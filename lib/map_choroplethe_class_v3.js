class Map_choroplethe {

	constructor(params_chart) {
		this.id = params_chart.id
		this.htmlNode = params_chart.htmlNode
	    this.category_field = params_chart.category_field
	    this.numerical_field = params_chart.numerical_field
	    this.label_tooltip = params_chart.label_tooltip
		this.type = params_chart.type
	    this.responsive = true
	    this.title = params_chart.title.text
	    this.list_segments_selected = []
	    this.nb_categories = 0
		

	}

	createChart(params_chart, sharedParams, data_to_transform) {

		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}


		this.setup_defaults_parameters(params_chart, sharedParams)
		params_chart.sharedParams = sharedParams

		this.funcLib(params_chart, sharedParams)

		var t1 = new Date()
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)
		console.log('choroplete prepare_data_p1 time: ' + (new Date() - t1))

		//map loads data only if a slice is selected on the target (load_on) chart
		//if (params_chart.load_on.list_idx_segments_multiples_selected.length > 0) {
			var t1 = new Date()
			this.prepare_data_p2(data_filtred, params_chart, sharedParams)
			console.log('choroplete prepare_data_p2 time: ' + (new Date() - t1))
		//}

		params_chart.inject_type = "init"		

		var chart_instance = this.init_chart(params_chart)
		this.inject_metadata(params_chart.map_instance, params_chart)
		console.log('choroplete init_chart time: ' + (new Date() - t1))
	

		//register the instanciator
		params_chart.instanciator = this

		params_chart.chart_sub_type = "choroplete_map"


		var t1 = new Date()
		this.setup_legends(params_chart, sharedParams, 'init')

		

		
		console.log('choroplete setup_legends time: ' + (new Date() - t1))

		console.log('choroplete createChart time: ' + (new Date() - t1))
	}

	

	updateChart(params_chart, sharedParams, filter_object, origin_order) {
		clean_data_map(params_chart)

		if (Object.keys(filter_object).length>0) params_chart.transformations.crossfilter= filter_object
		else if (params_chart.inject_type === 'change_hue_field') {
			if (params_chart.transformations.crossfilter && params_chart.filtered_by.axis) {
				Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)
			}
		}

		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		if (data_filtred.constructor == Promise) {
			data_filtred.then(data=> {
				this.prepare_data_p2(data, params_chart, sharedParams)		
				var data_type = "data"; var injection_type = "init"
				this.inject_metadata(params_chart.map_instance, params_chart)				
				params_chart.instanciator.setup_legends(params_chart, params_chart.sharedParams, 'update')				
				if (origin_order === 'change_hue_field') params_chart.inject_type = ""
			})
		}
		else {
			this.prepare_data_p2(data_filtred, params_chart, sharedParams)

			var data_type = "data"; var injection_type = "init"
			this.inject_metadata(params_chart.map_instance, params_chart)
			params_chart.instanciator.setup_legends(params_chart, params_chart.sharedParams, 'update')				
			if (origin_order === 'change_hue_field') params_chart.inject_type = ""
		}

		function clean_data_map(params_chart) {
			if (params_chart.inject_type === 'change_hue_field') {return} 
			params_chart.data[0].labels = []; params_chart.data[1].datasets = [];
			params_chart.data[1].markers = []; params_chart.data[1].borders; params_chart.inject_type = "init"
		}
	}

	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

	    var d1 = new Date();

		//1.join between geojson dataset & fact table iot create in the geojson dataset the fields required		
		if (!params_chart.joins_created) {
			//locate the operational & geo dataset
			if (params_chart.transformations.dataset) var chart_dataset = params_chart.transformations.dataset
			else {var chart_dataset = params_chart.sharedParams.data_main}				

			//get the keys field to articulate the geojson & operational data
			var layer_field_dataset = params_chart.geographic_priority_layers[0];
			var layer_field_geojson = layer_field_dataset
			if (sharedParams.join_fields) {
				layer_field_geojson = sharedParams.transcode_join_fields(sharedParams.join_fields, layer_field_dataset)
			};

			//set up the geojson layer field to the root level
			if (!sharedParams.geojson_data.find(f=> f[layer_field_geojson])) {
				sharedParams.geojson_data.forEach(p=> {
					p[layer_field_geojson] = p.properties[layer_field_geojson]
				})
			}

			//join for the tooltips
			//1.text fields
			var text_tooltips = params_chart.tooltip_fields.filter(f=> f.selection).map(f=> f.field)
			join_v2(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, text_tooltips)
			//2.numerical fields
			var num_tooltips = params_chart.tooltip_fields.filter(f=> f.agg_type).map(f=> {return {field: f.field, selection: f.agg_type} })
			join_aggregate_multiple_fields(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, num_tooltips)
			
			if (params_chart.params_fields.hue_params) {
				var agg_type = params_chart.params_fields.hue_params.agg_type;
				var hue_field = params_chart.params_fields.hue_params.hue_field;
				join_aggregate(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, hue_field, agg_type)
			}
			else if (params_chart.params_fields.color_params) {
				var color_field = params_chart.params_fields.color_params.color_field;
				join_v2(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, [color_field])
			}

			//join for the droplist_fields
			if (params_chart.droplist_fields) {
			
				//loop through the droplist_fields & make a join between the geojson dataset & the chart tataset 
				params_chart.droplist_fields.forEach(element => {
					if (element.title === undefined) {console.warn(`for ${params_chart.id}, a title is requiered in order to create the fields droplist`)}
					else {
						if (!element.fields || element.fields.length===0) {console.warn(`for ${params_chart.id}, a fields array is requiered in order to create the fields droplist`)}
						else {							
							//get the text fields to join
							var text_fields = element.fields.filter(o=> o.selection)

							//get the num fields to join
							var num_fields = element.fields.filter(o=> o.agg_type)

							var fields_to_join = {text_fields: text_fields, num_fields: num_fields}

							//check the existence of the field in the chart datatset
							Object.values(fields_to_join).filter(o=> o.length>0).forEach(fields=> {
								fields.forEach(f=> {
									//if the field does nt exist, delete it
									if (!chart_dataset.find(o=> o[f.field])) {
										console.warn(`for ${params_chart.id}, the field ${f.field} does not exist in the dataset of the chart`)
										var pos_field = element.findIndex(o=> o.field === f.field)
										fields.splice(pos,1)
									}
								})							
							})

							//join operation for text_fields
							if (fields_to_join.text_fields && fields_to_join.text_fields.length>0) {
								var text_fields_list = fields_to_join.text_fields.filter(f=> f.selection).map(f=> f.field)
								join_v2(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, text_fields_list)					
							}
							if (fields_to_join.num_fields && fields_to_join.num_fields.length>0) {
								//build the object of fields & operations in the target structure of the join_aggregate_multiple_fields function
								var num_fields_list = fields_to_join.num_fields.filter(f=> f.agg_type).map(f=> {return {field: f.field, selection: f.agg_type} })
								join_aggregate_multiple_fields(sharedParams.geojson_data, chart_dataset, layer_field_geojson, layer_field_dataset, num_fields_list)
							}


						}
					}
				})
			}

			params_chart.joins_created = true
		}

	    //zone de filtrage
	    //filter the primary data source according to the scope of the vizualisation (limited geographic area, range of time, any specific observation)

	    //data source for the bar chart
	    if (params_chart.transformations.dataset === undefined) {
	    	var data_chart = [...sharedParams.data_main]
	    	
	    }
	    else {
	    	var data_chart = [...params_chart.transformations.dataset]	    	
	    }








		var filterList = {};
		//if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
		if (params_chart.transformations.crossfilter !== undefined && Object.keys(params_chart.transformations.crossfilter).length > 0 ) {
			filterList = formFilterArray(params_chart, params_chart.transformations.crossfilter)
		}



		var data_chuncks = [];
		//if a filter arguments has been provided for the data source, call them back here
		if (params_chart.transformations.filter !== undefined) {

			//add the filter parameters to to main filter list
				//1.transform the filterList into an array that we can push in it filter objects
				filterList = Object.values(filterList)
				//2.extract & push the parameters of the initial filter list into the main filter list
				//don't take fields from the filter object if they are present in the crossfilter
				params_chart.transformations.filter.forEach(e=> {if (!filterList.find(f=> f.field === e.field)) {filterList.push(e)} })
				//3.remove the empty fields
				filterList = filterList.filter(l=> l.field !== "")
			
			//if the current filter ID is different from the shared filter id, call the filter function
			//data_chuncks = getFiltredData(data_chart, filterList, params_chart.id)
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if ((params_chart.transformations.dataset && params_chart.transformations.dataset.length>0) && (Object.keys(filterList).length > 0 || params_chart.to_filter === true)) {
			params_chart.multithreading = false;
			if (params_chart.join) {filterList = sharedParams.join_external_datasets(params_chart, filterList)}

			//if a field of the filterList is not present in the data_chart, delete it
			filterList = sharedParams.delete_unwanted_fields(data_chart, filterList)

			var data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, sharedParams);
		}
		else if (Object.keys(filterList).length > 0 || params_chart.to_filter === true) {
			//if a field of the filterList is not present in the data_chart, delete it
			filterList = sharedParams.delete_unwanted_fields(data_chart, filterList)

			var data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, sharedParams)	
		}
		//else 
		else {var data_filtred = deepCopyArray(data_chart)}




		if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length) {
			//select the fields requiered
			var data_filtred = select_required_fields(params_chart, data_filtred)

			return data_filtred
		}
		//if no data points to display, return empty array
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {
			params_chart.inject_type = "show_nothing"
			//fly to the borders 
			params_chart.map_instance.flyToBounds(params_chart.data[1].borders);
			params_chart.sharedParams.highlight_chart_border(params_chart)
			//remove previous shapes
			Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).map(l=> {
                params_chart.map_instance.removeLayer(l)
            })
	    	return {dataset: [], geojson_data: []}
	    }
		else {

	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_chart)
	        return promise_dataset_ready


			async function process_worker_result(data_filtred, sharedParams, params_chart) {
				var result = []; var chart
				if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> e).length > 0) {
					var promises_result = await Promise.all(data_filtred).then((results)=> {
						results.forEach(r=> {
							result = result.concat(result, r)
						});
						return result	
					}).then(result=> {
						var promise_result = process_promise_result(params_chart, sharedParams, result)
						return promise_result
					})

					return promises_result			
				}
				else {
					await data_filtred.then(r=> result = r)
					var promise_result = await process_promise_result(params_chart, sharedParams, result)
					return promise_result
				}

				function process_promise_result(params_chart, sharedParams, result) {
					var time_receive_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
					sharedParams['time_workers_' + params_chart.id]["time_receive_result"] = time_receive_result

					//filter on the current chart results
					result = result.filter(c=> c.chart === params_chart.transformations['filter_origin'])
					var indexes = result.map(r=> r.indexes)

					var result_length = d3.sum(indexes.map(r=> r.length))

					if (result_length === 0) {return []}

					else if (result_length > 0) {
						//match the filtred indexes with the main dataset
						console.time('exec build subset crossfilter choroplete_map')

						var dataset_filtred = [];
						var list_indexes = [];
						indexes.forEach(index=> {
						    index.forEach(i=> {
						        list_indexes.push(i)
						    })						
						})

						list_indexes = deduplicate_array(list_indexes)

						list_indexes.forEach(index=> {							
							dataset_filtred.push(sharedParams.data_main_groupBy_index[index][0])							
						})

						console.timeEnd('exec build subset crossfilter choroplete_map')


											//select the fields requiered
						var data_chart = select_required_fields(params_chart, dataset_filtred)

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

						//release proxies workers
						//Object.values(sharedParams.Workers_crossfilter).forEach(proxy=> {proxy.worker_instance[Comlink.releaseProxy]})

						return data_chart

					}
				}
			}
		}





		//select the fields requiered
		function select_required_fields(params_chart, data_filtred) {
			var tooltip_fields = []; params_chart.tooltip_fields.forEach(o => tooltip_fields.push(o["field"]));
			var fields = []; Object.assign(fields, tooltip_fields); fields.push(params_chart.params_fields.lat); fields.push(params_chart.params_fields.lng); 
			if (params_chart.params_fields.hue_params) {
				fields.push(params_chart.params_fields.hue_params.hue_field)
			}
			else if (params_chart.params_fields.color_params) {
				fields.push(params_chart.params_fields.color_params.color_field)	
			}
			else {
				console.log("specify hue params ou color params")
				return
			}

			if (params_chart.highlight_field?.length && fields.length) {
				params_chart.highlight_field.forEach(f=> fields.push(f))
			}
			
			//this ligne causes issues
				//var dataset = [...data_filtred.map(l=> _.pick(l, fields.filter(f=> f !== undefined)))]
			let dataset = deepCopyArray(data_filtred)

			//filter the geojson data
		    //select the data source
		    if (params_chart.transformations.dataset === undefined) {
		    	//var geojson_data = _.cloneDeep(sharedParams.geojson_data)
				var geojson_data = []; sharedParams.geojson_data.forEach(r=> geojson_data.push({...r}));
		    	
		    }
		    else {
		    	//var geojson_data = _.cloneDeep(params_chart.transformations.dataset)
				var geojson_data = []; sharedParams.transformations.dataset.forEach(r=> geojson_data.push({...r}));
		    }


		    //check if the filter list contains values that match with the geojson geographic layers
		    var geographic_priority_layers = Object.values(params_chart.geographic_priority_layers)
		    if (Object.values(filterList).length > 0) { var ind_to_filter = filterList.filter(f=> geographic_priority_layers.indexOf(f.field) > -1) } else {var ind_to_filter = []}
		    
			//join the operational dataset & the geojson dataset
			if (sharedParams.join_fields) {
				let _geographic_priority_layers=[]; 
				geographic_priority_layers.forEach(f=> {
					var transcoded_field = sharedParams.transcode_join_fields(sharedParams.join_fields, f)
					_geographic_priority_layers.push(transcoded_field)
				})
				geographic_priority_layers = [..._geographic_priority_layers]
			}

			
		    //if true, filter the geojson dataset with the values present in the filter list
		    let filter_array = []
			if (ind_to_filter.length > 0) {				
				if (sharedParams.join_fields) {
					filterList.forEach(o=> {
						filter_array.push(o)
						if (Object.keys(sharedParams.join_fields).includes(o.field) || Object.values(sharedParams.join_fields).includes(o.field)) {
							filter_array[filter_array.length-1].field = sharedParams.transcode_join_fields(sharedParams.join_fields, o.field)
						}
					})
				}

				if (filter_array.length === 0) filter_array = filterList
			    filter_array.filter(o=> geographic_priority_layers.includes(o.field)).forEach(f=> {
			        if (f.operation === "include") {
			            geojson_data = geojson_data.filter((item)=> f.values.indexOf(item[f.field]) !== -1)
			        }
			        else if (f.operation === "exclude") {
			            geojson_data = geojson_data.filter((item)=> f.values.indexOf(item[f.field]) === -1)
			        }
			    })	    	
		    }

		    //filter the geojson according to data present in the operationnal dataset
		    let layer_field_dataset = params_chart.geographic_priority_layers[0];
			let layer_field_geojson = layer_field_dataset
			if (sharedParams.join_fields) {
				layer_field_geojson = sharedParams.transcode_join_fields(sharedParams.join_fields, layer_field_dataset)
			}
		    var operationnal_areas = deduplicate_array(dataset.map(a=> a[layer_field_dataset]))
		 //    geojson_data = geojson_data.filter(function(item) {
			//     return operationnal_areas.indexOf(item[layer_field]) !== -1
			// })

			var _geojson_data = [];
			geojson_data.filter(r=> {
				if (operationnal_areas.includes(r[layer_field_geojson])) {
					_geojson_data.push(r)
				}
			})
			geojson_data = deepCopyArray(_geojson_data)

			//refresh agregates			
			var numerical_tooltips = params_chart.tooltip_fields.filter(f=> f.agg_type).map(f=> {return {field: f.field, selection: f.agg_type} })
			join_aggregate_multiple_fields(geojson_data, dataset, layer_field_geojson, layer_field_dataset, numerical_tooltips)


		    //transfer in geojson the fields required in highlight process
			if (params_chart.highlight_field?.length>0) {
				join_v2(geojson_data, dataset, layer_field_geojson, layer_field_dataset, params_chart.highlight_field)
			}

		    
		
		    return {dataset: dataset, geojson_data: geojson_data}
		}
	    



	}




	prepare_data_p2(data_input, params_chart, sharedParams) {
			const layer_field = params_chart.geographic_priority_layers[0]			
			var el; var popup, tooltip; var field; var fieldValue; var p1; var unit; var alias; var coef_colorHue;
			var opacity; var domain_opacity; var opacity_coef; var hue_color; var strokeColor

			params_chart.nb_axis = 1
			params_chart.category_field = layer_field

			//obtenir les catégories (les communes par ex)


			// if (params_chart._params_fields && (params_chart.inject_type === 'init' || params_chart.inject_type === 'update')) {
			// 	params_chart.params_fields = _.cloneDeep(params_chart._params_fields)
			// }


			//in case when hue_field is numerical, handle the domain extent and domain scope params
			if (params_chart.params_fields.hue_params) {
				const hue_field = params_chart.params_fields.hue_params.hue_field;
				params_chart.legends_field = hue_field + "_binned"
				//get min & max values	 
				var domain_hue = params_chart.params_fields.hue_params.domain				

				if (domain_hue === undefined) {domain_hue = ["min", "max"]}

				//---------------------------------------------------get data extent for the hue field
				var domain_scope = params_chart.params_fields.hue_params.domain_scope;
				//if the user specifies to use the whole dataset
				if (domain_scope === "whole_dataset") {
					params_chart.hue_dataset_extent = dataset_extent(domain_hue, sharedParams.geojson_data, hue_field);
				}
				else if (domain_scope === "filtred_dataset" || domain_scope === undefined) {
					params_chart.hue_dataset_extent = dataset_extent(domain_hue, data_input.geojson_data, hue_field);
				}			
				if (!params_chart.hue_dataset_extent || params_chart.hue_dataset_extent.length===0) {
					debugger
				}
				var hueMin = params_chart.hue_dataset_extent?.min; var hueMax = params_chart.hue_dataset_extent?.max;
				params_chart.params_fields.hue_params.hue_color !== undefined ? hue_color = params_chart.params_fields.hue_params.hue_color : hue_color = "interpolateBlues";
				//---------------------------------------------------
			}

			//in case when hue_field is categorical, handle the domain extent and domain scope params
			else if (params_chart.params_fields.color_params) {
				const color_field = params_chart.params_fields.color_params.color_field;
				params_chart.legends_field = color_field
				var color = params_chart.params_fields.color_params.color; color === undefined ? color = params_chart.params_fields.color_params.color : {};
				var selection = params_chart.params_fields.color_params.selection; selection === undefined ? selection = "first" : {};
				const categories = deduplicate_dict(data_input.dataset, color_field)


				//if the colors are not already set, generate them
				if (params_chart.polygons_colors_setup === undefined) {
					if (sharedParams.used_color_schemes.hasOwnProperty(color_field) === true) {
						var generated_colors = generateColors(nb_sous_categories, sharedParams.used_color_schemes[color_field], "", "", sharedParams) }
					else {
						var generated_colors = generateColors(categories.length, color, "", "", sharedParams);}

					var categories_colors = []
					for (var i = 0; i < categories.length; i++) {
						categories_colors.push({[color_field]: categories[i], color: generated_colors[i]})
					}
					params_chart.polygons_colors_setup = [...categories_colors]
				}
			}









					

			//get data to build polygones, colors and tooltips
			params_chart.data[1].markers = []; params_chart.data[1].popups = []; params_chart.data[1].polygons = []; params_chart.data[1].borders = []; params_chart.data[1].tooltips = [];
			params_chart.legends_config = []; params_chart.data[1].polygons_subset_legends = []


			if (!data_input.geojson_data || data_input.geojson_data.length === 0) {
				return
			}

			data_input.geojson_data.forEach(p=> {
				if (!p.polygone) p.polygone = p;

				//in case when the color field is numerical:
				if (params_chart.params_fields.hue_params) {

					//compute the statistical value for the hue color

					//V1: var hue_statistical_value = d3[agg_type](data_input.dataset.filter(o=> o[layer_field] === p.polygone.properties[layer_field]), v=> v[hue_field])

					//v2
					var hue_statistical_value = p[params_chart.params_fields.hue_params.hue_field]

					coef_colorHue = +((hue_statistical_value - hueMin) / (hueMax - hueMin)).toPrecision(4);

					if (params_chart.params_fields.hue_params.colorsOrder === "reverse") coef_colorHue = 1 -coef_colorHue
					var polygonColor = d3[hue_color](coef_colorHue);

					let border
					if (p.polygone.bbox) border= [[p.polygone.bbox[1], p.polygone.bbox[0]], [p.polygone.bbox[3], p.polygone.bbox[2]]];

					//handle the polygon's opacity depending on legends bound or full map
					//here setups for the active polygons
					if (params_chart.inject_type === "legends_binding") {	
						//if (hue_statistical_value >= params_chart.legends_binding_params.valueMin && hue_statistical_value < params_chart.legends_binding_params.valueMax) {
						var inside_interval = params_chart.legends_binding_params.map(o=> {
							if (hue_statistical_value >= o.valueMin && hue_statistical_value < o.valueMax) {return true} else {return false}
						})
						if (inside_interval.filter(r=> r === true)[0] === true) {
							var fillOpacity = params_chart.tileLayers_opacity; 
							params_chart.params_legends.filter_params.showTooltips === false ? p.polygone.properties["show_tooltip"] = true : {}
							//collect the bounds of the active polygons
							params_chart.data[1].borders.push(border)
							inside_interval = [false]
						}
						//here setups for the filtred polygons
						else {
							var fillOpacity = 0.2; 
							params_chart.params_legends.filter_params.showTooltips === false ? p.polygone.properties["show_tooltip"] = false : {}

							//collect the bounds of the active polygons
							if (params_chart.params_legends.filter_params.flyToBounds === false) {
								params_chart.data[1].borders.push(border)
							}

						}

						var value_to_project = hue_statistical_value; var color_field = params_chart.params_fields.hue_params.hue_field
					}
					else {
						var fillOpacity = params_chart.tileLayers_opacity; 
						p.polygone.properties["show_tooltip"] = true
						params_chart.data[1].borders.push(border)
					}

					params_chart.legends_config.push({layer_field: p.polygone.properties[layer_field], hue_statistical_value: hue_statistical_value,  coef_colorHue: coef_colorHue, polygonColor: polygonColor})
				}


				//in case when the color field is categorical:
				else if (params_chart.params_fields.color_params) {
					
					//V1.var values_to_project = deduplicate_dict(data_input.dataset.filter(v=> v[layer_field] === p.polygone.properties[layer_field]), color_field)
					//V2
					var values_to_project = p[color_field]									

					var polygonColor = params_chart.polygons_colors_setup.filter(c=> c[color_field] === value_to_project).color.replace(", 0.65)", ")")
					var border = [[p.polygone.bbox[1], p.polygone.bbox[0]], [p.polygone.bbox[3], p.polygone.bbox[2]]];
					

					//handle the polygon's opacity depending on legends bound or full map
					//here setups for the active polygons
					if (params_chart.inject_type === "legends_binding") {	
						if (params_chart.legends_binding_params === value_to_project) {
							var fillOpacity = params_chart.tileLayers_opacity; 
							params_chart.params_legends.filter_params.showTooltips === false ? p.polygone.properties["show_tooltip"] = true : {}
							//collect the bounds of the active polygons
							params_chart.data[1].borders.push(border)
							
						}
						//here setups for the filtred polygons
						else {
							var fillOpacity = 0.2; 
							params_chart.params_legends.filter_params.showTooltips === false ? p.polygone.properties["show_tooltip"] = false : {}

							//collect the bounds of the active polygons
							if (params_chart.params_legends.filter_params.flyToBounds === false) {
								params_chart.data[1].borders.push(border)
							}

						}

					}
					else {
						var fillOpacity = params_chart.tileLayers_opacity; 
						p.polygone.properties["show_tooltip"] = true
						params_chart.data[1].borders.push(border)
					}

					
				}


				//if (params_chart.params_fields.hue_params.hue_color && params_chart.params_fields.hue_params.hue_color.includes('Red'))

				//var poly_border_color = "red"
				var myStyle = {
				    "color": "white",
				    "fillColor": polygonColor,
				    fillColor_source: polygonColor,
				    "weight": 2,
				    "opacity": 1,
				    "fillOpacity": fillOpacity
				};

				

				//manage display
				p.polygone.properties["show_on_map"] = true

				//add hue value to poly properties
				p.polygone.properties[color_field] = value_to_project

				






				var polygon = new L.geoJSON(p.polygone, 
						{style: myStyle},
						//{onEachFeature: onEachFeature}
					)//.bindTooltip(tooltip);

				//add dataset to the poly options
				polygon.options["dataset"]= p


				//manage colors on mouse over
				var _this = this
				polygon.on('mouseover',function(evt) {
					_this.polygon_animate_colors(evt, params_chart)
					_this.polygon_display_tooltip(evt, params_chart)

				});

				polygon.on('mouseout', function(evt) {
					_this.polygon_reset_colors(evt, params_chart)
				})

				polygon.on("click", function(evt) {
					_this.polygon_store_selection(evt, params_chart)					
				})

				//add data propreties
				polygon.options["propreties"] = {[layer_field]: p.polygone.properties[layer_field], [color_field]: value_to_project}

				//add polygon to main list
				if (params_chart.inject_type === "legends_binding") {params_chart.data[1].polygons_subset_legends.push(polygon)}
				else {params_chart.data[1].polygons.push(polygon)}


				
			})

			params_chart.tileLayer_opacity = params_chart.tileLayers_opacity;
			params_chart.funcLib['reset_slider_tiles_opacity'](params_chart)

			params_chart.data[1].geojson = data_input.geojson_data
			params_chart.data[1].datasets = data_input.dataset

	    			

 
			//.sauvegarder une image des données source avant transformation
			if (params_chart.data_source_raw.length === 0) {
				params_chart.data_source_raw = data_input
				//params_chart.data_source[0].labels.push(categories)
		        params_chart.data_source[1].borders = [...params_chart.data[1].borders]; params_chart.data_source[1].polygons = [...params_chart.data[1].polygons]; 

		    }		

			//save an image of original params_fields object
			if (!params_chart._params_fields) {
				params_chart._params_fields = _.cloneDeep(params_chart.params_fields)
			}
			
			//restore original settings
			if (params_chart.inject_type === 'change_hue_field') {
				//params_chart.params_fields = _.cloneDeep(params_chart._params_fields)
			}

	}


	init_chart(params_chart) {		

	    //general container for the title + map & legend
	    const grid_title_controls_map_legend =  document.createElement('div'); 
	    Object.assign(grid_title_controls_map_legend, {id: 'grid_title_controls_map_legend_' + params_chart.htmlNode, 
			style: 'display: grid; grid-template-columns: 80% 20%; grid-column-gap: 1%;'}) 

	    //grid container for the map & legend
	    const grid_title_controls_map =  document.createElement('div'); 
	    Object.assign(grid_title_controls_map, {id: 'grid_title_controls_map_' + params_chart.htmlNode, style: 'display: inline-grid; grid-template-rows: auto auto auto; grid-row-gap: 1%'})


		var htmlNode = document.getElementById(params_chart.htmlNode)
		htmlNode.style.border = "solid 2px"; 
		htmlNode.style.borderColor= 'rgb(244,67,54,0)'; 
		htmlNode.style.borderRadius= '1%'; 
		htmlNode.style.transition= 'border-color 1.5s'

		var mymap = new L.map(htmlNode, {
			fullscreenControl: true,
			fullscreenControlOptions: {position: 'topleft'},
			renderer: L.canvas()
		}).fitBounds(params_chart.initial_view);

	
	    //add the chart & general container to their parent grid
	    //chart.style.width = '100%' 
	    //var parentNode = htmlNode.parentElement
	    



		/*to disable shift key on zoom:
		var mymap = new L.map(params_chart.htmlNode, { boxZoom: false, customBoxZoom: true }).fitBounds([[51.072228, 2.528016], [42.442288, 3.159714]]);*/

		var layer = new L.tileLayer('//{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
			attribution: 'donn&eacute;es &copy; <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
			minZoom: 1,
			maxZoom: 20
		})
		mymap.addLayer(layer)

		//register the map instance
		params_chart.map_instance = mymap; params_chart.chart_instance = mymap
		params_chart.chart_type = "leaflet"; params_chart.chart_subType ="choroplethe"

		mymap.on('mouseover', function(evt) {
			evt.target
		})



		
	
		//create the title

			//1.get the parent node of the map
			var mymap = document.getElementById(params_chart.htmlNode); 
			//var parentNode = mymap.parentElement
			//3.create the title
			var titleContainer = document.createElement('div'); titleContainer.style.display = 'grid'
			var title = document.createElement('span'); title.id = params_chart.htmlNode + '_title'; title.style = 'align-self: center; justify-self: center; height: max-content'; 
			params_chart.title ? title.innerHTML = params_chart.title : title.innerHTML = 'title undefined'
			
						

		//create node for crossfilter info
		var crossfilterContainer = document.createElement('div'); crossfilterContainer.id = "crossfilterContainer_" + params_chart.id
		
		//var width = document.getElementById(params_chart.id).clientWidth
		crossfilterContainer.style = `display: flex; flex-wrap: wrap; width: initial; height: 20px; justify-self: left; margin-left: 0px; column-gap: 4px`
		var title_node = document.createElement('p'); title_node.style = 'font-size: 12px; margin: 4px'; title_node.innerText = 'Filtres: '
		crossfilterContainer.append(title_node)

		var crossfilterContainer_tooltip = document.createElement('div'); crossfilterContainer_tooltip.id = "crossfilterContainer_tooltip_" + params_chart.id		
		crossfilterContainer_tooltip.style = `display: flex; width: initial; height: 20px; justify-self: left; column-gap: 4px`
		var phantom_title_node = document.createElement('p'); phantom_title_node.style = 'font-size: 12px; margin: 4px; opacity: 0;'; phantom_title_node.innerText = 'Filtres: '
		crossfilterContainer_tooltip.appendChild(phantom_title_node)




		//create layer for the controls
			//create grid container
			var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: auto auto auto; justify-items: center; margin-top: -15px; ; height: max-content; width: max-content; grid-column-gap: 5px'; 
			controlsContainer.id = "controlsContainer_" + params_chart.htmlNode

			//create sub grids containers
			var label_slider_opacity_control = document.createElement('p'); label_slider_opacity_control.style = 'font-size: 13px; color: #3c3c3c'
			if (!params_chart.sharedParams.language || params_chart.sharedParams.language === 'en') {
				label_slider_opacity_control.innerText = 'Adjust tiles opacity: '
			}
			else if (params_chart.sharedParams.language === 'fr') {
				label_slider_opacity_control.innerText = "Ajuster l'opacité des tuiles: "
			}
			
			var slider_opacity_control = document.createElement('input'); 
			Object.assign(slider_opacity_control, {type: 'range', min: "0", max: "100", step: "5", value: params_chart.tileLayers_opacity*100 })  
			slider_opacity_control.id = "slider_opacity_control_" + params_chart.id
			var value_slider_opacity_control = document.createElement('p'); value_slider_opacity_control.style = 'font-size: 13px; color: #3c3c3c'; value_slider_opacity_control.id = 'value_slider_opacity_control_'+params_chart.id
			value_slider_opacity_control.innerText = params_chart.tileLayers_opacity*100+' %'
			slider_opacity_control.addEventListener('change', ()=> {
				value_slider_opacity_control.innerText = `${slider_opacity_control.value} %`
				//register current tile opacity, to reuse it in the hover effects
				params_chart.tileLayer_opacity = slider_opacity_control.value/100
				//update tiles opacity
				let tiles = Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false)
				tiles.forEach(t=> {if (t.options && t.options.dataset)  {t.setStyle({fillOpacity: slider_opacity_control.value/100})} });
			})
			slider_opacity_control.addEventListener('touchmove', ()=> {
				value_slider_opacity_control.innerText = `${slider_opacity_control.value} %`
				//register current tile opacity, to reuse it in the hover effects
				params_chart.tileLayer_opacity = slider_opacity_control.value/100
				//update tiles opacity
				let tiles = Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false)
				tiles.forEach(t=> {if (t.options && t.options.dataset)  {t.setStyle({fillOpacity: slider_opacity_control.value/100})} });
			})
			

		//append created elements to the dom
			titleContainer.appendChild(title)			

			//add controls to a common grid
			controlsContainer.appendChild(label_slider_opacity_control); controlsContainer.appendChild(slider_opacity_control);
			controlsContainer.appendChild(value_slider_opacity_control);

			//add title container to general container (holds title + controls)
			grid_title_controls_map.appendChild(titleContainer)
			grid_title_controls_map.appendChild(crossfilterContainer)
			grid_title_controls_map.appendChild(crossfilterContainer_tooltip)
			
			//add controlsContainer to general container (holds title + controls)
			grid_title_controls_map.appendChild(controlsContainer)


			//add general container  to the parent node
			grid_title_controls_map_legend.appendChild(grid_title_controls_map)

			insertHtmlNodeAfter(mymap, grid_title_controls_map_legend)

			//add map to general container (holds title + controls)
			grid_title_controls_map.appendChild(mymap)

			//parentNode.appendChild(grid_title_controls_map_legend)
			
			
			//create a figure label		
			let fig = create_figure_label(params_chart)
			grid_title_controls_map.append(fig)




	}




	inject_metadata(mymap, params_chart, data_type, injection_type, updateTime) {
		//init flags for buiding the tooltips
		params_chart.layer_added = undefined; params_chart.tooltips_added= undefined

		//avoid repeated successives injections
		let time_last_injection = new Date - params_chart.time_injection
		
		if (!isNaN(time_last_injection) && time_last_injection < 300 && params_chart.size_previous_dataset === params_chart.data[1].polygons.length) {
			console.warn({"date from last circles injection": time_last_injection})
			console.warn({size_previous_dataset: params_chart.size_previous_dataset, size_current_dataset: params_chart.data[1].markers.length})
			console.warn("exit injection")
			return
		}
		else {
			console.warn({"date from last circles injection": time_last_injection})
			console.warn("continue injection")
		}

		params_chart["time_injection"] = new Date
		params_chart["size_previous_dataset"] = params_chart.data[1].polygons.length
		
		//remove previous layer
			if (params_chart.featureGroup) {params_chart.map_instance.removeLayer(params_chart.featureGroup)}
			params_chart.featureGroup = undefined
			params_chart.map_instance.eachLayer(l=> {if (l.options.dataset) l.remove()})

        console.log("remove previous layer")
		
		params_chart.zoom_log = {}
		mymap.once('zoomstart', function(e) {
			var t = new Date
			params_chart.zoom_log = {'zoomstart': t, iter: 0}
			
		})

		mymap.once('zoomend', function(e) {
			var t = new Date
			params_chart.zoom_log['zoomend'] = t
			var zoom_duration = t - params_chart['zoomstart']
			params_chart.zoom_log['zoom_duration'] = zoom_duration
			++params_chart.zoom_log.iter

		   	params_chart.layer_added = undefined
			var nb_poly_prepared = params_chart.data[1].polygons.length, nb_poly_injected = Object.values(params_chart.map_instance._layers).filter(l=> l._bounds && l.defaultOptions && l.feature).length
			if (params_chart.inject_type === "init" || params_chart.inject_type === "update") {	// && nb_poly_injected < nb_poly_prepared 

				if (params_chart.data[1].polygons.length === 0) {
					console.log({choroplete_map: 'no geojson data found'})
					return					
				}

				inject_polygons(params_chart)					
			}
			else {
				console.warn('injection canceled after zoomend')
			}
		});		
	
		//in case of map update fired by hue_field user change, inject the new polys here
		//if ()

		function inject_polygons(params_chart) {
			if (params_chart.layer_added) {
				console.warn({[params_chart.id]: 'exit inject_polygons functions'})
				return
			}

			let featureGroup = L.featureGroup(params_chart.data[1].polygons)
			params_chart.featureGroup = featureGroup;

			var t1 = new Date()
			params_chart.map_instance.addLayer(featureGroup);
			console.log({[params_chart.id]: "time inject polygons to map= " + (new Date() - t1)});

			//color transition
			if (params_chart.enable_transition) {
				d3.select(`#${params_chart.htmlNode} > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g`).style('opacity', 0).transition().duration(1000).style('opacity', 1)
				params_chart.enable_transition = false
			}
			//save new copy of the layers injected to the map			
			params_chart.data[1].polygons_injected = featureGroup
			params_chart.layer_added = true

			t1 = new Date()
			params_chart.instanciator.add_tooltips(params_chart)
			console.log({[params_chart.id]: "time inject tooltips to map= " + (new Date() - t1)});

			
		}

		//fire the zoom when the map is displayed
		let monitor_map_display = setInterval(() => {
			var map_parent_nodes = find_node_parents(document.getElementById(params_chart.htmlNode))
			var map_isHidden;
			map_parent_nodes.forEach(node=> {
				if (node.style.display === "none") {map_isHidden = true}
			})
			if (!map_isHidden) {
				if (params_chart.layer_added) {
					//console.warn({[params_chart.id]: 'exit flyto & inject_polygons functions'})
					return				
				}
	
				params_chart.data[1].polygons.length > 0 ? calculate_transition_times(params_chart) : {}
				


				if ((params_chart.inject_type === "init" || params_chart.inject_type === "update") && params_chart.data[1].borders.length>0) {
					params_chart.map_instance.invalidateSize()
					//if (params_chart.featureGroup) {params_chart.map_instance.removeLayer(params_chart.featureGroup)}
					if (params_chart.time_flyToBounds === undefined || params_chart.time_flyToBounds === 0) {
						params_chart.time_flyToBounds = 1;
						var timeOut = 1500
					}
					else {var timeOut = params_chart.time_flyToBounds }
					console.warn({[params_chart.id]: {time_flyToBounds: params_chart.time_flyToBounds, timeOut: timeOut}})

					mymap.flyToBounds(params_chart.data[1].borders, {'duration':params_chart.time_flyToBounds})
					params_chart.sharedParams.highlight_chart_border(params_chart)
										
				}
				clearInterval(monitor_map_display)
					
			}
		}, 400)

		//update the legends
		if (params_chart.inject_type === 'change_hue_field') {
			inject_polygons(params_chart);			
		}

		function invalidateSize() {
			params_chart.map_instance.invalidateSize()
		}

		




		function calculate_transition_times(params_chart) {
			params_chart.previousCenter = params_chart.currentCenter
			params_chart.currentCenter = new L.Polygon(params_chart.data[1].borders)._bounds.getCenter()
			if (params_chart.previousCenter) {
				var distance_from_previous_location = params_chart.currentCenter.distanceTo(params_chart.previousCenter)
				params_chart.distance_from_previous_location = distance_from_previous_location
				console.log({'distance_from_previous_location': params_chart.distance_from_previous_location})

				if (distance_from_previous_location < 1000) {
					params_chart.time_flyToBounds = 0
					params_chart.sharedParams.delay_time_scatter = 200
				}
				else if (distance_from_previous_location >= 1000 && distance_from_previous_location < 5000) {
					params_chart.time_flyToBounds = 0.5
					//params_chart.sharedParams.delay_time_scatter = 1200
					params_chart.sharedParams.delay_time_scatter = 400
				}
				else if (distance_from_previous_location >= 5000 && distance_from_previous_location < 10000) {
					params_chart.time_flyToBounds = 1
					//params_chart.sharedParams.delay_time_scatter = 1700
					params_chart.sharedParams.delay_time_scatter = 900
				}			
				else if (distance_from_previous_location >= 10000 && distance_from_previous_location < 50000) {
					params_chart.time_flyToBounds = 1.5
					//params_chart.sharedParams.delay_time_scatter = 2200
					params_chart.sharedParams.delay_time_scatter = 1400
				}
				else if (distance_from_previous_location >= 50000 && distance_from_previous_location < 100000) {
					params_chart.time_flyToBounds = 2
					//params_chart.sharedParams.delay_time_scatter = 2700
					params_chart.sharedParams.delay_time_scatter = 1900
				}
				else if (distance_from_previous_location >= 100000) {
					params_chart.time_flyToBounds = 3.2
					params_chart.sharedParams.delay_time_scatter = 3100
				}			

				console.log({'time_flyToBounds': params_chart.time_flyToBounds})
				console.log({'delay_time_scatter': params_chart.sharedParams.delay_time_scatter})
			}
		}				

	
	}







	add_tooltips(params_chart) {
		//access to the data points on the layer
		//var circles = Object.values(mymap._layers).filter(l=> l._latlng && l._radius)
		
		//build an object containing the coordinates as key, the layer as value
		var polygons = {};
		Object.values(params_chart.map_instance._layers).filter(l=> l._bounds && l.defaultOptions && l.feature).
		forEach(l=> { 
			var key = l.feature.bbox.join(); 
			polygons[key] = l 
		})

		//build an object containing the coordinates as key, the popups as value
		var tooltips = {}
		params_chart.data[1].geojson.forEach(d=> {var key = d.polygone.bbox.join(); tooltips[key] = d })

		var tooltip_fields = _.cloneDeep(params_chart.tooltip_fields)
		//check if there is a droplist_field enabled
		if (params_chart.droplist_fields) {
			var dropdown_menu = document.getElementById('droplist_fields'+params_chart.id)
			//var droplist_field = Object.values(dropdown_menu.childNodes).find(f=> f.classList && f.classList.contains('enabled'))
			var droplist_field; 
			params_chart.droplist_fields.forEach(el=> el.fields.find(e=> {if (e.enabled) {droplist_field =  e }} ))
			if (droplist_field) {
			
				var field = droplist_field.field;
				var alias = droplist_field.alias;
				var agg_type = droplist_field.agg_type;
				var unit = droplist_field.unit;
				var slice = droplist_field.slice;
				var toPrecision = droplist_field.toPrecision;

				//add the field to the tooltip fields if absent
				if (!tooltip_fields.find(o=> o.field === field)) {
					tooltip_fields.push({field: field, alias: alias, unit: unit, agg_type: agg_type, slice: slice, toPrecision: toPrecision})
				}
				else {droplist_field=undefined}
			}
		}
		
		//loop through polygons object, for each key add popup to the layer
		Object.keys(polygons).forEach(key=> {

			//build the tooltip
			var tooltip = [];
			var r = tooltips[key]
			tooltip_fields.forEach(o => { 
				var el = [];
				var field = o["field"];
				var precision = o["toPrecision"];
				if (r && r[field] !== undefined) {

					var alias = o.alias + ": "; el.push(alias);

					//to reduce the value lenght, check if the field is string or num
					//if (o.selection) {
					if (o.slice) {
						//convert eventual string values to int
						o.slice = o.slice.map(s=> parseInt(s))
						var fieldValue = r[field].toString().slice(o.slice[0], o.slice[1]) + "...";
					}
					else {
						if (o.toPrecision) {
							var precision = parseInt(o.toPrecision); //el.push(precision)
							var fieldValue = parseFloat(r[field]).toFixed(precision)
						}
						else {
							var fieldValue = r[field].toString()
						}							
					}
					el.push(fieldValue)

						
					if (o.unit) {
						var unit = ' ' +o.unit; el.push(unit);
					}

					
					tooltip.push(el.filter(e=> e!== undefined));

				}
				//popup.filter(e=> e!== undefined).map(f=> f + "<br />").join("")


			});

			var p1 = tooltip.map(f=> f.map(e=> e).join("")); 
			if (droplist_field) {
				var l='<strong>'+p1[p1.length-1]+'</strong>'
				p1[p1.length-1] = l
			}
			tooltip = p1.map(f=> f + "<br />").join("")


			polygons[key].bindTooltip(tooltip);
		})

	}


	polygon_animate_colors(evt, params_chart) {
		//animate if there is no legends interraction
		if (params_chart.inject_type !== 'legends_binding') {// && (params_chart.list_idx_segments_multiples_selected.length === 0)
			var leaflet_poly_id = evt.target._leaflet_id.toString()
			var poly_opacity = evt.target.options.style.fillOpacity
			//increase opacity of current polygon
			let target_poly_opacity
			if (params_chart.tileLayer_opacity < 0.15) {target_poly_opacity = params_chart.tileLayer_opacity}
			else {target_poly_opacity = 1}

			evt.target.setStyle({fillOpacity: target_poly_opacity}); evt.target.setStyle({weight: params_chart.tileLayer_weight, color: "red"}); //evt.target.
			
			let min_opacity
			if (params_chart.tileLayer_opacity < 0.15) {min_opacity = 0}
			else {min_opacity= params_chart.tileLayer_minOpacity}

			//set to standard opacity of all other polygons
			Object.keys(params_chart.map_instance._layers).forEach(key => { 
				//target a polygon layer that is not selected by click event
				if (key !== leaflet_poly_id && params_chart.map_instance._layers[key].hasOwnProperty("_layers") && params_chart.map_instance._layers[key].hasOwnProperty("_events") 
					&& params_chart.map_instance._layers[key].hasOwnProperty("_container") === false && params_chart.leaflet_polys_id_selected.indexOf(key) === -1) {
					//console.log(key)
					//if no polygon selected, return to normal opacity of 0.8
					if (params_chart.list_idx_segments_multiples_selected.length === 0) {
						params_chart.map_instance._layers[key].setStyle({fillOpacity: params_chart.tileLayer_opacity}); params_chart.map_instance._layers[key].setStyle({weight: params_chart.tileLayer_weight, color: 'white'})
					}//if a polygon is selected, return to lower opacity of 0.15
					else {
						params_chart.map_instance._layers[key].setStyle({fillOpacity: min_opacity}); params_chart.map_instance._layers[key].setStyle({weight: params_chart.tileLayer_weight, color: 'white'})	
					}
				} 
			})

			//bring the hovered poly to the front, iot show clearly its borders
			evt.layer.bringToFront()

			
		}
	}

	polygon_reset_colors(evt, params_chart) {
		//reset if there is no legends interraction or no polygon selected
		if (params_chart.inject_type !== 'legends_binding') {// && (params_chart.list_idx_segments_multiples_selected.length === 0)
			
			let min_opacity
			if (params_chart.tileLayer_opacity < 0.15) {min_opacity = 0}
			else {min_opacity = params_chart.tileLayer_minOpacity}

			//set to standard opacity of all other polygons
			Object.keys(params_chart.map_instance._layers).forEach(key => { 
				//target a polygon layer that is not selected by click event
				if (params_chart.map_instance._layers[key].hasOwnProperty("_layers") && params_chart.map_instance._layers[key].hasOwnProperty("_events") 
					&& params_chart.map_instance._layers[key].hasOwnProperty("_container") === false && params_chart.leaflet_polys_id_selected.indexOf(key) === -1) {
					//console.log(key)
					//if no polygon selected, return to normal opacity of 0.8
					if (params_chart.list_idx_segments_multiples_selected.length === 0) {
						params_chart.map_instance._layers[key].setStyle({fillOpacity: params_chart.tileLayer_opacity}); params_chart.map_instance._layers[key].setStyle({weight: params_chart.tileLayer_weight, color: "red"})
					}//if a polygon is selected, return to lower opacity of 0.15
					else {
						params_chart.map_instance._layers[key].setStyle({fillOpacity: min_opacity}); params_chart.map_instance._layers[key].setStyle({weight: params_chart.tileLayer_weight, color: 'red'})	
					}
				} 
			})		
		}
		else if (params_chart.inject_type === "legends_binding" && evt.type !== "mouseout") {evt.target.setStyle({fillOpacity: params_chart.tileLayer_opacity}); evt.target.setStyle({weight: 1, color: "red"})}
		
		params_chart.map_instance.eachLayer(l=> {
			l.options.dataset ? l.setStyle({weight: params_chart.tileLayer_weight, color: "white"}) : {}
		})

		//keep the red border for the selected poly
		params_chart.selected_polygons.forEach(p=> {
			if (p.layer) {
				p.target.setStyle({weight: 2, color: "red"})
				p.layer.bringToFront()		
			}
		})
		// evt.target.setStyle({weight: 2, color: "red"})
		// evt.layer.bringToFront()



		if (params_chart.enable_transition) {
			d3.select(`#${params_chart.htmlNode} > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g`).style('opacity', 0).transition().duration(1000).style('opacity', 1)
			params_chart.enable_transition = false
		}
	}

	polygon_display_tooltip(evt, params_chart) {
		//disable tooltip if the opacity is set to 0 by the user
		if (params_chart.tileLayer_opacity === 0) {
			var toolTip = Object.values(evt.target._layers)[0].getTooltip()
			if (toolTip) {params_chart.map_instance.closeTooltip(toolTip);}		
			return
		}

		//display the tooltip only if the polygon is not filtred by the legends
		if (evt.target.getTooltip && evt.target._layers && (params_chart.params_legends.show_tooltip === false || params_chart.params_legends.show_tooltip === undefined)) {
			var show_tooltip = Object.values(evt.target._layers); 
			if (show_tooltip[0].feature.properties.hasOwnProperty("show_tooltip") && show_tooltip[0].feature.properties["show_tooltip"] === false) {				
				var toolTip = Object.values(evt.target._layers)[0].getTooltip()
				if (toolTip) {
				    params_chart.map_instance.closeTooltip(toolTip);
				}
			}
		}
	}

	polygon_store_selection(evt, params_chart) {
		//disable click on tiles if the opacity is set to 0 by the user
		if (params_chart.tileLayer_opacity === 0) {return}
				
		//UPDATE THE list of selected polys
		if (params_chart.selected_polygons.length>0) {
			//find out if the poly is already selected
			let poly_is_selected
			params_chart.selected_polygons.forEach(p=> {
				if (p.layer === evt.layer) {poly_is_selected = true}
			})
			//user case 1: the user pressed the crtl key to target a specifi poly iot remove it
			if (poly_is_selected && evt.originalEvent.ctrlKey) {
				var pos = params_chart.selected_polygons.findIndex(f=> f.layer === evt.layer)
				params_chart.selected_polygons.splice(pos, 1)
			}
			//user case 2: the user selected twice the same poy, iot to reset the map selection state
			else if (poly_is_selected && !evt.originalEvent.ctrlKey) {
				params_chart.selected_polygons = []
			}
			//else add the new poly 
			else if (!poly_is_selected) {
				//if the poly is selected for the 1st time, check if where are in a case of single or multiple selection
				//1.case of single selection; reset the selected_polygons list before adding the new poly
				if (!evt.originalEvent.ctrlKey) {
					params_chart.selected_polygons = []
					params_chart.selected_polygons.push(evt)
				}
				//2.case of multiple selection; add the new poly to the existing list
				else {params_chart.selected_polygons.push(evt)}
			}
		}
		else {params_chart.selected_polygons.push(evt)}


		//if the click comes from map filtred by legends, and the target is hidden, don't activate the sotre selection process
		if (params_chart.inject_type === "legends_binding" && Object.values(evt.target._layers)[0].feature.properties.show_tooltip === false) {
			return}

		//extract key/value & leaflet id
		var layer_field = params_chart.geographic_priority_layers[0]
		if (evt.target._layers) { 
			if (params_chart.sharedParams.join_fields) {
				var transcoded_field = params_chart.sharedParams.transcode_join_fields(params_chart.sharedParams.join_fields, layer_field)
				var layer = Object.values(evt.target._layers); var selected_value = layer[0].feature.properties[transcoded_field]
			}
			else {
				var layer = Object.values(evt.target._layers); var selected_value = layer[0].feature.properties[layer_field]
			}
		}
		else {
			if (params_chart.sharedParams.join_fields) {
				var transcoded_field = params_chart.sharedParams.transcode_join_fields(params_chart.sharedParams.join_fields, layer_field)			
				var layer = evt.target.feature; var selected_value = layer.properties[transcoded_field]
			}
			else {
				var layer = evt.target.feature; var selected_value = layer.properties[layer_field]
			}
		}

		
		var selection = {[layer_field]: [selected_value]};
		var leaflet_poly_id = evt.target._leaflet_id.toString(); 


		//if the same polygon is pressed twice on single selection event, restore initial state
		if ((evt.originalEvent.ctrlKey === undefined || evt.originalEvent.ctrlKey === false) && params_chart.leaflet_polys_id_selected.indexOf(leaflet_poly_id) > -1)	{
			//remove previous values stored
			params_chart.list_idx_segment_single_selected = []; params_chart.list_keys_values_segment_single_selected = []; params_chart.list_labels_segment_single_selected = []; params_chart.leaflet_polys_id_selected=[]
			params_chart.list_idx_segments_multiples_selected = []; params_chart.list_keys_values_segments_multiples_selected = []; params_chart.list_labels_segments_multiples_selected = [];

			params_chart.instanciator.polygon_reset_colors(evt, params_chart)
			return

		}
		//if the same polygon is pressed twice on multiple selection event, restore initial state
		else if (evt.originalEvent.ctrlKey && params_chart.leaflet_polys_id_selected.indexOf(leaflet_poly_id) > -1)	{
			//get the pos of the selected value & remove it from the arrays
			//1.
			var pos = params_chart.list_idx_segments_multiples_selected.indexOf(selected_value); params_chart.list_idx_segments_multiples_selected.splice(pos, 1); 
			//2.
			//2.1.create an array of the values
			//var values = params_chart.list_idx_segments_multiples_selected.map(o=> o[layer_field][0]);
			var pos = params_chart.list_keys_values_segments_multiples_selected.findIndex(i=> i[layer_field][0] === selected_value); params_chart.list_keys_values_segments_multiples_selected.splice(pos,1)
			//3.
			var pos = params_chart.list_labels_segments_multiples_selected.findIndex(i=> i.category_field === selected_value); params_chart.list_labels_segments_multiples_selected.splice(pos,1);
			//4.
			var pos = params_chart.leaflet_polys_id_selected.indexOf(leaflet_poly_id); params_chart.leaflet_polys_id_selected.splice(pos, 1); 
			//add selection effects by adjusting opacity
			params_chart.leaflet_polys_id_selected.length > 0 ? adjusting_opacity(evt, params_chart) : params_chart.instanciator.polygon_reset_colors(evt, params_chart);

			params_chart.list_idx_segment_single_selected = []; params_chart.list_keys_values_segment_single_selected = []; params_chart.list_labels_segment_single_selected = [];
			return			
			
		}


		if ((evt.originalEvent.ctrlKey === undefined || evt.originalEvent.ctrlKey === false)) {// && params_chart.list_idx_segments_multiples_selected.length === 0
			
			//remove previous values stored
			params_chart.list_idx_segment_single_selected = []; params_chart.list_keys_values_segment_single_selected = []; params_chart.list_labels_segment_single_selected=[]; params_chart.leaflet_polys_id_selected=[]
			params_chart.list_idx_segments_multiples_selected = []; params_chart.list_keys_values_segments_multiples_selected = []; params_chart.list_labels_segments_multiples_selected = [];

			//set delay time for rendering the scatters
			params_chart.sharedParams.delay_time_scatter = 200
			//save new selection
			params_chart.list_idx_segment_single_selected.push(selected_value); params_chart.list_keys_values_segment_single_selected.push(selection) ; params_chart.list_labels_segment_single_selected.push({category_field: selected_value})
			params_chart.list_idx_segments_multiples_selected.push(selected_value); params_chart.list_keys_values_segments_multiples_selected.push(selection); params_chart.list_labels_segments_multiples_selected.push({category_field: selected_value})

			//save the id of the layer selected
			params_chart.leaflet_polys_id_selected.push(leaflet_poly_id)
			
			//add selection effects by adjusting opacity
			adjusting_opacity(evt, params_chart);
		}
		else if (evt.originalEvent.ctrlKey === true) {
			//remove previous values stored in the single selection listes
			params_chart.list_idx_segment_single_selected = []; params_chart.list_keys_values_segment_single_selected = []; params_chart.list_labels_segment_single_selected = [];			

			//save new selection			
			params_chart.list_idx_segments_multiples_selected.push(selected_value); 						
			params_chart.list_keys_values_segments_multiples_selected.push(selection); 
			params_chart.list_labels_segments_multiples_selected.push({category_field: selected_value})


			//params_chart.list_keys_values_segments_multiples_selected[0][layer_field].push(selected_value)
			
			//save the id of the layer selected
			params_chart.leaflet_polys_id_selected.push(leaflet_poly_id)			

			//add selection effects by adjusting opacity
			adjusting_opacity(evt, params_chart);
		}
		



		function adjusting_opacity(evt, params_chart) {
			//1.increase opacity of the selected polygon
			let current_poly_opacity
			if (params_chart.tileLayer_opacity < 0.15) {current_poly_opacity = params_chart.tileLayer_opacity}
			else {current_poly_opacity = 1}			
			
			evt.target.setStyle({fillOpacity: current_poly_opacity}); evt.target.setStyle({weight: 2})

			if (params_chart.inject_type !== "legends_binding") {
			//2.reduce opacity of other polygons, excepted the ones already selected		
				Object.keys(params_chart.map_instance._layers).forEach(key => { 
					if (params_chart.leaflet_polys_id_selected.indexOf(key) === -1 && params_chart.map_instance._layers[key].hasOwnProperty("_layers") && params_chart.map_instance._layers[key].hasOwnProperty("_events") 
						&& params_chart.map_instance._layers[key].hasOwnProperty("_container") === false) {
						//console.log(key)
						params_chart.map_instance._layers[key].setStyle({fillOpacity: params_chart.tileLayer_minOpacity}); params_chart.map_instance._layers[key].setStyle({weight: params_chart.tileLayer_weight})
					}
				})
			}
		}
	}





	setup_legends(params_chart, sharedParams, mode) {
		var max_cells; const layer_field = params_chart.geographic_priority_layers[0]
		params_chart.params_legends.max_cells ? max_cells = params_chart.params_legends.max_cells : max_cells = 6
		

		if (params_chart.params_legends.show !== true) {
			return
		}


		//in case when the color field is numerical:
		if (params_chart.params_fields.hue_params) {
			var hue_statistical_values = params_chart.legends_config.map(h=> h.hue_statistical_value)
			if (!hue_statistical_values || hue_statistical_values.length === 0) {
				console.warn(`unable to build legends on map ${params_chart.id}, refresh the app`)
				return
			}			
			//binning the legend field			
			let array_binned = binGenerator(params_chart, max_cells, hue_statistical_values)
			

			//build an array of coef colors and extents to feed d3 colors interpolator
			var coef_colors = []
			array_binned.forEach(a=> {coef_colors.push( {hue_value: d3.mean(a), x0: parseFloat(a.x0), x1: parseFloat(a.x1)} ) })

			var legends_colors_setup = [], precision = params_chart.params_legends.toPrecision
			coef_colors.forEach(c=> { 
				legends_colors_setup.push( {hue_value :c.hue_value, label: (c.x0)?.toFixed(precision) + " - " + (c.x1)?.toFixed(precision), 
				color: d3[params_chart.params_fields.hue_params.hue_color]((c.hue_value - params_chart.hue_dataset_extent.min) / (params_chart.hue_dataset_extent.max - params_chart.hue_dataset_extent.min)) } ) 
			} )

			params_chart.legends_colors_setup = legends_colors_setup
		}

		//in case when the color field is categorical:
		else if (params_chart.params_fields.color_params) {
			const color_field = params_chart.params_fields.color_params.color_field
			var legends_colors_setup = _.cloneDeep(params_chart.polygons_colors_setup)
			legends_colors_setup.map(o=> { o["label"] = o[color_field]; delete o[color_field] })
			
		}			


		//check if a legends container exists, remove it first		
		if (mode === 'update') {
			var legendsContainer = document.getElementById('grid_legend_' + params_chart.htmlNode)
			//backup droplist switcher for hue fields
			// var dl=document.querySelector("#droplist_"+params_chart.id)
			// dl ? params_chart.droplist_fields_clone =dl.cloneNode(true) : {}
			// document.getElementById('legend_title_'+params_chart.id)?.remove()
			// document.getElementById('grid-container_legends_'+params_chart.id)?.remove()
			legendsContainer.remove()	

		}

		//create the legends
		var legends_params = {htmlNode: "#"+params_chart.params_legends.htmlNode, chart_id: params_chart.id, max_cells: legends_colors_setup.length, 
			legends_colors_setup: legends_colors_setup}
		generateLegends(legends_params, params_chart, sharedParams)
	


		function binGenerator(params_chart, max_cells, hue_statistical_values) {

			let array_binned = _.repeat(1, 11);
			let index = max_cells, Generate_bins;
			let bin_min = d3.min(hue_statistical_values), bin_max = d3.max(hue_statistical_values)
			while (array_binned.length > max_cells) {
				

				Generate_bins = d3.histogram()
				.domain([bin_min, bin_max])// Set the domain to cover the entire intervall [0;]
				.thresholds(index);  // number of thresholds; this will create 19+1 bins		

				//bin hue values					
				array_binned = Generate_bins(hue_statistical_values).filter(a=> a.length > 0) ;

				if (array_binned.length > max_cells) {
					index--
				}
				else {					
					array_binned[array_binned.length-1].x1++							
					params_chart.legend_dataset_binned = array_binned
				}					  
			}
			return array_binned
		}
  

       

		function filter_map(params_chart, legend_text_selected) {
			//format the value of the selected legend text
			var filter_field = params_chart.params_fields.hue_params.hue_field + "_binned";

			//build the data_input based on the legend(s) selected
			var data_input = []
			//if legends are active, filter the data source
			if (params_chart.selected_legends.length > 0) {
				params_chart.selected_legends.map(l=> {
					var filter_value = l.replace(" ", "").replace(" ", "")
					params_chart.transformations.crossfilter = {[filter_field]: [filter_value]}

					//if the map is filtred, transfert all the values to the crossfilter object
					if (params_chart.filtered_by.axis !== undefined && Object.keys(params_chart.filtered_by.axis).length > 0) 
						{Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)}

					var data_filtred = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
					data_input = data_input.concat(data_filtred)
				})
			}
			else {
				//if the map is filtred, transfert all the values to the crossfilter object
				if (params_chart.filtered_by.axis !== undefined && Object.keys(params_chart.filtered_by.axis).length > 0) 
					{Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)}

				data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
			}




			
			
			params_chart.interaction_type = "legends"
			params_chart.selected_legends.length > 0 ? params_chart.params_datapoints.circles_color_mode = "discrecte_color" : params_chart.params_datapoints.circles_color_mode = "continuous_color"
			params_chart.instanciator.prepare_data_p2(data_input, params_chart, sharedParams)
			params_chart.instanciator.inject_metadata(params_chart.map_instance, params_chart)
			params_chart.interaction_type = ""

		}



	}


	exclusion_extrem_coordinates(params_chart ,data_input, domain) {

		//extraire liste des  latitudes
		var lat_p = getPercentiles(data_input, domain, params_chart.params_fields.lat); var lat_p0 = lat_p.p0; var lat_p1 = lat_p.p1;
		//extraire liste des  longitudes
		var lng_p = getPercentiles(data_input, domain, params_chart.params_fields.lng); var lng_p0 = lng_p.p0; var lng_p1 = lng_p.p1;


		function getPercentiles(data_input, domain, col) {
			if (domain[0] === "auto" || domain[0] === 0 || domain[0] === "min") {
				var p0 = d3.min(data_input.map(e=> e[col]))
			}
			else if (typeof(domain[0]) === "string") {
				if (domain[0].indexOf("p") > -1) {
					var quartil = domain[0]
					quartil = parseFloat(quartil.replace("p",""))
					var p0 = Quartile(data_input.map(e=> e[col]), quartil)
				}
			};

			//check if a max domain is provided, if no pick up the max value of the bin_field
			if (domain[1] === "auto" || domain[1] === "max") {
				var p1 = d3.max(data_input.map(e=> e[col]))
			}
			else if (typeof(domain[1]) === "string") {
				if (domain[1].indexOf("p") > -1) {
					var quartil = domain[1]
					quartil = parseFloat(quartil.replace("p",""))
					var p1 = Quartile(data_input.map(e=> e[col]), quartil)
				}
			}

			return {p0: p0, p1: p1}
		}


		//filtrer la liste sur les coordonées > au p0 et < au p1
		var list_lat_lng = data_input.filter(e=> (e[params_chart.params_fields.lat] >= lat_p0 && e[params_chart.params_fields.lat] <= lat_p1) && (e[params_chart.params_fields.lng] >= lng_p0 && e[params_chart.params_fields.lng] <= lng_p1)) 

		return list_lat_lng

	}

	setup_defaults_parameters(params_chart, sharedParams) {
		if (params_chart.params_fields.hue_params) {
			params_chart.params_fields.hue_params.domain === undefined ? params_chart.params_fields.hue_params.domain = ["min", "max"] : {}
		}		
		params_chart.params_fields.color_mode === undefined ? params_chart.params_fields.color_mode = "continuous_color" : params_chart.params_fields.color_mode = "continuous_color"
		params_chart.params_legends.max_cells === undefined ? params_chart.params_legends.max_cells = 6 : {}
		params_chart.params_legends.show === undefined ? params_chart.params_legends.show = true : {}
		params_chart.figure_auto = sharedParams.params_charts.length
	}


	funcLib(params_chart, sharedParams) {

		// params_chart.map_instance.on("zoomstart", ()=> {
		// 	params_chart.zoomstart = true
		// })

		let monitor_map_display = setInterval(() => {
			var map_parent_nodes = find_node_parents(document.getElementById(params_chart.htmlNode))
			var map_isHidden;
			map_parent_nodes.forEach(node=> {
				if (node.style.display === "none") {map_isHidden = true}
			})
			if (!map_isHidden && !params_chart.zoomstart) {
				var t1_bis1 = (new Date())/1000
				params_chart.map_instance.invalidateSize()				
				if (params_chart.bbox && params_chart.data[1].borders.length===0) {
					params_chart.map_instance.fitBounds(params_chart.bbox)
				}
				else if (params_chart.data[1].borders.length===0){
					if (navigator.language === "fr-FR") {
						params_chart.map_instance.fitBounds([[51.072228, 2.528016], [42.442288, 3.159714]])
					}
				}
				clearInterval(monitor_map_display)
			}
		}, 1000);
	
		params_chart.funcLib['reset_slider_tiles_opacity'] = function(params_chart) {
			var slider_opacity_control = document.getElementById("slider_opacity_control_" + params_chart.id)
			if (slider_opacity_control) slider_opacity_control.value = params_chart.tileLayers_opacity*100
			var value_slider_opacity_control = document.getElementById('value_slider_opacity_control_'+params_chart.id)
			if (value_slider_opacity_control) value_slider_opacity_control.innerText = params_chart.tileLayers_opacity*100+' %'
		}

		params_chart.funcLib['restore_tiles_fillColor'] = function(params_chart) {
			params_chart.map_instance.eachLayer(l=> {if (l.options && l.options.dataset) {l.setStyle({fillColor: l.options.style.fillColor_source})} })
		}
	
	}


}



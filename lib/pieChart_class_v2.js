class PieChart {

	constructor(params_pieChart) {
		this.id = params_pieChart.id
		this.ctx = params_pieChart.ctx
	    this.category_field = params_pieChart.category_field
	    this.numerical_field = params_pieChart.numerical_field
	    this.label_tooltip = params_pieChart.label_tooltip
		this.type = params_pieChart.type
	    this.responsive = true
	    this.title = params_pieChart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0
	    this.hovered_points = {previous: "", current: ""}
	    this.legends_points = {previous: "", current: ""}


	}

	createChart(params_pieChart, sharedParams, data_to_transform) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_pieChart) === false) {
			sharedParams.params_charts.push(params_pieChart)
		}

		params_pieChart.instanciator = this
		params_pieChart.sharedParams = sharedParams

		this.setup_funcLib(params_pieChart, sharedParams)
		
		var data_filtred = this.prepare_data_p1(params_pieChart, sharedParams, data_to_transform)

		this.prepare_data_p2(data_filtred, params_pieChart, sharedParams)

		this.create_parent_container(params_pieChart)
		
		//if (params_pieChart.instanciator === undefined) {
			var chart_instance = this.init_chart(params_pieChart, sharedParams)
		//}
		
		// if (params_pieChart.interactions_chart_options.hoverOptions === true) {				
		// 	this.add_options_hover(chart_instance, params_pieChart) }
		if (params_pieChart.interactions_chart_options.selectionOptions === true) {
			params_pieChart.instanciator.addListeners(params_pieChart.ctx, params_pieChart.chart_instance, params_pieChart)
		}



		//register the instanciator		
		params_pieChart.chart_type = "chartJS"
		params_pieChart.chart_sub_type = "pie"
		

		//chart resizer
			setTimeout(() => {
				let monitor_parent_display = setInterval(() => {
					
					var check_chart_parent_display = check_parent_display(params_pieChart)
					if (check_chart_parent_display.chart_display_on && !params_pieChart.chart_resized) {
						params_pieChart.ctx.parentElement.style.width=params_pieChart.style.chart_width+"px"
						params_pieChart.chart_instance.resize();
						params_pieChart.chart_instance.update();
						params_pieChart.ctx.parentElement.style.width="max-content"
						params_pieChart.chart_resized = true
					}
					else if (!check_chart_parent_display.chart_display_on) { // && params_pieChart.chart_resized
						params_pieChart.chart_resized = false
					}
						
				}, 500);
	
				setTimeout(() => {
					params_pieChart.ctx.parentElement.style.width="max-content"
				}, 2000);
			}, 500); 
		
		


		//regenerate the chart
		// setTimeout(() => {
		// 	params_pieChart.chart_instance.clear()			
		// 	params_pieChart.chart_instance.destroy()
		// 	// //pieChart.canvas.style.opa
		// 	chart_instance = this.init_chart(params_pieChart, params_pieChart.sharedParams)				


			
		// 	if (params_pieChart.interactions_chart_options.hoverOptions === true) {				
		// 		this.add_options_hover(chart_instance, params_pieChart) }
		// 	if (params_pieChart.interactions_chart_options.selectionOptions === true) {
		// 		params_pieChart.instanciator.addListeners(params_pieChart.ctx, params_pieChart.chart_instance, params_pieChart)
		// 	}
			
		// 	setTimeout(() => {
		// 		let monitor_parent_display = setInterval(() => {
					
		// 			var check_chart_parent_display = check_parent_display(params_pieChart)
		// 			if (check_chart_parent_display.chart_display_on && !params_pieChart.chart_resized) {
		// 				params_pieChart.ctx.parentElement.style.width=params_pieChart.style.chart_width+"px"
		// 				params_pieChart.chart_instance.resize();
		// 				params_pieChart.chart_instance.update();
		// 				params_pieChart.ctx.parentElement.style.width="max-content"
		// 				params_pieChart.chart_resized = true
		// 			}
		// 			else if (!check_chart_parent_display.chart_display_on) { // && params_pieChart.chart_resized
		// 				params_pieChart.chart_resized = false
		// 			}
						
		// 		}, 500);
	
		// 		setTimeout(() => {
		// 			params_pieChart.ctx.parentElement.style.width="max-content"
		// 		}, 2000);
		// 	}, 500); 
	
		// }, 2000);

		// if (params_pieChart.interactions_chart_options.selectionOptions === true) {
		// 	params_pieChart.instanciator.addListeners(params_pieChart.ctx, params_pieChart.chart_instance, params_pieChart)
		// }
		// if (params_pieChart.interactions_chart_options.hoverOptions === true) {				
		// 	this.add_options_hover(chart_instance, params_pieChart) }
	

	}

	setup_funcLib(params_chart, sharedParams) { 
		params_chart.funcLib['sync_legends'] = function(params_chart, hidden_legends) {
			var dataset;		
			//1.show all hidden datasets
			params_chart.chart_instance.getDatasetMeta(0).data.forEach(d=> d.hidden = false)
			//2.find the pos of the hidden legend in the target chart
			hidden_legends.forEach(legend=> {
				var indexOf_legend = params_chart.chart_instance.legend.legendItems.findIndex(i=> i.text === legend)
				//2.update legend status
				if (indexOf_legend > -1) {
					params_chart.chart_instance.getDatasetMeta(0).data[indexOf_legend].hidden=true
				}
			})
		
		}

		params_chart.funcLib['restore_chart_view'] = function(params_chart, sharedParams)	{
			//previous code, specific to each chart
				//clean store lists
	          //   params_chart.list_keys_values_segment_single_selected = [];
	          //   params_chart.list_labels_segment_single_selected = [];
	          //   params_chart.list_keys_values_segments_multiples_selected = [];
	          //   params_chart.list_labels_segments_multiples_selected = [];	        	
	          //   params_chart.list_idx_segment_single_selected = [];
	          //   params_chart.list_idx_segments_multiples_selected = [];
	          //   params_chart.id_previous_singleSelect = ""
	          //   params_chart.active_legends = {};
	          //   params_chart.hidden_legends = {};
	            

	          //   //update the chart
	          //   params_chart.funcLib.update_chart_dataset(params_chart, sharedParams)

				

	          //   //clean lists
	          //   var clean_lists = setInterval(()=> {
			        // if (sharedParams.crossfilter_status === 'idle') {
			        //  	params_chart.list_keys_values_segments_multiples_selected = [];
			        //     params_chart.list_labels_segments_multiples_selected = [];
			        //     params_chart.funcLib.restore_legends(params_chart, sharedParams);
			        //     clearInterval(clean_lists)
			        // }
	          //   }, 1000)
	        			
			sharedParams.restore_view(sharedParams)


		}


		params_chart.funcLib['update_chart_dataset'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, sharedParams)

		    //register values to use to restore the chart initial state & other charts state 
	         	params_chart.list_keys_values_segments_multiples_selected = [{...params_chart.list_keys_values_source}];
	            params_chart.list_labels_segments_multiples_selected = [{category_field: params_chart.list_keys_values_source[params_chart.category_field]}];
	            Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0])

            //send a signal iot trigger the crossfilter 
	            params_chart.list_idx_segment_single_selected = [];
	            params_chart.id_previous_singleSelect = ""
	            params_chart.list_idx_segments_multiples_selected = ['restore_view'];

		    
		    //3.get filtred dataset
		    params_chart.to_filter = true
		    var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)

		    //4.update the chart
		    promise_data_input.then(result=> {
		        updateChart(params_chart, result, sharedParams)
		    })

		    function updateChart(params_chart, result, sharedParams) {
		        //clean data config
				params_chart.data[0].labels = []; params_chart.data[1].datasets = [];
				params_chart.chart_instance.config.data.labels = []; 
				for (var ii = 0; ii < params_chart.chart_instance.config.data.datasets.length; ii++) {
					params_chart.chart_instance.config.data.datasets[ii].data = []; params_chart.chart_instance.config.data.datasets[ii].label = "";
					params_chart.chart_instance.config.data.datasets[ii].backgroundColor = []; params_chart.chart_instance.config.data.datasets[ii].borderColor = [];
					params_chart.chart_instance.config.data.datasets[ii].borderWidth = [];
				}

				params_chart.instanciator.prepare_data_p2(result, params_chart, sharedParams)
		        var data_type = "data"; var injection_type = "init"; var updateTime = undefined
		        params_chart.instanciator.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type)		        
		    }
		}


        //collecte active slices
		params_chart.funcLib["collect_active_selections"] = function collect_active_selections(params_chart, sharedParams) {
			params_chart.transformations.crossfilter = {}; var f=params_chart.transformations.crossfilter
			//single selections
			//sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {if (!_.isEmpty(c.list_keys_values_segment_single_selected)) Object.assign(f, c.list_keys_values_segment_single_selected)})
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				if (!_.isEmpty(c.list_keys_values_segment_single_selected)) {
					Object.keys(c.list_keys_values_segment_single_selected[0]).forEach(key=> {
						if (c.list_keys_values_segment_single_selected[0][key].constructor == Array) {
							Object.assign(f, {[key]: c.list_keys_values_segment_single_selected[0][key]})
						}
					})
				}
			})				
			//multiple selections
			//sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {if (!_.isEmpty(c.list_keys_values_segments_multiples_selected)) Object.assign(f, c.list_keys_values_segments_multiples_selected)})
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				if (!_.isEmpty(c.list_keys_values_segments_multiples_selected)) {
					Object.keys(c.list_keys_values_segments_multiples_selected[0]).forEach(key=> {
						if (c.list_keys_values_segments_multiples_selected[0][key].constructor == Array) {
							Object.assign(f, {[key]: c.list_keys_values_segments_multiples_selected[0][key]})
						}
					})
				}
			})				
			//brush selections
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {if (!_.isEmpty(c.brush_keys_values)) Object.assign(f, c.brush_keys_values)})

			//active legends
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the chart has legends params
				if (c.legends_field && c.legends_field !== "") {
					//check if the chart has hidden legends
					if (!_.isEmpty(c.hidden_legends[c.legends_field])) {
						console.log({c: c.legends_field})  
						Object.assign(f, c.active_legends)
					}
				}
			})
		};


		//restore legends
		params_chart.funcLib['restore_legends'] = function(params_chart, sharedParams) {

			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the category field of the source chart equals the legend field of the target
				// if (params_chart.category_field === c.legends_field || params_chart.legends_field === c.legends_field) {
				// 	//reset hidden & active legends objects
				// 	c.hidden_legends = {}; c.active_legends = {};
				// }
				//if the source chart & the target shares he same legends
				if (params_chart.legends_field === c.legends_field) {
					//show hidden legends for target chart
						//if target chart is pie type
						if (c.chart_type === 'chartJS' && (c.chart_sub_type === 'doughnut' || c.chart_sub_type === 'pie')) {
							//1.show all hidden datasets
							c.chart_instance.getDatasetMeta(0).data.forEach(d=> d.hidden = false);
							c.chart_instance.update()
						}
						else if (c.chart_type === 'chartJS') {
							//1.show all hidden datasets
							c.chart_instance.data.datasets.forEach(d=> {Object.values(d._meta)[0].hidden = false });
							c.chart_instance.update()
						};
						c.hidden_legends = {}; c.active_legends = {};
				}				
			})

		}

		params_chart.funcLib['create_figure_number'] = function(params_chart, sharedParams) {
			params_chart.figure_auto = sharedParams.params_charts.length
		}

		params_chart.funcLib.create_figure_number(params_chart, sharedParams)
	}
	


	updateChart(params_pieChart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_pieChart, sharedParams)

		this.prepare_data_p2(data_filtred, params_pieChart, sharedParams)

		var data_type = "data"; var injection_type = "update"
		this.inject_metadata(params_pieChart.chart_instance, params_pieChart, data_type, injection_type)

	}


	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

	    var d1 = new Date();

	    //zone de filtrage
	    //filter the primary data source according to the scope of the vizualisation (limited geographic area, range of time, any specific observation)

	    //data source for the chart
	    if (sharedParams.filter_order_origin === "spatial query" && sharedParams.spatial_data && sharedParams.spatial_data.length > 0) {
	    	var data_chart =[], latLng_index
			if (params_chart.transformations.dataset) {
				//build a lat/lng indexed dataset
				if (!params_chart.transformations.dataset.find(r=> r.latLng)) {
					params_chart.transformations.dataset.forEach(r=> {
						r.latLng = r[params_chart.sharedParams.transformations.latLng_fields.lat]+"_"+r[params_chart.sharedParams.transformations.latLng_fields.lng]
					});
				}
				//form an array of lat/lng values provided by the map brush
				//v2, by building a dict
				console.time('brush circles sizes v2')
				let dict_data_map_brushed={}; 
				params_chart.sharedParams.spatial_data.forEach(r=> dict_data_map_brushed[r.latLng] = r.latLng)
				
				data_chart=[];
				params_chart.transformations.dataset.forEach(r=> {
					if (dict_data_map_brushed[r.latLng]) {
						data_chart.push(r)
					}
				})
				console.timeEnd('brush circles sizes v2')				
			}
			else {
				data_chart = [...sharedParams.spatial_data]
			}
	    }
	    else if (params_chart.transformations.dataset === undefined) {
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

			//transform the filterList into an array that we can push in it filter objects
			filterList = Object.values(filterList)

			params_chart.transformations.filter.map(e=> filterList.push(e))

			//Object.assign(filterList, params_chart.transformations.filter)

			filterList = filterList.filter(l=> l.field !== "")
			
			//if the current filter ID is different from the shared filter id, call the filter function
			//data_chuncks = getFiltredData(data_chart, filter_array, filterList, params_chart.id)
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if (Object.keys(filterList).length > 0 || params_chart.to_filter === true) {
			var data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, data_chuncks, sharedParams)	
		}
		//else 
		else {var data_filtred = [...data_chart]}




		//case when the result of the crossfilter is an array of data & not an array of promises
		if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length > 0) {
			//data_filtred = [...data_chuncks]
			var dataset_grouped = groupData(data_filtred, params_chart)
			return dataset_grouped
		}
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {return []}
		//case when the result of the crossfilter is a promise
		else {
	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_chart)
	        return promise_dataset_ready


			async function process_worker_result(data_filtred, sharedParams, params_chart) {
				var result = []; var chart, promise_result
				//case when the workers return multiple promises of datasets
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
				//case when the workers return one promise of dataset
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
						console.time('exec build subset crossfilter simple_pieChart')
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

						console.timeEnd('exec build subset crossfilter simple_pieChart')


						var dataset_grouped = groupData(dataset_filtred, params_chart)						

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

						//params_chart.data_promise = dataset_grouped
						return dataset_grouped
					}
				}
			}
		}		




	    


	    //grouping zone
	    function groupData(data_filtred, params_chart) {	        
	        var agg_name_lodash = params_chart.numerical_field_params.agg_type + "By";
	        var agg_fieldName = params_chart.numerical_field_params.agg_type + "_" + params_chart.numerical_field_params.fieldName
	        params_chart.numerical_field_params.agg_fieldName = agg_fieldName
	        let groupedItem = _.groupBy(data_filtred, record => record[params_chart.category_field]);
	        if (params_chart.numerical_field_params.agg_type === "count") {
		        var dataset_grouped = _.map(groupedItem, (group, key) => {
		          return {
		            [params_chart.category_field]: group[0][params_chart.category_field],
		            [agg_fieldName]: (group.length)
		          };
		        });
	        }
	        else {
		        var dataset_grouped = _.map(groupedItem, (group, key) => {
		          return {
		            [params_chart.category_field]: group[0][params_chart.category_field],
		            [agg_fieldName]: _[agg_name_lodash](group, params_chart.numerical_field_params.fieldName)
		          };
		        });
		    }

	        //trier tableau
	        dataset_grouped.sort(trier(params_chart.category_field, 'asc'))
	        //round values
	        dataset_grouped = round_values(dataset_grouped, agg_fieldName)        

		    
		    function round_values(dataset_grouped, agg_fieldName) {
		    	for (var d = 0; d < dataset_grouped.length; d++) {	        
		            dataset_grouped[d][agg_fieldName] = Math.round(dataset_grouped[d][agg_fieldName] * 100) / 100
		        };
		        return dataset_grouped
		    }

		   return dataset_grouped
		}



	}




	prepare_data_p2(data_input, params_pieChart, sharedParams) {
		/*processus de création d'un nouveau dataset: 
		params_pieChart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
		*/			
			var categories, categories_source, category_field
			params_pieChart.nb_axis = 1
			params_pieChart.legends_field = this.category_field
			params_pieChart.active_legends.hasOwnProperty(params_pieChart.legends_field) ? {} : params_pieChart.active_legends[params_pieChart.legends_field] = [];
			params_pieChart.hidden_legends.hasOwnProperty(params_pieChart.legends_field) ? {} : params_pieChart.hidden_legends[params_pieChart.legends_field] = [];
			categories_source = data_input.map(r=> r[this.category_field])
			
			if (params_pieChart.list_of_axis.length === 0) {params_pieChart.list_of_axis.push(this.category_field)}

			//1.obtenir les catégories (les communes par ex)

			//if we have fields to decode
			if (params_pieChart.fields_to_decode) {
				//if the fields_to_decode is encapsulated into an array, put it into an object
				if (params_pieChart.fields_to_decode?.constructor == Array ) {
					params_pieChart.fields_to_decode = params_pieChart.fields_to_decode[0]
				}
				if (params_pieChart.fields_to_decode?.constructor == Object ) {
					var lookupTable = params_pieChart.fields_to_decode.lookupTable;
					var mainKey = params_pieChart.fields_to_decode.mainKey;
					var lookupKey = params_pieChart.fields_to_decode.lookupKey
					var fields = params_pieChart.fields_to_decode.fields
											
					params_pieChart.fields_to_decode.fields.forEach(f=> {
						var res = []
						data_input.map(r=> {res.push(r.hasOwnProperty(f))})
						if (res.filter(r=> !r).length > 0) {
							join_v2(data_input, lookupTable, mainKey, lookupKey, fields)						
							res = []
							//1.obtenir les catégories (les communes par ex)
							categories = data_input.map(r=> r[f])
							category_field = f
							params_pieChart.data_input = data_input

						}
					}) 
				}
			}
			else {
				//1.obtenir les catégories (les communes par ex)
				categories = data_input.map(r=> r[this.category_field])
				category_field = this.category_field
			}


			//sort data
			sort_dataset(params_pieChart)			
			function sort_dataset(params_pieChart) {
				if (params_pieChart.sort && params_pieChart.sort.fieldName && params_pieChart.sort.order) {
					if (['asc', 'desc'].includes(params_pieChart.sort.order)) {
						if (params_pieChart.sort.fieldName === params_pieChart.numerical_field_params.fieldName) {
							var key = params_pieChart.numerical_field_params.agg_type + "_" + params_pieChart.sort.fieldName
						}
						else {
							var key = params_pieChart.sort.fieldName
						}
						data_input.sort(trier(key, params_pieChart.sort.order))
					}
				}
			}

			var nb_categories = categories.length; 
			params_pieChart.nb_categories = categories.length;	        

			//2.création des catégories dans la spec ChartJS (champ labels dans chartJS)
			params_pieChart.data[0].labels.push(categories)
			params_pieChart.data_input = data_input		

	        
	        params_pieChart.activ_categories_values = [...categories_source]; //params_pieChart.activ_categories_values.push(categories)



            //4.créer un array borderColor et borderWidth égal à nb_sous_categories
            var borderColorArray = []; 
            var borderWidthArray = [];
            //changements pour passer au simple bar chart -> remplacer nb_sous_categories par nb_categories, pour avoir autant de couleurs que de barres
            for (var i = 0; i < nb_categories; i++) {
            	borderColorArray.push('white');
            	borderWidthArray.push(2);

        	}	        


			/*guide création des sous-catégories dans la spec ChartJS
			params_pieChart.data[1].datasets.push({"label":data_group[i]['nb_pieces'], backgroundColor: 'red', data: [39889, 19889, 14889]})*/
	        
			//changements pour passer au simple bar chart
			//if we initialize the backgroundColorArray for the first time, make a random select from the repository of colors        
			if (Object.keys(params_pieChart.backgroundColorArray_source).length === 0) {
        		var i = 0
        		function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}
				var status_colors = "empty"	            	       

     			if (sharedParams.registed_colors.hasOwnProperty(category_field)) {
     				params_pieChart.backgroundColorArray_source = {...sharedParams.registed_colors[category_field]}
     			}
     			else {
     				var backgroundColorArray_source = generateColors(nb_categories, params_pieChart.colorsConfig.scheme, params_pieChart.colorsConfig.colorsOrder, category_field, sharedParams)
					categories.forEach(axis => {
						params_pieChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						
					})
     			}	     
			}

			if (!sharedParams.registed_colors.hasOwnProperty(params_pieChart.category_field)) {
				sharedParams.registed_colors[category_field] = {...params_pieChart.backgroundColorArray_source}
			}




			//créer les datasets composés des categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			var data_array = []; var backgroundColorArray = []; 			
	        for (var i = 0; i < nb_categories; i++) {

	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	            //2.2.récupérer l'array contenant les data	            
	            data_array.push(data_input[i][params_pieChart.numerical_field_params.agg_fieldName]);

	            //3.construie l'array contenant les couleurs des barres
		        backgroundColorArray.push(params_pieChart.backgroundColorArray_source[categories[i]])

	        };


			//if the chart is already clicked, preserve the deactivated slices and maintain they color effect (grey or lower opacity)
            if (params_pieChart.prepare_data_type === "preserve backgroundColor") {
            	backgroundColorArray = [];
				if (params_pieChart.data_input) {
					var array_labels = params_pieChart.data_input.map(r=> r[params_pieChart.category_field])
				}
				else {var array_labels = params_pieChart.data[0].labels[0]}
            	
            	var active_category_fields = [];
            	for (var c = 0; c < params_pieChart.active_slices.length; c++) {
            		active_category_fields.push(params_pieChart.active_slices[c].category_field)
            	}

            	//1.collecte the category_field value & background color of the active slice
            	for (var a = 0; a < params_pieChart.active_slices.length; a++) {

	            	var active_category_field = params_pieChart.active_slices[a].category_field


	            	//2.collecte the position of the active_category_field in the filtred array of labels
	            	
	            	var pos_active_category_field = array_labels.indexOf(active_category_field)


	            	//3.add grey backgroundColor to the slices, except the active slice setup above
	            	for (var i = 0; i < array_labels.length; i++) {
	            		//if the label looped is not in the array of active labels, set it's background color to grey
	            		pos_active_category_field = active_category_fields.indexOf(array_labels[i])
	            		if (pos_active_category_field === -1) {
		            		backgroundColorArray.push('rgba(240, 240, 240, 0.5)');
	    				}
	    				else {
	            			var active_slice_backgroundColor = params_pieChart.active_slices[pos_active_category_field].backgroundColor	    					
	    					backgroundColorArray.push(active_slice_backgroundColor);
	    				}
	            	}
	            }
            }



            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
            params_pieChart.data[1].datasets.push({label: this.label_tooltip, backgroundColor: backgroundColorArray, borderWidth: borderWidthArray, 
            	borderColor: borderColorArray, data: data_array, datalabels: {anchor: 'end'}})

        params_pieChart.list_idx_segments_existants = [];
		var list_idx_segments_existants = params_pieChart.list_idx_segments_existants                    		
        //1.collecter les clés de tous les segments existants
		for (var i = 0; i < (nb_categories); i++) {
			list_idx_segments_existants.push(i)			
		}

		//.sauvegarder une image des données source avant transformation
		if (params_pieChart.data_source_raw.length === 0) {
			params_pieChart.data_source_raw = data_input
			params_pieChart.data_source[0].labels.push(categories)
	        params_pieChart.data_source[1].datasets = params_pieChart.data[1].datasets
	        params_pieChart.list_keys_values_source = {[params_pieChart.category_field]: categories_source}

	    }		

	}


	init_chart(params_pieChart, sharedParams) {
		
		if (params_pieChart.datalabels && !params_pieChart.datalabels_conf) {
			
			params_pieChart.plugins=[]; params_pieChart.plugins.push(ChartDataLabels)
			params_pieChart.datalabels_conf = {
				backgroundColor: function(context) {
				  return context.dataset.backgroundColor;
				},
				borderColor: 'white',
				borderRadius: 25,
				borderWidth: 2,
				color: 'white',
				display: function(context) {
				  var dataset = context.dataset;
				  var count = dataset.data.length;
				  var value = dataset.data[context.dataIndex];
				  return value > count * 1.5;
				},
				font: {
				  weight: 'bold'
				},
				padding: 6,
				formatter: Math.round
			  }
			  
		}


		var pieChart = new Chart(this.ctx, {
			    type: this.type,
			    data: [],
				plugins: params_pieChart.plugins,
	            options: {	  
					maintainAspectRatio: true, 	
	                responsive: false,                    
                    animation: {
                            duration: 1000,
                            easing: 'easeOutQuad'
                    },
					plugins: {
						datalabels: params_pieChart.datalabels_conf,
						legend: {
							display: true,
							position: "top",
							labels: {boxWidth: 20},
							align: "start",
							padding: 30,
							rtl: true,                    	
							onHover: function(e) {
								if (e) {
									e.native.target.style.cursor = 'pointer';								
								}							
							},
							onClick: function (evt, item) {

								params_pieChart.chart_instance.toggleDataVisibility(item.index)
								params_pieChart.legend_clicked = true;
								params_pieChart.chart_instance.update()
						        
								console.log('legend_clicked pieChart: ' + item.text)
							}                                                                 
						}					
						
					},
					layout: {padding: {top:12, bottom: 12}}
	            }
				
			})
			//pieChart.options.layout.padding = {top: 12, bottom: 12}

			
			
		//handle the display of the chart
		if (params_pieChart.build_on && params_pieChart.build_on.hasOwnProperty('params_chart_id')) {
			//create wait message
			if (params_pieChart.build_on?.messageWait) {
				let parentContainer_ = document.getElementById("parent_container_" + params_pieChart.id)
				//create container_messageWait
				let container_messageWait = document.getElementById('messageWait_'+params_pieChart.id)
				if (container_messageWait) container_messageWait.remove()

				container_messageWait = document.createElement('div'); container_messageWait.id = 'messageWait_'+params_pieChart.id
				container_messageWait.style = `display: grid; opacity: 0.7; border-radius: 5px; background-color: #e8e8e8; width: ${params_pieChart.style.chart_width*0.97}; padding: 4px; text-align: center; position: absolute; border: solid 1px; justify-self: center; align-self: center`
				let parent_chart = sharedParams.params_charts.find(c=> c.id === params_pieChart.build_on.params_chart_id); 
				if (parent_chart.figure) {var message_figure = parent_chart.figure}
				else {var message_figure = `(figure ${parent_chart.figure_auto})`}
				let messageWait = document.createElement('h6'); messageWait.style = 'opacity: 0.8; color: black; justify-self: center; align-self: center; place-self: center;text-align: center;'; messageWait.innerText = params_pieChart.build_on.messageWait+ ` ${message_figure}`;
				container_messageWait.append(messageWait);
				parentContainer_.append(container_messageWait)
			}			
			sharedParams.trigger_chart_display(params_pieChart, sharedParams)
		}

		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(pieChart, params_pieChart, data_type, injection_type)

		

		return pieChart 				
	}


	create_parent_container(params_pieChart) {
		//create a general container
		var parentContainer_ = document.createElement('div'); parentContainer_.id = "parent_container_" + params_pieChart.id;
		let height = params_pieChart.style.width * params_pieChart.style.aspectRatio
		parentContainer_.style = `display: grid; padding: 4px; width: ${params_pieChart.style.chart_width}; position: relative; height: ${height}; grid-row-gap: 1px; border: solid 2px; border-color: rgb(244,67,54,0); border-radius: 1%; transition: border-color 1.5s;`
		
		if (params_pieChart.style.boxShadow) {parentContainer_.style.boxShadow = "0px 2px 5px 1px rgba(0, 0, 0, 0.24)"}

		//create the title
		
			//1.get the parent node of the chart
			var parentElement = params_pieChart.ctx.parentElement
			
			//2.create the title
			var titleContainer = document.createElement('div'); titleContainer.style.display = 'grid'; titleContainer.id = "titleContainer_" + params_pieChart.id
			titleContainer.style = "display: grid; width: max-content; height: max-content; justify-self: center"

			if (params_pieChart.title.constructor == Array) {
				params_pieChart.title.forEach(title=> {
					create_title_text(params_pieChart, title)
				})
			}
			else if (params_pieChart.title.constructor == String) {
				create_title_text(params_pieChart, params_pieChart.title)
			}
			
			function create_title_text(params_pieChart, title_text) {
				var title = document.createElement('span'); title.id = params_pieChart.id + '_title'; title.style = 'align-self: center; justify-self: center; height: max-content; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #666'; 
				title.innerText = title_text
				titleContainer.append(title);
			}			

			var crossfilterContainer = document.createElement('div'); crossfilterContainer.id = "crossfilterContainer_" + params_pieChart.id
			//var width = document.getElementById(params_pieChart.id).clientWidth
			crossfilterContainer.style = `display: flex; flex-wrap: wrap; width: initial; height: 20px; justify-self: left; column-gap: 4px`
			var title_node = document.createElement('p'); title_node.style = 'font-size: 12px; margin: 4px'; title_node.innerText = 'Filtres: '
			crossfilterContainer.append(title_node)

			var crossfilterContainer_tooltip = document.createElement('div'); crossfilterContainer_tooltip.id = "crossfilterContainer_tooltip_" + params_pieChart.id;
			crossfilterContainer_tooltip.style = `display: flex; width: initial; height: 20px; justify-self: left; column-gap: 4px`
			var phantom_title_node = document.createElement('p'); phantom_title_node.style = 'font-size: 12px; margin: 4px; opacity: 0;'; phantom_title_node.innerText = 'Filtres: '
			crossfilterContainer_tooltip.appendChild(phantom_title_node)
	
			

		//create layer for the controls
			//create grid container
			var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; justify-items: center; margin-top: 0px; width: max-content; height: max-content'; controlsContainer.id = "controlsContainer_" + params_pieChart.id
			

			//create sub grids containers
			var grid_restore_view = document.createElement('div'); grid_restore_view.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_restore_view.id = "grid_restore_view_" + params_pieChart.id

		    //create control for restore view
		        const controlRestore = document.createElement('img'); controlRestore.src = "css/font-awesome-svg/undo-solid.svg"; controlRestore.id = "restore_pointer_" + params_pieChart.id
		        controlRestore.style.width= "18px"; controlRestore.title = 'Restore to initial view'		        
		        controlRestore.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} )
		        controlRestore.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
		        controlRestore.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
		        controlRestore.addEventListener('mouseleave', (evt)=> {
					if (evt.target['data-clicked']) {
						evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
					else {evt.target.style.filter = ""}
				});
		        grid_restore_view.append(controlRestore)
		        controlsContainer.append(grid_restore_view)

		        controlRestore.addEventListener("click", evt=> {
		        	params_pieChart.funcLib.restore_chart_view(params_pieChart, sharedParams)
		        })

		//create a figure label		
		let fig = create_figure_label(params_pieChart)
		fig.style.marginTop = '5px'
		//append all the elements
			parentContainer_.append(titleContainer);
			parentContainer_.append(crossfilterContainer);
			parentContainer_.append(crossfilterContainer_tooltip)
			parentContainer_.append(controlsContainer);
			insertHtmlNodeAfter(params_pieChart.ctx, parentContainer_)
			parentContainer_.append(params_pieChart.ctx)
			parentContainer_.append(fig)
			

			params_pieChart.ctx.style.justifySelf = 'center'
	}

	inject_metadata(pieChart, params_pieChart, data_type, injection_type, updateTime) {
		//alimenter avec les labels
		if (pieChart.config.data.labels.length === 0) {
			pieChart.config.data.labels = [...params_pieChart[data_type][0].labels[0]]
		}
	

		//alimenter avec les datasets
		if (injection_type === "init") {
			var l = params_pieChart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_pieChart[data_type][1].datasets[i])
				pieChart.config.data.datasets[i] = {...datasets[i]}
			}
			pieChart.config.data.datasets = [...datasets]


		}
		else if (injection_type === "update") {
			var l = params_pieChart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_pieChart[data_type][1].datasets[i])
				pieChart.config.data.datasets[i].data = [...datasets[i].data]
				pieChart.config.data.datasets[i].label = datasets[i].label
				pieChart.config.data.datasets[i].backgroundColor = [...datasets[i].backgroundColor]
				pieChart.config.data.datasets[i].borderColor = [...datasets[i].borderColor]
				pieChart.config.data.datasets[i].borderWidth = [...datasets[i].borderWidth]
			}
			pieChart.config.data.labels = [...params_pieChart[data_type][0].labels[0]]
			params_pieChart.sharedParams.highlight_chart_border(params_pieChart)
		}

		



		if (updateTime === undefined) {updateTime = 1000}


		//procedure manuelle pour remmetre les couleurs source
		/*bar1.config.data.datasets[2].backgroundColor = _.cloneDeep(params_bar1_deepCopy.data[1].datasets[2].backgroundColor)*/

		//register the chart instance in the param array
		params_pieChart.chart_instance = pieChart


		//if the chart shares legends with another chart, sync their legends
		if (params_pieChart.sync_legends) {
			params_pieChart.funcLib.sync_legends(params_pieChart, params_pieChart.sync_legends)
			params_pieChart.sync_legends = undefined
			pieChart.update(updateTime)			
		}
		else {
			pieChart.update(updateTime)	
		}
		

		return pieChart
	}





	maj_couleurs(pieChart, params_pieChart) {
		//on entre dans cette func pour enlever le focus posé sur les segments

		var nb_categories = params_pieChart.nb_categories;
		var backgroundColorArray = [];

		if (params_pieChart.fields_to_decode?.constructor == Array) {
			if (params_pieChart.fields_to_decode?.constructor == Array) {
				var category_field_decoded = params_pieChart.fields_to_decode[0].fields[0]
			}
			else {
				var category_field_decoded = params_pieChart.fields_to_decode.fields[0]	
			}
			var array_labels = params_pieChart.data_input.map(r=> r[category_field_decoded])
		}
		else if (params_pieChart.fields_to_decode?.constructor == Object) {
			var category_field_decoded = params_pieChart.fields_to_decode.fields[0]
			var array_labels = params_pieChart.data_input.map(r=> r[category_field_decoded])
		}
		else {var array_labels = pieChart.data.labels}

		Object.keys(params_pieChart.backgroundColorArray_source).filter(o=> o !== 'category_field').map(k=> { 
			if (array_labels.includes(k)) {
				var i = pieChart.data.labels.findIndex(ind=> ind === k)
				pieChart.data.datasets[0].backgroundColor[i] = params_pieChart.backgroundColorArray_source[k] 
				pieChart.config.data.datasets[0].borderColor[i] = "white";
				pieChart.config.data.datasets[0].borderWidth[i] = 1

			}; 			 
		})

		pieChart.update();
	}

	reset_border_color(this_chart, params_pieChart_deepCopy) {
		/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_pieChart_deepCopy);*/

		//remettre config sans bordures
		var nb_categories = params_pieChart_deepCopy.nb_categories;

		//parcours catégories
		if (params_pieChart_deepCopy.active_slices.length === 0) {
			for (var i = 0; i < nb_categories; i++) {		
				
				//this_chart.config.data.datasets[0].borderColor[i] = "rgba(230, 11, 11, 0)";
				this_chart.config.data.datasets[0].borderColor[i] = "rgba(210, 210, 210, 1)";
				this_chart.config.data.datasets[0].borderWidth[i] = 1
				
			}
		this_chart.update();
		}
		else {
			for (var i = 0; i < nb_categories; i++) {		
				
				this_chart.config.data.datasets[0].borderColor[i] = "rgba(210, 210, 210, 1)";
				this_chart.config.data.datasets[0].borderWidth[i] = 1
				
			}
		this_chart.update();			
		}

		

	}






	// add_options_hover(this_chart, params_pieChart_deepCopy) {

	// 		this_chart.config.options = {
	//                 onHover: function(evt) {
	//                     //var point = this_chart.getElementAtEvent(e);
	// 					var point = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
	// 					var activePoints
	// 					var this_instance = params_pieChart_deepCopy.instanciator

	//                      if (point.length) {
	//                         //transformer curseur en pointeur
	// 						evt.native.target.style.cursor = 'pointer'; 

	//                      	//effacer les bordures précédantes
	//                      	//this_chart.update();

	//                         //si survol d'un segment, mettre bordure rouge sur élément survolé
	//                         activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
	//                         if (activePoints[0]) {
	//                             //relever l'index de l'élément survolé                    
	//                             var idx = activePoints[0].index;
	// 							var datasetIdx = activePoints[0]['_datasetIndex'];

	// 							//collecter la couleur du segment
	// 							var activePoint_backgroundColor = activePoints[0].element.options.backgroundColor;
								
	// 							//augmenter l'opacité de la bordure
	// 							this_chart.config.data.datasets[0].borderWidth[idx] = 0
	// 							params_pieChart_deepCopy.border_activated = true
								
	// 							//augmenter l'opacité du segment
	// 							activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")
	// 							activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;
	// 							//this_chart.data.datasets[datasetIdx].backgroundColor[idx] = activePoint_backgroundColor;
								
	// 							//var label = activePoints[0]._model.label;
	// 							var label = this_chart.data.labels[activePoints[0].index];

	// 							//test désactivation couleurs segments non selectionnés
								
	// 							this_instance.hovered_points.current = idx
	// 							if (this_instance.hovered_points.current !== this_instance.hovered_points.previous) {
	// 								//console.log("hover: " + idx); console.log("hover: " + label)
	// 								this_instance.reset_border_color(this_chart, params_pieChart_deepCopy)
									
	// 								if (params_pieChart_deepCopy.active_slices.length === 0) {
	// 									this_instance.maj_couleurs(this_chart, params_pieChart_deepCopy);
	// 								}
	// 								this_instance.hovered_points.previous = idx
	// 							}

								

	//                         }

	//                      }
	//                      else {
	// 						evt.native.target.style.cursor = 'default';

	//                      	if (params_pieChart_deepCopy.border_activated === true) {
	// 							params_pieChart_deepCopy.instanciator.reset_border_color(this_chart, params_pieChart_deepCopy)
	// 							params_pieChart_deepCopy.border_activated = false
	// 						}

	//                      }
	//                 }
	// 	}
	// }	


	add_options_hover(this_chart, params_pieChart_deepCopy) {
		var activePoints
		// this_chart.config.options.hover = {
		//         onHover: function(e) {
		this_chart.config.options = {
			onHover: function(e) {
					 //var point = this_chart.getElementAtEvent(e);
					 var point = this_chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)

					 if (point[0]) {
						e.native.target.style.cursor = 'pointer'; 
					 }
					 else {
						e.native.target.style.cursor = ''; 
					 }

			}

		}
	}


	addListeners(ctx, this_chart, params_pieChart_deepCopy) {

	            //gestion de la bordure en zone blanche
	            // ctx.addEventListener("mouseover", function(evt){
	            //     var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

				// 	if ((evt.layerX > params_pieChart_deepCopy.chart_instance.chartArea.left && evt.layerX < params_pieChart_deepCopy.chart_instance.chartArea.right) && 
				// 	(evt.layerY > params_pieChart_deepCopy.chart_instance.chartArea.top && evt.layerY < params_pieChart_deepCopy.chart_instance.chartArea.bottom)) {
				// 		console.log('pointer mouseover')
				// 	}
				// 	else {console.log('cursor mouseover')}

				// 	if (activePoints[0]) {


	            //     }
	            //     else {
	            //     	//remettre config sans bordures

	            //     	/*console.log("entrée en zone blanche 2")*/
				// 		var nb_categories = params_pieChart_deepCopy.nb_categories;

	            //     }        

	            // });

	            // ctx.addEventListener("mousemove", function(evt){
	            //     var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

				// 	if ((evt.layerX > params_pieChart_deepCopy.chart_instance.chartArea.left && evt.layerX < params_pieChart_deepCopy.chart_instance.chartArea.right) && 
				// 	(evt.layerY > params_pieChart_deepCopy.chart_instance.chartArea.top && evt.layerY < params_pieChart_deepCopy.chart_instance.chartArea.bottom)) {
				// 		console.log('pointer mousemove')
				// 	}
				// 	else {console.log('cursor mousemove')}

					
				// })

				ctx.addEventListener("mousemove", function(evt){params_pieChart_deepCopy.instanciator.addListenerMouseover(evt, this_chart, params_pieChart_deepCopy)});




	            //collecter le segment cliqué
	            ctx.addEventListener("click", function(evt){
	                var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

	                if (activePoints[0]) {

	                	try {
		                    var idx = activePoints[0].index;
							var datasetIdx = activePoints[0]['_datasetIndex'];
							var key_composite = datasetIdx + "-" + idx

							var categorie = this_chart.data.labels[idx];

							if (params_pieChart_deepCopy.fields_to_decode) {
								if (params_pieChart_deepCopy.fields_to_decode?.constructor == Array) {
									var category_field_decoded = params_pieChart_deepCopy.fields_to_decode[0].fields[0]
								}
								else {
									var category_field_decoded = params_pieChart_deepCopy.fields_to_decode.fields[0]	
								}
								var categorie = params_pieChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_pieChart_deepCopy.category_field]
							}




							//il faut annuler les segments multiples précédemment sélectionnés avant de passer à une sélection unique
							//controler que shift n'a pas été appuyé
							if (evt.ctrlKey === false) {
								params_pieChart_deepCopy.list_idx_segments_multiples_selected = []; params_pieChart_deepCopy.list_labels_segments_multiples_selected = []
								params_pieChart_deepCopy.list_keys_values_segments_multiples_selected = [];
							};

							////il faut annuler le segment unique sélectionné lors sur dernier clic								
							params_pieChart_deepCopy.list_labels_segment_single_selected = [];
							params_pieChart_deepCopy.list_keys_values_segment_single_selected = [];
							sharedParams.filter_order_origin = "pieChart"


							//if clic on the same slice, clean the lists
							if (params_pieChart_deepCopy.list_idx_segment_single_selected.includes(idx)) {
								return								
							}

							else {
								var category_field = params_pieChart_deepCopy.category_field;
								
								params_pieChart_deepCopy.list_labels_segment_single_selected.push({category_field: categorie});
								params_pieChart_deepCopy.list_keys_values_segment_single_selected.push({[category_field] : [categorie]});


								//controler que shift n'a pas été appuyé pour éviter des push multiples
								if (evt.ctrlKey === false) {
									params_pieChart_deepCopy.list_labels_segments_multiples_selected.push({category_field: categorie});
									params_pieChart_deepCopy.list_keys_values_segments_multiples_selected.push({[category_field] : [categorie]});								
								}



			                    console.log("labels collectés:"); console.log(params_pieChart_deepCopy.list_labels_segment_single_selected); /*console.log("valeur: " + value)*/
			                }

		                }
		                catch {
		                	console.log("segment non detecté, clic à l'exterieur du graph")

							params_pieChart_deepCopy.list_idx_segment_single_selected = [];
							params_pieChart_deepCopy.list_labels_segment_single_selected = [];
							params_pieChart_deepCopy.list_keys_values_segment_single_selected = [];
							params_pieChart_deepCopy.list_keys_values_segment_single_selected = [];
							params_pieChart_deepCopy.list_keys_values_segments_multiples_selected = [];
							params_pieChart_deepCopy.active_slices = []
		                }    
	                }        

	            });


	            //gestion d'un clic unique sur un segment (pour désactiver les couleurs des segments non selectionnés)
	            ctx.onclick = function(evt) {
	            	
	                //var activePoints = this_chart.getElementAtEvent(evt);
					var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
	                //si le clic est fait sur un des segments
	                if (activePoints[0]) {
	                	//1.remettre les couleurs d'origine sur tous les segments
		                params_pieChart_deepCopy.instanciator.maj_couleurs(this_chart, params_pieChart_deepCopy);

	                    var idx = activePoints[0].index;
	                    var categorie = this_chart.data.labels[idx];

	                    //collect color of the slice
						var activePoint_backgroundColor = params_pieChart_deepCopy.backgroundColorArray_source[categorie]
						//augmenter l'opacité du segment
						activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")						


						if (params_pieChart_deepCopy.fields_to_decode) {
							if (params_pieChart_deepCopy.fields_to_decode?.constructor == Array) {
								var category_field_decoded = params_pieChart_deepCopy.fields_to_decode[0].fields[0]
							}
							else {
								var category_field_decoded = params_pieChart_deepCopy.fields_to_decode.fields[0]	
							}
							var categorie = params_pieChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_pieChart_deepCopy.category_field]
						}

						//if clic on the same slice, quit
						if (params_pieChart_deepCopy.list_idx_segment_single_selected.includes(idx)) {
							params_pieChart_deepCopy.list_idx_segment_single_selected = [];
							return
						}





						////il faut annuler le segment unique sélectionné lors sur dernier clic					
						params_pieChart_deepCopy.list_idx_segment_single_selected = [];
	                    params_pieChart_deepCopy.list_idx_segment_single_selected.push(idx);

						//controler que shift n'a pas été appuyé pour éviter des push multiples
						if (evt.ctrlKey === false) {
	    	                params_pieChart_deepCopy.list_idx_segments_multiples_selected.push(idx);//++
							//evo
							params_pieChart_deepCopy.active_slices = [];
							params_pieChart_deepCopy.active_slices.push({category_field: categorie, backgroundColor: activePoint_backgroundColor})

	    	            }


						
						/*console.log("idx: " + idx); console.log("datasetIdx: " + datasetIdx); console.log("id dataset: + key_composite")*/
	                    //var chartData = activePoints[0]['_chart'].config.data;                

	                    //parcourir toutes les barres pour les mettre en gris sauf celle cliquée
	                    var nb_categories = params_pieChart_deepCopy.nb_categories;
	    
	                        for (var i = 0; i < (nb_categories); i++) {
	                            //si la categorie parcourue n'est pas la catégorie active

	                            		//si on entre dans un segment différent du segment actif, griser la couleur du segment
	                            		if (idx !== i) {
		                            	//la couleur de fond se désactive ainsi pour le 1er segment: bar1.config.data.datasets[0].backgroundColor[0] = 'grey'
		                            		this_chart.config.data.datasets[0].backgroundColor[i] = "rgba(240, 240, 240, 0.5)";

		                            		//make border color grey for all other slices
		                            		this_chart.config.data.datasets[0].borderColor[i] = "rgba(210, 210, 210, 1)";
		                            		this_chart.config.data.datasets[0].borderWidth[i] = 1
		                            	}
										else {
											//collecter la couleur du segment											
											
											
											activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;
											this_chart.config.data.datasets[0].backgroundColor[i] = activePoint_backgroundColor;

				

										}

	                            	}                            	

	                        //save the colors of the filtred state
							var backgroundColor_array = [];
							for (var i = 0; i < this_chart.config.data.datasets.length; i++) {
								backgroundColor_array.push(this_chart.config.data.datasets[i].backgroundColor)
							};
							params_pieChart_deepCopy.backgroundColor_array_ClickedState = backgroundColor_array;

	                        this_chart.update()                    

	                }

	                //remettre les couleurs d'origine lors d'un clic à l'extérieur des barres
	                else {

	                	params_pieChart_deepCopy.prepare_data_type = "";
	                    params_pieChart_deepCopy.instanciator.maj_couleurs(this_chart, params_pieChart_deepCopy);
	                    params_pieChart_deepCopy.instanciator.reset_border_color(this_chart, params_pieChart_deepCopy)
						//vider liste des segments selectionnés
						
						
						params_pieChart_deepCopy.list_idx_segments_multiples_selected = [];
						params_pieChart_deepCopy.list_labels_segments_multiples_selected = [];												
						params_pieChart_deepCopy.list_idx_segment_single_selected = [];
						params_pieChart_deepCopy.list_labels_segment_single_selected = [];
						params_pieChart_deepCopy.list_keys_values_segment_single_selected = [];						
						params_pieChart_deepCopy.list_keys_values_segments_multiples_selected = [];
						params_pieChart_deepCopy.active_slices = []
	                }
	            }





	            //rés-activer les couleurs de tous les segments
	            ctx.ondblclick = function(evt) {
	            	params_pieChart_deepCopy.prepare_data_type = ""
	                params_pieChart_deepCopy.instanciator.maj_couleurs(this_chart, params_pieChart_deepCopy);

					//vider liste des segments selectionnés
					params_pieChart_deepCopy.list_idx_segments_multiples_selected = [];
					params_pieChart_deepCopy.list_labels_segments_multiples_selected = [];												
					params_pieChart_deepCopy.list_idx_segment_single_selected = [];
					params_pieChart_deepCopy.list_labels_segment_single_selected = [];					
					params_pieChart_deepCopy.list_keys_values_segment_single_selected = [];
					params_pieChart_deepCopy.list_keys_values_segments_multiples_selected = [];
					params_pieChart_deepCopy.active_slices = []
					
	            };
	     


		      /*gestion d'un clic + shift sur plusiers segments (pour désactiver les couleurs des segments non selectionnés)*/
		      ctx.addEventListener("click",
		        function(evt) {
		          if (evt.ctrlKey) {
		                	//remettre les couleurs d'origine sur tous les segments
			                params_pieChart_deepCopy.instanciator.maj_couleurs(this_chart, params_pieChart_deepCopy);

		                    //var activePoints = this_chart.getElementAtEvent(e);
							var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
		                    var idx = activePoints[0].index;
							
							var categorie = this_chart.data.labels[idx];

							//collect the backgroundcolor of the slice
							var activePoint_backgroundColor = params_pieChart_deepCopy.backgroundColorArray_source[categorie]
							//augmenter l'opacité du segment
							activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")


							if (params_pieChart_deepCopy.fields_to_decode) {
								if (params_pieChart_deepCopy.fields_to_decode?.constructor == Array) {
									var category_field_decoded = params_pieChart_deepCopy.fields_to_decode[0].fields[0]
								}
								else {
									var category_field_decoded = params_pieChart_deepCopy.fields_to_decode.fields[0]	
								}
								var categorie = params_pieChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_pieChart_deepCopy.category_field]
							}							

							var category_field = params_pieChart_deepCopy.category_field;



							var list_idx_segments_existants = params_pieChart_deepCopy.list_idx_segments_existants

							//vider les listes alimentées par un clic unique
							params_pieChart_deepCopy.list_idx_segment_single_selected = []; params_pieChart_deepCopy.list_labels_segment_single_selected = [];
							params_pieChart_deepCopy.id_previous_singleSelect = ""


							//refresh the lists fed by clic+shift
							//1.if the slice selected is not in the current lists, push it
							var pos_slice = params_pieChart_deepCopy.list_idx_segments_multiples_selected.indexOf(idx);
							if (pos_slice === -1) {
								//register the activated slices
			                    params_pieChart_deepCopy.list_idx_segments_multiples_selected.push(idx);
			                    params_pieChart_deepCopy.list_labels_segments_multiples_selected.push({"category_field": categorie})
			                    params_pieChart_deepCopy.list_keys_values_segments_multiples_selected.push({[category_field] : [categorie]});
								//register in the params_chart the active category & it's background color
								params_pieChart_deepCopy.active_slices.push({category_field: categorie, backgroundColor: activePoint_backgroundColor});

							}
							//2.delete selected slice from the diffent arrays
							else {
								params_pieChart_deepCopy.list_idx_segments_multiples_selected.splice(pos_slice, 1)

								var index_cat = params_pieChart_deepCopy.list_labels_segments_multiples_selected.findIndex(x => x.category_field === categorie);
								params_pieChart_deepCopy.list_labels_segments_multiples_selected.splice(index_cat, 1)

								var index_cat = params_pieChart_deepCopy.list_keys_values_segments_multiples_selected.findIndex(x => x[category_field][0] === categorie);
								params_pieChart_deepCopy.list_keys_values_segments_multiples_selected.splice(index_cat, 1)

								var index_cat = params_pieChart_deepCopy.active_slices.findIndex(x => x.category_field === categorie);
								params_pieChart_deepCopy.active_slices.splice(index_cat, 1)
							}





		                    //observableSlim
		                    /*p.changeBar1 = false;*/
		                    //var chartData = activePoints[0]['_chart'].config.data;
		             

		                    //parcourir toutes les barres pour les mettre en gris sauf celles cliquées
		                    var nb_segments_existants = params_pieChart_deepCopy.list_idx_segments_existants.length;
		                    var nb_categories = params_pieChart_deepCopy.nb_categories;
							

		                    //ne s'applique qu'en cas de sélection multiple
		    
		                        for (var i = 0; i < (nb_segments_existants); i++) {
		                            //si le segment n'appartient pas à la liste des segments selectionnés, le mettre en gris
		                            var segment_a_traiter = list_idx_segments_existants[i];

		                            //si le segment actuel a déjà été selectionné, ne pas le griser
		                            if (params_pieChart_deepCopy.list_idx_segments_multiples_selected.indexOf(segment_a_traiter) === -1) {
		                                this_chart.data.datasets[0].backgroundColor[i] = "rgba(240, 240, 240, 0.5)";
		                                
		                            }
		                            //else increase it's opacity if the slice is still maintained
		                            else {		                            	
		                            	var cat_value = params_pieChart_deepCopy.data[0].labels[0][i];
		                            	var index_cat = params_pieChart_deepCopy.active_slices.findIndex(x => x.category_field === cat_value);
		                            	
		                            	if (index_cat > -1) {
			                            	var bckg_color = params_pieChart_deepCopy.active_slices[index_cat].backgroundColor
			                            	this_chart.data.datasets[0].backgroundColor[i] = bckg_color;
			                            }
			                            /*catch(error) {
			                            	console.log(error)
			                            }*/
		                            }

		                        };
		                        this_chart.update();
		                    }

		        },false)
	}

	addListenerMouseover(evt, this_chart, params_pieChart_deepCopy){        
		var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

        if (activePoints[0]) {// || params_pieChart_deepCopy.legend_hovered
			evt.target.style.cursor='pointer'			

			//restor initial colors state
			let backgroundColor_array = [...params_pieChart_deepCopy.data[1].datasets[0].backgroundColor]
			// params_pieChart_deepCopy.chart_instance.data.datasets[0].backgroundColor = backgroundColor_array;

			//collecter la couleur du segment								
			//var activePoint_backgroundColor = backgroundColor_array[activePoints[0].index]
			
			//if a slice has been clicked, preserve its color
			// for (let index = 0; index < backgroundColor_array.length; index++) {
			// 	params_pieChart_deepCopy.chart_instance.data.datasets[0].backgroundColor[index] = "rgba(240, 240, 240, 0.5)";
				
			// }


			
			
			//augmenter l'opacité de la bordure			
			// params_pieChart_deepCopy.border_activated = true
			
			// //augmenter l'opacité du segment
			// activePoint_backgroundColor = activePoint_backgroundColor.replace(", 0.65)", ", 1)");
			// activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;

			// params_pieChart_deepCopy.chart_instance.data.datasets[0].backgroundColor[activePoints[0].index] = activePoint_backgroundColor;			
			//params_pieChart_deepCopy.chart_instance.update()

        }
        else {
			evt.target.style.cursor=''

			//restor initial colors state
			// let backgroundColor_array = [...params_pieChart_deepCopy.data[1].datasets[0].backgroundColor];
			// params_pieChart_deepCopy.chart_instance.data.datasets[0].backgroundColor = backgroundColor_array;
			// params_pieChart_deepCopy.chart_instance.update();


        }        

    }	

}



class simple_BarChart {

	constructor(params_barChart) {
		this.id = params_barChart.id
		this.ctx = params_barChart.ctx
	    this.category_field = params_barChart.category_field
	    this.sub_category_field = params_barChart.sub_category_field
	    this.numerical_field = params_barChart.numerical_field
	    this.agg_fieldName = params_barChart.numerical_field_params.agg_fieldName
	    this.title_x_axis = params_barChart.title_x_axis
	    this.title_y_axis = params_barChart.title_y_axis
	    this.label_tooltip = params_barChart.label_tooltip
		this.type = params_barChart.type
	    this.responsive = true
	    this.title = params_barChart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0
	    this.nb_sous_categories = 0


	}

	createChart(params_barChart, sharedParams, data_to_transform) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_barChart) === false) {
			sharedParams.params_charts.push(params_barChart)
		}

		params_barChart.sharedParams = sharedParams
		this.setup_funcLib(params_barChart, sharedParams)
		
		var data_filtred = this.prepare_data_p1(params_barChart, sharedParams, data_to_transform)

		if (data_filtred === "no dataset fits") {
			console.warn(data_filtred)
			return
		}

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		params_barChart.funcLib.create_parent_container(params_barChart, sharedParams);
		

		if (params_barChart.brush_mode) {
			//setTimeout(() => {
				params_barChart.funcLib.brush(params_barChart, sharedParams)		
				params_barChart.sharedParams.position_brush_transformer(params_barChart)
			//}, 500); 
		}		


		//if (params_barChart.instanciator === undefined) {
			var chart_instance = this.init_chart(params_barChart, sharedParams)
		//}

		var _thisClass = this
		params_barChart.chart_sub_type = "bar"
		
		//if (params_barChart.interactions_chart_options.hoverOptions === true) { this.add_options_hover(params_barChart.chart_instance, params_barChart) }
		if (params_barChart.interactions_chart_options.selectionOptions === true) { this.addListeners(params_barChart.ctx, chart_instance, params_barChart, _thisClass, sharedParams) }



		params_barChart.instanciator = this
		params_barChart.chart_type = "chartJS"



		//chart resizer
		setTimeout(() => {
			let monitor_parent_display = setInterval(() => {
				
				var check_chart_parent_display = check_parent_display(params_barChart)
				if (check_chart_parent_display.chart_display_on && !params_barChart.chart_resized) {
					params_barChart.ctx.parentElement.style.width=params_barChart.style.chart_width+"px"
					document.getElementById('general_container_'+params_barChart.id).style.width = params_barChart.style.chart_width+10+"px"
					params_barChart.chart_instance.resize();
					params_barChart.chart_instance.update();
					document.getElementById('parent_container_'+params_barChart.id).style.width = 'max-content'
					
					//params_barChart.funcLib.create_animated_scales(params_barChart, sharedParams)
					params_barChart.chart_resized = true
				}
				else if (!check_chart_parent_display.chart_display_on) { // && params_barChart.chart_resized
					params_barChart.chart_resized = false
				}
					
			}, 500);

			setTimeout(() => {
				//params_barChart.ctx.parentElement.style.width="max-content"
				document.getElementById('parent_container_'+params_barChart.id).style.width = 'max-content'
			}, 2000);
		}, 500); 

		//regenerate the chart
		// setTimeout(() => {
		// 	params_barChart.chart_instance.clear()			
		// 	params_barChart.chart_instance.destroy()
		// 	// //pieChart.canvas.style.opa
		// 	this.init_chart(params_barChart, params_barChart.sharedParams)				


			
		// 	if (params_barChart.interactions_chart_options.hoverOptions === true) {				
		// 		this.add_options_hover(params_barChart.chart_instance, params_barChart) }
		// 	if (params_barChart.interactions_chart_options.selectionOptions === true) {
		// 		params_barChart.instanciator.addListeners(params_barChart.ctx, params_barChart.chart_instance, params_barChart, _thisClass, sharedParams)
		// 	}
		// 	// if (params_barChart.interactions_chart_options.hoverOptions === true) { this.add_options_hover(chart_instance, params_barChart) }
		// 	// if (params_barChart.interactions_chart_options.selectionOptions === true) { this.addListeners(params_barChart.ctx, chart_instance, params_barChart, _thisClass, sharedParams) }
				
		// 	//resize mecanisme
		// 	setTimeout(() => {
		// 		let monitor_parent_display = setInterval(() => {
					
		// 			var check_chart_parent_display = check_parent_display(params_barChart)
		// 			if (check_chart_parent_display.chart_display_on && !params_barChart.chart_resized) {
		// 				params_barChart.ctx.parentElement.style.width=params_barChart.style.chart_width+"px"
		// 				params_barChart.chart_instance.resize();
		// 				params_barChart.chart_instance.update();
		// 				params_barChart.ctx.parentElement.style.width="max-content"
		// 				params_barChart.chart_resized = true
		// 			}
		// 			else if (!check_chart_parent_display.chart_display_on) { // && params_barChart.chart_resized
		// 				params_barChart.chart_resized = false
		// 			}
						
		// 		}, 500);
	
		// 		setTimeout(() => {
		// 			params_barChart.ctx.parentElement.style.width="max-content"
		// 		}, 2000);
		// 	}, 500); 
	
		// }, 2000);

	}
	

	setup_funcLib(params_chart, sharedParams) {
		params_chart.funcLib["groupData"] = function groupData(data_filtred, params_chart) {
		    if (params_chart.bin_params.bin === false) {
		        var dataset_grouped = [];
		        var agg_name_lodash = params_chart.numerical_field_params.agg_type + "By";
		        var agg_fieldName = params_chart.numerical_field_params.agg_type + "_" + params_chart.numerical_field_params.fieldName
		        params_chart.numerical_field_params.agg_fieldName = agg_fieldName
		        let groupedItem = _.groupBy(data_filtred, record => record[params_chart.category_field]);
		        if (params_chart.numerical_field_params.agg_type === "count") {
			        dataset_grouped = _.map(groupedItem, (group, key) => {
			          return {
			            [params_chart.category_field]: group[0][params_chart.category_field],
			            [agg_fieldName]: (group.length)
			          };
			        });
		        }
		        else {
			        dataset_grouped = _.map(groupedItem, (group, key) => {
			          return {
			            [params_chart.category_field]: group[0][params_chart.category_field],
			            [agg_fieldName]: _[agg_name_lodash](group, params_chart.numerical_field_params.fieldName)
			          };
			        });
			    }
		        //console.log("tps exec lodash: " + (new Date() - d1)/1000)
		        /*console.log('output: ', dataset_grouped);*/

		        //trier tableau
		        dataset_grouped.sort(trier(params_chart.category_field, 'asc'))
		        //round values
		        dataset_grouped = round_values(dataset_grouped, agg_fieldName)        
		    }

		    else if (params_chart.bin_params.bin === true) {
		        //to develop
		        //var dataset_grouped = main_bin(data_filtred, params_chart)
		    }		    

		    return dataset_grouped


		    function round_values(dataset_grouped, agg_fieldName) {
		    	for (var d = 0; d < dataset_grouped.length; d++) {	        
		            dataset_grouped[d][agg_fieldName] = Math.round(dataset_grouped[d][agg_fieldName] * 100) / 100
		        };
		        return dataset_grouped
		    }

		}

		params_chart.funcLib['apply_custom_func'] = function(dataset_grouped, data_filtred, params_chart) {
			if (!params_chart.numerical_field_params.custom_function) {
				return dataset_grouped
			}

			var custom_field = params_chart.numerical_field_params.computed_field_name, args = {}
			dataset_grouped.forEach(r=> {					
				Object.keys(params_chart.numerical_field_params.arguments).forEach(key=> {
					var fieldName = params_chart.numerical_field_params.arguments[key]
					var field = r[params_chart.numerical_field_params.agg_type+"_"+fieldName]
					if (!field) {							
						field = data_filtred.find(rr=> rr[params_chart.category_field] === r[params_chart.category_field])?.[fieldName]							
					}
					field ? args[key] = field : args = undefined
				})
				//var arguments = 
				if (args) {
					r[custom_field] = +params_chart.numerical_field_params.custom_function(args)
				}
				else {
					console.warn({[params_chart.id]: 'unable to apply the custom function, the arguments object provided for the numerical_field_params contains errors'})
				}
			})
			return dataset_grouped
		}

		params_chart.funcLib['zoom_in'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, sharedParams)

		    //2.inject brushed values
		    Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0])

            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            

			try{
				brushBox.call(d3.brush().clear)
			}
			catch (err) {
				console.error('brush clean error: ' +err)
			}

            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, sharedParams)
		}



        params_chart.funcLib['zoom_out'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, sharedParams)


            //clean values of the previous brush 
            if (params_chart.current_hierarchy) {
	            params_chart.list_keys_values_segments_multiples_selected = [{[params_chart.current_hierarchy.hierarchy_field]: params_chart.current_hierarchy.hierarchy_value}]
	            params_chart.list_labels_segments_multiples_selected = [{category_field: params_chart.current_hierarchy.hierarchy_value}];
	            Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
	        }
	        else {
	            params_chart.list_keys_values_segments_multiples_selected = [];
	            params_chart.list_labels_segments_multiples_selected = [];
	            Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
	        }
            params_chart.list_idx_segments_multiples_selected = [];


            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
			try{
				brushBox.call(d3.brush().clear)
			}
			catch (err) {
				console.error('brush clean error: ' +err)
			}


            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, sharedParams)
        };



        params_chart.funcLib['restore_chart_view'] = function (params_chart, sharedParams) {


            //clean values of the previous brush 
            if (params_chart.root_hierarchy) {
	            params_chart.list_keys_values_segments_multiples_selected = [{...params_chart.root_hierarchy}];
            	params_chart.list_labels_segments_multiples_selected = [{category_field: Object.values(params_chart.root_hierarchy).flat()}]
            	params_chart.category_field = Object.keys(params_chart.root_hierarchy)[0]
	    	}
	    	else {
	         	params_chart.list_keys_values_segments_multiples_selected = [{...params_chart.list_keys_values_source}];
	            params_chart.list_labels_segments_multiples_selected = [{category_field: params_chart.list_keys_values_source[params_chart.category_field]}];
	        }
            // if (params_chart.transformations.crossfilter) {
			// 	Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
			// }
			// else {
			// 	params_chart.transformations.crossfilter = {}
			// 	Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
			// }

			!params_chart.transformations.crossfilter ? params_chart.transformations.crossfilter = {} : {}
			Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
			

			      //       params_chart.list_idx_segment_single_selected = [];
			      //       params_chart.id_previous_singleSelect = ""
			      //       params_chart.list_idx_segments_multiples_selected = ['restore_view'];
		            

            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, sharedParams)



		          //   //clean lists
		          //   var clean_lists = setInterval(()=> {
				        // if (sharedParams.crossfilter_status === 'idle') {
				        //  	params_chart.list_keys_values_segments_multiples_selected = [];
				        //     params_chart.list_labels_segments_multiples_selected = [];
				        //     params_chart.funcLib.restore_legends(params_chart, sharedParams);
				        //     clearInterval(clean_lists)
				        // }
		          //   }, 1000);

	        //restore state of icon controls
            if (params_chart.hierarchy_levels) {
             	params_chart.previous_hierarchy = undefined;
             	document.getElementById("icon_hierarchy_" + params_chart.id).style.filter = ''
	        	params_chart.list_controls.controlPrevious_hierarchy.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'
	        }


	        //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            
			try{
				brushBox.call(d3.brush().clear)
			}
			catch (err) {
				console.error('brush clean error: ' +err)
			}


			
			sharedParams.restore_view(sharedParams);
        }


		params_chart.funcLib['update_area_bounds'] = function (params_chart, sharedParams) {


		    //3.get filtred dataset
		    params_chart.to_filter = true
		    var data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)

		    //4.update the chart
		    if (data_input.constructor == Promise) {
				data_input.then(result=> {
					updateChart(params_chart, result, sharedParams)
				})
			}
			else if (data_input.constructor == Array) {
				updateChart(params_chart, data_input, sharedParams)
			}

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




		//restore legends
		params_chart.funcLib['restore_legends'] = function(params_chart, sharedParams) {

			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the category field of the source chart equals the legend field of the target
				if (params_chart.category_field === c.legends_field) {
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



		params_chart.funcLib["collect_active_selections"] = function collect_active_selections(params_chart, sharedParams) {
			!params_chart.transformations.crossfilter ? params_chart.transformations.crossfilter = {} : {}
			var f=params_chart.transformations.crossfilter
			//single selections
			//sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {if (!_.isEmpty(c.list_keys_values_segment_single_selected)) Object.assign(f, c.list_keys_values_segment_single_selected)})
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the chart is excluded from collecting slices
				var c_chart = params_chart.crossfilter.find(o=> o.chart === c);
				
				if (!_.isEmpty(c.list_keys_values_segment_single_selected)) {
					Object.keys(c.list_keys_values_segment_single_selected[0]).forEach(key=> {
						if (c.list_keys_values_segment_single_selected[0][key].constructor == Array && c_chart && c_chart.collect_active_slices === true) {
							Object.assign(f, {[key]: c.list_keys_values_segment_single_selected[0][key]})
						}
					})
				}
			})				
			//multiple selections
			//sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {if (!_.isEmpty(c.list_keys_values_segments_multiples_selected)) Object.assign(f, c.list_keys_values_segments_multiples_selected)})
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the chart is excluded from collecting slices
				var c_chart = params_chart.crossfilter.find(o=> o.chart === c);

				if (!_.isEmpty(c.list_keys_values_segments_multiples_selected)) {
					Object.keys(c.list_keys_values_segments_multiples_selected[0]).forEach(key=> {
						if (c.list_keys_values_segments_multiples_selected[0][key].constructor == Array && c_chart && c_chart.collect_active_slices === true) {
							Object.assign(f, {[key]: c.list_keys_values_segments_multiples_selected[0][key]})
						}
					})
				}
			})				
			//brush selections
			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {
				//check if the chart is excluded from collecting slices
				var c_chart = params_chart.crossfilter.find(o=> o.chart === c)
				if (c.chart_type !== "adressSearch" && c_chart && c_chart.collect_active_slices === true) {
					if (!_.isEmpty(c.brush_keys_values)) Object.assign(f, c.brush_keys_values)
				}
			})

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

		}


		params_chart.funcLib["clean_brush"] = function(params_chart) { 
			var brush_node = document.getElementById('brushParent_' + params_chart.id)
			var brush_button = document.getElementById('activate_brush_' + params_chart.id)
		    var svgSceen
		    if (brush_node) {
				svgSceen = document.getElementsByClassName('svg-plot_brushParent_' + params_chart.id)[0]				
				brush_button.title = 'Brush'
				brush_button['data-clicked'] = false
				params_chart.brush = false
			}

		    if (svgSceen && svgSceen.style.display === 'block') {               
			    var brushBox = d3.select('#brush_' + params_chart.ctx.id)
				try{
					brushBox.call(d3.brush().clear);
					svgSceen.style.display = 'none'
				}
				catch (err) {
					console.error('brush clean error: ' +err)
				}

			    params_chart.instanciator.maj_couleurs(params_chart.chart_instance, params_chart)
			    params_chart.list_idx_segments_multiples_selected = [];
			    params_chart.list_labels_segments_multiples_selected = [];
			    params_chart.list_keys_values_segments_multiples_selected = [];
			    params_chart.active_slices = []
				params_chart.brush_enabled = false

		        //turn off clicked state for all controls
		        Object.values(params_chart['list_controls']).forEach(control=> {
		            //control['data-clicked'] = false
		            //control.style.filter = ""

		        })	    
			}
		}



		params_chart.funcLib['setup_filterList'] = function setup_filterList(params_chart, sharedParams) {
			var filterList = []
			if (params_chart.transformations.crossfilter !== undefined && Object.keys(params_chart.transformations.crossfilter).length > 0 ) {
				filterList = formFilterArray(params_chart, params_chart.transformations.crossfilter)
			}

			//if a filter arguments has been provided for the data source, call them back here
			if (params_chart.transformations.filter !== undefined) {

				//transform the filterList into an array that we can push in it filter objects
				filterList ? filterList = Object.values(filterList) : {}

				params_chart.transformations.filter.map(e=> filterList.push(e))

				//Object.assign(filterList, params_chart.transformations.filter)

				filterList = filterList.filter(l=> l.field !== "")			
			}
			//regenerate the crossfilter list that has been erased
			params_chart.funcLib['collect_active_selections'](params_chart, sharedParams)
			return filterList
		};


		params_chart.funcLib['encode_fields'] = function process_label_fields(array_labels, params_chart) {
			if (array_labels.length > 0 && params_chart.fields_to_decode) {
				//params_chart.sub_category_field

				if (params_chart.fields_to_decode?.constructor == Array && params_chart.fields_to_decode.map(r=> Object.values(r).includes(params_chart.category_field)).some(r=> r)) {
					var array_labels = array_labels.map(l=> encode_field(params_chart, l))
					return array_labels
				}
				else if (params_chart.fields_to_decode?.constructor == Object && Object.values(params_chart.fields_to_decode).includes(params_chart.category_field)) {
					params_chart.fields_to_decode = [params_chart.fields_to_decode]
					var array_labels = array_labels.map(l=> encode_field(params_chart, l))
					return array_labels
				}							
				else {return array_labels}
			}
			else {return array_labels}
		

			function encode_field(params_chart, value_to_encode) {
				
				var field_to_decode = params_chart.fields_to_decode.filter(f => f.mainKey === params_chart.category_field)[0];

				var lookupTable = [...params_chart.data_input];

				var mainKey = field_to_decode.fields[0];
				var lookupKey = field_to_decode.fields[0]

				var field = params_chart.category_field
				var data_input = [{[mainKey]: value_to_encode}]

				join_v2(data_input, lookupTable, mainKey, lookupKey, [field])

				return data_input[0][params_chart.category_field]
			}

		}





		params_chart.funcLib['save_root_hierarchy'] = function (params_chart, sharedParams) {
			if (!params_chart.root_hierarchy) {
				params_chart['root_hierarchy'] = {[params_chart.category_field]: params_chart.activ_categories_values.flat()}
			}
		}



		params_chart.funcLib['create_parent_container'] = function(params_chart, sharedParams) {
			//create parent container for the general container, the title, the controls, the brush & chart
			const parent_container = document.createElement('div'); var id_parent = 'parent_container_' + params_chart.id
			//parent_container.style.opacity = '0'
			//get original width		
			if (params_chart.style.chart_width) {
				var width_px = params_chart.style.chart_width*1.1+"px"; var width = params_chart.style.chart_width
			}
			//else if (params_chart.chart_instance.ctx.canvas.width)
			else {var width = 400, width_px = "400px"}

			const general_container = document.createElement('div'); var id_general = 'general_container_' + params_chart.id
			if (params_chart.style.boxShadow) {var boxShadow = "box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24)"}
			else {var boxShadow = ""}
			Object.assign(parent_container, {id: id_parent, 
				style: `display: none; grid-template-rows: auto auto; grid-row-gap: 4px; ${boxShadow}; padding: 5px; justify-self: center; border: solid 2px; border-color: rgb(244,67,54,0); border-radius: 1%; transition: border-color 1.5s;`
			})

			Object.assign(general_container, {id: id_general, style: `display: none; grid-template-rows: auto auto auto; grid-row-gap: 1%; padding: 5px; justify-self: center; position: relative; width: max-content; height: max-content`})

			// var monitor_chart_instance_creation = setInterval(()=> {
			// 	if (params_chart.chart_instance.constructor == Object) {
			// 		params_chart.chart_instance.options.maintainAspectRatio = false
			// 		clearInterval(monitor_chart_instance_creation)
			// 	}
			// }, 1000)
				
						
			parent_container.style.width = width_px; 
			//parent_container.style.height = (width*params_chart.style.aspectRatio+50)+"px"			
			parent_container.style.height = "max-content"

			general_container.style.width = width_px; 
			general_container.style.height = (width*params_chart.style.aspectRatio)+"px"			

			//set height on general_container to max-content when the chart is visible
			setTimeout(()=> {general_container.style.height = "max-content"}, 2000)

			//create the title
			
				//1.get the parent node of the chart				
				
				//2.create the title
				var titleContainer = document.createElement('div'); titleContainer.id = "titleContainer_" + params_chart.id
				titleContainer.style = "display: grid; width: max-content; height: max-content; justify-self: center"

				if (params_chart.title.constructor == Array) {
					params_chart.title.forEach(title=> {
						create_title_text(params_chart, title)
					})
				}
				else if (params_chart.title.constructor == String) {
					create_title_text(params_chart, params_chart.title)
				}
				
				parent_container.append(titleContainer)

				function create_title_text(params_chart, title_text) {
					var title = document.createElement('span'); title.id = params_chart.id + '_title'; title.style = 'align-self: center; justify-self: center; height: max-content; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #666'; 
					title.innerText = title_text
					titleContainer.append(title);
				}			
			
			//create node for crossfilter info
				var crossfilterContainer = document.createElement('div'); crossfilterContainer.id = "crossfilterContainer_" + params_chart.id
				//var width = document.getElementById(params_chart.id).clientWidth
				crossfilterContainer.style = `display: flex; flex-wrap: wrap; width: initial; height: 20px; justify-self: left; column-gap: 4px`
				var title_node = document.createElement('p'); title_node.style = 'font-size: 12px; margin: 4px'; title_node.innerText = 'Filtres: '
				crossfilterContainer.append(title_node)
				parent_container.append(crossfilterContainer)

				
				var crossfilterContainer_tooltip = document.createElement('div'); crossfilterContainer_tooltip.id = "crossfilterContainer_tooltip_" + params_chart.id		
				crossfilterContainer_tooltip.style = `display: flex; width: initial; height: 20px; justify-self: left; column-gap: 4px`
				var phantom_title_node = document.createElement('p'); phantom_title_node.style = 'font-size: 12px; margin: 4px; opacity: 0;'; phantom_title_node.innerText = 'Filtres: '
				crossfilterContainer_tooltip.appendChild(phantom_title_node)
		
				parent_container.append(crossfilterContainer_tooltip)
				
			//insert parent & general container after the chart node
			insertAfter(params_chart.ctx, parent_container)
			insertAfter(params_chart.ctx, general_container)
			//move the chart node inside the genegral container
			general_container.append(params_chart.ctx)
			//move the genegral container inside the parent
			parent_container.append(general_container);

			//create a figure label		
			let fig = create_figure_label(params_chart); fig.style.marginTop = "0px"
			parent_container.append(fig)
			
			if (params_chart.build_on?.messageWait) {
				let container_messageWait = document.createElement('div'); container_messageWait.id = 'messageWait_'+params_chart.id
				container_messageWait.style = `display: grid; opacity: 0.7; border-radius: 5px; background-color: #e8e8e8; width: ${width*1.0}; padding: 4px; text-align: center; position: absolute; border: solid 1px; justify-self: center; align-self: center`
				let parent_chart = sharedParams.params_charts.find(c=> c.id === params_chart.build_on.params_chart_id)				
				if (parent_chart.figure) {var message_figure = parent_chart.figure}
				else {var message_figure = `(figure ${parent_chart.figure_auto})`}
				let messageWait = document.createElement('h6'); messageWait.style = 'opacity: 0.8; color: black; justify-self: center; align-self: center; place-self: center;text-align: center;'; messageWait.innerText = params_chart.build_on.messageWait + ` ${message_figure}`;
				container_messageWait.append(messageWait);
				general_container.append(container_messageWait)
			}

			parent_container.style.display = "grid"
			general_container.style.display = "grid"


			function insertAfter(referenceNode, newNode) {
				referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
			}
		}

		params_chart.funcLib['create_animated_scales'] = function(params_chart, sharedParams) {
			params_chart.chart_instance.options.scales["x"].ticks.color='white'
			params_chart.chart_instance.options.scales["y"].ticks.color='white'
			params_chart.chart_instance.update()

			if (params_chart.create_animated_scales) return

			let general_container = document.getElementById('general_container_'+params_chart.id)

			let brush_parent = document.getElementById('brushParent_'+params_chart.id)
			let container
			if (brush_parent) {
				container = d3.select('#brushParent_'+params_chart.id);
			}
			else {
				container = d3.select('#general_container_'+params_chart.id);
			}
			

			var check_chart_rendering = setInterval(()=>{
					
				var parent_container_display = check_parent_display(params_chart)				
				if (parent_container_display.chart_display_on) {	
					const width= params_chart.chart_instance.scales["x"].width
					const xScale_paddingLeft= params_chart.chart_instance.scales.x.paddingLeft
					const height = params_chart.chart_instance.scales["y"].height
					const margin = { top: params_chart.chart_instance.chartArea.top, right: params_chart.chart_instance.chartArea.right, 
						bottom: params_chart.chart_instance.chartArea.bottom, left: params_chart.chart_instance.chartArea.left };
					let parentPadding= container._groups[0][0].style.padding;
					if (parentPadding && parentPadding.includes('px')) {
						parentPadding = parseInt(parentPadding.replace('px', ''))
					}
					else {
						parentPadding = 0
					}
		
					//check if the chart is horizontal
					if (params_chart.horizontalBar)	{var barOrientation = "y"}
					else {var barOrientation = "x"}
			
					
					//1.add svg container
					const svg_y_axis = container.append('svg:svg')
						.attr('width', margin.left)
						.attr('height', height+margin.top*2)
						.attr('id', 'svg-y_axis' + '_' + params_chart.id)
						.attr('style', 'position: absolute;')
						.attr('transform', `translate(${0}, ${parentPadding})`);
						//.attr('style', 'position: absolute')
						//.attr('style', 'margin-top: ' + margin.top + 'px')
						//.append('g')
						
						
						
					// Init Scales

					//Y scale
					if (params_chart.horizontalBar) {
						create_y_axis(params_chart, height, svg_y_axis, margin, parentPadding, "categorical")
					}
					else {
						create_y_axis(params_chart, height, svg_y_axis, margin, parentPadding, "numerical")
					}
					function create_y_axis(params_chart, height, svg_y_axis, margin, parentPadding, data_type) {
						let yScale, tickValues
						if (data_type === "numerical") {
							let max_value_dataset = d3.max(params_chart.data[1].datasets[0].data)
							yScale = d3.scaleLinear().domain([max_value_dataset, 0]).range([0, height]).nice();
							//const yAxis = d3.axisLeft(yScale);			
							tickValues = params_chart.chart_instance.scales.y.ticks.map(t=> t.value)							
						}
						else if (data_type === "categorical") {
							let y_axis_val = params_chart.data[0].labels[0]
							yScale = d3.scaleBand().domain(y_axis_val).range([0, height])//.padding(0.05)
							tickValues = params_chart.chart_instance.scales.y.ticks.map(t=> t.label)							
						}
						
						let yAxis = d3.axisLeft(yScale);
						//yAxis.scale(yScale).tickValues(tickValues);	
						yAxis.tickValues(tickValues)
	
						const gyAxis = svg_y_axis.append('g')
							.attr('width', margin.left)
							.attr('height', height+margin.top*2)
							.attr('transform', `translate(${margin.left}, ${margin.top})`)
							.attr('id', 'yAxis_'+params_chart.id)
							.attr("style", "font-size: 13px; color: #4a4a4a")
							.call(yAxis);

						if (data_type === "categorical") {							
							//hide the ticks
							let gyAxisTicks = d3.selectAll(`#yAxis_${params_chart.id} > g > line`)
							gyAxisTicks.attr('x2', 0)
							//delete the horizontal bar (domain)
							d3.select(`#yAxis_${params_chart.id} > path.domain`).remove()
						}
						
						//save y axis attr
						params_chart.yScale = {yScale: yScale, scaleHeight: height , width: margin.left, g_scale_height: height+margin.top*2, transform: {translateX: 0, translateY: parentPadding}, gyAxis: gyAxis}// 

						params_chart.yAxis = yAxis
	
					}
					

					//add x axis
					//1.add svg container
					const svg_x_axis = container.append('svg:svg')
						.attr('width', width)
						//.attr('width', params_chart.chart_instance.canvas.width)
						.attr('height', 40)
						.attr('id', 'svg-x_axis' + '_' + params_chart.id)
						.attr('style', 'position: absolute;')
						//.style("font-size", 13)
						.attr('transform', `translate(${margin.left}, ${height+margin.top*1.5})`)
						//.append('g')

					
					if (params_chart.horizontalBar) {
						//create_x_axis(params_chart, width, height, svg_x_axis, margin, "numerical")
						var params_f = {params_chart, width, height, svg_x_axis, margin, data_type: "numerical", xScale_paddingLeft}
						create_x_axis(params_f)
					}
					else {
						//create_x_axis(params_chart, width, height, svg_x_axis, margin, "categorical")
						var params_f = {params_chart, width, height, svg_x_axis, margin, data_type: "categorical", xScale_paddingLeft}
						create_x_axis(params_f)
					}

					//X SCALE					
					function create_x_axis(params_f) {
						let xScale, xAxis, tickValues


						
						if (params_f.data_type === "numerical") {
							let max_value_dataset = d3.max(params_f.params_chart.data[1].datasets[0].data)
							xScale = d3.scaleLinear().domain([0, max_value_dataset]).range([params_f.xScale_paddingLeft, params_f.width]).nice();
							//const yAxis = d3.axisLeft(yScale);			
							tickValues = params_f.params_chart.chart_instance.scales.x.ticks.map(t=> t.value)							
						}
						else if (params_f.data_type === "categorical") {
							let x_axis_val = params_f.params_chart.data[0].labels[0]
							xScale = d3.scaleBand().domain(x_axis_val).range([params_f.xScale_paddingLeft, params_f.width])//.padding(0.05)
							tickValues = params_f.params_chart.chart_instance.scales.x.ticks.map(t=> t.label)							
						}


						xAxis = d3.axisBottom(xScale)
						//xAxis.scale(xScale).tickValues(tickValues);
						//xAxis.tickValues(tickValues)
	
						const gxAxis = params_f.svg_x_axis.append('g')						
								.attr('id', 'xAxis_'+params_f.params_chart.id)								
								//.attr('transform', `translate(${margin.left}, ${0})`)								
								.call(xAxis)//.tickSize(0)								
								//.selectAll('text')
								//.attr("style", "font-size: 12px; color: #4a4a4a")								
								// .style("text-anchor", "end")
								// .style("font-size: 13px")
							
						if (params_f.data_type === "categorical") {
							//adjust labels fonts & orientation
							gxAxis
								.selectAll('text')
								.attr("transform", `translate(0,0) rotate(-30)`)
								.attr("style", "text-anchor: end; font-size: 13px; color: #4a4a4a")
								
							//hide the ticks
							let gxAxisTicks = d3.selectAll(`#xAxis_${params_f.params_chart.id} > g > line`)
							gxAxisTicks.attr('y2', 0)
							//delete the horizontal bar (domain)
							d3.select(`#xAxis_${params_f.params_chart.id} > path.domain`).remove()
						}
						else if (params_f.data_type === 'numerical') {
							gxAxis
								.selectAll('text')
								.attr("style", "font-size: 11px; color: #4a4a4a")

						}
				
						//adjust svg height
						let g_axis_height = document.getElementById('xAxis_'+params_f.params_chart.id).getBBox().height
						params_f.svg_x_axis.attr('height', g_axis_height+10)
	
						//save x axis attr
						params_f.params_chart.xScale = {xScale: xScale, scaleWidth: params_f.width, xScale_paddingLeft: params_f.xScale_paddingLeft,g_scale_width: params_f.params_chart.chart_instance.canvas.width, 
							height: g_axis_height+10, transform: {translateX: 0, translateY: params_f.height+margin.top*1.5},
							gxAxis: gxAxis
						}

						params_f.params_chart.xAxis = xAxis
					}
				
					
					params_chart.create_animated_scales = true
					clearInterval(check_chart_rendering)
				}
			}, 1000)
		}

		params_chart.funcLib['update_animated_scales'] = function(params_chart) {
			if (!params_chart.xScale) return
			if (!params_chart.yScale) return

			let tickValues
			if (params_chart.horizontalBar) {
				//X axis				
				let max_value_dataset = d3.max(params_chart.data[1].datasets[0].data)				
				params_chart.xScale.xScale.domain([0, max_value_dataset]).range([params_chart.xScale.xScale_paddingLeft, params_chart.xScale.scaleWidth]).nice();			
				tickValues = params_chart.chart_instance.scales.x.ticks.map(t=> t.value)
				
				//params_chart.xAxis.tickValues(tickValues)

				d3.select("#xAxis_"+params_chart.id)
					.transition()
					.duration(1000)
					.delay(50)
					.call(params_chart.xAxis);

				//Y axis
				//update the scale		
				let y_axis_val = params_chart.data[0].labels[0]				
				params_chart.yScale.yScale.domain(y_axis_val)//.range([0, params_chart.yScale.scaleHeight])//.padding(0.05)
				tickValues = params_chart.chart_instance.scales.y.ticks.map(t=> t.label)
				
				params_chart.yAxis.tickValues(tickValues)

				d3.select("#yAxis_"+params_chart.id)
					.transition()
					.duration(1000)
					.delay(50)
					.call(params_chart.yAxis);

				

			}
			else {
				//X axis
				let x_axis_val = params_chart.data[0].labels[0]
				params_chart.xScale.xScale.domain(x_axis_val).range([0, params_chart.xScale.scaleWidth])//.padding(0.05)
				let tickValues = params_chart.chart_instance.scales.x.ticks.map(t=> t.label)
				

				params_chart.xAxis.scale(params_chart.xScale.xScale);

				d3.select("#xAxis_"+params_chart.id)
					.transition(params_chart.params_scales.animationDuration).delay(params_chart.params_scales.delayDuration)
					.call(params_chart.xAxis)			

				//params_chart.xAxis = xAxis

				//Y axis
				//update the scale		
				let max_value_dataset = d3.max(params_chart.data[1].datasets[0].data)
				params_chart.yScale.yScale.domain([max_value_dataset, 0]).range([0, params_chart.yScale.scaleHeight]).nice();			
				tickValues = params_chart.chart_instance.scales.y.ticks.map(t=> t.value)
				
				


				params_chart.yAxis.tickValues(tickValues)


				d3.select("#yAxis_"+params_chart.id)
					.transition()
					.duration(1000)
					.delay(50)
					.call(params_chart.yAxis);


				

			}


		}

		params_chart.funcLib['brush'] = function (params_chart, sharedParams) {

			//create general containers
			    const chart_instance = params_chart.chart_instance		    
			    //const chart_parentElement = (params_chart.ctx.parentElement)
			    const chart_node = params_chart.ctx

				let general_container = document.getElementById('general_container_'+params_chart.id)
			
			    //create controls container
			    const controls_container = document.createElement('div'); var id = 'controls_container_' + params_chart.id
			    controls_container.style = 'height: max-content; display: inline-grid; grid-template-columns: 25px 25px 25px 25px 25px 25px 25px 25px 25px; justify-items: center; margin-bottom: 10px; margin-top: 10px; grid-column-gap: 5px'; controls_container.id = "controlsContainer_" + params_chart.id
			    //controls_container.style.marginLeft = ((chart_instance.chartArea.left).toString())/2+"px"
				controls_container.style.marginLeft = "10px"

			    //create sub grids containers
			    const grid_brush = document.createElement('div'); grid_brush.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_brush.id = "grid_brush_" + params_chart.id;
			    const grid_pointer = document.createElement('div'); grid_pointer.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_pointer.id = "grid_pointer_" + params_chart.id;
			    const grid_zoom_in = document.createElement('div'); grid_zoom_in.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_zoom_in.id = "grid_zoom_in_" + params_chart.id;
			    const grid_zoom_out = document.createElement('div'); grid_zoom_in.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_zoom_in.id = "grid_zoom_out_" + params_chart.id;
			    const grid_restore = document.createElement('div'); grid_restore.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_restore.id = "grid_restore_" + params_chart.id;		
				const icons_size = "18px"
				
				//colors coding:
					/*red: invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)
					grey: invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)
					black: invert(0%) sepia(72%) saturate(0%) hue-rotate(328deg) brightness(95%) contrast(106%)*/

	
			//create control for brush
				const controlBrush = document.createElement('img'); controlBrush.src = "css/font-awesome-svg/crosshairs-solid.svg"; controlBrush.style.width = icons_size; controlBrush.id = "activate_brush_" + params_chart.id
				controlBrush.title = 'Brush'
		        
				controlBrush.addEventListener("mouseover", function(evt){
					if (params_chart.zoom_in) {
						evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'
					}
					else {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
				} );
		        controlBrush.addEventListener('mouseenter', (evt)=> {
					if (params_chart.zoom_in) {
						evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'
					}
					else {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}					
				});
		        controlBrush.addEventListener('mouseemove', (evt)=> {
					if (params_chart.zoom_in) {
						evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'
					}
					else {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}					
				});
		        controlBrush.addEventListener('mouseleave', (evt)=> {
					if (evt.target['data-clicked']) {
						evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
					else if (params_chart.zoom_in) {
						evt.target.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
					}
					else {evt.target.style.filter = ""}
				});
		        grid_brush.append(controlBrush)
		        controls_container.append(grid_brush)
			

		    
		    
		    //create control for pointer
				const controlPointer = document.createElement('img'); controlPointer.src = "css/font-awesome-svg/hand-pointer-solid.svg"; controlPointer.id = params_chart.id + "activate_pointer_" + params_chart.id
				controlPointer.style = "align-self: center; width: 13px"; controlPointer.title = 'Show tooltips'
		        
				controlPointer.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} );
		        controlPointer.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
		        controlPointer.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
		        controlPointer.addEventListener('mouseleave', (evt)=> {
					if (evt.target['data-clicked']) {
						evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
					else {evt.target.style.filter = ""}
				});
		        grid_pointer.append(controlPointer)
		        controls_container.append(grid_pointer)    
			

		    //create control for zoom in		        
				const controlZoom_in = document.createElement('img'); controlZoom_in.src = "css/font-awesome-svg/search-plus-solid.svg"; controlZoom_in.id = "zoom_in_pointer_" + params_chart.id
		        controlZoom_in.style.width = icons_size; controlZoom_in.title = 'Select & zoom in'

		        controlZoom_in.addEventListener("mouseover", function(evt){
					if (!params_chart.list_controls.controlBrush["data-clicked"]) {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
				} )
		        controlZoom_in.addEventListener('mouseenter', (evt)=> {
					if (!params_chart.list_controls.controlBrush["data-clicked"]) {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}					
				});
		        controlZoom_in.addEventListener('mouseemove', (evt)=> {
					if (!params_chart.list_controls.controlBrush["data-clicked"]) {
						evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}					
				})
		        controlZoom_in.addEventListener('mouseleave', (evt)=> {
					if (evt.target['data-clicked']) {
						evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
					else if (params_chart.list_controls.controlBrush['data-clicked']) {evt.target.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"}
					else {evt.target.style.filter = ""}
				});
		        grid_zoom_in.append(controlZoom_in)
		        controls_container.append(grid_zoom_in)
			

		    //create control for zoom out
				const controlZoom_out = document.createElement('img'); controlZoom_out.src = "css/font-awesome-svg/search-minus-solid.svg"; controlZoom_out.id = "zoom_out_pointer_" + params_chart.id
		        controlZoom_out.style.width = icons_size; controlZoom_out.title = 'Zoom out'

		        controlZoom_out.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} )
		        controlZoom_out.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
		        controlZoom_out.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
		        controlZoom_out.addEventListener('mouseleave', (evt)=> {evt.target.style.filter = ""});
		        grid_zoom_out.append(controlZoom_out)
		        controls_container.append(grid_zoom_out);
			
				
		    //create control for restore view
				const controlRestore = document.createElement('img'); controlRestore.src = "css/font-awesome-svg/undo-solid.svg"; controlRestore.id = "restore_pointer_" + params_chart.id
		        controlRestore.style.width= icons_size; controlRestore.title = 'Restore to initial view'

		        controlRestore.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} )
		        controlRestore.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
		        controlRestore.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
		        controlRestore.addEventListener('mouseleave', (evt)=> {
					if (evt.target['data-clicked']) {
						evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
					}
					else {evt.target.style.filter = ""}
				});
		        grid_restore.append(controlRestore)
		        controls_container.append(grid_restore)
			


			//create controls for hierarchy buttons
	        var controlPrevious_hierarchy, controlNext_hierarchy
		    if (params_chart.hierarchy_levels) {
			    const grid_spacing = document.createElement('div'); grid_spacing.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_restore.id = "grid_spacing_" + params_chart.id
				const grid_next_hierarchy = document.createElement('div'); grid_next_hierarchy.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_next_hierarchy.id = "grid_next_hierarchy_" + params_chart.id
			    const grid_previous_hierarchy = document.createElement('div'); grid_previous_hierarchy.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_previous_hierarchy.id = "grid_previous_hierarchy_" + params_chart.id
			    const grid_ind_hierarchy = document.createElement('div'); grid_ind_hierarchy.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_ind_hierarchy.id = "grid_ind_hierarchy_" + params_chart.id



			    //create control for next hierarchy
					controlNext_hierarchy = document.createElement('img'); controlNext_hierarchy.src = "css/font-awesome-svg/arrow-circle-down-solid.svg"; controlNext_hierarchy.id = "next_hierarchy_" + params_chart.id
			        controlNext_hierarchy.style.width = icons_size; controlNext_hierarchy.title = 'Jump to next hierarchy'
			        
					controlNext_hierarchy.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} )
			        controlNext_hierarchy.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
			        controlNext_hierarchy.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
			        controlNext_hierarchy.addEventListener('mouseleave', (evt)=> {
						evt.target.style.filter = ""
					});
			        grid_next_hierarchy.append(controlNext_hierarchy)		
			        controls_container.append(grid_spacing)		        
			        controls_container.append(grid_next_hierarchy)



			    //create control for previous hierarchy
					controlPrevious_hierarchy = document.createElement('img'); controlPrevious_hierarchy.src = "css/font-awesome-svg/arrow-circle-up-solid.svg"; controlPrevious_hierarchy.id = "previous_hierarchy_" + params_chart.id
			        controlPrevious_hierarchy.style = `width: ${icons_size}; filter: invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%);`; 
					controlPrevious_hierarchy.title = 'Restore previous hierarchy'

			        controlPrevious_hierarchy.addEventListener("mouseover", function(evt){
			        	if (_.isEmpty(params_chart.previous_hierarchy)) {evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else if (!_.isEmpty(params_chart.previous_hierarchy) && params_chart.current_hierarchy?.hierarchy_level !== 0) {
							evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
			        } )
			        controlPrevious_hierarchy.addEventListener('mouseenter', (evt)=> {
			        	if (_.isEmpty(params_chart.previous_hierarchy)) {
							evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else if (!_.isEmpty(params_chart.previous_hierarchy) && params_chart.current_hierarchy?.hierarchy_level !== 0) {
							evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
			        } )			        	
			        controlPrevious_hierarchy.addEventListener('mouseemove', (evt)=> {
			        	if (_.isEmpty(params_chart.previous_hierarchy)) {evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else if (!_.isEmpty(params_chart.previous_hierarchy) && params_chart.current_hierarchy?.hierarchy_level !== 0) {
							evt.target.style.cursor = "pointer"; 
							evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
			        } )
			        controlPrevious_hierarchy.addEventListener('mouseleave', (evt)=> {
			        	if (_.isEmpty(params_chart.previous_hierarchy)) {evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
			        	else if (!_.isEmpty(params_chart.previous_hierarchy) && params_chart.current_hierarchy?.hierarchy_level === 0) {evt.target.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"}
			        	else {evt.target.style.filter = ''};
			        } )
			        grid_previous_hierarchy.append(controlPrevious_hierarchy)				        
			        controls_container.append(grid_previous_hierarchy)


			    //create control icon for hierarchy setup
					const icon_hierarchy = document.createElement('img'); icon_hierarchy.src = "css/font-awesome-svg/sitemap-solid.svg"; icon_hierarchy.id = "icon_hierarchy_" + params_chart.id
			        icon_hierarchy.style = `width: ${icons_size}; margin-top: 8%`; icon_hierarchy.title = 'A hierarchy layer is available'
			        grid_ind_hierarchy.append(icon_hierarchy)
			        controls_container.append(grid_ind_hierarchy)
	    	}

		    
		    
		    // const margin = { top: chart_instance.chartArea.top, right: chart_instance.chartArea.right, 
		    //                 bottom: chart_instance.chartArea.bottom, left: chart_instance.chartArea.left };
		    // params_chart.chart_instance.chartArea = _.cloneDeep(margin)
		    

		    //create parent node for brush element
		    const brush_node = document.createElement('div'); brush_node.id = 'brushParent_' + params_chart.id
			
			if (params_chart.style.chart_width) {var width_px = params_chart.style.chart_width+"px", width = params_chart.style.chart_width}
			else {var width_px = "400px", width=400}
				
			//var height = params_chart.chart_instance.height+"px"
			var height = (width*params_chart.style.aspectRatio)+"px"
			
			
			brush_node.style = `margin-left:1px; width: ${width}; height: ${height}; margin-bottom: 0px`
		    
			//set position of the chart to absolute, iot suprepose the chart with the svg screen
			chart_node.style.position = "absolute"

		    //move all elements into their parents
		    brush_node.append(chart_node)
		    general_container.append(controls_container)
		    general_container.append(brush_node)
		    
			//resize general_container accordring to the new elements added
			var height_gl = controls_container.getBoundingClientRect().height + parseFloat(controls_container.style.marginTop.replace('px','')) + parseFloat(controls_container.style.marginBottom.replace('px',''))
			
			//general_container.style.height = "max-content"
			
			//general_container.style.width = general_container.getBoundingClientRect().width + 15 + "px"

		    //add all controls into a list
		    if (controlPrevious_hierarchy) {
		    	params_chart['list_controls'] = {controlBrush: controlBrush, controlPointer: controlPointer, controlZoom_in: controlZoom_in, controlZoom_out: controlZoom_out, controlRestore: controlRestore, controlPrevious_hierarchy: controlPrevious_hierarchy}
		    }
		    else {
			    params_chart['list_controls'] = {controlBrush: controlBrush, controlPointer: controlPointer, controlZoom_in: controlZoom_in, controlZoom_out: controlZoom_out, controlRestore: controlRestore}
		    }

		    

			const brush_node_name = '#'+brush_node.id
		    const container = d3.select(brush_node_name);

		    
		    
		    

		    
		    Object.assign(sharedParams.interaction_events, {[params_chart.id]: {type_event: {click: false}, brushed: false}})


		    //shows svg screen for brush selection
		    controlBrush.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot_brushParent_' + params_chart.id)[0]
		        
		            //break if zoom control is activated
		            if (params_chart.zoom_in) {
		                //build window to display msg 'brush disabled when the zoom is active'
						return
		            }

		            if (svgSceen.style.display === 'none') {
			            svgSceen.style.display = 'block'
						//hide custom handles at first
						// let customHandles=document.getElementsByClassName("handle--custom"+params_chart.id)
						// for (let index = 0; index < customHandles.length; index++) {
						// 	customHandles[index].style.display='none';							
						// }						
						params_chart.brush_customHandles.attr('display', 'none')
			        }

			        //if brush control is selected twice, clean the brush
			        if (el.currentTarget['data-clicked']) {
				        //restore chart to its initial state

						params_chart.funcLib.clean_brush(params_chart)
						svgSceen.style.display = 'none'
						el.currentTarget.title = 'Brush'
						el.currentTarget['data-clicked'] = false
						params_chart.brush = false

						return			        	
			        }

		            //turn off clicked state for all controls
		            Object.values(params_chart['list_controls']).forEach(control=> {
		                control['data-clicked'] = false		                
		                control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
		                control.parentElement.style.boxShadow = ""
		                control.parentElement.style.backgroundColor = ""
		            })

		            //turn on clicked state for current controls
		            el.currentTarget["data-clicked"] = true
					el.currentTarget.title = 'Clean brush'

					//set style for target		            		            
		            el.currentTarget.style.filter = "invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)"

		    })

		    //hide svg screen for brush selection
		    controlPointer.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
		        
		        if (svgSceen.style.display === 'block') {
		            svgSceen.style.display = 'none';
		            
		            //turn off clicked state for all controls
		            Object.values(params_chart['list_controls']).forEach(control=> {
		                control['data-clicked'] = false
		                control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
		                control.parentElement.style.boxShadow = ""
		                control.parentElement.style.backgroundColor = ""

		            })

		            //turn on clicked state for current controls
		            el.currentTarget["data-clicked"] = true

		            //set style for target		            
		            el.currentTarget.style.filter = "invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)"
		            //el.currentTarget.parentElement.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 2px 5px 1px" 

		            //deactivate behaviour for other controls            
		            //...

		        }
		    })


		    //zoom in selected area of the plot
		    controlZoom_in.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]

				//if zoom in control is selected twice, clean it
				if (el.currentTarget['data-clicked']) {
					params_chart.list_controls.controlZoom_in.style.filter = ''					
					svgSceen.style.display = 'none'
					el.currentTarget.title = 'Select & zoom in'
					params_chart.zoom_in = false

					return			        	
				}


		        if (svgSceen.style.display === 'none') {
					params_chart.brush_customHandles.attr('display', 'none')
		        	svgSceen.style.display = 'block'
		        }

	            //clean previous bush
	            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
	            try{
					brushBox.call(d3.brush().clear)
				}
				catch (err) {
					console.error('brush clean error: ' +err)
				}
	            

	            //turn off clicked state for all controls
	            Object.values(params_chart['list_controls']).forEach(control=> {
	                control['data-clicked'] = false
	                control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
	                control.parentElement.style.boxShadow = ""
	                control.parentElement.style.backgroundColor = ""
	            })

	            //turn on clicked state for current controls
	            el.currentTarget["data-clicked"] = true

	            //set style for target	            
	            el.currentTarget.style.filter = "invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)"
	            

	            //deactivate behaviour for other controls
	            params_chart.list_controls.controlBrush.title = 'Brush is disabled in zoom mode'
				params_chart.list_controls.controlBrush.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'	                                
		    })


		    //zoom in selected area of the plot
		    controlZoom_out.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
		    
		        svgSceen.style.display = 'none';

				//turn off clicked state for all controls
				Object.values(params_chart['list_controls']).forEach(control=> {
					control['data-clicked'] = false
					control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
					control.parentElement.style.boxShadow = ""
					control.parentElement.style.backgroundColor = ""
				})

				//turn on clicked state for current controls
				el.currentTarget["data-clicked"] = true

				el.currentTarget.style.filter = ""
			
				params_chart.funcLib.zoom_out(params_chart, sharedParams)				
				params_chart.zoom_in = false
				params_chart.list_controls.controlBrush.title = 'Brush'
		                                
		    });






		    //restore the view to its initial state
		    controlRestore.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]

		        if (svgSceen.style.display === 'block') {
		            svgSceen.style.display = 'none'
		        }

		        //turn off clicked state for all controls
		        Object.values(params_chart['list_controls']).forEach(control=> {
		            control['data-clicked'] = false
					control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
					control.id === "zoom_in_pointer_"+params_chart.id ? control.title = "Select & zoom in" : {}
					control.id === "activate_brush_"+params_chart.id ? control.title = "Brush" : {}
		            })

	            //turn on clicked state for current controls
	            el.currentTarget["data-clicked"] = true


		        //restore chart to its initial state
		        params_chart.funcLib.restore_chart_view(params_chart, sharedParams)

	            //clean previous bush
	            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
				try{
					brushBox.call(d3.brush().clear)
				}
				catch (err) {
					console.error('brush clean error: ' +err)
				}


		        //deactivate behaviour for other controls
		        params_chart.brush = false; params_chart.zoom_in = false

		        
		    })


		    //switch between hierarchies
		    if (params_chart.hierarchy_levels) {
			    controlNext_hierarchy.addEventListener('click', (el)=> {
			    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
			        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]

			        if (svgSceen.style.display === 'block') {
			            svgSceen.style.display = 'none'
			        }

			        //turn off clicked state for all controls
			        Object.values(params_chart['list_controls']).forEach(control=> {
			            control['data-clicked'] = false
			                //control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
			                control.parentElement.style.boxShadow = ""
			                control.parentElement.style.backgroundColor = ""
			            })

		            //turn on clicked state for current controls
		            el.currentTarget["data-clicked"] = true

		            //set style for target		            
		            el.currentTarget.style.filter = ''		            
		            

		            //clean previous bush
		            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
					try{
						brushBox.call(d3.brush().clear)
					}
					catch (err) {
						console.error('brush clean error: ' +err)
					}
	


		            //access next hierarchy
		            params_chart.funcLib.access_next_hierarchy(params_chart, sharedParams)

			        //deactivate behaviour for other controls
			        //...
			        
			    })

			    controlPrevious_hierarchy.addEventListener('click', (el)=> {
			    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
			        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]

					if (params_chart.brush || params_chart.zoom_in) {
						return
					}

			        if (svgSceen.style.display === 'block') {
			            svgSceen.style.display = 'none'
			        }

			        //turn off clicked state for all controls
			        Object.values(params_chart['list_controls']).forEach(control=> {
			            control['data-clicked'] = false
			                control.id === "previous_hierarchy_" + params_chart.id ? control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)" : control.style.filter = ""
			                control.parentElement.style.boxShadow = ""
			                control.parentElement.style.backgroundColor = ""
			            })

		            //turn on clicked state for current controls
		            el.currentTarget["data-clicked"] = true;

		            //set style for target		            
		            el.currentTarget.style.filter = '';

			        
		            //clean previous bush
		            var brushBox = d3.select('#brush_' + params_chart.ctx.id);
					try{
						brushBox.call(d3.brush().clear)
					}
					catch (err) {
						console.error('brush clean error: ' +err)
					}
	


		            //restore_previous_hierarchy
		            params_chart.funcLib.restore_previous_hierarchy(params_chart, sharedParams)

			        //activate ind presence hiearchy
			        if (params_chart.current_hierarchy.hierarchy_level !== 0) {
				        document.getElementById("icon_hierarchy_" + params_chart.id).style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
			        }
			        else {
			        	document.getElementById("icon_hierarchy_" + params_chart.id).style.filter = ''
			        	params_chart.list_controls.controlPrevious_hierarchy.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
			        }

			        //deactivate behaviour for other controls
			        //...

			        
			    })
			}


		    setTimeout(()=> {
		    	//params_chart.funcLib.generate_svg_brush(sharedParams, params_chart)

			},10)


			var check_chart_rendering = setInterval(()=>{
				var sum_margin=0; 
				Object.values(params_chart.chart_instance.chartArea).forEach(e=> sum_margin=sum_margin+e)
				var sum_heightWidth = params_chart.chart_instance.height + params_chart.chart_instance.width
				var parent_container_display = check_parent_display(params_chart)
				//if (!isNaN(sum_margin) && sum_heightWidth > 0) {
				if (parent_container_display.chart_display_on) {
					setTimeout(()=> {
						params_chart.funcLib.generate_svg_brush(sharedParams, params_chart)	
					}, 2000)
					clearInterval(check_chart_rendering)					
				}
			}, 200)		
	
	
	

		}



		
		params_chart.funcLib['generate_svg_brush'] = function (sharedParams, params_chart) {

			//1.create 1st svg screen
			const brush_node = document.getElementById('brushParent_' + params_chart.id);			
			const brushNode_name = '#'+brush_node.id;
			const container = d3.select(brushNode_name);


			const margin = { top: params_chart.chart_instance.chartArea.top, right: params_chart.chart_instance.chartArea.right, 
			                bottom: params_chart.chart_instance.chartArea.bottom, left: params_chart.chart_instance.chartArea.left };


			//const width = margin.right - params_chart.chart_instance.scales["x-axis-0"].margins.right
			//const width = margin.right - params_chart.chart_instance.scales["x"].right
			//const height = margin.bottom - params_chart.chart_instance.scales["y-axis-0"].margins.bottom + 12//(12px for compensating the width of top & bottom handlers)
			//const height = margin.bottom - params_chart.chart_instance.scales["y"].bottom + 12//(12px for compensating the width of top & bottom handlers)
			const width= params_chart.chart_instance.scales["x"].width
			const height = params_chart.chart_instance.scales["y"].height


			const svgChart = container.append('svg:svg')
			    .attr('width', width)
			    .attr('height', height)
			    .attr('class', 'svg-plot' + '_' + brush_node.id)
			    .attr('style', 'position: absolute')
			    //.attr('style', 'margin-top: ' + margin.top + 'px')
			    .append('g')
			    .attr('id', 'transformer' + '_' + brush_node.id)
			    //.attr('transform', `translate(${margin.left}, ${margin.top - margin.top*0.06})`);
			    


			//chartJS v2
			// var brush_width = params_chart.chart_instance.scales["x"].maxWidth - params_chart.chart_instance.scales["x"].right
		    // var brush_height = params_chart.chart_instance.scales["y"].height + 2// - params_chart.chart_instance.scales["y-axis-0"].margins.bottom

			//chartJS v3
			var brush_width = params_chart.chart_instance.scales["x"].maxWidth
			var brush_height = params_chart.chart_instance.scales["y"].maxHeight
		    //params_chart['brush_dim'] = {width: brush_width, height: brush_height}
		    //const brush = d3.brushX().extent([[0, 0], [width-margin.left - 6, height-margin.top - 5]])
		    const brush = d3.brushX().extent([[0, 0], [brush_width, brush_height]])
		        .on("start", () => { brush_startEvent(); })
		        .on("brush", () => { brush_brushEvent(); })
		        .on("end", () => { brush_endEvent(); })
		        .on("start.nokey", function() {
		            d3.select(window).on("keydown.brush keyup.brush", null);
		        });

			params_chart['brushBox'] = brush
				
		    //const svgChart = d3.select('#transformer' + '_' + brush_node.id);
		    const canvasChart_id = params_chart.chart_instance.canvas.id

		    const brushSvg = svgChart
		        .append("g")
		        .attr("class", "brush")
		        .attr("id", "brush_" + canvasChart_id)
		        .call(brush);


			//custom handles
				var brushResizePath = function(d) {
					var e = +(d.type == "e"),
						x = e ? 1 : -1,
						y = brush_height / 2;
					return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
				}	
				
				
				var handle = brushSvg.selectAll(".handle--custom")
					.data([{type: "w"}, {type: "e"}])
					.enter().append("path")
					.attr("class", "handle--custom"+params_chart.id)
					.attr("stroke", "#000")
					.attr("cursor", "ew-resize")
					.attr("d", brushResizePath);

				params_chart.brush_customHandles = handle


		    //hide brush screen
		    const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
		    svgSceen.style.display = "none"

		    let brushStartPoint = null;

		    function brush_startEvent() {
		        console.log('start');
		        var s = d3.event.selection

		        var check_brush_state = s[0] - s[1]
		        
		        //if the brush is inactiv, restore original colors
		        if (check_brush_state === 0) {
		            params_chart.instanciator.maj_couleurs(params_chart.chart_instance, params_chart)
		            params_chart.list_idx_segments_multiples_selected = [];
		            params_chart.list_labels_segments_multiples_selected = [];
		            params_chart.list_keys_values_segments_multiples_selected = [];
		            params_chart.active_slices = [];
					handle.attr("display", "none");
		        }
		    }

		    function brush_brushEvent() {
		        const s = d3.event.selection;
		        params_chart.list_labels_segments_multiples_selected = [];
		        params_chart.list_keys_values_segments_multiples_selected = [];

		        if (s && params_chart.selection_params.brush.mode === 'brushEvent') {
		            activate_brush(sharedParams, params_chart,s)
		        }
				handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - brush_height / 4] + ")"; });				
		    }


		    function brush_endEvent() {
		        const s = d3.event.selection;
		        params_chart.list_labels_segments_multiples_selected = [];
		        params_chart.list_keys_values_segments_multiples_selected = [];

		        console.log(s)
		        if (s) {
		            activate_brush(sharedParams, params_chart,s)

		        }
		    }


		    //save the pos of the svg screen components
		    var id = params_chart.chart_instance.canvas.parentNode.id;var querySelectorOverlay = '#' + id + ' > svg > g > g > rect.overlay';
		    var overlay = document.querySelector(querySelectorOverlay)
		    params_chart.brush_area = {overlay: {x: overlay.x.baseVal.value, y: overlay.y.baseVal.value, width: overlay.width.baseVal.value, height: overlay.height.baseVal.value},
		                                gap_left:0, gap_top: 0}		







		    function activate_brush(sharedParams, params_chart,s) {
		        //case when the scales are category type
		        if (params_chart.chart_instance.scales["x"].type === "category") {

		            var axis_x = [s[0], s[1]].sort(function(a, b){return a-b})
		            var x1_px = axis_x[0] + params_chart.chart_instance.chartArea.left, x2_px = axis_x[1] + params_chart.chart_instance.chartArea.left

		            // var brushedValues = [];
					// Object.values(params_chart.chart_instance.data.datasets[0]._meta)[0].data.forEach(d=> {if (d._model.x >= x1_px && d._model.x <= x2_px) brushedValues.push(d._model.label); });
					var dataset_meta = params_chart.chart_instance.getDatasetMeta(0);
					var i=0, dataset_meta_length = dataset_meta.data.length, brushed_pixels_indexes=[], dataset; 
					for (var i=0; i<= dataset_meta_length; i++) {
						dataset = dataset_meta.data[i];
						if (dataset?.x+1 >= x1_px && dataset?.x <= x2_px) {
							brushed_pixels_indexes.push(i)
						}
					}
					let brushedValues=[];
					brushed_pixels_indexes.forEach(i=> {brushedValues.push(dataset_meta._dataset.labels[i]) })


					//update colors
					update_colors(params_chart, brushedValues);



					//encode fields
					brushedValues = params_chart.funcLib.encode_fields(brushedValues, params_chart)


		            //store the brushed values in the lists
		            var category_field = params_chart.category_field
		            params_chart.list_labels_segments_multiples_selected = [{category_field: brushedValues}]
		            params_chart.list_keys_values_segments_multiples_selected = [{[category_field] : brushedValues}]
		            params_chart.list_idx_segments_multiples_selected = brushedValues;
		            params_chart.list_idx_segment_single_selected = []
		            params_chart.id_previous_singleSelect = ""
					params_chart.brush_enabled = true


		            console.log("brush_endEvent s: "+s); console.log("brushedValues: " + brushedValues)


				    if (params_chart.list_controls.controlBrush['data-clicked']) {

				        sharedParams.interaction_events[canvasChart_id].brushed = true        
						
						//update interactions states
						params_chart.zoom_in = false
						params_chart.brush = true

				    }
				    else if (params_chart.list_controls.controlZoom_in['data-clicked']) {
				        //zoom into selected area by filting the plot
				        params_chart.funcLib.zoom_in(params_chart, sharedParams)
						
						//update interactions states
						params_chart.zoom_in = true
						params_chart.brush = false

				        //hide svg screen
				        //const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
				        svgSceen.style.display = 'none'

				    }

		        }
		     
				function update_colors(params_chart, brushedValues) {
					params_chart.instanciator.maj_couleurs(params_chart.chart_instance, params_chart)
					var _brushedValues_indexes = [];					
					brushedValues.forEach(v=> {
						var i=0;
						params_chart.chart_instance.data.datasets[0].labels.forEach(label=> { 
							if (label === v) {
								_brushedValues_indexes.push(i)
								return}; 
							i++
						}); 
					}) 
					
					var length = params_chart.chart_instance.data.datasets[0].backgroundColor.length
					for (var i = 0; i < length; i++) {
						//if the slice is brushed, increase its opacitiy
						if (_brushedValues_indexes.includes(i)) {
							var backgroundcolor = params_chart.chart_instance.data.datasets[0].backgroundColor[i];
							backgroundcolor = backgroundcolor.replace('0.65', '1');
							params_chart.chart_instance.data.datasets[0].backgroundColor[i] = params_chart.chart_instance.data.datasets[0].backgroundColor[i].replace('0.65', '0.9');
						}
						//else set rgba(194, 194, 194, 1) color
						else {
							params_chart.chart_instance.data.datasets[0].backgroundColor[i] = 'rgba(240, 240, 240, 0.5)'

						}
					};
					params_chart.chart_instance.options.plugins.legend.display=false
					params_chart.chart_instance.update();
				}

		    }

		}




		params_chart.funcLib['restore_previous_hierarchy'] = function(params_chart, sharedParams) {
        	if (params_chart.hierarchy_levels === undefined) {return}

			//form an array from the hierarchy levels
			var arr_hierarchy_levels = Object.values(params_chart.hierarchy_levels)

			//get the position of the current cat field in the hierachy levels array
			var pos_current = arr_hierarchy_levels.indexOf(params_chart.category_field)

			//get the upper hierarchy level field & values
			//if (Object.keys(params_chart.previous_hierarchy).includes((pos_current-1).toString()) === false ) {
			if (Object.keys(params_chart.hierarchy_levels)[0] == pos_current) {
				console.log("you have reached the first hierarchy level")
				return
			}

			var category_field = params_chart.hierarchy_levels[pos_current-1];
			var previous_hierarchy = _.find(params_chart.hierarchy_interactions, {category_field: category_field})
			//var category_value = params_chart.previous_hierarchy[pos_current-1].hierarchy_value.flat()
			var category_value = previous_hierarchy.hierarchy_value.flat()
			//var last_active_category_value = [params_chart.previous_hierarchy[pos_current-1].active_hierarchy_value]
			var last_active_category_value = previous_hierarchy.active_hierarchy_value.flat()
			
			//save the hiararchy value
			params_chart.category_field = category_field


			//save current hier level			
			params_chart.current_hierarchy = {hierarchy_level: pos_current-1, hierarchy_field: category_field, hierarchy_value: category_value}



			//set x-axis label for next hierarchy						
			if (params_chart.labels_hierarchy_levels) {
				var label_x_axis = params_chart.labels_hierarchy_levels[pos_current-1]
				params_chart.chart_instance.config.options.scales.x.title.text = label_x_axis
			}
			else {
				params_chart.chart_instance.config.options.scales.x.title.text = category_field
			}


			//get the data filtred & grouped
			//1.make a copy of the transformation object if it exists
			if (params_chart.transformations) {var restore_transformations_object = true; params_chart.transformations_copy = {...params_chart.transformations} }
			//2.replace its content temporarly
			//2.1.assign 
				var pos_next_hierarchy = pos_current-1
				//save filter params				
				params_chart.transformations.filter=[]
				Object.values(params_chart.hierarchy_interactions).forEach(h=>{
					if (h.hierarchy_level !== pos_current && h.hierarchy_level !== pos_next_hierarchy) {
						params_chart.transformations.filter.push({field: h.category_field, operation: "include", values: h.active_hierarchy_value})
					}
					else if (h.hierarchy_level !== pos_current && h.hierarchy_level === pos_next_hierarchy) {
						params_chart.transformations.filter.push({field: h.category_field, operation: "include", values: [category_value]})
					}
				})

			//3.collect active selections from other charts
			params_chart.funcLib.collect_active_selections(params_chart, sharedParams)
			var filterList = params_chart.funcLib.setup_filterList(params_chart, sharedParams)

			//4.regenerate next dataset
			var target_id = filterList.map(o=> Object.values(o).join()).join("|")
			if (params_chart.history_data_filtred.hasOwnProperty(target_id)) {
				if (params_chart.transformations.dataset) {					
					var dataset_filtred = params_chart.history_data_filtred[target_id].indexes.map(e=> params_chart.transformations.data_main_groupBy_index[e][0]);
				}
				else {			
					var dataset_filtred = params_chart.history_data_filtred[target_id].indexes.map(e=> sharedParams.data_main_groupBy_index[e][0]);
				}
				var dataset_grouped = params_chart.funcLib["groupData"](dataset_filtred, params_chart)
				dataset_grouped = params_chart.funcLib['apply_custom_func'](dataset_grouped, dataset_filtred, params_chart)
			}
			else {
				params_chart.multithreading = false
				var dataset_grouped = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
				params_chart.multithreading = true
			}

			//5.restore the original transformation object
			if (restore_transformations_object === true) {
				params_chart.transformations = {...params_chart.transformations_copy}
			}
			else {params_chart.transformations = undefined}

			//update the targeted chart with the filtred data
			//1.get the instance of the chart to filter
			var chart_to_filter = params_chart.chart_instance

			//2.2.reset the existing labels & datasets in the param array & the config chart JS instance 
			params_chart.data[0].labels = []; params_chart.data[1].datasets = [];

			chart_to_filter.config.data.labels = []; 
			for (var ii = 0; ii < chart_to_filter.config.data.datasets.length; ii++) {
				chart_to_filter.config.data.datasets[ii].data = []; chart_to_filter.config.data.datasets[ii].label = "";
				chart_to_filter.config.data.datasets[ii].backgroundColor = []; chart_to_filter.config.data.datasets[ii].borderColor = [];
				chart_to_filter.config.data.datasets[ii].borderWidth = [];
			}					
			
			params_chart.prepare_data_type = ""
			params_chart.prepare_data_type = "preserve backgroundColor"																
			var field_decoded = decode_field(params_chart, category_field, last_active_category_value)
			feed_storeLists(params_chart, field_decoded)
			params_chart.instanciator.prepare_data_p2(dataset_grouped, params_chart, sharedParams)// -> ko, nb de bordures et couleurs trop élevé
			var data_type = "data"; var injection_type = "update"
			params_chart.instanciator.inject_metadata(chart_to_filter, params_chart, data_type, injection_type) // -> ok


			//delete current & previous hierarchy level
			delete params_chart.previous_hierarchy[pos_current]
			delete params_chart.previous_hierarchy[pos_current-1]

			setTimeout(	trigger_crossfilter(params_chart), 20)



			//regenerate svg & brush screen
			const brush_node = document.getElementById('brushParent_' + params_chart.id);
			
			if (brush_node) {
				//1.remove previous screen
				const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
				svgSceen.remove()

				//2.create new one
				params_chart.funcLib.generate_svg_brush(sharedParams, params_chart)
			}




	        //activate ind presence hiearchy
			const icon_hierarchy = document.getElementById("icon_hierarchy_" + params_chart.id)
			if (icon_hierarchy) {
				if (params_chart.current_hierarchy.hierarchy_level !== 0) {		        
					icon_hierarchy.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
				}
				else {
					document.getElementById("icon_hierarchy_" + params_chart.id).style.filter = ''
					params_chart.list_controls.controlPrevious_hierarchy.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'
				}
			}

			function feed_storeLists(params_chart,field_decoded) {
				params_chart.list_labels_segment_single_selected = [{category_field: last_active_category_value}];
				params_chart.list_keys_values_segment_single_selected = [{[category_field] : last_active_category_value}];
				params_chart.list_labels_segments_multiples_selected = [{category_field: last_active_category_value}];
				params_chart.list_keys_values_segments_multiples_selected = [{[category_field] : last_active_category_value}]
				
				if (field_decoded) {
					var backgroundcolor = sharedParams.registed_colors[field_decoded.category_field][field_decoded.field_decoded]
				}
				else {
					var backgroundcolor = sharedParams.registed_colors[category_field][last_active_category_value]	
				}
				params_chart.active_slices = [{category_field: last_active_category_value[0], backgroundColor: backgroundcolor, 
					index: undefined}]
				}

			function trigger_crossfilter(params_chart) {
				params_chart.list_idx_segment_single_selected.push("hierarchy_nav_" + category_field); params_chart.list_idx_segments_multiples_selected.push("hierarchy_nav_" + category_field)
				}

			function decode_field(params_chart, category_field, last_active_category_value) {

				if (params_chart.fields_to_decode && params_chart.fields_to_decode?.constructor == Array && params_chart.fields_to_decode.map(r=> Object.values(r).includes(category_field)).some(r=> r)) {										
					var field_to_decode = params_chart.fields_to_decode.filter(f => f.mainKey === params_chart.category_field)[0]

					var mainKey = field_to_decode.mainKey;

					var lookupTable = field_to_decode.lookupTable;

					var lookupKey = field_to_decode.lookupKey
					var fields = field_to_decode.fields
					var data_input = [{[category_field]: last_active_category_value[0]}]

					field_to_decode.fields.forEach(f=> {
					    var res = []
					    data_input.map(r=> {res.push(r.hasOwnProperty(f))})
					    if (res.filter(r=> !r).length > 0) {
					        join_v2(data_input, lookupTable, mainKey, lookupKey, fields)        
					    }
					})

					return {field_decoded: data_input[0][fields[0]], category_field: fields[0]}
				}
				else {
					return undefined
				}
			}		

		}




		params_chart.funcLib["access_next_hierarchy"] = function(params_chart, sharedParams, source_event, evt) {
			//get the data references of selected slice
			var category_field = params_chart.category_field;
			
			//if brush or zoom is active, cancel current action
			// if (params_chart.brush || params_chart.zoom_in) {
			// 	return
			// }
			//remove existing brush
			params_chart.funcLib.clean_brush(params_chart)

			var this_chart = params_chart.chart_instance
			if (source_event === 'dblclick') {
			    //var activePoints = params_chart.chart_instance.getElementAtEvent(evt);
				var activePoints = params_chart.chart_instance.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
			    //var idx = activePoints[0]['_index'];
				var idx = activePoints[0].index;
				var category = this_chart.data.labels[activePoints[0].index];

				//encode field
				if (params_chart.fields_to_decode && params_chart.fields_to_decode?.constructor == Array && params_chart.fields_to_decode.map(r=> Object.values(r).includes(category_field)).some(r=> r)) {
					var field_to_decode = params_chart.fields_to_decode.filter(f => f.mainKey === category_field)[0]
					var category_field_decoded = field_to_decode.fields[0]
					category = params_chart.data_input.filter(r=> r[category_field_decoded] === category)[0][category_field]
				}											

			}
			else {
				if (params_chart.active_slices[0] && params_chart.active_slices[0].hasOwnProperty('category_field')) {
					var category = params_chart.active_slices[0].category_field;
					var idx = params_chart.active_slices[0].index;
				}
				else {
					alert('Please select a bar to decompose')
					return
				}
			}

			//if the chart is linked to an adress search component, get the lat/lng radius here
			if (params_chart.geoRadius && params_chart.geoRadius.length>0) {
				var adress_label = this_chart.data.labels[activePoints[0].index];
				var adresse_Search_object = _.find(params_adressSearch.adresses, {adress: adress_label})		
			}


			//check if this is the last hierarchy level

			//get the last hierarchy level
			var array_hierarchy_levels = Object.values(params_chart.hierarchy_levels); var last_hierarchy_level = array_hierarchy_levels[array_hierarchy_levels.length-1]
			if (last_hierarchy_level === category_field) {
				console.log("you have reached the last hierarchy level")
				return
			}
				

			//regenerate store lists if the previous category value is != from the current
			//if (params_chart.list_labels_segment_single_selected.length>0 && params_chart.list_labels_segment_single_selected[0]["category_field"] !== category) {
				params_chart.list_idx_segments_multiples_selected = []; params_chart.list_labels_segments_multiples_selected = [];												
				params_chart.list_idx_segment_single_selected = []; params_chart.list_labels_segment_single_selected = [];					
				params_chart.list_keys_values_segment_single_selected = []; params_chart.list_keys_values_segments_multiples_selected = [];
				params_chart.active_slices = []

				params_chart.list_labels_segment_single_selected.push({category_field: category});
				params_chart.list_keys_values_segment_single_selected.push({[category_field] : [category]});
				params_chart.list_labels_segments_multiples_selected.push({category_field: category});
				params_chart.list_keys_values_segments_multiples_selected.push({[category_field] : [category]});
				params_chart.list_idx_segment_single_selected.push(idx+"_"+category_field); params_chart.list_idx_segments_multiples_selected.push(idx+"_"+category_field)
			//}

				

			//save the hiararchy value							
				//1.form an array from the hierarchy levels & get the position of the current cat field in the hierachy levels array
				var pos_current = Object.values(params_chart.hierarchy_levels).indexOf(category_field)						
				params_chart['previous_hierarchy'] = {}
				params_chart.previous_hierarchy[pos_current] = {hierarchy_level: pos_current, hierarchy_field: category_field, hierarchy_value: params_chart.activ_categories_values.flat(), 
					active_hierarchy_value: category}

				//for each hierarchy level, save the interactions asked by the user
				//if we are at the first hierarchy level, reset the hierarchy_interactions object
				//!params_chart.hierarchy_interactions ? params_chart.hierarchy_interactions={}: {}
				if (pos_current === 0 || !params_chart.hierarchy_interactions) {
					params_chart.hierarchy_interactions={}
				}
				params_chart.hierarchy_interactions[category_field] = {category_field: category_field, hierarchy_level: pos_current, hierarchy_value: params_chart.activ_categories_values.flat(), 
					active_hierarchy_value: !_.isArray(category)? [category]:category}
				

			//collect the rank of the current category field in the hierarchy fields object
			var pos_active_category_field = Object.values(params_chart.hierarchy_levels).indexOf(params_chart.category_field)

			//set next cat field
			pos_active_category_field++; 
			params_chart.category_field = params_chart.hierarchy_levels[pos_active_category_field]

			//set x-axis label for next hierarchy						
			if (params_chart.labels_hierarchy_levels) {
				var label_x_axis = params_chart.labels_hierarchy_levels[pos_active_category_field]
				params_chart.chart_instance.config.options.scales.x.title.text = label_x_axis
			}
			else {
				params_chart.chart_instance.config.options.scales.x.title.text = params_chart.category_field
			}


			

			//get the data filtred & grouped
			//1.make a copy of the transformation object if it exists
			if (params_chart.transformations) {var restore_transformations_object = true; params_chart.transformations_copy = {...params_chart.transformations} }
			//2.feed the values to be used to filter the chart
			if (params_chart.geoRadius && params_chart.geoRadius.length>0) {
				//get the lat/lng field names
				if (params_chart.latLng_fields_params && params_chart.latLng_fields_params.hasOwnProperty("lat_fieldName")) {
					var lat_field = params_chart.latLng_fields_params.lat_fieldName, lng_field = params_chart.latLng_fields_params.lng_fieldName
				}
				else {
					var lat_field = sharedParams.transformations.latLng_fields.lat, lng_field = sharedParams.transformations.latLng_fields.lng
				}
					
				Object.assign(params_chart.transformations.crossfilter, {[lat_field+"_brushed"]: [adresse_Search_object.lat_radius], [lng_field+"_brushed"]: [adresse_Search_object.lng_radius]})
				params_chart.brush_keys_values = {[lat_field+"_brushed"]: [adresse_Search_object.lat_radius], [lng_field+"_brushed"]: [adresse_Search_object.lng_radius]}
			}

			//current
			//Object.assign(params_chart.transformations, {filter: [{field: category_field, operation: "include", values: [category]}]})
			
			//evo
			var pos_next_hierarchy = pos_current+1
			params_chart.transformations.filter=[]
			// Object.values(params_chart.hierarchy_interactions).forEach(h=>{
			// 	if (h.hierarchy_level !== pos_current && h.hierarchy_level !== pos_next_hierarchy) {
			// 		params_chart.transformations.filter.push({field: h.category_field, operation: "include", values: h.active_hierarchy_value})
			// 	}
			// 	else if (h.hierarchy_level !== pos_current && h.hierarchy_level === pos_next_hierarchy) {
			// 		params_chart.transformations.filter.push({field: h.category_field, operation: "include", values: [category_value]})
			// 	}
			// })
			Object.values(params_chart.hierarchy_interactions).forEach(h=>{
				params_chart.transformations.filter.push({field: h.category_field, operation: "include", values: h.active_hierarchy_value})
			})			


			//3.collect active selections from other charts
			params_chart.transformations.crossfilter_copy = {...params_chart.transformations.crossfilter}
			params_chart.funcLib.collect_active_selections(params_chart, sharedParams)
			var filterList = params_chart.funcLib.setup_filterList(params_chart, sharedParams)
			params_chart.transformations.crossfilter = {...params_chart.transformations.crossfilter_copy}

			//4.regenerate next dataset
			var target_id = filterList.map(o=> Object.values(o).join()).join("|")
			if (params_chart.history_data_filtred.hasOwnProperty(target_id)) {
				if (params_chart.transformations.dataset) {					
					var dataset_filtred = params_chart.history_data_filtred[target_id].indexes.map(e=> params_chart.transformations.data_main_groupBy_index[e][0]);
				}
				else {
					var dataset_filtred = params_chart.history_data_filtred[target_id].indexes.map(e=> sharedParams.data_main_groupBy_index[e][0]);
				}
				var dataset_grouped = params_chart.funcLib.groupData(dataset_filtred, params_chart)
				dataset_grouped = params_chart.funcLib['apply_custom_func'](dataset_grouped, dataset_filtred, params_chart)
				updateChart(params_chart, dataset_grouped)
			}
			else {
				params_chart.multithreading = false
				var dataset_grouped = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
				updateChart(params_chart, dataset_grouped)
				params_chart.multithreading = true
			}

			

			//regenerate svg & brush screen
			//1.remove previous screen
				const brush_node = document.getElementById('brushParent_' + params_chart.id);
				if (brush_node) {
					const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
					svgSceen.remove()
				//2.create new one
					params_chart.funcLib.generate_svg_brush(sharedParams, params_chart)
				}



	        //activate ind presence hiearchy
	        const icon_hierarchy = document.getElementById("icon_hierarchy_" + params_chart.id)
			if (icon_hierarchy) {
				icon_hierarchy.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
				params_chart.list_controls.controlPrevious_hierarchy.style.filter = ''
			}


			
			function updateChart(params_chart, dataset_filtred) {

				//4.restore the original transformation object
				if (restore_transformations_object === true) {
					params_chart.transformations = {...params_chart.transformations_copy}
				}
				else {params_chart.transformations = undefined}

				//update the targeted chart with the filtred data
				//1.get the instance of the chart to filter
				var chart_to_filter = params_chart.chart_instance

				//2.2.reset the existing labels & datasets in the param array & the config chart JS instance 
				params_chart.data[0].labels = []; params_chart.data[1].datasets = [];

				chart_to_filter.config.data.labels = []; 
				for (var ii = 0; ii < chart_to_filter.config.data.datasets.length; ii++) {
					chart_to_filter.config.data.datasets[ii].data = []; chart_to_filter.config.data.datasets[ii].label = "";
					chart_to_filter.config.data.datasets[ii].backgroundColor = []; chart_to_filter.config.data.datasets[ii].borderColor = [];
					chart_to_filter.config.data.datasets[ii].borderWidth = [];
				}					

				params_chart.prepare_data_type = ""
				params_chart.instanciator.prepare_data_p2(dataset_filtred, params_chart, sharedParams)// -> ko, nb de bordures et couleurs trop élevé
				var data_type = "data"; var injection_type = "update"
				params_chart.instanciator.inject_metadata(chart_to_filter, params_chart, data_type, injection_type) // -> ok
			}

			
			params_chart.current_hierarchy = {hierarchy_level: pos_current+1, hierarchy_field: params_chart.category_field, hierarchy_value: params_chart.activ_categories_values.flat(), 
					first_in: true}

			//re init store lists
			setTimeout(	re_init_storeLists(params_chart), 1500)

			function re_init_storeLists(params_chart) {
				//bugy code
				var category_field = params_chart.category_field
				params_chart.list_labels_segments_multiples_selected = [];	params_chart.list_labels_segment_single_selected = [];					
				params_chart.list_keys_values_segment_single_selected = []; params_chart.list_keys_values_segments_multiples_selected = [];
				
				// params_chart.list_labels_segment_single_selected.push({category_field: params_chart.activ_categories_values.flat()});
				// params_chart.list_keys_values_segment_single_selected.push({[category_field] : params_chart.activ_categories_values.flat()});
				// params_chart.list_labels_segments_multiples_selected.push({category_field: params_chart.activ_categories_values.flat()});
				// params_chart.list_keys_values_segments_multiples_selected.push({[category_field] : params_chart.activ_categories_values.flat()}); 
			}

		};

		params_chart.funcLib['init_adresses_radius'] = function(params_chart, sharedParams) {
			var slices_are_adresses = (params_chart.hasOwnProperty('geoRadius') && params_chart.geoRadius.length>0)
			var adressSearch_built = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
			if (slices_are_adresses) {
				var listen_adressSearch_built = setInterval(()=> {
					if (adressSearch_built) {
						var radius_coordinates_built = Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).map(e=> e.lat_radius).every(e=> e)
						if (radius_coordinates_built) {
							var lat_field = sharedParams.transformations.latLng_fields.lat;
							var lng_field = sharedParams.transformations.latLng_fields.lng;

							var lat_values = Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).map(a=> a.lat_radius)
							var lng_values = Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).map(a=> a.lng_radius)

							//update the chart
							params_chart.brush_keys_values = {[lat_field+'_brushed']: lat_values, [lng_field+'_brushed']: lng_values};
							params_chart.brush_values = {lat_field: lat_values, lng_field: lng_values};

							clearInterval(listen_adressSearch_built)
						}
					}
					adressSearch_built = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
				}, 50)
			}
		}

		params_chart.funcLib['create_figure_number'] = function(params_chart, sharedParams) {
			params_chart.figure_auto = sharedParams.params_charts.length
		}

		params_chart.funcLib.create_figure_number(params_chart, sharedParams)

    
	}

	async updateChart(params_barChart, sharedParams, filter_object, preserve_backgroundColor) {
		clear_data_chart(params_barChart)

		if (filter_object) Object.assign(params_barChart.transformations.crossfilter, filter_object)
		if (preserve_backgroundColor) params_barChart.prepare_data_type = "preserve backgroundColor"

		var data_filtred = await this.prepare_data_p1(params_barChart, sharedParams)

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		var data_type = "data"; var injection_type = "update"
		this.inject_metadata(params_barChart.chart_instance, params_barChart, data_type, injection_type)
		
		
		function clear_data_chart(params_barChart) {
			params_barChart.data[0].labels = []; params_barChart.data[1].datasets = [];
			params_barChart.chart_instance.data.datasets.forEach(d=> {
				d.label ? d.label = "" : {}; 
				d.data ? d.data = [] : {};
				d.backgroundColor ? d.backgroundColor = [] : {}; 
				d.borderColor ? d.borderColor = [] : {}; 
				d.borderWidth ? d.borderWidth = [] : {}; 
				d.labels ? d.labels = [] : {};
			})
			params_barChart.chart_instance.data.labels ? params_barChart.chart_instance.data.labels = [] : {}
		}
	}

	prepare_data_p1(params_chart, sharedParams) {

	    var d1 = new Date();

	    //zone de filtrage
	    //filter the primary data source according to the scope of the vizualisation (limited geographic area, range of time, any specific observation)

	    //data source for the bar chart
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
					//v1, kept to show the better perf of the v2
					// console.time('brush circles sizes v1')
					// params_chart.transformations.dataset.forEach(r=> {
					// 	if (params_chart.sharedParams.spatial_data.find(f=> f.latLng === r.latLng)) {
					// 		data_chart.push(r)
					// 	}
					// })
					// console.timeEnd('brush circles sizes v1')

				//v2, by building a dict, 10x faster than v1
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

            //delete the lat/lng crossfilter values as they were just a routing signal for the spatial queries
            delete params_chart.transformations.crossfilter.lat;
            delete params_chart.transformations.crossfilter.lng;
			
	    }
	    else if (params_chart.transformations.dataset === undefined) {
	    	var data_chart = [...sharedParams.data_main]
	    	
	    }
	    else if (params_chart.transformations.dataset && params_chart.transformations.dataset.length>0 ) {
			if (!params_chart.transformations['dataset_ready'] && !params_chart.transformations.filter) {
				params_chart.transformations['dataset_ready'] = [...params_chart.transformations.dataset]
				var data_chart = [...params_chart.transformations.dataset]
			}
			else if (!params_chart.transformations['dataset_ready'] && params_chart.transformations.filter) {
				var data_filtred = filter_local_dataset(params_chart.transformations.filter, params_chart.transformations.dataset);
				//create index
				let i=0; data_filtred.forEach(r=> {r['index'] = i++})				
			 
				//if the data has lat/lng fields, create a leaflet latLng
				if (params_chart.latLng_fields_params) {
					data_filtred.forEach(r=> {
						r['leaflet_lat_lng'] = new L.latLng(r[params_chart.latLng_fields_params.lat_fieldName], r[params_chart.latLng_fields_params.lng_fieldName])
					})
				}
				params_chart.transformations['data_main_groupBy_index'] = _.groupBy(data_filtred, 'index'); 
				params_chart.transformations['dataset_ready'] = [...data_filtred]
				var data_chart = [...params_chart.transformations.dataset_ready]
			}
			else {
				var data_chart = [...params_chart.transformations.dataset_ready]
			}			
	    }
		else  {return 'no dataset fits'}




		var filterList = {};
		//if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
		if (params_chart.transformations.crossfilter !== undefined && Object.keys(params_chart.transformations.crossfilter).length > 0 ) {
			filterList = formFilterArray(params_chart, params_chart.transformations.crossfilter)
		}




		//if a filter arguments has been provided for the data source, call them back here
		if (params_chart.transformations.filter !== undefined) {

			//transform the filterList into an array that we can push in it filter objects
			filterList = Object.values(filterList)

			//don't take fields from the filter object if they are present in the crossfilter
			params_chart.transformations.filter.forEach(e=> {if (!filterList.find(f=> f.field === e.field)) {filterList.push(e)} })


			//Object.assign(filterList, params_chart.transformations.filter)

			filterList = filterList.filter(l=> l.field !== "");

			//flaten values
			filterList.forEach(e=> {if (e.values) e.values = e.values.flat()})
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
		else {var data_filtred = [...data_chart]}




		//case when the result of the crossfilter is an array of data & not an array of promises
		//if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length > 0) {
		if (data_filtred.constructor == Array && data_filtred[0]?.constructor != Promise) {
			//save data indexes
			if (!_.isEmpty(filterList)) {
				params_chart.id_current_filter = filterList.map(o=> Object.values(o).join()).join("|")			
				if (!params_chart.history_data_filtred.hasOwnProperty(params_chart.id_current_filter)) {
					params_chart.history_data_filtred[params_chart.id_current_filter] = {indexes: deduplicate_dict(data_filtred, 'index')} 
				}
			}

			
			//if the dataset is built upon a radius, given by an adress, fit the dataset to the bounds of the given radius
			if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length > 0) {
				var func_locator = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
				if (func_locator && data_filtred.find(r=> r.leaflet_lat_lng)) {
					data_filtred = func_locator.funcLib.restrict_dataset_to_radius(data_filtred, params_chart);
				}

				else if (func_locator && !data_filtred.find(r=> r.leaflet_lat_lng) && _.find(params_chart, 'lat_fieldName')) {
					var lat = params_chart.latLng_fields_params.lat_fieldName, lng = params_chart.latLng_fields_params.lng_fieldName;
					data_filtred = func_locator.funcLib.restrict_dataset_to_radius(data_filtred, params_chart, lat, lng);
				}
				else {
					console.warn('please specify the lat/lng fields for the chart id: ' + params_chart.id);
				}
				
			}



			var dataset_grouped = params_chart.funcLib["groupData"](data_filtred, params_chart)
							
			dataset_grouped = params_chart.funcLib['apply_custom_func'](dataset_grouped, data_filtred, params_chart)

			return dataset_grouped
		}
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {return []}
		//case when the result of the crossfilter is a promise
		else {

	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_chart)
	        return promise_dataset_ready


			async function process_worker_result(data_filtred, sharedParams, params_chart, filterList) {
				var result = []; var chart, promise_result
				//case when the workers return multiple promises of datasets
				if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> e).length > 0) {
				//if (data_filtred.constructor == Array && data_filtred[0]?.constructor == Promise) {
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
						console.time('exec build subset crossfilter simple_BarChart')
						var dataset_filtred = [];
						var list_indexes = [];
						//console.time('time build list_indexes')
						indexes.forEach(index=> {
						    index.forEach(i=> {
						        list_indexes.push(i)
						    })						
						})
						//console.timeEnd('time build list_indexes')

						//console.time('time deduplicate array')
						list_indexes = deduplicate_array(list_indexes)
						//console.timeEnd('time deduplicate array')

						//console.time('time save data indexes')
						//save data indexes
						if (!_.isEmpty(filterList)) {
							params_chart.id_current_filter = filterList.map(o=> Object.values(o).join()).join("|")			
							params_chart.history_data_filtred[params_chart.id_current_filter] = {indexes: list_indexes} 
						}
						//console.timeEnd('time save data indexes')

						//console.time('time build dataset_filtred')
						list_indexes.forEach(index=> {							
							dataset_filtred.push(sharedParams.data_main_groupBy_index[index][0])							
						})
						//console.timeEnd('time build dataset_filtred')
						
						console.timeEnd('exec build subset crossfilter simple_BarChart')

						//if the dataset is built upon a radius, given by an adress, fit the dataset to the bounds of the given radius
						if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length > 0) {
							var func_locator = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
							if (func_locator)  {dataset_filtred = func_locator.funcLib.restrict_dataset_to_radius(dataset_filtred, params_chart)}
						}

						var dataset_grouped = params_chart.funcLib["groupData"](dataset_filtred, params_chart);
						dataset_grouped = params_chart.funcLib['apply_custom_func'](dataset_grouped, dataset_filtred, params_chart)

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result						

						//params_chart.data_promise = dataset_grouped
						return dataset_grouped
					}
				}
			}
		}	
		



	}


	prepare_data_p2(data_input, params_barChart, sharedParams) {
		/*processus de création d'un nouveau dataset: 
		params_barChart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
		*/			
			var categories, categories_source, categories_safe_copy, category_field
			params_barChart.nb_axis = 1
			this.category_field = params_barChart.category_field

			if (params_barChart.list_of_axis.length === 0) {params_barChart.list_of_axis.push(this.category_field)}

			categories_source = data_input.map(r=> r[this.category_field])


			//if we have fields to decode for the current category field
			if (params_barChart.fields_to_decode && params_barChart.fields_to_decode?.constructor == Array && params_barChart.fields_to_decode.map(r=> Object.values(r).includes(params_barChart.category_field)).some(r=> r)) {
				decode_field(params_barChart, data_input)
				slice_category_field(params_barChart, data_input)
			}
			else if (params_barChart.fields_to_decode && params_barChart.fields_to_decode?.constructor == Object && Object.values(params_barChart.fields_to_decode).includes(params_barChart.category_field)) {
				params_barChart.fields_to_decode = [params_barChart.fields_to_decode]
				decode_field(params_barChart, data_input)
				slice_category_field(params_barChart, data_input)
			}
			else {
				sort_dataset(params_barChart)
				//1.obtenir les catégories (les communes par ex)
				//slice the category field
				slice_category_field(params_barChart, data_input)
				categories = data_input.map(r=> r[this.category_field])
				categories_safe_copy = data_input.map(r=> r[this.category_field].toString())
				category_field = this.category_field
				params_barChart.data_input = data_input
			}




			function decode_field(params_chart, data_input) {
				var field_to_decode = params_chart.fields_to_decode.filter(f => f.mainKey === params_chart.category_field)[0]
			
				var mainKey = field_to_decode.mainKey;
			
				var lookupTable = field_to_decode.lookupTable;
				
				var lookupKey = field_to_decode.lookupKey
				var fields = field_to_decode.fields
										
				field_to_decode.fields.forEach(f=> {
					var res = []
					data_input.map(r=> {res.push(r.hasOwnProperty(f))})
					if (res.filter(r=> !r).length > 0) {
						join_v2(data_input, lookupTable, mainKey, lookupKey, fields)
						sort_dataset(params_chart)
						res = []
						//1.obtenir les catégories (les communes par ex)
						categories = data_input.map(r=> r[f])
						categories_safe_copy = data_input.map(r=> r[f])
						category_field = f
						params_chart.data_input = data_input

					}
				})
				params_barChart.category_field_alias = fields[0]+'_shortcut'
			}


			//sort data
			function sort_dataset(params_barChart) {
				if (params_barChart.sort && params_barChart.sort.custom_sort && params_barChart.sort.fieldName) {
					join_v2(data_input, params_barChart.sort.custom_sort, params_barChart.sort.fieldName, 'field', ['key'])
					if (params_barChart.sort.order) { 
						data_input.sort(trier('key', params_barChart.sort.order))
					}
					else {
						data_input.sort(trier('key', 'asc'))
					}
				}

				else if (params_barChart.sort && params_barChart.sort.fieldName && params_barChart.sort.order) {
					if (['asc', 'desc'].includes(params_barChart.sort.order)) {
						if (params_barChart.sort.fieldName === params_barChart.numerical_field_params.fieldName) {
							var key = params_barChart.numerical_field_params.agg_type + "_" + params_barChart.sort.fieldName
						}
						else {
							var key = params_barChart.sort.fieldName
						}
						data_input.sort(trier(key, params_barChart.sort.order))
					}
				}
			}

			function slice_category_field(params_barChart, data_input) {
				if (params_barChart.category_field_slice && params_barChart.category_field_slice.constructor == Array) {
					if (params_barChart.fields_to_decode) {
						var label_field = params_barChart.fields_to_decode[0]?.fields[0]
						!label_field ? label_field = params_barChart.fields_to_decode.fields[0] : {}
						var max_label_len = params_barChart.category_field_slice[1] - params_barChart.category_field_slice[0];
						
						data_input.forEach(d=> {
							var sufix = ''
							if (d[label_field].length > max_label_len) sufix = '...'
								d[label_field+'_shortcut'] = d[label_field].slice(params_barChart.category_field_slice[0], params_barChart.category_field_slice[1])+sufix
						})
						categories_safe_copy = data_input.map(r=> r[params_barChart.category_field_alias])
					}
				}			
			}

			var nb_categories = categories.length; 

	        params_barChart.nb_categories = categories.length;
	        params_barChart.activ_categories_values = []; params_barChart.activ_categories_values.push(data_input.map(r=> r[this.category_field]))

			//3.création des catégories dans la spec ChartJS (champ labels dans chartJS)
			params_barChart.data[0].labels = [categories_safe_copy]
			


            //4.créer un array borderColor et borderWidth égal à nb_categories
            var borderColorArray = []; 
            var borderWidthArray = [];
            
            for (var i = 0; i < nb_categories; i++) {
            	borderColorArray.push('rgba(230, 11, 11, 0)');
            	borderWidthArray.push(1);

        	}	        


			/*guide création des sous-catégories dans la spec ChartJS
			params_barChart.data[1].datasets.push({"label":data_group[i]['nb_pieces'], backgroundColor: 'red', data: [39889, 19889, 14889]})*/
	        
			//if the chart must be sync with a chart from another sharedParams instance, try to reuse the existing colors
			var backgroundColorArray_source = undefined
			if (sharedParams.sharedParams_array) {
				var reuse_color_scheme = sharedParams.sharedParams_array.map(sh=> sh.registed_colors.hasOwnProperty(category_field)).some(e=> e)
			}
			
			//if we initialize the backgroundColorArray for the first time, make a random select from the repository of colors
			if (reuse_color_scheme) {
				sharedParams.sharedParams_array.forEach(sh=> {if (sh.registed_colors.hasOwnProperty(category_field)) {backgroundColorArray_source = sh.registed_colors[category_field]} })
				//params_barChart.backgroundColorArray_source[params_barChart.category_field] = backgroundColorArray_source
				params_barChart.backgroundColorArray_source = {...backgroundColorArray_source}
			}

			//check if the backgroundColorArray_source contains colors for each category value
			let checker = (arr, target) => target.every(v => arr.includes(v));
			if (backgroundColorArray_source) {
				var all_colors_defined = checker(Object.keys(backgroundColorArray_source), categories)
				if (!all_colors_defined) {
					select_generated_color(categories, params_barChart, backgroundColorArray_source)
				}
			}

			if (!backgroundColorArray_source && params_barChart.backgroundColorArray_source["category_field"] !== params_barChart.category_field) {        		

        		//reset the backgroundColorArray_source
        		params_barChart.backgroundColorArray_source = {};
        		params_barChart.backgroundColorArray_source["category_field"] = params_barChart.category_field
        		

				var status_colors = "empty";

				//generate id for the registred categories
				var check_sum_categories = categories.sort().join()
				if (sharedParams.registed_colors.hasOwnProperty(category_field)) {
					var check_sum_registred_colors = Object.keys(sharedParams.registed_colors[category_field]).filter(e=> e !== 'category_field').sort().join()
				}
				else {var check_sum_registred_colors = undefined}

				//if the registred colors object contains the actual category field with the same keys, reuse it
     			if (sharedParams.registed_colors.hasOwnProperty(category_field) && check_sum_categories === check_sum_registred_colors) {
     				params_barChart.backgroundColorArray_source = {...sharedParams.registed_colors[category_field]}
     			}
     			//else generate a new one
     			else {
     				var backgroundColorArray_source = generateColors(nb_categories, params_barChart.colorsConfig.scheme, params_barChart.colorsConfig.colorsOrder, category_field, sharedParams)
					select_generated_color(categories, params_barChart, backgroundColorArray_source)
     			}
			}

			if (!sharedParams.registed_colors.hasOwnProperty(category_field)) {
				sharedParams.registed_colors[category_field] = {...params_barChart.backgroundColorArray_source}
			}

			function select_generated_color(categories, params_barChart, backgroundColorArray_source) {
				let i = 0;
				categories.forEach(axis => {
					if (!params_barChart.backgroundColorArray_source[axis]) {
						params_barChart.backgroundColorArray_source[axis] = pick_one_color(backgroundColorArray_source, i); 
						i++
					}
				})

				function pick_one_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}
			}


			//créer les datasets composés des categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			var data_array = []; var backgroundColorArray = []; 			
	        for (var i = 0; i < nb_categories; i++) {

	        	var category = data_input[i][category_field]
	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	            //2.2.récupérer l'array contenant les data
				if (params_barChart.numerical_field_params.custom_function) {
					data_array.push(data_input[i][params_barChart.numerical_field_params.computed_field_name]);
				}
				else {
		            data_array.push(data_input[i][params_barChart.numerical_field_params.agg_fieldName]);
				}

	            //3.construie l'array contenant les couleurs des barres
	            var color = params_barChart.backgroundColorArray_source[category]
		        backgroundColorArray.push(color)

	        };


			//if the chart is already clicked, preserve the deactivated slices and maintain they color effect (rgba(194, 194, 194, 1) or lower opacity)
            if (params_barChart.prepare_data_type === "preserve backgroundColor" && params_barChart.active_slices.length > 0) {
            	backgroundColorArray = [];

				if (params_barChart.data_input) {
					var array_labels = params_barChart.data_input.map(r=> r[params_barChart.category_field])
				}
				else {var array_labels = params_barChart.data[0].labels[0]}

		            	
            	var active_category_fields = [];
            	for (var c = 0; c < params_barChart.active_slices.length; c++) {
            		active_category_fields.push(params_barChart.active_slices[c].category_field)
            	}

            	//1.collecte the category_field value & background color of the active slice
            	for (var a = 0; a < params_barChart.active_slices.length; a++) {

	            	var active_category_field = params_barChart.active_slices[a].category_field


	            	//2.collecte the position of the active_category_field in the filtred array of labels
	            	
	            	var pos_active_category_field = array_labels.indexOf(active_category_field)


	            	//3.add rgba(194, 194, 194, 1) backgroundColor to the slices, except the active slice setup above
	            	for (var i = 0; i < array_labels.length; i++) {
	            		//if the label looped is not in the array of active labels, set it's background color to rgba(194, 194, 194, 1)
	            		pos_active_category_field = active_category_fields.indexOf(array_labels[i])
	            		if (pos_active_category_field === -1) {
		            		backgroundColorArray.push('rgba(240, 240, 240, 0.5)');
	    				}
	    				else {
	            			var active_slice_backgroundColor = params_barChart.active_slices[pos_active_category_field].backgroundColor	    					
	    					backgroundColorArray.push(active_slice_backgroundColor);
	    				}
	            	}
	            }
            }



            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 

            params_barChart.data[1].datasets.push({label: this.label_tooltip, backgroundColor: backgroundColorArray, borderWidth: borderWidthArray, 
            	borderColor: borderColorArray, data: data_array, labels: categories_safe_copy})

        params_barChart.list_idx_segments_existants = [];
		var list_idx_segments_existants = params_barChart.list_idx_segments_existants                    		
        //1.collecter les clés de tous les segments existants
		for (var i = 0; i < (nb_categories); i++) {
			list_idx_segments_existants.push(i)			
		}

		//.sauvegarder une image des données source avant transformation
		if (params_barChart.data_source_raw.length === 0) {
			params_barChart.data_source_raw = data_input
			params_barChart.data_source[0].labels.push(categories)
	        params_barChart.data_source[1].datasets = params_barChart.data[1].datasets
	        params_barChart.list_keys_values_source = {[params_barChart.category_field]: categories_source}

	    }		

	}


	init_chart(params_barChart, sharedParams) {		
		
	
		
		if (params_barChart.horizontalBar)	{var barOrientation = "y"}
		else {var barOrientation = "x"}

		let datalabels, plugins = [];
		if (params_barChart.datalabels) {
			plugins.push(ChartDataLabels)
			datalabels = {
				backgroundColor: function(context) {
				  return context.dataset.backgroundColor;
				},
				borderColor: 'white',
				borderRadius: 10,
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
				formatter: Math.round,
				anchor: 'end'
			  }
		}

		
		var barChart = new Chart(this.ctx, {
				        type: this.type,
				        data: [],
						plugins: plugins,
				        options: {
							indexAxis: barOrientation,
				            responsive: this.responsive,
							maintainAspectRatio: false,
				            title: {
								display: false,
								text: ""
							},

			                scales: {
			                    //v3.4
								y: {			                        
									beginAtZero: params_barChart.params_yAxis.ticks.beginAtZero,
									display: params_barChart.params_yAxis.ticks.display,								
									title: {
										display: true,
										text: this.title_y_axis
									}	
							    },
			                    x: {
									beginAtZero: params_barChart.params_xAxis.ticks.beginAtZero,
									display: params_barChart.params_xAxis.ticks.display,
									title: {
										display: true,
										text: this.title_x_axis
									}			
							    }

			                },
							plugins: {
								legend: {
									display: false
							  	},
								datalabels: datalabels
							},			                
			                animation: {
			                        duration: 1000,
			                        easing: 'easeOutQuad'
			                },
			             /*    tooltips: {
			                    mode: 'label'
			                },*/



				        },
						//plugins: plugins
				      });

		//handle the display of the chart
		if (params_barChart.build_on && params_barChart.build_on.hasOwnProperty('params_chart_id')) {
			sharedParams.trigger_chart_display(params_barChart, sharedParams)
		}


		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		//params_barChart.ctx.style.opacity = '0'
		this.inject_metadata(barChart, params_barChart, data_type, injection_type)
		barChart.options.plugins.legend.display=false




		return barChart 				
	}



	inject_metadata(barChart, params_barChart, data_type, injection_type) {
		//alimenter avec les labels
		if (barChart.config.data.labels.length === 0) {
			barChart.config.data.labels = [...params_barChart[data_type][0].labels[0]]
		}



		//alimenter avec les datasets
		if (injection_type === "init") {
			var l = params_barChart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_barChart[data_type][1].datasets[i])
				barChart.config.data.datasets[i] = _.cloneDeep(datasets[i])
			}
			barChart.config.data.datasets = _.cloneDeep(datasets)
		}
		else if (injection_type === "update") {
			var l = params_barChart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_barChart[data_type][1].datasets[i])
				barChart.config.data.datasets[i].data = _.cloneDeep(datasets[i].data)
				barChart.config.data.datasets[i].label = _.cloneDeep(datasets[i].label)
				barChart.config.data.datasets[i].backgroundColor = _.cloneDeep(datasets[i].backgroundColor)
				barChart.config.data.datasets[i].borderColor = _.cloneDeep(datasets[i].borderColor)
				barChart.config.data.datasets[i].borderWidth = _.cloneDeep(datasets[i].borderWidth)
			}

			barChart.data.datasets[0].labels = [...barChart.data.labels]
			
			params_barChart.sharedParams.highlight_chart_border(params_barChart)
		}

		
		//clean brush
		params_barChart.funcLib.clean_brush(params_barChart)

		
		barChart.update(params_barChart.sharedParams.chartsUpdateTime)
		

		params_barChart.funcLib.update_animated_scales(params_barChart)


		//register the chart instance in the param array
		params_barChart.chart_instance = barChart



		

		return barChart
	}





	maj_couleurs(barChart, params_barChart) {
		//on entre dans cette func pour enlever le focus posé sur les segments

		var nb_categories = params_barChart.nb_categories;
		var backgroundColorArray = [];


		//old code
		// if (params_barChart.fields_to_decode) {
		// 	var category_field_decoded = params_barChart.fields_to_decode.fields[0]
		// 	var array_labels = params_barChart.data_input.map(r=> r[category_field_decoded])
		// }

		if (params_barChart.fields_to_decode && params_barChart.fields_to_decode?.constructor == Array && params_barChart.fields_to_decode.map(r=> Object.values(r).includes(params_barChart.category_field)).some(r=> r)) {
			var field_to_decode = params_barChart.fields_to_decode.filter(f => f.mainKey === params_barChart.category_field)[0]
			var category_field_decoded = field_to_decode.fields[0]
			var array_labels = params_barChart.data_input.map(r=> r[category_field_decoded])
			array_labels.filter(a=> a).map(a=> a.toString()).map(a=> a.toString())

		}

		else {var array_labels = barChart.data.labels}
		
		//convert labels into strings
		array_labels= array_labels.map(l=> l.toString())
		Object.keys(params_barChart.backgroundColorArray_source).filter(o=> o !== 'category_field').map(k=> { 
			if (array_labels.includes(k)) {
				var i = barChart.data.datasets[0].labels.findIndex(ind=> ind === k)
				barChart.data.datasets[0].backgroundColor[i] = params_barChart.backgroundColorArray_source[k] 
			}; 			 
		});
		barChart.options.plugins.legend.display=false
		barChart.update();
	}

	reset_border_color(this_chart, params_barChart_deepCopy) {
		/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_barChart_deepCopy);*/

		//remettre config sans bordures
		var nb_categories = params_barChart_deepCopy.nb_categories;

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {
			this_chart.config.data.datasets[0].borderColor[i] = "rgba(230, 11, 11, 0)";			
		}
		this_chart.options.plugins.legend.display=false;
		this_chart.update();
	}







	add_options_hover(this_chart, params_barChart_deepCopy) {
			
			// this_chart.config.options.hover = {
	        //         onHover: function(e) {
			this_chart.config.options = {
				onHover: function(e) {
	                     //var point = this_chart.getElementAtEvent(e);
						 var activePoints = this_chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
	                     if (activePoints.length) {
	                        //transformer curseur en pointeur	                     	
							 e.native.target.style.cursor = 'pointer'; 

	                     	//effacer les bordures précédantes
							// this_chart.options.plugins.legend.display=false
	                     	// this_chart.update();

	                        //si survol d'un segment, mettre bordure rouge sur élément survolé
	                        
							activePoints=[]
	                        if (activePoints[0]) {
	                            //relever l'index de l'élément survolé                    	                            
								var idx = activePoints[0].index;
								var datasetIdx = activePoints[0].datasetIndex;

								//collecter la couleur du segment								
								var activePoint_backgroundColor = activePoints[0].element.options.backgroundColor
								
								
								//augmenter l'opacité de la bordure
								activePoints[0].element.options.borderColor = "rgba(230, 11, 11, 1)"
								params_barChart_deepCopy.border_activated = true
								
								//augmenter l'opacité du segment
								if (activePoint_backgroundColor.includes("O.65")) {
									activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1");
								}
					
								activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;


								var label = this_chart.data.labels[activePoints[0].index];
								//this_chart.options.plugins.legend.display=false;
								//this_chart.update(500);

								//test désactivation couleurs segments non selectionnés
								

	                        }

	                     }
	                     else {
	                     	//e.target.style.cursor = 'default';
							 e.native.target.style.cursor = ''; 

	                     	// if (params_barChart_deepCopy.border_activated === true) {
							// 	params_barChart_deepCopy.instanciator.reset_border_color(this_chart, params_barChart_deepCopy)
							// 	params_barChart_deepCopy.border_activated = false
							// }

	                     }
	                }
		}
	}	

	addListeners(ctx, this_chart, params_barChart_deepCopy, _thisClass, sharedParams) {

	            //gestion de la bordure en zone blanche
	            ctx.addEventListener("mousemove", function(evt){params_barChart_deepCopy.instanciator.addListenerMouseover(evt, this_chart, params_barChart_deepCopy)});



	            //collecter le segment cliqué
	            ctx.addEventListener("click", function(evt){

	            	if (evt.ctrlKey) {
	            		return
	            	}

	                var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

					if (evt.detail === 1) {
						params_barChart_deepCopy.timer_dblclick1 = setTimeout(() => {
							console.log('click collecte')

  

		                //when click on slice
			                if (activePoints[0]) {

			                	try {
				                    //var idx = activePoints[0]['_index'];
									var idx = activePoints[0].index;
									//var datasetIdx = activePoints[0]['_datasetIndex'];
									var datasetIdx = activePoints[0].datasetIndex;
									var key_composite = datasetIdx + "-" + idx;

									var categorie = this_chart.data.labels[activePoints[0].index];
									var category_field = params_barChart_deepCopy.category_field;
									
									//case adresses
									params_barChart_deepCopy.current_slice = this_chart.data.labels[activePoints[0].index];
									var slices_are_adresses = (params_barChart_deepCopy.hasOwnProperty('geoRadius') && params_barChart_deepCopy.geoRadius.length>0)

									if (params_barChart_deepCopy.fields_to_decode && params_barChart_deepCopy.fields_to_decode?.constructor == Array && params_barChart_deepCopy.fields_to_decode.map(r=> Object.values(r).includes(category_field)).some(r=> r)) {
										var field_to_decode = params_barChart_deepCopy.fields_to_decode.filter(f => f.mainKey === category_field)[0]
										var category_field_decoded = field_to_decode.fields[0]
										categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][category_field]
									}



									
									//var sous_categorie = activePoints[0]._model.datasetLabel;
									sharedParams.filter_order_origin = "barChart"



									//if clic on the same slice, clean interaction lists & exit
									//case when THE SLICES are adresses									
									if (slices_are_adresses) { 
										//if clic on the same slice on the current hierarchy level, clean lists & quit
										if (params_barChart_deepCopy.current_slice === params_barChart_deepCopy.previous_slice) {
											//fill the brush values with the lat/lng of all adresses
											var lat_field = sharedParams.transformations.latLng_fields.lat;
											var lng_field = sharedParams.transformations.latLng_fields.lng;
								
											var lat_values = Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).map(a=> a.lat_radius)
											var lng_values = Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).map(a=> a.lng_radius)
											params_barChart_deepCopy.brush_keys_values = {[lat_field+'_brushed']: lat_values, [lng_field+'_brushed']: lng_values};
											params_barChart_deepCopy.brush_values = {lat_field: lat_values, lng_field: lng_values};

											if (params_barChart_deepCopy.graphics_to_synchronise) sharedParams.sync_external_charts(params_barChart_deepCopy, sharedParams, "")
											if (params_barChart_deepCopy.graphics_to_filter) sharedParams.filter_external_charts(params_barChart_deepCopy, sharedParams, {})

											return
										}
									}
									//case when the slices are categories
									else if (params_barChart_deepCopy.list_idx_segment_single_selected.includes(idx+"_"+category_field)) {//  && !params_barChart_deepCopy.current_hierarchy['first_in']
										params_barChart_deepCopy.list_labels_segment_single_selected = [];
										params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
										params_barChart_deepCopy.list_labels_segments_multiples_selected = []										
										params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
										params_barChart_deepCopy.brush_keys_values = {};
										params_barChart_deepCopy.brush_values = {};
										
										if (params_barChart_deepCopy.graphics_to_synchronise) sharedParams.sync_external_charts(params_barChart_deepCopy, sharedParams, "")
										if (params_barChart_deepCopy.graphics_to_filter) sharedParams.filter_external_charts(params_barChart_deepCopy, sharedParams, {})
										// params_barChart_deepCopy.active_slices = [];
										//bugy code
											// params_barChart_deepCopy.list_labels_segments_multiples_selected=[{category_field: params_barChart_deepCopy.activ_categories_values}]
											// params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [{[category_field]: params_barChart_deepCopy.activ_categories_values}]
										return
									}

									//if single selection, clean single clics stores & refresh 
									if (evt.ctrlKey === false) {
										//if the bars values are adresses, get the corresponding area in lat/lng
										if (slices_are_adresses) {																					
											var lat_field = sharedParams.transformations.latLng_fields.lat;
											var lng_field = sharedParams.transformations.latLng_fields.lng;
											var cat = this_chart.data.labels[activePoints[0].index];
											var lat_value = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses[cat].lat_radius
											var lng_value = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses[cat].lng_radius
											params_barChart_deepCopy.brush_keys_values = {[lat_field+'_brushed']: [lat_value], [lng_field+'_brushed']: [lng_value]};
											params_barChart_deepCopy.brush_values = {lat_field: lat_value, lng_field: lng_value};
											//reset selected status
											Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).forEach(o=> o['selected'] = false)
											//register selected status for current adress
											sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses[cat]['selected'] = true
											
											if (params_barChart_deepCopy.graphics_to_synchronise) sharedParams.sync_external_charts(params_barChart_deepCopy, sharedParams, this_chart.data.labels[activePoints[0].index])
											if (params_barChart_deepCopy.graphics_to_filter) sharedParams.filter_external_charts(params_barChart_deepCopy, sharedParams, params_barChart_deepCopy.brush_keys_values)
										}

										//case when slices are categories
										else {
											params_barChart_deepCopy.list_idx_segments_multiples_selected = []; params_barChart_deepCopy.list_labels_segments_multiples_selected = []
											params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
											
											params_barChart_deepCopy.list_keys_values_segment_single_selected = []
											params_barChart_deepCopy.list_labels_segment_single_selected = []								
											params_barChart_deepCopy.brush_keys_values = {};
											params_barChart_deepCopy.brush_values = {};

											params_barChart_deepCopy.list_labels_segment_single_selected.push({category_field: categorie});
											params_barChart_deepCopy.list_keys_values_segment_single_selected.push({[category_field] : [categorie]});
											
											if (params_barChart_deepCopy.graphics_to_synchronise) sharedParams.sync_external_charts(params_barChart_deepCopy, sharedParams, this_chart.data.labels[activePoints[0].index])
											if (params_barChart_deepCopy.graphics_to_filter) sharedParams.filter_external_charts(params_barChart_deepCopy, sharedParams, {[category_field]: [categorie]})
										}
										

						
									}
						
					                console.log("labels collectés:"); console.log(params_barChart_deepCopy.list_labels_segment_single_selected); /*console.log("valeur: " + value)*/			                  
				                }

				                catch {
				                	console.log("segment non detecté, clic à l'exterieur du graph")
				                	//observableSlim
				                	/*p.changeBar1 = false;*/
				                	//vider la liste puisqu'on ne sélectionne plus aucun segment
									//vider liste des segments selectionnés

									params_barChart_deepCopy.list_idx_segment_single_selected = [];
									params_barChart_deepCopy.list_labels_segment_single_selected = [];
									params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
									params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
									params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
									params_barChart_deepCopy.active_slices = []

									//if the bars values are adresses, get the corresponding area in lat/lng
									if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length>0) {
										params_barChart_deepCopy.brush_keys_values = {};
										params_barChart_deepCopy.brush_values = {};
										//reset selected status
										Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).forEach(o=> o['selected'] = false)
									}

				                }    
			                } 
			                //when click outside of slices (on empty space), jump to previous hierarchy
			                else if (params_barChart_deepCopy.previous_hierarchy) {

			                	params_barChart_deepCopy.funcLib.restore_previous_hierarchy(params_barChart_deepCopy, sharedParams)


			                }

		                }, 300)
	            	}      

	            });


	            //gestion d'un clic unique sur un segment (pour désactiver les couleurs des segments non selectionnés)
	            ctx.addEventListener("click", function(evt){
	            	
	            	if (evt.ctrlKey) {
	            		return
	            	}
	            	
	                var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

					if (evt.detail === 1) {
						params_barChart_deepCopy.timer_dblclick2 = setTimeout(() => {


			                //si le clic est fait sur un des segments
			                if (activePoints[0]) {
			                	//var idx = activePoints[0]['_index'];
								var idx = activePoints[0].index;
			                    //1.collect color of the slice
								//var categorie = this_chart.data.labels[activePoints[0].index];
								var categorie = this_chart.data.labels[activePoints[0].index]
								var category_field = params_barChart_deepCopy.category_field;

								//case adresses
								params_barChart_deepCopy.current_slice = this_chart.data.labels[activePoints[0].index];
								var slices_are_adresses = (params_barChart_deepCopy.hasOwnProperty('geoRadius') && params_barChart_deepCopy.geoRadius.length>0)

								var activePoint_backgroundColor = params_barChart_deepCopy.backgroundColorArray_source[categorie]
								//augmenter l'opacité du segment
								if (activePoint_backgroundColor) {
									if (activePoint_backgroundColor.includes("O.65")) {
										activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1");
									}
															
								}

								//old code
								// if (params_barChart_deepCopy.fields_to_decode && params_barChart_deepCopy.fields_to_decode.mainKey === params_barChart_deepCopy.category_field) {
								// 	var category_field_decoded = params_barChart_deepCopy.fields_to_decode.fields[0]
								// 	categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_barChart_deepCopy.category_field]
								// }

								if (params_barChart_deepCopy.fields_to_decode && params_barChart_deepCopy.fields_to_decode?.constructor == Array && params_barChart_deepCopy.fields_to_decode.map(r=> Object.values(r).includes(category_field)).some(r=> r)) {
									var field_to_decode = params_barChart_deepCopy.fields_to_decode.filter(f => f.mainKey === category_field)[0]
									var category_field_decoded = field_to_decode.fields[0]
									categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][category_field]
								}						

								/*else {
									var backgroundColor_array = Object.values(params_barChart_deepCopy.backgroundColorArray_source)
									activePoint_backgroundColor = backgroundColor_array[parseInt(Math.random() * backgroundColor_array.length)].replace("0.65", "1")
								}*/

									


			                	//2.remettre les couleurs d'origine sur tous les segments
				                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);



								//if clic on the same slice, on the same hierarchy level, exit
								//case when the slices are adresses
								if (slices_are_adresses) {
									if (params_barChart_deepCopy.current_slice === params_barChart_deepCopy.previous_slice) {
										params_barChart_deepCopy.active_slices = [];

										// params_barChart_deepCopy.brush_keys_values = {};
										// params_barChart_deepCopy.brush_values = {};	
										//reset selected status
										Object.values(sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses).forEach(o=> o['selected'] = false)
										params_barChart_deepCopy.previous_slice = undefined
										return
									}
								}
				                //case when the slices are categories
								else if ((params_barChart_deepCopy.list_idx_segment_single_selected.includes(idx+"_"+category_field) || params_barChart_deepCopy.list_idx_segments_multiples_selected.includes(idx+"_"+category_field))) {//&& !params_barChart_deepCopy.current_hierarchy['first_in']
									params_barChart_deepCopy.list_idx_segment_single_selected = [];
									params_barChart_deepCopy.active_slices = [];
									return
								}





								//controler que shift n'a pas été appuyé pour éviter des push multiples
								if (evt.ctrlKey === false) {
									//if the slices are adresses
									if (slices_are_adresses && params_barChart_deepCopy.current_slice !== params_barChart_deepCopy.previous_slice) {
										params_barChart_deepCopy.previous_slice = this_chart.data.labels[activePoints[0].index];
									}
									else {
										params_barChart_deepCopy.list_idx_segment_single_selected = [];
										params_barChart_deepCopy.list_idx_segment_single_selected.push(idx+"_"+category_field);
									}
									params_barChart_deepCopy.active_slices = [];
									params_barChart_deepCopy.active_slices.push({category_field: categorie, backgroundColor: activePoint_backgroundColor, 
										index: idx})
			    	            }



								
								/*console.log("idx: " + idx); console.log("datasetIdx: " + datasetIdx); console.log("id dataset: + key_composite")*/
			                    var chartData = params_barChart_deepCopy.chart_instance.data;

			                    //parcourir toutes les barres pour les mettre en gris sauf celle cliquée
			                    var nb_categories = params_barChart_deepCopy.nb_categories;
			    
			                        for (var i = 0; i < (nb_categories); i++) {
			                            //si la categorie parcourue n'est pas la catégorie active

			                            		//si on entre dans un segment différent du segment actif, griser la couleur du segment
			                            		if (idx !== i) {
				                            	//la couleur de fond se désactive ainsi pour le 1er segment: bar1.config.data.datasets[0].backgroundColor[0] = 'rgba(194, 194, 194, 1)'
				                            		this_chart.config.data.datasets[0].backgroundColor[i] = "rgba(240, 240, 240, 0.5)";
				                                
				                            	}
												else {
													//collecter la couleur du segment											
													

													//activePoints[0]._model.backgroundColor = activePoint_backgroundColor;
													activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;
													this_chart.config.data.datasets[0].backgroundColor[i] = activePoint_backgroundColor;				

												}

			                            	}                            	

			                        //save the colors of the filtred state
									var backgroundColor_array = [];
									for (var i = 0; i < this_chart.config.data.datasets.length; i++) {
										backgroundColor_array.push(this_chart.config.data.datasets[i].backgroundColor)
									};
									params_barChart_deepCopy.backgroundColor_array_ClickedState = backgroundColor_array;
									this_chart.options.plugins.legend.display=false;
			                        this_chart.update()                    

			                }

			                //remettre les couleurs d'origine lors d'un clic à l'extérieur des barres
			                else {

			                	/*params_barChart_deepCopy.prepare_data_type = "";
			                    params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);
								//vider liste des segments selectionnés
								
								
								params_barChart_deepCopy.list_idx_segments_multiples_selected = [];
								params_barChart_deepCopy.list_labels_segments_multiples_selected = [];												
								params_barChart_deepCopy.list_idx_segment_single_selected = [];
								params_barChart_deepCopy.list_labels_segment_single_selected = [];
								params_barChart_deepCopy.list_keys_values_segment_single_selected = [];						
								params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
								params_barChart_deepCopy.active_slices = []*/
			                }

			            	console.log('click color')
						}, 300)    
		            }
	            })





	            //rés-activer les couleurs de tous les segments
	            ctx.addEventListener("dblclick", function(evt){
	            	if (!params_barChart_deepCopy.hierarchy_levels) {
	            		console.log('there is no hierarchy for this chart')
	            		return
	            	}
	            	var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)
	            	if (activePoints[0]) {

						clearTimeout(params_barChart_deepCopy.timer_dblclick1)
						clearTimeout(params_barChart_deepCopy.timer_dblclick2)
						console.log('dblclick')	            		
						var source_event = 'dblclick'
						params_barChart_deepCopy.funcLib.save_root_hierarchy(params_barChart_deepCopy, sharedParams);
						params_barChart_deepCopy.funcLib.access_next_hierarchy(params_barChart_deepCopy, sharedParams, source_event, evt);
						


					}
	            });
	     


		      /*gestion d'un clic + shift sur plusiers segments (pour désactiver les couleurs des segments non selectionnés)*/
		      ctx.addEventListener("click",
		        function(e) {
		          //var activePoints = this_chart.getElementAtEvent(e);
				  var activePoints = this_chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
		          if (e.ctrlKey && activePoints) {
		                    console.log("ctrl, yay!");
							//1.collect the backgroundcolor of the slice
							//var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
							var activePoint_backgroundColor = activePoints[0].element.options.backgroundColor;
							//augmenter l'opacité du segment
							if (activePoint_backgroundColor.includes("O.65")) {
								activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1");
							}
				

		                	//2.remettre les couleurs d'origine sur tous les segments
			                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);
		                    
		                    //var idx = activePoints[0]['_index'];
							var idx = activePoints[0].index
							
							var categorie = this_chart.data.labels[activePoints[0].index];
							var category_field = params_barChart_deepCopy.category_field;


							//old code
							// if (params_barChart_deepCopy.fields_to_decode) {
							// 	var category_field_decoded = params_barChart_deepCopy.fields_to_decode.fields[0]
							// 	categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_barChart_deepCopy.category_field]
							// }

							if (params_barChart_deepCopy.fields_to_decode && params_barChart_deepCopy.fields_to_decode?.constructor == Array && params_barChart_deepCopy.fields_to_decode.map(r=> Object.values(r).includes(category_field)).some(r=> r)) {
								var field_to_decode = params_barChart_deepCopy.fields_to_decode.filter(f => f.mainKey === category_field)[0]
								var category_field_decoded = field_to_decode.fields[0]
								categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][category_field]
							}							




							var list_idx_segments_existants = params_barChart_deepCopy.list_idx_segments_existants




							//refresh the lists fed by clic+shift
							//1.if the slice selected is not in the current lists, push it
							var pos_slice = params_barChart_deepCopy.list_idx_segments_multiples_selected.indexOf(idx);
							if (pos_slice === -1) {
								//inject previous selected slices
								params_barChart_deepCopy.list_idx_segments_multiples_selected.push(params_barChart_deepCopy.list_idx_segment_single_selected[0]+"_"+category_field)
			                    //var categories = [categorie]; categories.push(params_barChart_deepCopy.list_labels_segment_single_selected[0]['category_field'])
			                    var categories = params_barChart_deepCopy.active_slices.map(s=> s.category_field); categories.push(categorie)
			                    

								//register the selected slices
			                    params_barChart_deepCopy.list_idx_segments_multiples_selected.push(idx+"_"+category_field);
			                    params_barChart_deepCopy.list_labels_segments_multiples_selected = [{"category_field": categories}]
			                    params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [{[category_field] : [categories]}];
								//register in the params_chart the active category & it's background color
								params_barChart_deepCopy.active_slices.push({category_field: categorie, backgroundColor: activePoint_backgroundColor, index: idx});

								//vider les listes alimentées par un clic unique
								params_barChart_deepCopy.list_idx_segment_single_selected = []; params_barChart_deepCopy.list_labels_segment_single_selected = [];
								params_barChart_deepCopy.id_previous_singleSelect = "";

							}
							//2.delete selected slice from the diffent arrays
							else {
								params_barChart_deepCopy.list_idx_segments_multiples_selected.splice(pos_slice, 1)

								//var index_cat = params_barChart_deepCopy.list_labels_segments_multiples_selected.findIndex(x => x.category_field === categorie);
								//params_barChart_deepCopy.list_labels_segments_multiples_selected.splice(index_cat, 1)
								var index_cat = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.findIndex(x => x === categorie);
								params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.splice(index_cat, 1)
								

								var index_cat = params_barChart_deepCopy.active_slices.findIndex(x => x.category_field === categorie);
								params_barChart_deepCopy.active_slices.splice(index_cat, 1)
	
								//vider les listes alimentées par un clic unique
								params_barChart_deepCopy.list_idx_segment_single_selected = []; params_barChart_deepCopy.list_labels_segment_single_selected = [];

							}





		                    //observableSlim
		                    /*p.changeBar1 = false;*/
		                    var chartData = params_barChart_deepCopy.chart_instance.data;
		             

		                    //parcourir toutes les barres pour les mettre en gris sauf celles cliquées
		                    var nb_segments_existants = params_barChart_deepCopy.list_idx_segments_existants.length;
		                    var nb_categories = params_barChart_deepCopy.nb_categories;							


							//v2
							//var activ_categories_values = params_barChart_deepCopy.active_slices.map(o=> o.category_field)
							//turn all slices into rgba(194, 194, 194, 1) color
		                    var nb_segments_existants = this_chart.data.labels.length
		                    var activ_idx_values = params_barChart_deepCopy.active_slices.map(o=> o.index)
		                    for (var i = 0; i < (nb_segments_existants); i++) {
		                    	var segment_courant = i

		                    	//si le segment courant n'est pas actif, le griser
		                    	if (activ_idx_values.indexOf(i) === -1) {
		                    		this_chart.data.datasets[0].backgroundColor[i] = "rgba(240, 240, 240, 0.5)";
		                    	}
		                    	//sinon récupérer la couleur de l'index actif et l'affecter à l'index courant
		                    	else {
		                    		// var bckg_color_activSlice = params_barChart_deepCopy.active_slices.filter(o=> o.index === i)[0].backgroundColor;
		                    		// this_chart.data.datasets[0].backgroundColor[i] = bckg_color_activSlice;
		                    	}
		                    }
							//set bckg color for activated slices
							this_chart.options.plugins.legend.display=false;
		                    this_chart.update();
		            }

		        },false)


	}

	addListenerMouseover(evt, this_chart, params_barChart_deepCopy){
        //var activePoints = this_chart.getElementAtEvent(evt);
		var activePoints = this_chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)

        if (activePoints[0]) {
			evt.target.style.cursor='pointer'

			//collecter la couleur du segment								
			var activePoint_backgroundColor = activePoints[0].element.options.backgroundColor
			
			
			//augmenter l'opacité de la bordure
			activePoints[0].element.options.borderColor = "rgba(230, 11, 11, 1)"
			params_barChart_deepCopy.border_activated = true
			
			//augmenter l'opacité du segment
			if (activePoint_backgroundColor?.includes("O.65")) {
				activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1");
			}
			
			activePoints[0].element.options.backgroundColor = activePoint_backgroundColor;

			params_barChart_deepCopy.chart_instance.update()

        }
        else {
			evt.target.style.cursor=''			
        }        

    }	

	



}



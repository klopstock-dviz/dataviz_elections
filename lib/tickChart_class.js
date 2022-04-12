class Tick_chart {

	constructor(params_chart) {
		this.id = params_chart.id
		this.ctx = params_chart.ctx	    
	    this.numerical_field = params_chart.numerical_field_params
	    this.label_tooltip = params_chart.label_tooltip
		this.type = params_chart.type
	    this.responsive = true
	    this.title = params_chart.title
	}

	createChart(params_chart, sharedParams) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

		params_chart.instanciator = this
		params_chart.sharedParams = sharedParams

		this.setup_funcLib(params_chart, sharedParams)
		
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		//this.create_parent_container(params_chart)
		
		//render the chart when the parent container is visible
		let monitor_parent_display = setInterval(() => {
					
			var check_chart_parent_display = check_parent_display(params_chart)
			if (check_chart_parent_display.chart_display_on) {
				//build parent container
				sharedParams.create_parent_container(params_chart, sharedParams)
				sharedParams.create_continuous_brush_controls(params_chart)
				var chart_instance = this.init_chart(params_chart, sharedParams)
				this.inject_metadata(params_chart, sharedParams)
				if (params_chart.brush_mode) {
					sharedParams.create_continuous_brush_windows(params_chart)
				}
				params_chart.funcLib.display_tooltips(params_chart)
				clearInterval(monitor_parent_display)
			}
		}, 500)
		//}
		
		// if (params_chart.interactions_chart_options.hoverOptions === true) {				
		// 	this.add_options_hover(chart_instance, params_chart) }
		if (params_chart.interactions_chart_options.selectionOptions === true) {
			//params_chart.instanciator.addListeners(params_chart.ctx, params_chart.chart_instance, params_chart)
		}



		//register the instanciator		
		params_chart.chart_type = "d3"
		params_chart.chart_sub_type = "tick"
		


	}

	updateChart(params_chart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		var data_type = "data"; var injection_type = "update"
		this.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type)

	}


	prepare_data_p1(params_chart, sharedParams) {

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

			filterList = filterList.filter(l=> l.field !== "")			
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
			//var dataset_grouped = groupData(data_filtred, params_chart)
            
			//data_filtred = data_filtred.map(r=> {return {[params_chart.numerical_field_params.fieldName]: r[params_chart.numerical_field_params.fieldName]} })
			data_filtred = select_required_fields(params_chart, data_filtred)
			return data_filtred
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


						//var dataset_grouped = groupData(dataset_filtred, params_chart)						

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

						//params_chart.data_promise = dataset_grouped
                        //data_filtred = data_filtred.map(r=> {return {[params_chart.numerical_field_params.fieldName]: r[params_chart.numerical_field_params.fieldName]} })
						dataset_filtred = select_required_fields(params_chart, dataset_filtred)
						return dataset_filtred
					}
				}
			}
		}		


		function select_required_fields(params_chart, data_chart) {
			var tooltip_fields = []; params_chart.tooltip_fields?.forEach(o => tooltip_fields.push(o["field"]));
			var fields = []; Object.assign(fields, tooltip_fields); 
			fields.push(params_chart.numerical_field_params.fieldName);
			var dataset = [...data_chart.map(l=> _.pick(l, fields))]
			return dataset
		}



	}




	prepare_data_p2(data_input, params_chart, sharedParams) {
		/*processus de création d'un nouveau dataset: 
		params_chart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
		*/			
			var categories, categories_source, category_field
			params_chart.nb_axis = 1
			params_chart.legends_field = this.category_field
			params_chart.active_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.active_legends[params_chart.legends_field] = [];
			params_chart.hidden_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.hidden_legends[params_chart.legends_field] = [];
			if (this.category_field) {
                categories_source = data_input.map(r=> r[this.category_field])
			    if (params_chart.list_of_axis.length === 0) {params_chart.list_of_axis.push(this.category_field)}
            }

			
			//1.obtenir les catégories (les communes par ex)

			//if we have fields to decode
                // if (params_chart.fields_to_decode) {
                //     //if the fields_to_decode is encapsulated into an array, put it into an object
                //     if (params_chart.fields_to_decode?.constructor == Array ) {
                //         params_chart.fields_to_decode = params_chart.fields_to_decode[0]
                //     }
                //     if (params_chart.fields_to_decode?.constructor == Object ) {
                //         var lookupTable = params_chart.fields_to_decode.lookupTable;
                //         var mainKey = params_chart.fields_to_decode.mainKey;
                //         var lookupKey = params_chart.fields_to_decode.lookupKey
                //         var fields = params_chart.fields_to_decode.fields
                                                
                //         params_chart.fields_to_decode.fields.forEach(f=> {
                //             var res = []
                //             data_input.map(r=> {res.push(r.hasOwnProperty(f))})
                //             if (res.filter(r=> !r).length > 0) {
                //                 join_v2(data_input, lookupTable, mainKey, lookupKey, fields)						
                //                 res = []
                //                 //1.obtenir les catégories (les communes par ex)
                //                 categories = data_input.map(r=> r[f])
                //                 category_field = f
                //                 params_chart.data_input = data_input

                //             }
                //         }) 
                //     }
                // }
                // else {
                //     //1.obtenir les catégories (les communes par ex)
                //     categories = data_input.map(r=> r[this.category_field])
                //     category_field = this.category_field
                // }


			//sort data
                // sort_dataset(params_chart)			
                // function sort_dataset(params_chart) {
                //     if (params_chart.sort && params_chart.sort.fieldName && params_chart.sort.order) {
                //         if (['asc', 'desc'].includes(params_chart.sort.order)) {
                //             if (params_chart.sort.fieldName === params_chart.numerical_field_params.fieldName) {
                //                 var key = params_chart.numerical_field_params.agg_type + "_" + params_chart.sort.fieldName
                //             }
                //             else {
                //                 var key = params_chart.sort.fieldName
                //             }
                //             data_input.sort(trier(key, params_chart.sort.order))
                //         }
                //     }
                // }

			// var nb_categories = categories.length; 
			// params_chart.nb_categories = categories.length;	        

			//2.création des catégories dans la spec ChartJS (champ labels dans chartJS)
			//params_chart.data[0].labels.push(categories)
			params_chart.data_input = data_input		

	        
	        //params_chart.activ_categories_values = [...categories_source]; //params_chart.activ_categories_values.push(categories)

			//2.2.reset the existing labels & datasets in the param array & the config chart JS instance 
			params_chart.data[0].labels = []; params_chart.data[1].datasets = [];


            //4.créer un array borderColor et borderWidth égal à nb_sous_categories
            var borderColorArray = []; 
            var borderWidthArray = [];
            //changements pour passer au simple bar chart -> remplacer nb_sous_categories par nb_categories, pour avoir autant de couleurs que de barres
            

			/*guide création des sous-catégories dans la spec ChartJS
			params_chart.data[1].datasets.push({"label":data_group[i]['nb_pieces'], backgroundColor: 'red', data: [39889, 19889, 14889]})*/
	        
			//changements pour passer au simple bar chart
			//if we initialize the backgroundColorArray for the first time, make a random select from the repository of colors        
			// if (Object.keys(params_chart.backgroundColorArray_source).length === 0) {
        	// 	var i = 0
        	// 	function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}
			// 	var status_colors = "empty"	            	       

     		// 	if (sharedParams.registed_colors.hasOwnProperty(category_field)) {
     		// 		params_chart.backgroundColorArray_source = {...sharedParams.registed_colors[category_field]}
     		// 	}
     		// 	else {
     		// 		var backgroundColorArray_source = generateColors(nb_categories, params_chart.colorsConfig.scheme, params_chart.colorsConfig.colorsOrder, category_field, sharedParams)
			// 		categories.forEach(axis => {
			// 			params_chart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
			// 			i++
						
			// 		})
     		// 	}	     
			// }

			// if (!sharedParams.registed_colors.hasOwnProperty(params_chart.category_field)) {
			// 	sharedParams.registed_colors[category_field] = {...params_chart.backgroundColorArray_source}
			// }

            if (!params_chart.colorArray_source) {
                params_chart.colorArray_source = generateColors(1, params_chart.colorsConfig.scheme, params_chart.colorsConfig.colorsOrder, "category_field", sharedParams)
            }



			//créer les datasets composés des categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			var data_array = []; var colorArray = []; 			
            var nb_categories = 1
            let numerical_field = params_chart.numerical_field_params.fieldName;
            let data_input_length = data_input.length    
	        for (var i = 0; i < data_input_length; i++) {

	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	            //2.2.récupérer l'array contenant les data	            
	            data_array.push(data_input[i]);

	            //3.construie l'array contenant les couleurs des barres
		        colorArray.push(params_chart.colorArray_source[0])

	        };




            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
            params_chart.data[1].datasets.push({label: this.label_tooltip, color: colorArray, data: data_array})


		//.sauvegarder une image des données source avant transformation
		if (params_chart.data_source_raw.length === 0) {
			params_chart.data_source_raw = data_input
			//params_chart.data_source[0].labels.push(categories)
	        params_chart.data_source[1].datasets = params_chart.data[1].datasets
	        //params_chart.list_keys_values_source = {[params_chart.category_field]: categories_source}

	    }		

	}


    updateAxis(params_chart){		
		if (!params_chart.xScale) return
		//update the scale		
		var dataset_domain = [0, d3.max(params_chart.data[1].datasets[0].data, (d) => d[params_chart.numerical_field_params.fieldName])]		
		params_chart.xScale.domain(dataset_domain).range([0, params_chart.canvasWidth]).nice()        

		
	
		
		//update the axis
		params_chart.xAxis.scale(params_chart.xScale);
		

		d3.select("#xAxis_"+params_chart.id)
          .transition(1000).delay(100)
          .call(params_chart.xAxis)
	}

    init_chart(params_chart) {
        //build d3 svg container, axis & scales
			const margin = { top: 5, right: 15, bottom: 20, left: 70 };
			const outerWidth = params_chart.style.chart_width || 450;
			const outerHeight = params_chart.style.chart_height || 100;
			const width = outerWidth - margin.left - margin.right;
			const height = outerHeight - margin.top - margin.bottom;
			params_chart.margin = margin
			params_chart.canvasWidth = width
			params_chart.canvasHeight = height

		//add specific styles to the parent container		
        const container = d3.select(`#${params_chart.htmlNode}`);
		container.attr("style", `margin: auto; width: ${outerWidth}; height: outerHeight`)


        // Init SVG
		let svgHeight
		if (params_chart.title_x_axis.constructor == String) {
			svgHeight= outerHeight+12//12px as height of x axis label
		}
		else if (params_chart.title_x_axis.constructor == Array) {
			svgHeight= outerHeight+(12*params_chart.title_x_axis.length)//12px as height of x axis label
		}
		
        const svgChart = container.append('svg:svg')
            .attr('width', outerWidth)
            .attr('height', svgHeight+margin.bottom)
            .attr('id', `svg_tickChart_${params_chart.htmlNode}`)
			.style('position', 'absolute')
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Init Canvas
        const canvasChart = container.append('canvas')
            .attr('width', width)
            .attr('height', height)
            .attr('id', `canvas_tickChart_${params_chart.htmlNode}`)
            .style('margin-left', margin.left + 'px')
            .style('margin-top', margin.top + 'px')
			.style('position', 'absolute');


        

        // Init Scales
		let max_value_dataset = d3.max(params_chart.data[1].datasets[0].data, (d) => d[params_chart.numerical_field_params.fieldName])
        const xScale = d3.scaleLinear().domain([0, max_value_dataset]).range([0, width]).nice();
        params_chart.xScale = xScale

		// const xScale_reverse= d3.scaleLinear().domain([0, params_chart.canvasWidth]).range([0, max_value_dataset]).nice()
		// params_chart.xScale_reverse= xScale_reverse
        

        // Init Axis
        const xAxis = d3.axisBottom(xScale);
        //const yAxis = d3.axisLeft(yScale);

        // Add Axis
        const gxAxis = svgChart.append('g')
            .attr('transform', `translate(0, ${height})`)
			.attr('id', 'xAxis_'+params_chart.id)
            .call(xAxis);

		params_chart.xAxis = xAxis

        // const gyAxis = svgChart.append('g')
        //     .call(yAxis);

        // Add labels
        if (params_chart.title_x_axis.constructor == String) {
			append_axisX_label(params_chart, svgChart, params_chart.title_x_axis,0, 40)
		}
		else if (params_chart.title_x_axis.constructor == Array) {
			let pos_item=0, pos_y=40, text;
			params_chart.title_x_axis.forEach(text=> {
				text = params_chart.title_x_axis[pos_item]
				append_axisX_label(params_chart, svgChart, text, pos_item, pos_y)
				pos_item++
				pos_y+=15
			})
		}
		function append_axisX_label(params_chart, svgChart, text,pos_item, pos_y) {
			svgChart.append('text')
				.attr('x', 0)
				.attr('y', `${height + pos_y}`)
				.attr('id', 'xAxis_label_'+pos_item+'_'+params_chart.id)
	            .text(text)
				.style("fill", 'rgb(102, 102, 102)')
				.style("font-size", '12px');

			let xAxisLabel_width=document.getElementById('xAxis_label_'+pos_item+'_'+params_chart.id).clientWidth
			let xAxisLabel_margin=(width-xAxisLabel_width)/2
			d3.select('#xAxis_label_'+pos_item+'_'+params_chart.id)
				.attr('x',xAxisLabel_margin)	
		}


		//adjust containers height
		let general_container = document.getElementById('general_container_'+params_chart.id)
		general_container.style.height= svgHeight+margin.bottom


    }




    



    inject_metadata(params_chart) {
		if (params_chart.injection_type === 'update') this.updateAxis(params_chart)

        params_chart.ticks_objects = []; 
		const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
		const context = canvas.getContext('2d');

		
        
        let numerical_field = params_chart.numerical_field_params.fieldName;
        let dataset_length = params_chart.data[1].datasets[0].data.length
        for (let i = 0; i < dataset_length; i++) {
            let x_origin = 0//Math.floor(Math.random() * 30);
            let x_target = params_chart.xScale(params_chart.data[1].datasets[0].data[i][numerical_field]);			
            let y_top = 0//params_chart.margin.top;
            let y_bottom = params_chart.canvasHeight;
            let tickColor = params_chart.data[1].datasets[0].color[i];
			let tooltips = params_chart.data[1].datasets[0].data[i]
			let tick = params_chart.funcLib.createTick(i, x_origin, x_target, y_top, y_bottom, tickColor, tooltips,context)
            params_chart.ticks_objects.push(tick);
        }

        params_chart.trigger_redraw_status=[], params_chart.ticks_drawn=[]
        params_chart.requestAnim_holder=""
		

        setTimeout(() => {
            this.Update(params_chart, {ease_method: params_chart.animation_params.ease_function, speed: params_chart.animation_params.speed})
        }, 300);
    }





	Update (params_chart, update_args) {        
		function request_redraw() {
			const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
			const context = canvas.getContext('2d');

			if (update_args && update_args.constructor == Object) params_chart.update_args = {...update_args}
			if (params_chart.trigger_redraw_status.length === 0) {
				context.clearRect(0, 0, params_chart.canvasWidth, params_chart.canvasHeight);
			}
			
			for (let i = 0; i < params_chart.ticks_objects.length; i++) {
				let tick = params_chart.ticks_objects[i];     					
					tick.animate(params_chart.update_args);
					params_chart.trigger_redraw_status.push(tick.redraw)
			}
			
			if (params_chart.trigger_redraw_status.some(e=> e)) {            
				params_chart.trigger_redraw_status=[];
				params_chart.ticks_drawn=[]
				params_chart.requestAnim_holder = requestAnimationFrame(request_redraw);
			}
			else if (params_chart.trigger_redraw_status.every(e=> !e)) {
				//trigger a last draw to ensure each tick is painted
				context.clearRect(0, 0, params_chart.canvasWidth, params_chart.canvasHeight);
				params_chart.ticks_objects.forEach(t=> {
					t.draw(t.x_target)
				})

				cancelAnimationFrame(params_chart.requestAnim_holder)
				return
			}
		}
		request_redraw()
	}

    setup_funcLib(params_chart) {
        //params_chart.funcLib.createTick = function(point_id, x_origin, x_target, y_top, y_bottom, x_tooltip_intercept, yStart_tooltip_intercept, yEnd_tooltip_intercept, canvasX, canvasY, color, context) {
		params_chart.funcLib.createTick = function(point_id, x_origin, x_target, y_top, y_bottom, color, tooltips, context) {
  
			let tick_object={}
			tick_object.point_id = point_id
			tick_object.x_origin = x_origin
			tick_object.x_current = x_origin
			tick_object.x_target = x_target
			tick_object.y_top = y_top
			tick_object.y_bottom = y_bottom
			tick_object.tooltips = tooltips
			tick_object.color = color
			tick_object.redraw = true
			tick_object.final_redraw = false

			tick_object.dx = 6
			tick_object.dy = 6
		

			tick_object.draw = function (x, color) {
				context.beginPath()
				// Staring point
				context.moveTo(x, tick_object.y_top)
				// End point
				context.lineTo(x+1, tick_object.y_bottom)
				//color 
				var colorStroke
				if (color) {
					colorStroke = color
				}
				else {
					colorStroke = tick_object.color
				}
				context.strokeStyle = colorStroke
				// Make the line visible
				context.stroke()
			}

			tick_object.animate = function (update_args) {
				let ease_method, speed, color
				if (update_args) {
					ease_method = update_args.ease_method
					speed = update_args.speed
					color = update_args.color
				}

				if (tick_object.x_current < tick_object.x_target || tick_object.final_redraw) {
					//increment position only if the tock hasn't reached its target postition
					if (!tick_object.final_redraw) {
						tick_object.x_current += speed || tick_object.dx
						if (!ease_method)
							ease_method = 'easeInQuad'
						var pos = ease_functions[ease_method](tick_object.x_current / tick_object.x_target, tick_object.x_origin, tick_object.x_target, 1)
						tick_object.redraw = true
						tick_object.draw(pos, color)
						params_chart.ticks_drawn.push(tick_object)
					}
					else {
						tick_object.redraw = false
						tick_object.draw(tick_object.x_target, color)
						params_chart.ticks_drawn.push(tick_object)
					}


					//tick_object.y += tick_object.dy;
				}
				else if (tick_object.x_current >= tick_object.x_target) {
					//tick_object.x_origin = -tick_object.dx;
					tick_object.redraw = false
					tick_object.final_redraw = true
				}
			}
			return tick_object                    
    	}

		params_chart.funcLib.display_tooltips = function(params_chart) {			
			const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
			canvas.addEventListener('mousemove', (evt)=> {
				const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
				const canvasBBox = canvas.getBoundingClientRect()
	
				let yStart_tooltip_intercept = canvasBBox.y;
				let yEnd_tooltip_intercept = canvasBBox.y + params_chart.canvasHeight;
				// let canvasX = canvasBBox.x;
				// let canvasY = canvasBBox.y;
				let mouseX = evt.x;
				let mouseY = evt.y;
				params_chart.mouseX = mouseX;
				params_chart.mouseY = mouseY;
				
				//find corresponding ticks
				let ticks_objects_lenght = params_chart.ticks_objects.length
				for (let index = 0; index < ticks_objects_lenght; index++) {
					const tick = params_chart.ticks_objects[index];
					let tick_x_target =tick.x_target+canvasBBox.x//+params_chart.margin.left
					if ((mouseX >= tick_x_target-2 && mouseX <= tick_x_target+2) && (mouseY >= yStart_tooltip_intercept && mouseY <= yEnd_tooltip_intercept)) {
						Object.keys(tick.tooltips).forEach(k=> {
							let alias = params_chart.tooltip_fields.find(o=> o.field === k)?.alias;
							if (alias) {
								tick.tooltips[alias] = tick.tooltips[k];
								delete tick.tooltips[k];
							}
						})						
						params_chart.sharedParams.create_standard_tooltip(params_chart, tick.tooltips, mouseX, mouseY)
						return
					}					
				}
				if (params_chart.tooltip_container)	params_chart.tooltip_container.style.display = 'none'
			})
		}



		params_chart.funcLib.activate_brush_highlight = function (params_chart,s) {
			const brushed_ticks=params_chart.ticks_objects.filter(t=> t.x_target >= s[0] && t.x_target <= s[1]);
			const brush_field = params_chart.numerical_field_params.fieldName;
			const min_value_brushed = d3.min(brushed_ticks, d=> d.tooltips[brush_field]);
			const max_value_brushed = d3.max(brushed_ticks, d=> d.tooltips[brush_field]);

			if (!min_value_brushed || !max_value_brushed) {
				return
			}

			const brush_values = {x1: min_value_brushed, x2: max_value_brushed}
			params_chart.brush_highlight_values = brush_values

			//translate brush values coordinates into store format
			params_chart.sharedParams.filter_order_origin = "tick_brush_highlight"
			params_chart.brush_highlight_keys_values = {}
			params_chart.brush_highlight_keys_values[brush_field + "_brushed"] = [min_value_brushed.toString()+"_"+max_value_brushed.toString()];
			

			//console.log("brush_Event highlight s: "+s); console.log(params_chart.brush_highlight_keys_values)
			params_chart.sharedParams.interaction_events[params_chart.id].brushed = true

			//highlight data points in the target charts (scatters/bubble charts and maps)
			params_chart.highlight_charts?.forEach(chart_id=> {				
				//get params chart instance
				let params_chart_target = params_chart.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
				
				if (params_chart_target) {
					params_chart_target.highlighted_polys = [];
					params_chart_target.highlighted_points = [];
		
					//let brush_intervals = get_brush_intervals(params_chart, params_chart_target);
					if (params_chart_target.chart_sub_type === 'scatter' || params_chart_target.chart_sub_type === 'bubble') {
						//console.time('total time highlight scatter')
						params_chart_target.highlighted_points = []
						//console.time('time loop highlight scatter')
						params_chart_target.chart_instance.data.datasets.forEach(dataset=> {
							var label = dataset.label;
							if (label !== "") {
								if (params_chart_target.category_field) {
									backgroundColorArray = (params_chart_target.backgroundColorArray_source[label]+"|").repeat(dset.data.length).split("|").filter(e=> e !== ',' && e !== '')
								}
								else {backgroundColorArray = params_chart_target.backgroundColorArray_source[`${params_chart.id}_no_axis`]}
								dataset.backgroundColor = backgroundColorArray
							}
						})						
						params_chart_target.chart_instance.update(0)
					}
					else if (params_chart_target.chart_sub_type === 'map') {
						params_chart_target.featureGroup.eachLayer(l=> {
							if ((l.options.dataset[brush_field] >= min_value_brushed && l.options.dataset[brush_field] <= max_value_brushed)) {
								l.setStyle({'fillColor': l.options.original_color});
								l.setStyle({'color': l.options.original_color});
								l.bringToFront()
								params_chart_target.highlighted_points.push(l.options.dataset)																	
							}
							else {
								l.setStyle({'fillColor': "rgb(180, 180, 180)"});
								l.setStyle({'color': "rgb(180, 180, 180)"});
							}						
						})
						//adapt legends color
						let color_field=params_chart_target.params_fields.color_params.color_field						
						if (color_field) {
							let active_legends = deduplicate_dict(brushed_ticks.map(o=> o.tooltips), params_chart_target.params_fields.color_params.color_field)
							adaptMapsLegendColors(params_chart_target, active_legends)
						}
						
					}
					else if (params_chart_target.chart_sub_type === 'choroplete_map') {							
						
						//console.time('time highlight choroplete_map')
						params_chart_target.featureGroup.eachLayer(l=> {
							if (l.options && l.options.dataset) {
								if ((l.options.dataset[brush_field] >= min_value_brushed && l.options.dataset[brush_field.field1] <= max_value_brushed)) {
										l.setStyle({'fillColor': l.options.style.fillColor_source});
										params_chart_target.highlighted_polys.push(l.options.dataset)																	
								}
								else {
									l.setStyle({'fillColor': "rgb(180, 180, 180)"});
								}
							}
						})							
						//console.timeEnd('time highlight choroplete_map')
					}
				}
			})

			function adaptMapsLegendColors(params_chart, active_legends) {
				let legend=document.getElementById("grid-container_legends_" + params_chart.id)
				legend.childNodes.forEach(c=> {
					//display original color
					c.firstChild.style.backgroundColor = c.firstChild['data-originalColor']
					//if the legend is exluded by the brush, tunr it grey
					if (!active_legends.includes(c.lastChild.innerText)) {
						c.firstChild.style.backgroundColor = 'rgb(180, 180, 180)'
					}
				})
			}


		}


		

		params_chart.funcLib.activate_brush_filter = function (params_chart,s) {
			const brushed_ticks=params_chart.ticks_objects.filter(t=> t.x_target >= s[0] && t.x_target <= s[1]);
			const brush_field = params_chart.numerical_field_params.fieldName;
			const min_value_brushed = d3.min(brushed_ticks, d=> d.tooltips[brush_field]);
			const max_value_brushed = d3.max(brushed_ticks, d=> d.tooltips[brush_field]);

			if (!min_value_brushed || !max_value_brushed) {
				return
			}

			const brush_values = {x1: min_value_brushed, x2: max_value_brushed}
			params_chart.brush_values = brush_values

			//translate brush values coordinates into store format
			params_chart.sharedParams.filter_order_origin = "tick_brush_highlight"
			params_chart.brush_keys_values = {}
			params_chart.brush_keys_values[brush_field + "_brushed"] = [min_value_brushed.toString()+"_"+max_value_brushed.toString()];
			

			//console.log("brush_Event highlight s: "+s); console.log(params_chart.brush_highlight_keys_values)
			params_chart.sharedParams.interaction_events[params_chart.id].brushed = true
		}
		
		params_chart.funcLib.restorColors = function (params_chart) {
			//restore original colors
			const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
			const canvasBBox = canvas.getBoundingClientRect()
			const context = canvas.getContext('2d');
	
			context.clearRect(0, 0, params_chart.canvasWidth, params_chart.canvasHeight);
			params_chart.ticks_objects.forEach(t=> {				
				t.draw(t.x_target)				
			})
		}


		params_chart.funcLib.highlight_brush = function (params_chart, s) {
			const canvas=document.getElementById(`canvas_tickChart_${params_chart.htmlNode}`)
			const canvasBBox = canvas.getBoundingClientRect()
			const context = canvas.getContext('2d');
	
			context.clearRect(0, 0, params_chart.canvasWidth, params_chart.canvasHeight);
			params_chart.ticks_objects.forEach(t=> {
				if (t.x_target >= s[0] && t.x_target <= s[1]) {
					t.draw(t.x_target)
				}
				else {
					t.draw(t.x_target, "rgb(180, 180, 180)")					
				}
				
			})

		}
    
	}


}
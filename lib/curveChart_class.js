class curveChart {

	constructor(params_curveChart) {		
		this.id = params_curveChart.id
		this.ctx = params_curveChart.ctx
	    this.category_field = params_curveChart.category_field
	    this.sub_category_field = params_curveChart.sub_category_field
	    this.numerical_field = params_curveChart.numerical_field
	    this.title_x_axis = params_curveChart.title_x_axis
	    this.title_y_axis = params_curveChart.title_y_axis
		this.type = params_curveChart.type
	    this.responsive = true	    
	    this.legend_title = params_curveChart.legend_title
	    this.legend_clicked = params_curveChart.legend_clicked
	    this.title = params_curveChart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0
	    this.nb_sous_categories = 0
	    this.fill = params_curveChart.shape.fill
	    this.stackedChart = params_curveChart.stackedChart


	}

	createChart(params_curveChart, sharedParams, data_to_transform) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_curveChart) === false) {
			sharedParams.params_charts.push(params_curveChart)
		}

		this.setup_funcLib(params_curveChart, sharedParams)
		var data_filtred = this.prepare_data_p1(params_curveChart, sharedParams, data_to_transform)

		this.prepare_data_p2(data_filtred, params_curveChart, sharedParams)

		sharedParams.create_parent_container(params_curveChart, sharedParams)

		//if (params_curveChart.instanciator === undefined) {
			var chart_instance = this.init_chart(params_curveChart, sharedParams)
		//}

		this.wrapper_brush_creator(params_curveChart)


		params_curveChart.chart_type = "chartJS"
		params_curveChart.chart_sub_type = "curve"

		params_curveChart.instanciator = this


	}


	setup_funcLib(params_chart, sharedParams) {

		params_chart.funcLib['zoom_in'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)

		    //2.inject brushed values
		    Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0])

            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)

            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, params_chart.sharedParams)
		}


        params_chart.funcLib['zoom_out'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)


            //clean values of the previous zoom
	            params_chart.list_keys_values_segment_single_selected = [];
	            params_chart.list_labels_segment_single_selected = [];
	            params_chart.list_keys_values_segments_multiples_selected = [];
	            params_chart.list_labels_segments_multiples_selected = [];
	            Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0]);
	        
            	params_chart.list_idx_segments_multiples_selected = [];


            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)

            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, params_chart.sharedParams)
        }




		params_chart.funcLib['update_area_bounds'] = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)

		    //2.inject brushed values
		    Object.assign(params_chart.transformations.crossfilter, params_chart.list_keys_values_segments_multiples_selected[0])

		    //3.get filtred dataset
		    params_chart.to_filter = true
		    var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, params_chart.sharedParams)

		    //4.update the chart
		    promise_data_input.then(result=> {
		        updateChart(params_chart, result, params_chart.sharedParams)
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

				params_chart.instanciator.prepare_data_p2(result, params_chart, params_chart.sharedParams)
		        var data_type = "data"; var injection_type = "init"; var updateTime = undefined
		        params_chart.instanciator.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type)		        
		    }
		}



        params_chart.funcLib['restore_chart_view'] = function (params_chart, sharedParams) {
        	//previous code, specific to each chart
				// //clean store lists
				// params_chart.list_keys_values_segment_single_selected = [];
				// params_chart.list_labels_segment_single_selected = [];
				// params_chart.list_keys_values_segments_multiples_selected = [];
				// params_chart.list_labels_segments_multiples_selected = [];	        	
				// params_chart.list_idx_segment_single_selected = [];
				// params_chart.list_idx_segments_multiples_selected = [];
				// params_chart.id_previous_singleSelect = ""
				// params_chart.active_legends = {};
				// params_chart.hidden_legends = {};

				// //collect active selections from other charts
				// params_chart.funcLib.collect_active_selections(params_chart, sharedParams)


	          //   //update chart view with collected selections
	          //   params_chart.funcLib.update_area_bounds(params_chart, sharedParams)

	          //   //clean lists
	          //   var clean_lists = setInterval(()=> {
			        // if (sharedParams.crossfilter_status === 'idle') {
			        //  	params_chart.list_keys_values_segments_multiples_selected = [];
			        //     params_chart.list_labels_segments_multiples_selected = [];
			        //     params_chart.funcLib.restore_legends(params_chart, sharedParams);
			        //     clearInterval(clean_lists)
			        // }
	          //   }, 1000)

            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)
            


	        params_chart.sharedParams.restore_view(params_chart.sharedParams);

        }


		//restore legends
		params_chart.funcLib['restore_legends'] = function(params_chart, sharedParams) {

			sharedParams.params_charts.filter(c=> c !== params_chart).forEach(c=> {

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
		}


		params_chart.funcLib['brush'] = function (params_chart, sharedParams) {

			//create general containers
			    const chart_instance = params_chart.chart_instance		    
			    // const chart_parentElement = (params_chart.ctx.parentElement)
			    const chart_node = params_chart.ctx
				// var width_general_container = params_chart.chart_instance.width + "px"

			    // //create grid container for controls, brush & chart
			    // const general_container = document.createElement('div'); var id = 'general_container_' + params_chart.id
				// //var width = "100%"
				// //clean original chart width
				// //params_chart.ctx.style.width = ""; params_chart.ctx.style.maxWidth = "";

			    // Object.assign(general_container, {id: id, style: "display: grid; grid-template-rows: auto auto auto; grid-row-gap: 1%; box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24); padding: 3%; width: "+width_general_container})
				// setTimeout(()=> {general_container.style.width = params_chart.chart_instance.width*1.05 + "px"}, 500) 

				//create a general container
				
				//get the parent node of the chart
				let parentElement = document.getElementById('parent_container_' + params_chart.id)
				let generalContainer = document.getElementById('general_container_'+params_chart.id)


			    //create controls container
			    const controls_container = document.createElement('div'); var id = 'controls_container_' + params_chart.id
			    controls_container.style = 'display: inline-grid; grid-template-columns: 5% 5% 5% 5% 5%; justify-items: center; margin-bottom: 0%; grid-column-gap: 5px'; controls_container.id = "controlsContainer_" + params_chart.id
			    controls_container.style.marginLeft = ((chart_instance.chartArea.left).toString())/2+"px"

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
							evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else {
							evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
					} );
					controlBrush.addEventListener('mouseenter', (evt)=> {
						if (params_chart.zoom_in) {
							evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else {
							evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}					
					});
					controlBrush.addEventListener('mouseemove', (evt)=> {
						if (params_chart.zoom_in) {
							evt.target.style.filter = 'invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)'}
						else {
							evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}					
					});
					controlBrush.addEventListener('mouseleave', (evt)=> {
						if (evt.target['data-clicked']) {
							evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'}
						else if (params_chart.zoom_in) {
							evt.target.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"}
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
	
				//create control for resore
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
	



			const margin = { top: chart_instance.chartArea.top, right: chart_instance.chartArea.right, 
				bottom: chart_instance.chartArea.bottom, left: chart_instance.chartArea.left };
			params_chart.chartArea = _.cloneDeep(margin)
			const outerWidth = chart_instance.width;
			const outerHeight = chart_instance.height;


		    //create parent node for brush element
		    const brush_node = document.createElement('div'); brush_node.id = 'brushParent_' + params_chart.id

			// var width = params_chart.chart_instance.ctx.canvas.offsetWidth
			// var height = margin.bottom - params_chart.chart_instance.scales.y.margins.bottom + 12//(12px for compensating the width of top & bottom handlers)

			if (params_chart.style.chart_width) {var width_px = params_chart.style.chart_width+"px", width = params_chart.style.chart_width}
			else {var width_px = "400px", width=400}
				
			//var height = params_chart.chart_instance.height+"px"
			var height = (width*params_chart.style.aspectRatio)+"px"
			
			brush_node.style = `margin-left:1px; width: ${width}; height: ${height}; margin-bottom: 0px`


			//set position of the chart to absolute, iot suprepose the chart with the svg screen
			chart_node.style.position = "absolute"

			//old
				//move all elements into their parents
				// brush_node.append(chart_node)
				// //general_container.append(controls_container)
				// general_container.append(brush_node)
				// chart_parentElement.append(general_container)

				//create a figure label		
				// let fig = create_figure_label(params_chart)
				// general_container.append(fig)

		    brush_node.append(chart_node)
		    generalContainer.append(controls_container)
		    generalContainer.append(brush_node)
		    parentElement.append(generalContainer)


		//create a figure label		
			let fig = create_figure_label(params_chart); fig.style.marginTop = "25px"				
			parentElement.append(fig)
			
			params_chart.ctx.style.justifySelf = 'center'


			//regenerate the chart
			params_chart.chart_instance.destroy()
			params_chart.instanciator.init_chart(params_chart, params_chart.sharedParams)



		    //add all controls into a list
		    params_chart['list_controls'] = {controlBrush: controlBrush, controlPointer: controlPointer, controlZoom_in: controlZoom_in, controlZoom_out: controlZoom_out, controlRestore: controlRestore}


		    


		    

			

		    //shows svg screen for brush selection
		    controlBrush.addEventListener('click', (el)=> {
		    	const brush_node = document.getElementById('brushParent_' + params_chart.id);
		        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
		        
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

		            //deactivate behaviour for other controls

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


		    setTimeout(()=> {
				const brush_node_name = '#'+brush_node.id
				const container = d3.select(brush_node_name);
				// Init SVG
				//var width = margin.right - params_chart.chart_instance.scales.x.margins.right
				var width = params_chart.chart_instance.scales.x.width
				//var height = margin.bottom - params_chart.chart_instance.scales.y.margins.bottom + 12//(12px for compensating the width of top & bottom handlers)
				var height = (width*params_chart.style.aspectRatio)

	
				const svgChart = container.append('svg:svg')
					.attr('width', width)
					.attr('height', height)
					.attr('class', 'svg-plot' + '_' + brush_node.id)
					.attr('style', 'position: absolute')
					.attr('transform', `translate(${params_chart.chart_instance.chartArea.left}, ${params_chart.chart_instance.chartArea.top})`)
					//.attr('style', 'margin-top: ' + margin.top + 'px')
					.append('g')
					.attr('width', width)
					.attr('id', 'transformer' + '_' + brush_node.id)
					//.attr('transform', `translate(${params_chart.chart_instance.chartArea.left}, ${params_chart.chart_instance.chartArea.top})`);
					
	
				
				//var canvasChart_id = chart_instance.canvas.id
				var canvasChart = document.getElementById(params_chart.id)//.getContext('2d');
	
	
	
				
				var svgSceen = document.getElementsByClassName('svg-plot' + '_' + brush_node.id)[0]
				svgSceen.style.display = 'none'
				
				Object.assign(params_chart.sharedParams.interaction_events, {[params_chart.id]: {type_event: {click: false}, brushed: false}})
	

				//var brush_width = params_chart.chart_instance.scales.x.maxWidth - params_chart.chart_instance.scales.x.margins.right
				//var brush_width = params_chart.chart_instance.ctx.canvas.offsetWidth - margin.left
				var brush_width = width
			    var brush_height = params_chart.chart_instance.scales.y.height
			    //params_chart['brush_dim'] = {width: brush_width, height: brush_height}
			    //const brush = d3.brushX().extent([[0, 0], [width-margin.left - 6, height-margin.top - 5]])
			    const brush = d3.brushX().extent([[0, 0], [brush_width, brush_height]])
			        .on("start", () => { brush_startEvent(); })
			        .on("brush", () => { brush_brushEvent(); })
			        .on("end", () => { brush_endEvent(); })
			        .on("start.nokey", function() {
			            d3.select(window).on("keydown.brush keyup.brush", null);
			        });

			    const brushSvg = svgChart
			        .append("g")
			        .attr("class", "brush")
			        .attr("id", "brush_" + params_chart.id)
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


			    let brushStartPoint = null;

			    function brush_startEvent() {
			        console.log('start');
			        var s = d3.event.selection

			        var check_brush_state = s[0] - s[1]
			        
			        //if the brush is inactiv, restore original colors
			        if (check_brush_state === 0) {
			            //restorColors(params_chart);
			            params_chart.list_idx_segments_multiples_selected = [];
			            params_chart.list_labels_segments_multiples_selected = [];
			            params_chart.list_keys_values_segments_multiples_selected = [];
			            params_chart.active_slices = []
						handle.attr("display", "none");
					}					
			    }

			    function brush_brushEvent() {
			        const s = d3.event.selection;
			        params_chart.list_labels_segments_multiples_selected = [];
			        params_chart.list_keys_values_segments_multiples_selected = [];

			        if (s && params_chart.selection_params.brush.mode === 'brushEvent') {
			            activate_brush(s, params_chart)
			        }
					handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - brush_height / 4] + ")"; });									
			    }


			    function brush_endEvent() {
			        const s = d3.event.selection;
			        params_chart.list_labels_segments_multiples_selected = [];
			        params_chart.list_keys_values_segments_multiples_selected = [];

			        console.log(s)
			        if (s) {
			            activate_brush(s, params_chart)

			        }
			    }


			    //save the pos of the svg screen components
			    var id = params_chart.chart_instance.canvas.parentNode.id;var querySelectorOverlay = '#' + id + ' > svg > g > g > rect.overlay';
			    var overlay = document.querySelector(querySelectorOverlay)
			    params_chart.brush_area = {overlay: {x: overlay.x.baseVal.value, y: overlay.y.baseVal.value, width: overlay.width.baseVal.value, height: overlay.height.baseVal.value},
			                                gap_left:0, gap_top: 0}

			},1500)


		    





		    function activate_brush(s, params_chart) {
		        //case when the scales are category type
		        if (chart_instance.scales.x.type === "category") {

		            var axis_x = [s[0], s[1]].sort(function(a, b){return a-b})
		            var x1_px = axis_x[0] + params_chart.chart_instance.chartArea.left
					var x2_px = axis_x[1] + params_chart.chart_instance.chartArea.left

		            //adjustments to the chart area
		            //calculate the gap between the previous left position of the chart area and the current left position        
		            /*var gap_left = params_chart.chartArea.left - params_chart.chart_instance.chartArea.left; var gap_top = params_chart.chartArea.top - params_chart.chart_instance.chartArea.top;
		            x1_px = x1_px + gap_left; x2_px = x2_px + gap_left; y1_px = y1_px + gap_top; y2_px = y2_px + gap_top*/

		            //get the data inside the selected range		            
		            let brushed_pixels_indexes = []; 
					var i=0, gridLineItems_length = params_chart.chart_instance.scales.x._gridLineItems.length; 
					for (var i=0; i<= gridLineItems_length; i++) {
						var gridLineItem = params_chart.chart_instance.scales.x._gridLineItems[i];
						if (gridLineItem?.x1+1 >= x1_px && gridLineItem?.x1 <= x2_px) {
							brushed_pixels_indexes.push(i)
						}
					}
					let brushedValues=[];
					brushed_pixels_indexes.forEach(i=> {brushedValues.push(params_chart.chart_instance.scales.x._labelItems[i].label) })


		            //store the brushed values in the lists
		            var category_field = params_chart.category_field
		            params_chart.list_labels_segments_multiples_selected = [{category_field: brushedValues}]
		            params_chart.list_keys_values_segments_multiples_selected = [{[category_field] : brushedValues}]
		            params_chart.list_idx_segments_multiples_selected.push(x1_px + "_" + x2_px)


		            console.log("brush_endEvent s: "+s); console.log("brushedValues: " + brushedValues)


				    if (params_chart.list_controls.controlBrush['data-clicked']) {

				        params_chart.sharedParams.interaction_events[params_chart.id].brushed = true        

				    }
				    else if (params_chart.list_controls.controlZoom_in['data-clicked']) {
				        //zoom into selected area by filting the plot
				        params_chart.funcLib.zoom_in(params_chart, params_chart.sharedParams)

				        //hide svg screen
				        const svgSceen = document.getElementsByClassName('svg-plot'+ '_' + brush_node.id)[0]
				        svgSceen.style.display = 'none'

				    }
		        }
		        
		    }   


		}


		params_chart.funcLib['sync_legends'] = function(params_chart, hidden_legends) {
			//traverse the array of hidden legends & hide corresponding legends in the target chart	
			var dataset;

			//1.show all hidden datasets
			params_chart.chart_instance.data.datasets.forEach(d=> {Object.values(d._meta)[0].hidden = false })
			//2.hide datasets listed in hidden_legends
			hidden_legends.forEach(legend=> { 
				dataset = params_chart.chart_instance.data.datasets.filter(d=> d.label === legend);
				if (dataset.length>0) {
					Object.values(dataset[0]._meta)[0].hidden = true
				}
			})
		
			
			//if a brush is in place, reset its coordinates according to the last scales observed
			if (Object.values(params_chart.brush_values).length > 0) {params_chart.funcLib.adapt_brush_v2(params_chart)}			
		}

		params_chart.funcLib['create_figure_number'] = function(params_chart, sharedParams) {
			params_chart.figure_auto = sharedParams.params_charts.length
		}
		params_chart.funcLib.create_figure_number(params_chart, sharedParams)

	}


	updateChart(params_curveChart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_curveChart, sharedParams)

		this.prepare_data_p2(data_filtred, params_curveChart, sharedParams)

		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(params_curveChart.chart_instance, params_curveChart, data_type, injection_type)

	}

	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

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
	    else if (params_chart.transformations.dataset && params_chart.transformations.dataset.length>0 ) {
	    	if (!params_chart.transformations['dataset_ready'] && params_chart.transformations.filter) {
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



		var data_chuncks = [];
		//if a filter arguments has been provided for the data source, call them back here
		if (params_chart.transformations.filter !== undefined) {

			//transform the filterList into an array that we can push in it filter objects
			filterList = Object.values(filterList)

			//don't take fields from the filter object if they are present in the crossfilter
			params_chart.transformations.filter.forEach(e=> {if (!filterList.find(f=> f.field === e.field)) {filterList.push(e)} })

			//Object.assign(filterList, params_chart.transformations.filter)

			filterList = filterList.filter(l=> l.field !== "")
			
			//if the current filter ID is different from the shared filter id, call the filter function
			//data_chuncks = getFiltredData(data_chart, filter_array, filterList, params_chart.id)
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
		if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length) {
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
				var result = []; var chart
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
						indexes.forEach(index=> {
						    index.forEach(i=> {
						        list_indexes.push(i)
						    })						
						})

						list_indexes = deduplicate_array(list_indexes)

						list_indexes.forEach(index=> {							
							dataset_filtred.push(sharedParams.data_main_groupBy_index[index][0])							
						})

						console.timeEnd('exec build subset crossfilter simple_BarChart')


						var dataset_grouped = groupData(dataset_filtred, params_chart)
						

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

						return dataset_grouped
					}
				}
			}
		}		
	    


	    //zone de regroupements
	    //if one categorical axis, use this groupy method
	    

	    function groupData(dataset_filtred, params_chart) {
	        
	        var agg_name_lodash = params_chart.numerical_field_params.agg_type + "By";
	        var agg_fieldName = params_chart.numerical_field_params.agg_type + "_" + params_chart.numerical_field_params.fieldName
	        params_chart.numerical_field_params.agg_fieldName = agg_fieldName
	        let groupedItem = _.groupBy(dataset_filtred, record => record[params_chart.category_field] + '_' +
		          record[params_chart.sub_category_field]);
	        if (params_chart.numerical_field_params.agg_type === "count") {
		        var dataset_grouped = _.map(groupedItem, (group, key) => {
		          return {
		            [params_chart.category_field]: group[0][params_chart.category_field],
		            [params_chart.sub_category_field]: group[0][params_chart.sub_category_field],
		            [agg_fieldName]: (group.length)
		          };
		        });
	        }
	        else {
		        dataset_grouped = _.map(groupedItem, (group, key) => {
		          return {
		            [params_chart.category_field]: group[0][params_chart.category_field],
		            [params_chart.sub_category_field]: group[0][params_chart.sub_category_field],
		            [agg_fieldName]: _[agg_name_lodash](group, params_chart.numerical_field_params.fieldName)
		            
		          };
		        });
		    }

	        //trier tableau
	        dataset_grouped.sort(trier(params_chart.category_field, 'asc'))
	        //round values
	        dataset_grouped = round_values(dataset_grouped, agg_fieldName)        


		    return dataset_grouped
		}



	    
	    function round_values(dataset_ChartJS, agg_fieldName) {
	    	for (var d = 0; d < dataset_ChartJS.length; d++) {	        
	            dataset_ChartJS[d][agg_fieldName] = Math.round(dataset_ChartJS[d][agg_fieldName] * 100) / 100
	        };
	        return dataset_ChartJS
	    }



	}





	prepare_data_p2(data_input, params_curveChart, sharedParams) {
		//processus de création d'un nouveau dataset: 
		//params_curveChart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		//répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
			var sous_categories, sub_category_field

			if (params_curveChart.list_of_axis.length === 0) {
				params_curveChart.list_of_axis.push(this.category_field); params_curveChart.list_of_axis.push(this.sub_category_field)
			}
			params_curveChart.legends_field = params_curveChart.sub_category_field
			
			params_curveChart.nb_axis = 2

			//1.obtenir les catégories (les communes par ex)
			var categories = data_input.map(r=> r[this.category_field]);
			categories = deduplicate_array(categories)
			

			//2.obtenir les sous-catégories (la taille des logements par ex: 1p, 2p ...)		
			//if we have fields to decode
			if (params_curveChart.fields_to_decode) {
				//if the fields_to_decode is encapsulated into an array, put it into an object
				if (params_curveChart.fields_to_decode.constructor == Array ) {
					params_curveChart.fields_to_decode = params_curveChart.fields_to_decode[0]
				}
				if (params_curveChart.fields_to_decode.constructor == Object ) {
					var lookupTable = params_curveChart.fields_to_decode.lookupTable;
					var mainKey = params_curveChart.fields_to_decode.mainKey;
					var lookupKey = params_curveChart.fields_to_decode.lookupKey
					var fields = params_curveChart.fields_to_decode.fields
											
					params_curveChart.fields_to_decode.fields.forEach(f=> {
						var res = []
						data_input.map(r=> {res.push(r.hasOwnProperty(f))})
						if (res.filter(r=> !r).length > 0) {
							join_v2(data_input, lookupTable, mainKey, lookupKey, fields)						
							res = []
							//1.obtenir les catégories (les communes par ex)
							sous_categories = deduplicate_dict(data_input, f); sous_categories.sort()
							sub_category_field = f
							params_curveChart.data_input = data_input

						}
					})
				}
			}
			else {				
				//1.obtenir les catégories (les communes par ex)
				sous_categories = deduplicate_dict(data_input, this.sub_category_field); sous_categories.sort()
				sub_category_field = this.sub_category_field
			}

			var nb_categories = categories.length; var nb_sous_categories = sous_categories.length;
	        params_curveChart.nb_categories = categories.length;
	        params_curveChart.nb_sous_categories = sous_categories.length

			//3.création des catégories dans la spec ChartJS (champ labels dans chartJS)
			params_curveChart.data[0].labels = [categories]


			params_curveChart.activ_categories_values = []; params_curveChart.activ_categories_values.push(categories);
			params_curveChart.activ_sub_categories_values = []; params_curveChart.activ_sub_categories_values.push(sous_categories)
			//var nb_categories = params_curveChart.data[0].labels[0].length
            


        	if (Object.keys(params_curveChart.backgroundColorArray_source).length === 0) {
        		var i = 0
        		function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i].replace("0.65", "1") }
        		var status_colors = "empty";
        		//chech if a color has been generated for the same category field, if so re use it
     			if (sharedParams.registed_colors.hasOwnProperty(sub_category_field)) {
     				params_curveChart.backgroundColorArray_source = {...sharedParams.registed_colors[sub_category_field]}
     			}
     			else {
     				var backgroundColorArray_source = generateColors(nb_categories, params_curveChart.colorsConfig.scheme, params_curveChart.colorsConfig.colorsOrder, sub_category_field, sharedParams)
					sous_categories.forEach(axis => {
						params_curveChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						
					})
     			}
        	}

			if (!sharedParams.registed_colors.hasOwnProperty(sub_category_field)) {
				sharedParams.registed_colors[sub_category_field] = {...params_curveChart.backgroundColorArray_source}
			}

	        
			//créer les datasets composés des sous_categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			//reset dataset array
			params_curveChart.data[1].datasets = []
	        for (var i = 0; i < nb_sous_categories; i++) {
	        	//1.recupérer la valeur de chaque sous-catégorie (1p, 2p ...)
	        	var sous_categorie = sous_categories[i]

	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	        	//2.1.filtrer le tableau d'entrée de la sous-catégorie    
	        	var dataset = data_input.filter((item)=> item[sub_category_field] === sous_categorie)
	            
	            //2.2.récupérer l'array contenant les data
	            //var data_array = dataset.map(o=> o[params_curveChart.numerical_field_params.agg_fieldName])

	            var data_array = [], dataset_dates = dataset.map(o=> o.date)
				var fill_null_value = d3[params_curveChart.numerical_field_params.agg_type](dataset, r=> r[params_curveChart.numerical_field_params.agg_fieldName])
	            categories.forEach(d=> { 
	            	if (dataset_dates.includes(d)) {
	            		var value = dataset.filter(o=> o.date === d).map(v=> v[params_curveChart.numerical_field_params.agg_fieldName])[0]; 
	            		data_array.push(value)
	            	}
					else if (params_curveChart.numerical_field_params.fill_null) {
						data_array.push(fill_null_value)
					}
	            	else {data_array.push(0)}
	            })


	            //3.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
				//pointBackgroundColor: params_curveChart.backgroundColorArray_source[sous_categorie],
	            params_curveChart.data[1].datasets.push({label: sous_categorie, backgroundColor: params_curveChart.backgroundColorArray_source[sous_categorie],
	            	borderColor: params_curveChart.backgroundColorArray_source[sous_categorie], data: data_array, fill: false, pointStyle: 'circle'})

	        };


			//if the chart is already clicked, preserve the deactivated slices and maintain their color effect (grey or lower opacity)            
			if (params_curveChart.prepare_data_type === "preserve backgroundColor") {

				
			}





			params_curveChart.list_idx_segments_existants = [];
			var list_idx_segments_existants = params_curveChart.list_idx_segments_existants
	        //1.collecter les clés de tous les segments existants
			for (var i = 0; i < (nb_categories); i++) {			

					for (var a = 0; a < (nb_sous_categories); a++) {
						list_idx_segments_existants.push(a + "-" + i)
					}
			}                       

			//.sauvegarder une image des données source avant transformation
			if (params_curveChart.data_source_raw.length === 0) {
				params_curveChart.data_source_raw = data_input
				params_curveChart.data_source[0].labels.push(categories)
		        params_curveChart.data_source[1].datasets = params_curveChart.data[1].datasets

		    }


	}


	init_chart(params_curveChart, sharedParams) {	
		var plugin = {
			id: "CurveChart_legend_handler",
		    beforeDraw: function (chart) {
		    		var this_chart = params_curveChart.chart_instance
		            let legends = chart.legend.legendItems;
		            try {
			            legends.forEach(function (e, i) {
			              if (e.text === "") {
			              	e.fillStyle = "rgba(252, 252, 252, 1)";
			              	e.strokeStyle = "rgba(252, 252, 252, 1)"
			              }
			              else {
			              	var col = this_chart.config.data.datasets[i].borderColor
			              	e.fillStyle = col
			              	e.strokeStyle = col
			              }

			            });
			        }
			        catch (error) {console.log(error)}
		    }
		

		};

		var curveChart = new Chart(this.ctx, {
				        type: this.type,
				        data: [],
						options: {
								maintainAspectRatio: false,
								responsive: true,
								title: this.title,
								tooltips: {
								      mode: 'nearest',
								      intersect: true
								},
								hover: {
									mode: 'nearest',
									intersect: true
								},
								scales: {
									x: {
										display: true,
										title: {
											display: true,
											text: this.title_x_axis
										}
									},
									y: {
										display: true,
										title: {
											display: true,									
											text: this.title_y_axis
										},
										//stacked: this.stackedChart
									}
								},
								plugins: {
									legend : {
										position: params_curveChart.legend.position,
										labels : {
											usePointStyle: params_curveChart.legend.labels.usePointStyle},
										onHover: function(e) {
											if (e) {
												e.native.target.style.cursor = 'pointer';;
											}
										},
										onClick: function (evt, item) {
											//get dataset visibility
											let legend_clicked = params_curveChart.chart_instance.isDatasetVisible(item.datasetIndex)
											if (legend_clicked) {
												params_curveChart.chart_instance.setDatasetVisibility(item.datasetIndex, false)
											}
											else {
												params_curveChart.chart_instance.setDatasetVisibility(item.datasetIndex, true)
											}
											
											params_curveChart.legend_clicked = true;
											params_curveChart.chart_instance.update()
											
											console.log('legend_clicked pieChart: ' + item.text)
										}									
									}
								}
						},
				    	//plugins: [plugin]						
				      });




		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		//register the chart instance in the param array
		params_curveChart.chart_instance = curveChart
		this.inject_metadata(curveChart, params_curveChart, data_type, injection_type)


		

		return curveChart 				
	}

	wrapper_brush_creator(params_curveChart) {
		if (params_curveChart.brush_mode) {
			var check_chart_rendering = setInterval(()=>{
					
				var parent_container_display = check_parent_display(params_curveChart)				
				if (parent_container_display.chart_display_on) {	
					params_curveChart.funcLib.brush(params_curveChart, sharedParams)
					clearInterval(check_chart_rendering)
				}
			}, 1000)
		}
	}
	

	inject_metadata(curveChart, params_curveChart, data_type, injection_type) {
		//alimenter avec les labels
		if (curveChart.config.data.labels.length === 0) {
			curveChart.config.data.labels = [...params_curveChart[data_type][0].labels[0]]
		}


		//alimenter avec les datasets
		if (injection_type === "init") {
			var l = params_curveChart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_curveChart[data_type][1].datasets[i])
				curveChart.config.data.datasets[i] = _.cloneDeep(datasets[i])
			}
			params_curveChart.chart_instance.config.data.datasets = _.cloneDeep(datasets)
		}
		else if (injection_type === "update") {
			var l = params_curveChart[data_type][1].datasets.length;
			var datasets = [];
			//try {
				if (!params_curveChart.chart_instance.config.data.datasets) {params_curveChart.chart_instance.config.data.datasets = []}
				for (var i = 0; i < l; i++) {
					datasets.push(params_curveChart[data_type][1].datasets[i])					
					delete params_curveChart.chart_instance.config.data.datasets[i]?.borderWidth;
					if (params_curveChart.chart_instance.config.data.datasets[i]) {						
						params_curveChart.chart_instance.config.data.datasets[i].data = [...datasets[i].data]
						params_curveChart.chart_instance.config.data.datasets[i].label = datasets[i].label
						params_curveChart.chart_instance.config.data.datasets[i].backgroundColor = _.cloneDeep(datasets[i].backgroundColor)
						params_curveChart.chart_instance.config.data.datasets[i].borderColor = datasets[i].borderColor
						params_curveChart.chart_instance.config.data.datasets[i].fill = false
						params_curveChart.chart_instance.config.data.datasets[i].pointStyle = "circle"
						//params_curveChart.chart_instance.config.data.datasets[i].borderWidth = _.cloneDeep(datasets[i].borderWidth)
					}
					else {
						params_curveChart.chart_instance.config.data.datasets[i] = {label: datasets[i].label, data: datasets[i].data, borderColor: datasets[i].borderColor, fill: false, pointStyle: "circle", backgroundColor: datasets[i].backgroundColor}
					}

				}
			//}
			// catch (error) {				
			// 	params_curveChart.chart_instance.config.data.datasets.push({label: datasets[i].label, data: datasets[i].data, backgroundColor: datasets[i].backgroundColor, borderColor: datasets[i].borderColor, borderWidth: datasets[i].borderWidth})
			// }			
			params_curveChart.sharedParams.highlight_chart_border(params_curveChart)
		}

		//clean datasets
		params_curveChart.chart_instance.data.datasets = params_curveChart.chart_instance.data.datasets.filter(d=> d.label !== "")		


		params_curveChart.chart_instance.update(750)


		//procedure manuelle pour remmetre les couleurs source
		/*bar1.config.data.datasets[2].backgroundColor = _.cloneDeep(params_bar1_deepCopy.data[1].datasets[2].backgroundColor)*/

		


		//if the chart shares legends with another chart, sync their legends
		if (params_curveChart.chart_instance.sync_legends) {
			params_curveChart.chart_instance.funcLib.sync_legends(params_curveChart, params_curveChart.chart_instance.sync_legends)
			params_curveChart.chart_instance.sync_legends = undefined
			params_curveChart.chart_instance.update(750)
		}



		return params_curveChart.chart_instance
	}



	maj_couleurs(curveChart, params_curveChart) {
		//on entre dans cette func pour enlever le focus posé sur les segments

		var nb_categories = params_curveChart.nb_categories;
		var backgroundColorArray = [];

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {		
			
			//parcours sous-catégories
			var nb_sous_categories = params_curveChart.nb_sous_categories;
			for (var a = 0; a < nb_sous_categories; a++) {
	/*			backgroundColorArray.push(params_curveChart.data[1].datasets[a].backgroundColor[i])*/
				//var backgroundColor = params_curveChart.data_source[1].datasets[a].backgroundColor?.[i];
	/*			var borderColor = params_curveChart.data[1].datasets[a].borderColor[i];*/
				//curveChart.config.data.datasets[a].backgroundColor[i] = backgroundColor;
				/*curveChart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";*/
			}

			/*curveChart.config.data.datasets[i].backgroundColor = backgroundColorArray;*/
			curveChart.update();



		}
	}	

	reset_border_color(this_chart, params_curveChart_deepCopy) {
		/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_curveChart_deepCopy);*/

		//remettre config sans bordures
		var nb_categories = params_curveChart_deepCopy.nb_categories;

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {		
			
			//parcours sous-catégories
			var nb_sous_categories = params_curveChart_deepCopy.nb_sous_categories;
			for (var a = 0; a < nb_sous_categories; a++) {
				this_chart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";
			};
			
		}

		this_chart.update();

	}





}




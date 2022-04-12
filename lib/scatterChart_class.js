class scatterChart {

	constructor(params_chart) {		
		this.id = params_chart.id
		this.ctx = params_chart.ctx
	    this.category_field = params_chart.category_field || undefined
	    this.x_field = params_chart.x_field
	    this.y_field = params_chart.y_field	   
	    this.title_x_axis = params_chart.title_x_axis
	    this.title_y_axis = params_chart.title_y_axis
		this.type = params_chart.shape.type
	    this.responsive = true
	    //this.legend_position = params_chart.legend_position[0]
	    this.legend_title = params_chart.legend_title
	    this.legend_clicked = params_chart.legend_clicked
	    this.title = params_chart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0
	    //this.nb_sous_categories = 0
	    this.fill = params_chart.shape.fill
	    this.stackedChart = params_chart.stackedChart
	    


	}

	createChart(params_chart, sharedParams, data_to_transform) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

		this.setup_funcLib(params_chart, sharedParams)
		
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)

		var t1 = new Date()
		this.prepare_data_p2(data_filtred, params_chart, sharedParams)
		console.log('scatterChart prepare_data_p2 time: ' + (new Date() - t1))
		
		sharedParams.create_parent_container(params_chart, sharedParams)
		this.wrapper_brush_creator(params_chart)

		//if (params_chart.instanciator === undefined) {
			t1 = new Date()
			var chart_instance = this.init_chart(params_chart, sharedParams)
			console.log('scatterChart init_chart time: ' + (new Date() - t1))
		//}


		params_chart.instanciator = this
		params_chart.chart_type = "chartJS"
		//params_chart.chart_sub_type = "scatter"



		//specify the existence of the spinner in the sharedParams, iot fire it with the user click
		sharedParams.charts_with_spinners[params_chart.id] = {show_spinner: this.show_spinner, hide_spinner: this.hide_spinner}




		function lineReg() {
			let arr1 = [1,1,2,3,4,5,6,7,8,9]			
			let arr2 = [5,10,25,40,40,60,50,55,80,150]
			var l = ss.linearRegressionLine(ss.linearRegression([arr1, arr2]));
			console.log(l(1))
			console.log(l(15))
			console.log(l(37))
		}
		
	}




	setup_funcLib(params_chart, sharedParams) {

		params_chart.funcLib.zoom_in = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)


            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)

            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, params_chart.sharedParams)
		}


        params_chart.funcLib.zoom_out = function (params_chart) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)


            //clean values of the previous zoom
			params_chart.brush_values = {};
			params_chart.brush_keys_values = {};
			


            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)

            //set scales start
            params_chart.chart_instance.options.scales.x.beginAtZero = true
            params_chart.chart_instance.options.scales.y.beginAtZero = true


            //update chart view with collected selections
            params_chart.funcLib.update_area_bounds(params_chart, sharedParams)
        }


		params_chart.funcLib.update_area_bounds = function (params_chart, sharedParams) {
		    //1.inject active slices of other charts
		    params_chart.funcLib.collect_active_selections(params_chart, params_chart.sharedParams)

		    //2.inject brushed values
		    Object.assign(params_chart.transformations.crossfilter, params_chart.brush_keys_values)

		    //3.get filtred dataset
		    var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, params_chart.sharedParams)

		    //4.update the chart
		    params_chart.to_filter = true
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
						    	
		        params_chart.instanciator.prepare_data_p2(result, params_chart, params_chart.sharedParams)
		        var data_type = "data"; var injection_type = "init"; var updateTime;
		        params_chart.instanciator.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type, updateTime, params_chart.sharedParams)            
		    }
		}


        params_chart.funcLib.restore_chart_view = function (params_chart, sharedParams) {

            //clean values of the previous zoom
			params_chart.brush_values = {};
			params_chart.brush_keys_values = {};
			

            //set scales start
            params_chart.chart_instance.options.scales.x.beginAtZero = true
            params_chart.chart_instance.options.scales.y.beginAtZero = true

            //clean brush box
            var brushBox = d3.select('#brush_' + params_chart.ctx.id)
            brushBox.call(d3.brush().clear)
            


	        params_chart.sharedParams.restore_view(params_chart.sharedParams);

        }



		params_chart.funcLib.collect_active_selections = function collect_active_selections(params_chart, sharedParams) {
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



		params_chart.funcLib.brush = function (params_chart, sharedParams) {
		    const chart_instance = params_chart.chart_instance
		    //var htmlNode = document.getElementById(params_chart.brush_htmlNode)


		    
		    const chart_node = params_chart.ctx
			//old
				// var width_general_container = params_chart.chart_instance.width + "px"
				// //create grid container for controls, brush & chart
				// const general_container = document.createElement('div'); var id = 'general_container_' + params_chart.id
				// Object.assign(general_container, {id: id, style: "display: grid; margin-left:1px; padding: 5px ;grid-template-rows: auto auto auto; grid-row-gap: 1%; box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24); width: "+width_general_container})//
				// setTimeout(()=> {general_container.style.width = params_chart.chart_instance.width*1.05 + "px"}, 500) 

			//create a general container
			

			//get the parent node of the chart			
			let parentElement = document.getElementById('parent_container_' + params_chart.id)
			let general_container = document.getElementById('general_container_'+params_chart.id)
			general_container.style.justifySelf = 'start'
			parentElement.style.opacity = '0'
			

			if (params_chart.legend_size) {
				//create parent container that holds the 
			}

			//create controls container
		    const controls_container = document.createElement('div'); var id = 'controls_container_' + params_chart.id
		    controls_container.style = 'display: inline-grid; grid-template-columns: 5% 5% 5% 5% 5%; justify-items: center; margin-bottom: 0%; grid-column-gap: 5px'; controls_container.id = "controlsContainer_" + params_chart.id
		    //controls_container.style.marginLeft = ((chart_instance.chartArea.left).toString())/2+"px"
			controls_container.style.marginLeft = "15px"

		    //create sub grids containers
				const grid_brush = document.createElement('div'); grid_brush.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_brush.id = "grid_brush_" + params_chart.id
				const grid_pointer = document.createElement('div'); grid_pointer.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_pointer.id = "grid_pointer_" + params_chart.id
				const grid_zoom_in = document.createElement('div'); grid_zoom_in.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_zoom_in.id = "grid_zoom_in_" + params_chart.id
				const grid_zoom_out = document.createElement('div'); grid_zoom_in.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_zoom_in.id = "grid_zoom_out_" + params_chart.id;
				const grid_restore = document.createElement('div'); grid_restore.style = 'display: inline-grid; grid-template-columns: 1.2em; justify-items: center; border-radius: 25%'; grid_restore.id = "grid_restore_" + params_chart.id
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


		    //create parent node for brush element
			const brush_node = document.createElement('div'); brush_node.id = 'brushParent_' + params_chart.id; 
			
			//chartJS v2
			// const margin = { top: chart_instance.chartArea.top, right: chart_instance.chartArea.right, 
			// 	bottom: chart_instance.chartArea.bottom, left: chart_instance.chartArea.left };
			// params_chart.chartArea = _.cloneDeep(margin)
			// const outerWidth = chart_instance.width;
			// const outerHeight = chart_instance.height;


			//new from curve chart
			let width_px, width
			if (params_chart.style.chart_width) {
				width_px = params_chart.style.chart_width+"px";
				width = params_chart.style.chart_width}
			else {
				width_px = "400px"
			 	width=400
			}
				
			//var height = params_chart.chart_instance.height+"px"
			var height = (width*params_chart.style.aspectRatio)+"px"
			
			brush_node.style = `margin-left:1px; width: ${width}; height: ${height}; margin-bottom: 0px`


			//set position of the chart to absolute, iot suprepose the chart with the svg screen
			chart_node.style.position = "absolute"
				

			
		    //move all elements into their parents
		    brush_node.append(chart_node)
		    general_container.append(controls_container)
		    general_container.append(brush_node)
		    parentElement.append(general_container)

			//old code for create a figure label		
				// let fig = create_figure_label(params_chart)
				// general_container.append(fig)
			
			//create a figure label		
			let fig = create_figure_label(params_chart); fig.style.marginTop = "25px"				
			parentElement.append(fig)
	
			params_chart.ctx.style.justifySelf = 'center'


			//add all controls into a list
		    params_chart.list_controls = {controlBrush: controlBrush, controlPointer: controlPointer, controlZoom_in: controlZoom_in, controlZoom_out: controlZoom_out, controlRestore: controlRestore}

		    //register the parent element for the controls & the chart
		    params_chart.parentNode = 'general_container_' + params_chart.id

		
		    




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
			        }

			        //if brush control is selected twice, clean the brush
			        if (el.currentTarget['data-clicked']) {
				        //restore chart to its initial state

						//params_chart.funcLib.clean_brush(params_chart)
						svgSceen.style.display = 'none'
						el.currentTarget.title = 'Brush'
						el.currentTarget['data-clicked'] = false
						params_chart.brush = false

						return			        	
			        }

		            //turn off clicked state for all controls
		            Object.values(params_chart.list_controls).forEach(control=> {
		                control['data-clicked'] = false;
						
		                if (control.id === "previous_hierarchy_" + params_chart.id) {
							control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
						}
						else {control.style.filter = "";}
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
		            Object.values(params_chart.list_controls).forEach(control=> {
		                control['data-clicked'] = false
		                if (control.id === "previous_hierarchy_" + params_chart.id) {
							control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
						}
						else {control.style.filter = ""}
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
	            Object.values(params_chart.list_controls).forEach(control=> {
	                control['data-clicked'] = false
	                if (control.id === "previous_hierarchy_" + params_chart.id) {
						control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
					}
					else {control.style.filter = ""}
	                control.parentElement.style.boxShadow = ""
	                control.parentElement.style.backgroundColor = ""
	            })

	            //turn on clicked state for current controls
	            el.currentTarget["data-clicked"] = true
				//el.currentTarget.title = "Exit the zoom mode"

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
				Object.values(params_chart.list_controls).forEach(control=> {
					control['data-clicked'] = false
					if (control.id === "previous_hierarchy_" + params_chart.id) {
						control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
					 }
					else {control.style.filter = ""}
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
		        Object.values(params_chart.list_controls).forEach(control=> {
		            control['data-clicked'] = false
					if (control.id === "previous_hierarchy_" + params_chart.id) {
						control.style.filter = "invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)"
					} 
					else {control.style.filter = ""}
					
					control.title = (control.id === "zoom_in_pointer_"+params_chart.id ? "Select & zoom in" : "");
					control.title = (control.id === "activate_brush_"+params_chart.id ? "Brush" : '');
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
			
			

			var check_chart_rendering = setInterval(()=>{
				var sum_margin=0; 
				Object.values(params_chart.chart_instance.chartArea).forEach(e=> sum_margin=sum_margin+e)
				var sum_heightWidth = params_chart.chart_instance.height + params_chart.chart_instance.width
				var parent_container_display = check_parent_display(params_chart)
				//if (!isNaN(sum_margin) && sum_heightWidth > 0) {
				if (parent_container_display.chart_display_on) {
					//reset chart iot to force its display
					params_chart.chart_instance.destroy()
					params_chart.instanciator.init_chart(params_chart, params_chart.sharedParams)
					params_chart.ctx.style.opacity = '1'

					setTimeout(()=> {
						params_chart.funcLib.generate_svg_brush(params_chart)	
					}, 2000)
					clearInterval(check_chart_rendering)					
				}
			}, 200)		
			
		}



		params_chart.funcLib.generate_svg_brush = function(params_chart) {
			//remove previous brush elements if they exist
			let svg_parent = d3.select('#svg_parent_container' + '_' + params_chart.id)
			if (!svg_parent.empty()) svg_parent.remove()
			
			const brush_node_name = '#brushParent_' + params_chart.id
			const container = d3.select(brush_node_name);
			// Init SVG
			// let width = params_chart.style.chart_width				
			// let height = (width*params_chart.style.aspectRatio)
			let width = params_chart.chart_instance.chartArea.width;
			let height = params_chart.chart_instance.chartArea.height;
			let margin_left = params_chart.chart_instance.chartArea.left;
			let margin_top = params_chart.chart_instance.chartArea.top

			const svgChart = container.append('svg:svg')
				.attr('width', width)
				.attr('height', height)
				.attr('class', 'svg-plot_brushParent_' + params_chart.id)
				.attr('id', 'svg_parent_container' + '_' + params_chart.id)
				.attr('style', 'position: absolute')
				.attr('transform', `translate(${margin_left}, ${margin_top})`)
				.append('g')
				.attr('id', 'transformer_brushParent_' + params_chart.id)
				
				

			
			var canvasChart_id = params_chart.id
			var canvasChart = document.getElementById(canvasChart_id)//.getContext('2d');



			const svgSceen = document.getElementsByClassName('svg-plot_brushParent_' + params_chart.id)[0]
			
			svgSceen.style.display = 'none'
			
			Object.assign(params_chart.sharedParams.interaction_events, {[canvasChart_id]: {type_event: {click: false}, brushed: false}})

			
			// var brush_width = Object.values(params_chart.chart_instance.scales)[0].maxWidth //- params_chart.chart_instance.scales["x-axis-1"].margins.right
			// var brush_height = Object.values(params_chart.chart_instance.scales)[1].height

			//test option:
			
			//var brush_height_curve_param = params_chart.chart_instance.scales["y-axis-0"].height
			params_chart.brush_dim = {width: width, height: height}		    
			const brush = d3.brush().extent([[0, 0], [width, height]])
				.on("start", () => { brush_startEvent(); })
				.on("brush", () => { brush_brushEvent(); })
				.on("end", () => { brush_endEvent(); })
				.on("start.nokey", function() {
					d3.select(window).on("keydown.brush keyup.brush", null);
				});

			params_chart.brush_object = brush;

			const brushSvg = svgChart
				.append("g")
				.attr("class", "brush")
				.attr("id", "brush_" + canvasChart_id)
				.call(brush);
		   
			

			function brush_startEvent() {
				console.log('start');
				var s = d3.event.selection

				var check_brush_state = d3.sum(s[0]) - d3.sum(s[1])
				
				//if the brush is inactiv, restore original colors
				if (check_brush_state === 0) {
					params_chart.funcLib.restorColors(params_chart, params_chart.sharedParams);					
					params_chart.brush_values = {}
					params_chart.brush_keys_values = {}

					if (check_brush_state=== 0 && params_chart.selection_params.brush.mode === 'highlight') {
						//disable animations for scatterplots
						if (params_chart.chart_sub_type === 'scatter' || params_chart.chart_sub_type === 'bubble') {
							params_chart.funcLib.restor_external_scatterplots_colors(params_chart);
							//params_chart.chart_instance.options.transitions.active.animation.duration = 0; // disables the animation for 'active' mode
						}
						params_chart.funcLib.restore_choroplete_map_tiles_color(params_chart)	
					}

				}

			}

			function brush_brushEvent() {
				const s = d3.event.selection;
				if (s && params_chart.selection_params.brush.mode === 'brushEvent') {
					params_chart.funcLib.activate_brush_filter(params_chart,s)
				}        
				else if (s && params_chart.selection_params.brush.mode === 'highlight') {
					params_chart.funcLib.activate_brush_highlight(params_chart,s)
				}
			}




			function brush_endEvent() {
				const s = d3.event.selection;
				console.log(s)
				if (s) {
					params_chart.funcLib.activate_brush_filter(params_chart,s)

				}
			}


			//save the pos of the svg screen components
			var id = params_chart.chart_instance.canvas.parentNode.id;
			var querySelectorOverlay = '#' + id + ' > svg > g > g > rect.overlay';
			
			// var id = params_chart.ctx.id; 
			// var querySelectorOverlay = '#brush_' + id + ' > rect.overlay';
			
			var overlay = document.querySelector(querySelectorOverlay)
			params_chart.brush_area = {overlay: {x: overlay.x.baseVal.value, y: overlay.y.baseVal.value, width: overlay.width.baseVal.value, height: overlay.height.baseVal.value},
										gap_left:0, gap_top: 0}

			params_chart.ind_generate_brush = true;


		}



		//get scales of the chart
		params_chart.funcLib.getChartScales = function (params_chart) {
			//axis x
			var minValue = params_chart.chart_instance.scales.x.min
			var maxValue = params_chart.chart_instance.scales.x.max
			var width = params_chart.chart_instance.scales.x.width

			var axis_x = {minValue, maxValue, width}

			//axis y
			minValue = params_chart.chart_instance.scales.y.min
			maxValue = params_chart.chart_instance.scales.y.max
			var height = params_chart.chart_instance.scales.y.height

			var axis_y = {minValue, maxValue, height}

			return {axis_x: axis_x, axis_y: axis_y}
		}


		params_chart.funcLib.activate_brush_highlight = function (params_chart,s) {
			const axis_params = params_chart.funcLib.getChartScales(params_chart)
			const canvasChart_id = params_chart.chart_instance.canvas.id;

			var axis_x = [s[0][0], s[1][0]].sort(function(a, b){return a-b}), axis_y = [s[0][1], s[1][1]].sort(function(a, b){return a-b});
			var x1_px = axis_x[0], x2_px = axis_x[1], y1_px = axis_y[0], y2_px = axis_y[1];


			var x1_value = (x1_px * axis_params.axis_x.maxValue) / axis_params.axis_x.width, x2_value = (x2_px * axis_params.axis_x.maxValue) / axis_params.axis_x.width;
			var y1_value = axis_params.axis_y.maxValue - ((y1_px * axis_params.axis_y.maxValue) / axis_params.axis_y.height)
			var y2_value = axis_params.axis_y.maxValue - ((y2_px * axis_params.axis_y.maxValue) / axis_params.axis_y.height)
			axis_x = [x1_value, x2_value].sort(function(a, b){return a-b}); axis_y = [y1_value, y2_value].sort(function(a, b){return a-b});        
			var brush_values = {x1: axis_x[0], x2: axis_x[1], y1: axis_y[0], y2: axis_y[1]}
			params_chart.brush_highlight_values = brush_values

			//translate brush values coordinates into store format
			var x = (Math.round(params_chart.brush_highlight_values.x1 * 10000) / 10000).toString() + "_" + (Math.round(params_chart.brush_highlight_values.x2 * 10000) / 10000).toString()
			var y = (Math.round(params_chart.brush_highlight_values.y1 * 10000) / 10000).toString() + "_" + (Math.round(params_chart.brush_highlight_values.y2 * 10000) / 10000).toString()
			params_chart.sharedParams.filter_order_origin = "scatter_brush_highlight"
			params_chart.brush_highlight_keys_values = {}
			params_chart.brush_highlight_keys_values[params_chart.x_field + "_brushed"] = [x]; params_chart.brush_highlight_keys_values[params_chart.y_field + "_brushed"] = [y];

			//console.log("brush_Event highlight s: "+s); console.log(params_chart.brush_highlight_keys_values)
			params_chart.sharedParams.interaction_events[params_chart.id].brushed = true

			//highlight data points in the target charts (scatters/bubble charts and maps)
			params_chart.highlight_charts?.forEach(chart_id=> {
				//get params chart instance
				let params_chart_target = params_chart.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
				if (params_chart_target) {
					let brush_intervals = get_brush_intervals(params_chart, params_chart_target);
					if (params_chart_target.chart_sub_type === 'scatter' || params_chart_target.chart_sub_type === 'bubble') {
						//console.time('total time highlight scatter')
						params_chart_target.highlighted_points = []
						//console.time('time loop highlight scatter')
						params_chart_target.chart_instance.data.datasets.forEach(dataset=> {
							var dataset_lenght = dataset.data.length
							var i = 0, x_val=0, y_val=0
							for (i = 0; i<=dataset_lenght; i++) {
								x_val = dataset.data[i]?.o[brush_intervals.field1];
								y_val = dataset.data[i]?.o[brush_intervals.field2];
								if ((x_val >= brush_intervals.valueMin1 && x_val <= brush_intervals.valueMax1) && ((y_val >= brush_intervals.valueMin2 && y_val <= brush_intervals.valueMax2))) {
										//l.setStyle({'fillColor': l.options.style.fillColor_source});
										dataset.backgroundColor[i] = dataset.backgroundColor_source[i].replace('0.65', '0.9')
										params_chart_target.highlighted_points.push({x: x_val, y: y_val, backgroundColor: dataset.backgroundColor[i]})
										//params_chart_target.highlighted_polys.push(l.options.dataset)																	
								}
								else {
									dataset.backgroundColor[i] = "rgba(220, 222, 220, 0.25)";
								}									
							}
						})
						//console.timeEnd('time loop highlight scatter')
						//params_chart_target.sharedParams.interaction_events[params_chart.id].brushed = true
						
						
						params_chart_target.chart_instance.update(0)
						//console.timeEnd('total time highlight scatter')

					}
					else if (params_chart_target.chart_sub_type === 'map') {
						console.log('hi map')
					}
					else if (params_chart_target.chart_sub_type === 'choroplete_map') {							
						
						//console.time('time highlight choroplete_map')
						params_chart_target.map_instance.eachLayer(l=> {
							if (l.options && l.options.dataset) {
								if ((l.options.dataset[brush_intervals.field1] >= brush_intervals.valueMin1 && l.options.dataset[brush_intervals.field1] <= brush_intervals.valueMax1) && 
									((l.options.dataset[brush_intervals.field2] >= brush_intervals.valueMin2 && l.options.dataset[brush_intervals.field2] <= brush_intervals.valueMax2))) {
										l.setStyle({'fillColor': l.options.style.fillColor_source});
										params_chart_target.highlighted_polys.push(l.options.dataset)																	
								}
								else {
									l.setStyle({'fillColor': "rgb(220, 222, 220)"});
								}
							}
						})							
						//console.timeEnd('time highlight choroplete_map')
					}
				}
			})

			function get_brush_intervals(params_chart, params_chart_target) {
				let brush_fields ={}, i=1
				Object.keys(params_chart.brush_highlight_keys_values).forEach(f=> {
					var field = f.replace('_brushed','')
					var valueMin = +params_chart.brush_highlight_keys_values[f][0].substring(0, params_chart.brush_highlight_keys_values[f][0].indexOf('_'));
					var valueMax = +params_chart.brush_highlight_keys_values[f][0].substring(params_chart.brush_highlight_keys_values[f][0].indexOf('_')+1)
					brush_fields['brush_field_'+i] = {field: field, valueMin: valueMin, valueMax: valueMax}
					i++
				})

				params_chart_target.highlighted_polys = []
				let field1 = brush_fields.brush_field_1.field, field2 = brush_fields.brush_field_2.field
				let valueMin1 = brush_fields.brush_field_1.valueMin, valueMax1 = brush_fields.brush_field_1.valueMax;
				let valueMin2 = brush_fields.brush_field_2.valueMin, valueMax2 = brush_fields.brush_field_2.valueMax
				return {field1: field1, field2: field2, valueMin1: valueMin1, valueMin2: valueMin2, valueMax1: valueMax1, valueMax2: valueMax2}
			}

		}

		params_chart.funcLib.restore_choroplete_map_tiles_color = function(params_chart) {
			params_chart.highlight_charts?.forEach(chart_id=> {
				//get params chart instance
				let params_chart_target = params_chart.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
				if (params_chart_target) {
					if (params_chart_target.chart_sub_type === 'choroplete_map') {
						params_chart_target.funcLib.restore_tiles_fillColor(params_chart_target)

						params_chart_target.brush_highlight_keys_values = {}
						params_chart_target.brush_highlight_keys_values = {}					
					}
				}

			})
		}
		params_chart.funcLib.activate_brush_filter = function(params_chart,s) {
			if (params_chart.selection_params.brush.mode === 'highlight') return

			const axis_params = params_chart.funcLib.getChartScales(params_chart);
			const canvasChart_id = params_chart.chart_instance.canvas.id;

			var axis_x = [s[0][0], s[1][0]].sort(function(a, b){return a-b}), axis_y = [s[0][1], s[1][1]].sort(function(a, b){return a-b});
			var x1_px = axis_x[0], x2_px = axis_x[1], y1_px = axis_y[0], y2_px = axis_y[1];

			//adjustments to the chart area
			//calculate the gap between the previous left position of the chart area and the current left position        
			/*var gap_left = params_chart.chart_instance.chartArea.left - params_chart.chart_instance.chartArea.left; var gap_top = params_chart.chart_instance.chartArea.top - params_chart.chart_instance.chartArea.top;
			x1_px = x1_px + gap_left; x2_px = x2_px + gap_left; y1_px = y1_px + gap_top; y2_px = y2_px + gap_top*/


			var x1_value = (x1_px * axis_params.axis_x.maxValue) / axis_params.axis_x.width, x2_value = (x2_px * axis_params.axis_x.maxValue) / axis_params.axis_x.width;
			var y1_value = axis_params.axis_y.maxValue - ((y1_px * axis_params.axis_y.maxValue) / axis_params.axis_y.height)
			var y2_value = axis_params.axis_y.maxValue - ((y2_px * axis_params.axis_y.maxValue) / axis_params.axis_y.height)
			axis_x = [x1_value, x2_value].sort(function(a, b){return a-b}); axis_y = [y1_value, y2_value].sort(function(a, b){return a-b});        
			var brush_values = {x1: axis_x[0], x2: axis_x[1], y1: axis_y[0], y2: axis_y[1]}
			params_chart.brush_values = brush_values

			//translate brush values coordinates into store format
			var x = (Math.round(params_chart.brush_values.x1 * 10000) / 10000).toString() + "_" + (Math.round(params_chart.brush_values.x2 * 10000) / 10000).toString()
			var y = (Math.round(params_chart.brush_values.y1 * 10000) / 10000).toString() + "_" + (Math.round(params_chart.brush_values.y2 * 10000) / 10000).toString()
			params_chart.sharedParams.filter_order_origin = "scatter_brush"
			params_chart.brush_keys_values[params_chart.x_field + "_brushed"] = [x]; params_chart.brush_keys_values[params_chart.y_field + "_brushed"] = [y];

			console.log("brush_endEvent s: "+s); console.log(params_chart.brush_keys_values)



			if (params_chart.list_controls.controlBrush['data-clicked']) {
				params_chart.funcLib.restorColors(params_chart, params_chart.sharedParams)
				//highlight brushed zone
				params_chart.funcLib.highlight_brush(params_chart)
				params_chart.sharedParams.interaction_events[canvasChart_id].brushed = true;
				//set scales start
				params_chart.chart_instance.options.scales.x.beginAtZero = true
				params_chart.chart_instance.options.scales.y.beginAtZero = true
				params_chart.chart_instance.update()            
			}
			else if (params_chart.list_controls.controlZoom_in['data-clicked']) {
				//zoom into selected area by filting the plot
				params_chart.funcLib.update_area_bounds(params_chart, params_chart.sharedParams)

				//hide svg screen
				const svgSceen = document.getElementsByClassName('svg-plot_brushParent_' + params_chart.id)[0]
				svgSceen.style.display = 'none'

				//clear brush box
				var brushBox = d3.select('#brush_' + params_chart.ctx.id)
				brushBox.call(d3.brush().clear)

				//set scales start
				params_chart.chart_instance.options.scales.x.beginAtZero = false
				params_chart.chart_instance.options.scales.y.beginAtZero = false
				params_chart.chart_instance.update()
			}
			
		}		




		params_chart.funcLib.restorColors = function (params_chart, sharedParams) {
			//restore original colors
			var canvasChart_id = params_chart.chart_instance.canvas.id;
			if (sharedParams.interaction_events[canvasChart_id].brushed === true) {
				var backgroundColorArray
				params_chart.chart_instance.data.datasets.map(dset=> {

					var label = dset.label;
					if (label !== "") {
						if (params_chart.category_field) {
							backgroundColorArray = (params_chart.backgroundColorArray_source[label]+"|").repeat(dset.data.length).split("|").filter(e=> e !== ',' && e !== '')
						}
						else {backgroundColorArray = params_chart.backgroundColorArray_source[`${params_chart.id}_no_axis`]}
						dset.backgroundColor = backgroundColorArray
					}
				})
				params_chart.chart_instance.update(0);
			}
		}
		
		params_chart.funcLib.restor_external_scatterplots_colors = function (params_chart) {
			params_chart.highlight_charts?.forEach(chart_id=> {
				//get params chart instance
				let params_chart_target = params_chart.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
				if (params_chart_target && (params_chart_target.chart_sub_type === 'scatter' || params_chart_target.chart_sub_type === 'bubble')) {
					var backgroundColorArray
					params_chart_target.chart_instance.data?.datasets?.forEach(dset=> {
	
						var label = dset.label;
						if (label !== "") {
							if (params_chart_target.category_field) {
								backgroundColorArray = (params_chart_target.backgroundColorArray_source[label]+"|").repeat(dset.data.length).split("|").filter(e=> e !== ',' && e !== '')
							}
							else {backgroundColorArray = params_chart_target.backgroundColorArray_source[`${params_chart.id}_no_axis`]}
							dset.backgroundColor = backgroundColorArray
						}
					})
					params_chart_target.chart_instance.update(0);
				}

			})		
		}


		params_chart.funcLib.reposition_brush = function (params_chart) {
			if (params_chart.chart_instance.chartArea) {
				//get the scales and values of the current scatterplot
				let scale_x_MaxValue, scale_y_MaxValue
				var scaleWidth = Object.values(params_chart.chart_instance.scales)[0].width;
				var scaleHeight = Object.values(params_chart.chart_instance.scales)[1].height; 
				
				
				//check if the plot has hidden datasets before getting max values
				var check_plot_rendered = params_chart.chart_instance.legend.legendItems.filter(t=> t.text !=="").map(h=> h.hidden).filter(h=> h === false).length
				if (check_plot_rendered === 0) {
					//if the plot has hidden datasets, turn them on & get the data scales
					//get the indexes of the hidden datasets
					var datasetIndex = params_chart.chart_instance.legend.legendItems.filter(t=> t.text !=="").map(d=> d.datasetIndex)
					//show all hidden datasets
					datasetIndex.map(d=> params_chart.chart_instance.getDatasetMeta(d).hidden = false);
					params_chart.chart_instance.update(0);
					
					//var scale_x_MaxValue = params_chart.scale_x_MaxValue; var scale_y_MaxValue = params_chart.scale_y_MaxValue
					scale_x_MaxValue = Object.values(params_chart.chart_instance.scales)[0].end// - params_chart.chart_instance.scales["x-axis-1"].start;
					scale_y_MaxValue = Object.values(params_chart.chart_instance.scales)[1].end// - params_chart.chart_instance.scales["y-axis-1"].start            
				}
				else {
					scale_x_MaxValue = Object.values(params_chart.chart_instance.scales)[0].end// - params_chart.chart_instance.scales["x-axis-1"].start;
					scale_y_MaxValue = Object.values(params_chart.chart_instance.scales)[1].end// - params_chart.chart_instance.scales["y-axis-1"].start
				}

				//calculate the scales of the new brush box
				var x_start = (params_chart.brush_values.x1 * scaleWidth) / scale_x_MaxValue; var x_end = (params_chart.brush_values.x2 * scaleWidth) / scale_x_MaxValue;
				var y_start = ((scale_y_MaxValue - params_chart.brush_values.y2) * scaleHeight) / scale_y_MaxValue; var y_end = ((scale_y_MaxValue - params_chart.brush_values.y1) * scaleHeight) / scale_y_MaxValue;

				//calculate the gap between the previous left position of the chart area and the current left position
				var gap_left = params_chart.chart_instance.chartArea.left - params_chart.chart_instance.chartArea.left; var gap_top = params_chart.chart_instance.chartArea.top - params_chart.chart_instance.chartArea.top;
				if (gap_left > 0) {params_chart.brush_area.gap_left = gap_left}
				if (gap_top > 0) {params_chart.brush_area.gap_top = gap_top}

				//apply the adjustment to the brush
				//apply the adjustment to the overlay
				if (!isNaN(gap_left) && !isNaN(x_start)) {

					//select the brush node
					//get the id of the canvas chart
					var canvasChart_id = params_chart.chart_instance.canvas.id; //var querySelector_selection = "#" + id + " > svg > g > g > rect.selection"
					var brushBox = d3.select('#brush_' + canvasChart_id)

					//adjust the gap of the brush area if there are hidden datasets
					if (check_plot_rendered === 0) {
						x_start = x_start + params_chart.brush_area.gap_left; x_end = x_end + params_chart.brush_area.gap_left;
					}

					if (brushBox) {
						var x_start_options = [0, x_start]; var x_end_options = [scaleWidth, x_end]; var y_start_options = [0, y_start]; var y_end_options = [scaleHeight, y_end]
						try {
							brushBox.call(d3.brush().move, [
								[d3.max(x_start_options), d3.max(y_start_options)], [d3.min(x_end_options), d3.min(y_end_options)]
							])
						}
						catch {}
					}
				}
			}
		}





		params_chart.funcLib.highlight_brush = function (params_chart) {
		    var brush_values = _.cloneDeep(params_chart.brush_values)
		    params_chart.chart_instance.data.datasets.map(dset=> {
		    var dset_length = dset.data.length

		    for (var i = 0; i < dset_length; i++) {
		        var x = dset.data[i].x;
		        var y = dset.data[i].y;

		        if ((x > brush_values.x1 && x < brush_values.x2) && (y > brush_values.y1 && y < brush_values.y2)) {
		            //dset.backgroundColor[i] = dset.backgroundColor[i].replace('0.65', '1')
		        }
		        else {
		            dset.backgroundColor[i] = "rgba(240, 240, 240, 0.5)";
		        }

		    }

		    });

		    params_chart.chart_instance.update(0)
		}


	    params_chart.funcLib.adapt_brush_v2 = function(params_chart) {
		    //refresh colors
		    //restorColors()
		    //highlight brushed zone
		    params_chart.funcLib.highlight_brush(params_chart)



		    //get the sizes of the brush box
		    //get the id of the parent node
		    var id = params_chart.chart_instance.canvas.parentNode.id



		    //adjustments to the chart area after it's first init
		    params_chart.funcLib.reposition_brushTransformer(params_chart)
		    params_chart.funcLib.reposition_brush(params_chart)

	    }




		params_chart.funcLib.reposition_brushTransformer = function(params_chart) {


	        if (params_chart.chart_instance.chartArea) {
	            //get the scales and values of the current scatterplot
	            var scaleWidth = Object.values(params_chart.chart_instance.scales)[0].width; var scale_x_MaxValue = Object.values(params_chart.chart_instance.scales)[0].end// - params_chart.chart_instance.scales["x-axis-1"].start;
	            var scaleHeight = Object.values(params_chart.chart_instance.scales)[1].height; var scale_y_MaxValue = Object.values(params_chart.chart_instance.scales)[1].end// - params_chart.chart_instance.scales["y-axis-1"].start

	            //calculate the gap between the previous left position of the chart area and the current left position
	            var gap_left = params_chart.chart_instance.chartArea.left - params_chart.chart_instance.chartArea.left; var gap_top = params_chart.chart_instance.chartArea.top - params_chart.chart_instance.chartArea.top;

	            if (gap_top > 0) {params_chart.brush_area.gap_top = gap_top}

	            //apply the adjustment to the overlay
	            if (!isNaN(gap_left)) {
	                var id = params_chart.chart_instance.canvas.parentNode.id; var querySelector = '#transformer_' + id; var transformer_brush = d3.select(querySelector)
	                
	                
	                // if (gap_left > 0 ) { //&& (gap_left + overlay.x.baseVal.value) !== 0
	                //     transformer_brush.attr('transform', `translate(${params_chart.chart_instance.chartArea.left - gap_left}, ${params_chart.chart_instance.chartArea.top})`);
	                //     //brushBox.call(d3.brush().extent([[0, 0], [530, 253]]))
	                //     var width = params_chart.chart_instance.chartArea.right - params_chart.chart_instance.chartArea.left + gap_left
	                //     transformer_brush.attr('width', width)
	                //     params_chart.brush_area.gap_left = gap_left
	                // }
	                // else if (gap_left === 0) {
	                //     transformer_brush.attr('transform', `translate(${params_chart.chart_instance.chartArea.left}, ${params_chart.chart_instance.chartArea.top})`);
	                // }


	            }
	        }				
		}		


		params_chart.funcLib.sync_legends = function(params_chart, hidden_legends) {
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
	
		params_chart.funcLib.create_figure_number = function(params_chart, sharedParams) {
			params_chart.figure_auto = sharedParams.params_charts.length
		}
		params_chart.funcLib.create_figure_number(params_chart, sharedParams)

	}




	updateChart(params_chart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		var data_type = "data"; var injection_type = "init"; var updateTime
		this.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type, updateTime, sharedParams)

	}


	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

	    var d1 = new Date();
		let data_chart, data_filtred
	    //zone de filtrage
	    //filter the primary data source according to the scope of the vizualisation (limited geographic area, range of time, any specific observation)

	    //data source for the bar chart
	    if (sharedParams.filter_order_origin === "spatial query" && sharedParams.spatial_data && sharedParams.spatial_data.length > 0) {
	    	let data_chart =[], latLng_index
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
	    	data_chart = [...sharedParams.data_main]
	    	
	    }
	    else if (params_chart.transformations.dataset && params_chart.transformations.dataset.length>0 ) {
	    	if (!params_chart.transformations.dataset_ready && params_chart.transformations.filter) {
				data_filtred = filter_local_dataset(params_chart.transformations.filter, params_chart.transformations.dataset);
				//create index
				let i=0; data_filtred.forEach(r=> {r.index = i++})				
			 
				//if the data has lat/lng fields, create a leaflet latLng
				if (params_chart.latLng_fields_params) {
					data_filtred.forEach(r=> {
						r.leaflet_lat_lng = new L.latLng(r[params_chart.latLng_fields_params.lat_fieldName], r[params_chart.latLng_fields_params.lng_fieldName])
					})
				}
				params_chart.transformations.data_main_groupBy_index = _.groupBy(data_filtred, 'index'); 
				params_chart.transformations.dataset_ready = [...data_filtred]
				data_chart = [...params_chart.transformations.dataset_ready]
			}
			else {
				data_chart = [...params_chart.transformations.dataset_ready]
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
			
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here		
		if (Object.keys(filterList).length > 0 || params_chart.to_filter === true) {
			data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, sharedParams);
		}
		//else 
		else {data_filtred = [...data_chart]}



		//case when the result of the crossfilter is an array of data & not an array of promises
		if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length) {
			//data decimation
			data_chart = engage_data_decimation(params_chart, data_filtred);			

			//select the fields requiered
			data_chart = select_required_fields(params_chart, data_chart)

			return data_chart			
		}
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {return []}
		else {
	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_chart)
	        return promise_dataset_ready


		}
	    
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
				sharedParams['time_workers_' + params_chart.id].time_receive_result = time_receive_result

				//filter on the current chart results
				result = result.filter(c=> c.chart === params_chart.transformations.filter_origin)
				var indexes = result.map(r=> r.indexes)

				var result_length = d3.sum(indexes.map(r=> r.length))

				if (result_length === 0) {return []}

				else if (result_length > 0) {
					//match the filtred indexes with the main dataset
					console.time('exec build subset crossfilter scatterChart')

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

					console.timeEnd('exec build subset crossfilter scatterChart')

					//data decimation
					data_chart = engage_data_decimation(params_chart, dataset_filtred);			

					//select the fields requiered
					data_chart = select_required_fields(params_chart, data_chart)

					var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
					sharedParams['time_workers_' + params_chart.id].time_process_result = time_process_result

					return data_chart
				}
			}
		}

		//preserve the fields to be used
		function select_required_fields(params_chart, data_chart) {
			var label_tooltip_fields_keep, label_tooltip_title, fields_to_use;
			if (params_chart.list_of_axis.length === 0 && params_chart.label_tooltip) {
				label_tooltip_fields_keep = params_chart.label_tooltip.map(o=> o.field_detail).filter(o=> o !== undefined)
				label_tooltip_title = params_chart.label_tooltip.map(o=> o.field_title).filter(o=> o !== undefined)[0]
				label_tooltip_fields_keep.push(label_tooltip_title)
				if (params_chart.category_field) label_tooltip_fields_keep.push(params_chart.category_field)

				params_chart.list_of_axis = [...label_tooltip_fields_keep]
			}
			else {
				label_tooltip_fields_keep = [...params_chart.list_of_axis]	
			}

			//add x, y & r fields			
			if (label_tooltip_fields_keep && label_tooltip_fields_keep.length > 0) {
				fields_to_use = [params_chart.x_field, params_chart.y_field, params_chart.r_field].filter(f=> f).concat(label_tooltip_fields_keep)
			}
			else {
				fields_to_use = [params_chart.x_field, params_chart.y_field, params_chart.r_field].filter(f=> f)
			}

			fields_to_use = deduplicate_array(fields_to_use)
			var dataset_filtred = data_chart.map(o=> _.pick(o, fields_to_use));

			return dataset_filtred
		}



		//data decimation
		function engage_data_decimation(params_chart, data_chart) {				
			if (data_chart.length > params_chart.limit_decimation) {
				data_chart = data_decimation(params_chart, data_chart)
			}
			return data_chart
		}


			

  
	    function round_values(dataset_ChartJS, agg_fieldName) {
	    	for (var d = 0; d < dataset_ChartJS.length; d++) {	        
	            dataset_ChartJS[d][agg_fieldName] = Math.round(dataset_ChartJS[d][agg_fieldName] * 100) / 100
	        }
	        return dataset_ChartJS
	    }



	}





	prepare_data_p2(data_input, params_chart, sharedParams) {
		//processus de création d'un nouveau dataset: 
		//params_chart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		//répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
			var categories, category_field
					
			params_chart.nb_axis = 1
			params_chart.legends_field = this.category_field || undefined
			// params_chart.active_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.active_legends[params_chart.legends_field] = [];
			// params_chart.hidden_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.hidden_legends[params_chart.legends_field] = [];
			if (!params_chart.active_legends.hasOwnProperty(params_chart.legends_field)) {
				params_chart.active_legends[params_chart.legends_field]=[]
			}
			if (!params_chart.hidden_legends.hasOwnProperty(params_chart.legends_field)) {
				params_chart.hidden_legends[params_chart.legends_field] = [];
			}
			params_chart.data_input = data_input
			//break if the data_input is empty
			if (data_input && data_input.length === 0) {
				return
			}

			//if the chart is bublbe type, scale the r field (convert the raw value into pixels)
			if (params_chart.chart_sub_type === 'bubble' && params_chart.r_field && params_chart.radius_params) {
				const min_r_value = d3.min(data_input, r=> r[params_chart.r_field]);
				const max_r_value = d3.max(data_input, r=> r[params_chart.r_field]);

				var r_field_in_px
				var scale_sqrt = d3.scaleSqrt().range([0, params_chart.radius_params.max_radius]).domain([min_r_value, max_r_value]);
				var radius_factor = params_chart.radius_params.radius_factor || 1
				data_input.forEach(r=> {
					//r_field_in_px = ((r[params_chart.r_field] / max_r_value) * params_chart.radius_params.max_radius) * params_chart.radius_params.radius_factor
					r_field_in_px = scale_sqrt(r[params_chart.r_field]) * radius_factor
					r.r_field_in_px = r_field_in_px
				})
			}

			//if we have fields to decode
			if (params_chart.fields_to_decode) {
				//if the fields_to_decode is encapsulated into an array, put it into an object
				if (params_chart.fields_to_decode.constructor == Array ) {
					params_chart.fields_to_decode = params_chart.fields_to_decode[0]
				}
				if (params_chart.fields_to_decode.constructor == Object ) {
					var lookupTable = params_chart.fields_to_decode.lookupTable;
					var mainKey = params_chart.fields_to_decode.mainKey;
					var lookupKey = params_chart.fields_to_decode.lookupKey
					var fields = params_chart.fields_to_decode.fields
											
					params_chart.fields_to_decode.fields.forEach(f=> {
						var res = []
						data_input.map(r=> {res.push(r.hasOwnProperty(f))})
						if (res.filter(r=> !r).length > 0) {
							join_v2(data_input, lookupTable, mainKey, lookupKey, fields)
							res = []
							//1.obtenir les catégories (les communes par ex)
							//var categories = data_input.map(r=> r[f])
							categories = deduplicate_dict(data_input, f)
							params_chart.data_input = data_input

							category_field = f

						}
					})
				} 
			}
			else {
				//1.obtenir les catégories (les communes par ex)
				//var categories = data_input.map(r=> r[this.category_field])
				categories = deduplicate_dict(data_input, this.category_field)
				category_field = this.category_field

			}			


			sort_dataset(params_chart, categories)
			function sort_dataset(params_chart) {
				if (params_chart.sort && params_chart.sort.fieldName && params_chart.sort.order) {						
					if (params_chart.sort.order === 'asc') {
						categories.sort()
					}
					else if (params_chart.sort.order === 'desc') {
						categories.sort()	
						categories.reverse()
					}
				}				
			}
			var nb_categories;
			if (params_chart.category_field)  {
				nb_categories = categories.length; //var nb_sous_categories = sous_categories.length;
				params_chart.nb_categories = categories.length;
			}


        	if (params_chart.category_field && Object.keys(params_chart.backgroundColorArray_source).length === 0) {
        		var i = 0
        		var select_generated_color = function(backgroundColorArray_source, i) { return backgroundColorArray_source[i] }//.replace("0.65", "1")
        		var status_colors = "empty";
        		//chech if a color has been generated for the same category field, if so re use it

     			if (sharedParams.registed_colors.hasOwnProperty(category_field)) {
     				params_chart.backgroundColorArray_source = {...sharedParams.registed_colors[category_field]}
     			}
     			else {
     				var backgroundColorArray_source = generateColors(nb_categories, params_chart.colorsConfig.scheme, params_chart.colorsConfig.colorsOrder, category_field, sharedParams)
					categories.forEach(axis => {
						params_chart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						
					})
     			}
        	}
			else if (Object.keys(params_chart.backgroundColorArray_source).length === 0) {
				var rand = Math.random()
				var color = d3.interpolateRdYlBu(rand)
				params_chart.backgroundColorArray_source[`${params_chart.id}_no_axis`] = [color]
			}

			if (params_chart.category_field && !sharedParams.registed_colors.hasOwnProperty(params_chart.category_field)) {
				sharedParams.registed_colors[category_field] = {...params_chart.backgroundColorArray_source}
			}



	        
			//créer les datasets regroupés par categ
			if (params_chart.category_field) {
				let groupedItem, groups, group
				groupedItem = _.groupBy(data_input, record => record[category_field])
				groups = _.mapValues(groupedItem, function(value, key) {
				
					var backgroundColorArray = _.repeat(params_chart.backgroundColorArray_source[key]+";", value.length).split(";")
					if (params_chart.chart_sub_type === 'bubble' && params_chart.radius_params && params_chart.r_field) {
						group = {label: key, backgroundColor: backgroundColorArray, backgroundColor_source: [...backgroundColorArray], data: value.map(o=> {return {x: o[params_chart.x_field], y: o[params_chart.y_field], r: o.r_field_in_px, o}}), pointStyle: 'circle'}	
					}
					else {
						group = {label: key, backgroundColor: backgroundColorArray, backgroundColor_source: [...backgroundColorArray], data: value.map(o=> {return {x: o[params_chart.x_field], y: o[params_chart.y_field], o}}), pointStyle: 'circle'}	
					}
					
					return group
				})		

				params_chart.data[1].datasets = [...Object.values(groups)]
			}	
			else {
				var dataset
				const color = params_chart.backgroundColorArray_source[`${params_chart.id}_no_axis`]
				data_input.forEach(r=> {
					dataset = {label: undefined, backgroundColor: color, data: [r].map(o=> {return {x: o[params_chart.x_field], y: o[params_chart.y_field], o}}), pointStyle: 'circle'}	
					params_chart.data[1].datasets.push(dataset)
				})
			}

			//.sauvegarder une image des données source avant transformation
			if (params_chart.data_source_raw.length === 0) {
				params_chart.data_source_raw = data_input
				if (categories) {params_chart.data_source[0].labels.push(categories)}
		        params_chart.data_source[1].datasets = params_chart.data[1].datasets

		    }


	}


	init_chart(params_chart, sharedParams) {	
		
		
		var plugin = {
			id: "scatterChart_legend_handler",
		    beforeDraw: function (chart) {
		    		var this_chart = params_chart.chart_instance
		            //sort legends as specified
		            if (params_chart.legends_params.sort === undefined || params_chart.legends_params.sort === "") {params_chart.legends_params.sort = "asc"}
		            chart.legend.legendItems.sort(trier("text", params_chart.legends_params.sort))
		        
		            let legends = chart.legend.legendItems;
		            try {
			            legends.forEach(function (e, i) {
			              	if (e.text !== "" && typeof(e.text) !== "object") {
				              	var backgroundColor = params_chart.data[1].datasets.filter(l=> l.label === e.text);
				              	if (backgroundColor.length > 0) {backgroundColor = backgroundColor[0].backgroundColor[0]}
				              	
				              	if (backgroundColor.constructor == String) {
					              	e.fillStyle = backgroundColor
					            }
					        }
			              	//e.strokeStyle = "rgba(252, 252, 252, 1)"
			             
						/*else {
			              	var col = this_chart.config.data.datasets[i].borderColor
			              	e.fillStyle = col
			              	e.strokeStyle = col
			              }*/

			            });
			        }
			        catch (error) {console.log(error)}
		    }
		

		};
		
		var display_legends = true
		if (!params_chart.category_field) display_legends = false
		if (params_chart.nb_categories > 8) display_legends = false

		var scatterChart = new Chart(this.ctx, {
			type: params_chart.chart_sub_type,
			data: {},
			options: {
				maintainAspectRatio: false,
				title: {
					display: true,
					text: this.title,
				},			    
				scales: {
					x: {
						type: 'linear',
						position: 'bottom',			                
						beginAtZero: true,		                    
						title: {			
							display: true,			        
							text: this.title_x_axis
						}		                    
					},
					y: {
						type: 'linear',
						position: 'left',			               
						beginAtZero: true,
						title: {
							display: true,
							text: this.title_y_axis
						}		                    
					}    
				},
				interaction: {
					mode: 'nearest'
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: function(tooltipItem) {								
							if (tooltipItem.constructor == Array) {tooltipItem = tooltipItem[0]}
							var field_title = params_chart.label_tooltip.find(e=> e.field_title).field_title
							return params_chart.label_tooltip.filter(e=> e.field_title)[0].as + ": " + tooltipItem.raw.o[field_title]
							}, 
							label: function(tooltipItem) {

								//console.time('time display tooltip')
								// var tooltips_source = params_chart.data_input.find(r=> r[params_chart.x_field] === tooltipItem.xLabel && r[params_chart.y_field] === tooltipItem.yLabel)
								// var tooltips_final= params_chart.label_tooltip.filter(e=> e.field_detail).map(e=> {var l = e.as + ": " +  tooltips_source[e.field_detail];
								// 	return l })
								//console.timeEnd('time display tooltip')
								if (tooltipItem.constructor == Array) {tooltipItem = tooltipItem[0]}									

								var tooltips_final= params_chart.label_tooltip.filter(e=> e.field_detail).map(e=> {var l = e.as + ": " +  tooltipItem.raw.o[e.field_detail];
																return l })									
								return tooltips_final
							}
						},
						backgroundColor: 'rgba(0, 0, 0, 0.6)',
						titleFontSize: 12,
						titleFontColor: '#fff',
						bodyFontColor: '#fff',
						bodyFontSize: 12,
						displayColors: false,
						
					},
					legend: {
						labels : {usePointStyle : true},
						display: display_legends,
						position: "top",
						align: "start",
						padding: 30,
						rtl: true,
						onHover: function(e) {
							if (e) {
								e.native.target.style.cursor = 'pointer';
							}
							},
						/*onClick: function (evt, item) {
							//preserve default behaviour on click
							Chart.defaults.global.legend.onClick.call(this, evt, item)
							//register click event
							if (evt) {
								params_chart.legend_clicked = true
							}			                     	
							}*/
						onClick: function(evt, item) {
							
							//Chart.defaults.global.legend.onClick.call(this, evt, item)
							var pos_dataset = this.chart.data.datasets.map(l=> l.label).indexOf(item.text);
							var legend_clicked = this.chart.getDatasetMeta(pos_dataset).hidden;
							if (legend_clicked === false || legend_clicked === null) {
								this.chart.getDatasetMeta(pos_dataset).hidden = true;
								params_chart.legend_clicked = true;
								params_chart.chart_instance.update(0)
							}
							else {
								this.chart.getDatasetMeta(pos_dataset).hidden = false;
								params_chart.legend_clicked = true;
								params_chart.chart_instance.update(0)
							}

							
							console.log('legend_clicked scatterChart: ' + item.text)
						}		                      
					}						
				}
									
			},
			plugins: [plugin]
		});
			//scatterChart.options.legend.labels.usePointStyle = true




		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"; var updateTime
		this.inject_metadata(scatterChart, params_chart, data_type, injection_type, updateTime, sharedParams)
		params_chart.chart_instance.canvas.style.opacity = '0'



		return scatterChart 				
	}


	

	inject_metadata(scatterChart, params_chart, data_type, injection_type, updateTime, sharedParams) {


		//alimenter avec les datasets
		var l, i, datasets = [];
		if (injection_type === "init") {
			l = params_chart[data_type][1].datasets.length;
			datasets = [];
			for (i = 0; i < l; i++) {
				datasets.push(params_chart[data_type][1].datasets[i])
				scatterChart.config.data.datasets[i] = {...(datasets[i])}
			}
			//scatterChart.config.data.datasets = [...datasets]
		}
		else if (injection_type === "update") {
			l = params_chart[data_type][1].datasets.length;
			datasets = [];

			for (i = 0; i < l; i++) {
				try {
					datasets.push(params_chart[data_type][1].datasets[i])
					scatterChart.config.data.datasets[i].data = [...datasets[i].data]
					//datasets[i].label ? scatterChart.config.data.datasets[i].label = datasets[i].label : {}
					scatterChart.config.data.datasets[i].label = datasets[i].label
					scatterChart.config.data.datasets[i].backgroundColor = [...datasets[i].backgroundColor];
					scatterChart.config.data.datasets[i].backgroundColor_source = [...datasets[i].backgroundColor_source];	
				}
				catch (error) {
					//console.log("scatterChart ko:" + error.stack)
					scatterChart.config.data.datasets.push({label: datasets[i].label, data: datasets[i].data, backgroundColor: datasets[i].backgroundColor, backgroundColor_source: datasets[i].backgroundColor_source})
				}
			}

			//clean datasets
			scatterChart.data.datasets = scatterChart.data.datasets.filter(d=> d.label !== "")
				

			//regenerate svg parent brush
			setTimeout(() => {
				params_chart.funcLib.generate_svg_brush(params_chart)
			}, 1000); 
			sharedParams.highlight_chart_border(params_chart)
			
		}



		if (updateTime === undefined && !params_chart.updateTime) {params_chart.updateTime = 750}
	    

		if (scatterChart.config.data.datasets.length > 0 && scatterChart.config.data.datasets[0].data.length > 0 && !params_chart.delay_rendering) {
			var t1 = (new Date())/1000
			//if (!params_chart.category_field) params_scatterChart_com_immobilier_prix_surface.chart_instance.options.legend.display=false
			scatterChart.update(updateTime)			
			var t2 = (new Date())/1000; var tf = parseFloat((t2-t1).toFixed(3))
			var event_time = new Date()
			sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "refresh chart","chart": params_chart.id, exec_time: tf, event_time: event_time.toLocaleString()})	
			params_chart.init_render = false
		}
		else {
			sharedParams.charts_with_spinners?.[params_chart.id]?.hide_spinner(params_chart)
		}

		


		//procedure manuelle pour remmetre les couleurs source
		/*bar1.config.data.datasets[2].backgroundColor = _.cloneDeep(params_bar1_deepCopy.data[1].datasets[2].backgroundColor)*/

		//register the chart instance in the param array
		params_chart.chart_instance = scatterChart


		//if a brush is drawn, conserve it
		if (params_chart.prepare_data_type === "preserve backgroundColor" || Object.values(params_chart.brush_values).length > 0) {
			
			params_chart.funcLib.adapt_brush_v2(params_chart)
		}
		else {
			params_chart.funcLib.reposition_brushTransformer(params_chart)
		}



		//if the chart shares legends with another chart, sync their legends
		if (params_chart.sync_legends) {
			params_chart.funcLib.sync_legends(params_chart, params_chart.sync_legends)
			params_chart.sync_legends = undefined
			//if (!params_chart.category_field) params_scatterChart_com_immobilier_prix_surface.chart_instance.options.legend.display=false
			scatterChart.update(updateTime)
		}



		return scatterChart
	}




	wrapper_brush_creator(params_chart) {
		if (params_chart.brush_mode) {
			var check_chart_rendering = setInterval(()=>{
				var sum_margin=0; 
				Object.values(params_chart.chart_instance.chartArea).forEach(e=> sum_margin=sum_margin+e)
				var sum_heightWidth = params_chart.chart_instance.height + params_chart.chart_instance.width
				//if (!isNaN(sum_margin) && sum_heightWidth > 0) {
					
				var parent_container_display = check_parent_display(params_chart)				
				if (parent_container_display.chart_display_on) {	
					//generate sizing legend
					if (params_chart.legend_size?.display && params_chart.radius_params) {
						params_chart.funcLib.brush(params_chart, sharedParams)
						generate_legend_size(params_chart);
						clearInterval(check_chart_rendering);
						//create the progress spinner
						create_progress_spinner(params_chart)

						var monitor_generate_legend_size = setInterval(() => {
							if (params_chart.ind_generate_legend_size) {
								document.getElementById('parent_container_'+params_chart.id).style.opacity = '1'
								params_chart.chart_instance.canvas.style.opacity = '1'
								clearInterval(monitor_generate_legend_size)
							}
						}, 500);
	
					}
					else {
						params_chart.funcLib.brush(params_chart, sharedParams)
						clearInterval(check_chart_rendering)
						//create the progress spinner
						create_progress_spinner(params_chart)
						//reposition brush
						//params_chart.sharedParams.position_brush_transformer(params_chart)

						var monitor_generate_brush = setInterval(() => {
							if (params_chart.ind_generate_brush) {
								document.getElementById('parent_container_'+params_chart.id).style.opacity = '1'
								params_chart.chart_instance.canvas.style.opacity = '1'
								clearInterval(monitor_generate_brush)
							}
						}, 500);
	
					}

					


				}
			}, 1000)
		}
		else {
			//create the progress spinner
			create_progress_spinner(params_chart)			
			document.getElementById('parent_container_'+params_chart.id).style.opacity = '1'
			params_chart.chart_instance.canvas.style.opacity = '1'
		}
	}



	//old code
		// maj_couleurs(scatterChart, params_chart) {
		// 	//on entre dans cette func pour enlever le focus posé sur les segments

		// 	var nb_categories = params_chart.nb_categories;
		// 	var backgroundColorArray = [];

		// 	//parcours catégories
		// 	for (var i = 0; i < nb_categories; i++) {		
				
		// 		//parcours sous-catégories
		// 		var nb_sous_categories = params_chart.nb_sous_categories;
		// 		for (var a = 0; a < nb_sous_categories; a++) {
		// 			backgroundColorArray.push(params_chart.data[1].datasets[a].backgroundColor[i])
		// 			var backgroundColor = params_chart.data_source[1].datasets[a].backgroundColor[i];
		// /*			var borderColor = params_chart.data[1].datasets[a].borderColor[i];*/
		// 			scatterChart.config.data.datasets[a].backgroundColor[i] = backgroundColor;
		// 			/*scatterChart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";*/
		// 		}

		// 		/*scatterChart.config.data.datasets[i].backgroundColor = backgroundColorArray;*/
		// 		scatterChart.update();



	// 	}
	// }	

	//old code
		// reset_border_color(this_chart, params_chart_deepCopy) {
		// 	/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_chart_deepCopy);*/

		// 	//remettre config sans bordures
		// 	var nb_categories = params_chart_deepCopy.nb_categories;

		// 	//parcours catégories
		// 	for (var i = 0; i < nb_categories; i++) {		
				
		// 		//parcours sous-catégories
		// 		var nb_sous_categories = params_chart_deepCopy.nb_sous_categories;
		// 		for (var a = 0; a < nb_sous_categories; a++) {
		// 			this_chart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";
		// 		};
				
		// 	}

		// 	this_chart.update();

		// }


	show_spinner(params_chart_target) {
		var chart_display
		if (params_chart_target.chart_type === 'chartJS') {
			chart_display = document.getElementById(params_chart_target.ctx.parentElement.id)
		}
		else {chart_display = document.getElementById(params_chart_target.id)}
		var spinner_display = document.getElementById(params_chart_target.id + '_spinner')

		if (spinner_display) {
			spinner_display.style.display = 'grid'
			chart_display.style.display = 'none'
		}

		
	}	

	hide_spinner(params_chart_target) {
		var chart_display
		if (params_chart_target.chart_type === 'chartJS') {
			chart_display = document.getElementById(params_chart_target.ctx.parentElement.id)
		}
		else {chart_display = document.getElementById(params_chart_target.id)}
		var spinner_display = document.getElementById(params_chart_target.id + '_spinner')

		if (spinner_display) {
			spinner_display.style.display = 'none'
			chart_display.style.display = 'grid'
		}
		
		
	}



}




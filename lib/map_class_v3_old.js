class Map_circles {

	constructor(params_chart) {
		if (params_chart) {
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

	}

	createChart(params_chart, sharedParams, data_to_transform) {
		//register the map class in the params object
		params_chart.map_class = this		

		this.setup_defaults_parameters(params_chart, sharedParams)
		params_chart.sharedParams = sharedParams

		var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)

		var t1 = new Date()
		this.prepare_data_p2(data_filtred, params_chart, sharedParams)
		console.log('classic map prepare_data_p2 time: ' + (new Date() - t1))

	
		//init the map
		var t1 = new Date()
		var chart_instance = this.init_chart(params_chart, sharedParams)
		console.log('classic map init_chart time: ' + (new Date() - t1))


		//register the instanciator
		params_chart.instanciator = this

		params_chart.chart_sub_type = "map"

		this.setup_legends(params_chart, sharedParams, 'init')


		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

		//create the progress spinner
		//create_progress_spinner(params_chart)		

	}

	updateChart(params_chart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		this.inject_metadata(params_chart.map_instance, params_chart)

	}


	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

	    var d1 = new Date();

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
			filterList = formFilterArray(params_chart)
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
			//data_chart = getFiltredData(data_chart, filterList, params_chart.id, sharedParams)
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if (Object.keys(filterList).length > 0 || params_chart.to_filter === true) {
			var data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, data_chuncks, sharedParams)
		}
		else {
			var data_filtred = [...data_chart]
		}



		if (data_filtred.constructor === Array && data_filtred.length > 0) {			
			//data decimation
			data_filtred = engage_data_decimation(params_chart, data_filtred);
			
			//select the fields requiered
			var data_filtred = select_required_fields(params_chart, data_filtred)

			return data_filtred
		}			
		//if no data points to display, return empty array
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {return []}
		else {

	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_chart)
	        return promise_dataset_ready

			async function process_worker_result(data_filtred, sharedParams, params_chart) {
				var result, chart
				await data_filtred.then(r=> result = r)

				var time_receive_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
				sharedParams['time_workers_' + params_chart.id]["time_receive_result"] = time_receive_result

				//check if the result is returned by another chart that shares the same filter id
				//if (params_chart.transformations['filter_origin'] !== params_chart.id)
				
				//filter on the current chart results
				result = result.filter(c=> c.chart === params_chart.transformations['filter_origin'])
				var indexes = result.map(r=> r.indexes)

				var result_length = d3.sum(indexes.map(r=> r.length))
				if (result_length === 0) {return []}

				else if (result_length > 0) {
					//match the filtred indexes with the main dataset
					console.time('exec build subset crossfilter Map_circles')

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

					console.timeEnd('exec build subset crossfilter Map_circles')


					//if the filtred dataset is reclaimed by the map's brush circle interaction, return full format here
					if (sharedParams.filter_order_origin === 'spatial query') {
						return dataset_filtred
					}

					//data decimation
					data_chart = engage_data_decimation(params_chart, dataset_filtred);
					
					//select the fields requiered
					data_chart = select_required_fields(params_chart, data_chart)

					var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
					sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

					//release proxies workers
					//Object.values(sharedParams.Workers_crossfilter).forEach(proxy=> {proxy.worker_instance[Comlink.releaseProxy]})

					return data_chart
				}
				
			}
		}


		
		function engage_data_decimation(params_chart, data_chart) {				
			if (data_chart.length > params_chart.limit_decimation) {
				data_chart = data_decimation(params_chart, data_chart)
			}
			return data_chart
		}



		//select the fields requiered
		function select_required_fields(params_chart, data_chart) {
			var popup_fields = []; Object.keys(params_chart.popup_fields).forEach(key => popup_fields.push(params_chart.popup_fields[key]["fieldName"]));
			var fields = []; Object.assign(fields, popup_fields); fields.push(params_chart.params_fields.lat); fields.push(params_chart.params_fields.lng); fields.push(params_chart.params_fields.hue_params.hue_field)
			var dataset = [...data_chart.map(l=> _.pick(l, fields))]
			return dataset
		}
	    


	    
	    function round_values(dataset, agg_fieldName) {
	    	for (var d = 0; d < dataset_ChartJS.length; d++) {	        
	            dataset[d][agg_fieldName] = Math.round(dataset[d][agg_fieldName] * 100) / 100
	        };
	        return dataset
	    }

	}




	prepare_data_p2(data_input, params_chart, sharedParams) {
			const hue_field = params_chart.params_fields.hue_params.hue_field;
			params_chart.legends_field = hue_field + "_binned"
			const size_field = params_chart.params_fields.size_field; 
			var opacity_field = undefined
			params_chart.params_fields.opacity_params !== undefined ? opacity_field = params_chart.params_fields.opacity_params.opacity_field : opacity_field = undefined;
			var data_circle; var circleColor; var circleSize; var x_y; var el; var popup; var fieldName; var fieldValue; var p1; var textAfter; var textBefore; var coef_colorHue;
			var size_coef; const radius = 5; var opacity; var domain_opacity; var circleOpacity; var opacity_coef; var hue_color; var strokeColor

			params_chart.nb_axis = 1
			
			params_chart.data[1].markers = []; params_chart.data[1].popups = []; params_chart.data[1].x_y = []; 
			if (data_input.length === 0) {
				console.log({map: "data_input is empty"})
				return
			}

			//obtenir les catégories (les communes par ex)


			//get min & max values	 
			var domain_hue = params_chart.params_fields.hue_params.domain
			opacity_field !== undefined ? domain_opacity = params_chart.params_fields.opacity_params.domain : domain_opacity = ["min", "max"];

			if (domain_hue === undefined) {domain_hue = ["min", "max"]}
			if (domain_opacity === undefined) {domain_opacity = ["min", "max"]}





			//get data extent for the hue field
			var domain_scope = params_chart.params_fields.hue_params.domain_scope;
			//if the user specifies to use the whole dataset
			if (domain_scope === "whole_dataset") {
				params_chart.hue_dataset_extent = dataset_extent(domain_hue, sharedParams.data_main, hue_field);
			}
			else if (domain_scope === "filtred_dataset" || domain_scope === undefined) {
				params_chart.hue_dataset_extent = dataset_extent(domain_hue, data_input, hue_field);
			}			
			var hueMin = params_chart.hue_dataset_extent.min; var hueMax = params_chart.hue_dataset_extent.max; 
			params_chart.params_fields.hue_params.hue_color !== undefined ? hue_color = params_chart.params_fields.hue_params.hue_color : hue_color = "interpolateBlues";






			//get data extent for the opacity field
			var domain_scope
			params_chart.params_fields.opacity_params !== undefined ? domain_scope = params_chart.params_fields.opacity_params.domain_scope : domain_scope = undefined;
			//if the user specifies to use the whole dataset
			if (domain_scope === "whole_dataset") {
				params_chart.opacity_dataset_extent = dataset_extent(domain_opacity, sharedParams.data_main, opacity_field);
			}
			else if (domain_scope === "filtred_dataset" || domain_scope === undefined) {
				params_chart.opacity_dataset_extent = dataset_extent(domain_opacity, data_input, opacity_field);
			}
			var opacityMin = params_chart.opacity_dataset_extent.min; var opacityMax = params_chart.opacity_dataset_extent.max;
			




			
			//bounds_adjustment
			if (params_chart.bounds_adjustment.adjustment === true) {
				var essai = this.exclusion_extrem_coordinates(params_chart ,data_input, params_chart.bounds_adjustment.domain)
				if (essai.length > 0) {
					data_input = [...essai]
				}
			}

			//get data to build popup & data points for projection			
			data_input.forEach(r=> {
				//form x y coord
				x_y = [r[params_chart.params_fields.lat], r[params_chart.params_fields.lng]];


				//form the data circle
				//setup the color
				coef_colorHue = ((r[hue_field] - hueMin) / (hueMax - hueMin)).toPrecision(4);


				//if the process is fired by legends selection, take the color registred in the 				
				if (params_chart.params_datapoints.circles_color_mode === "discrecte_color") {

					var hue_value = r[hue_field]					
				
					circleColor = params_chart.legendColors.filter(e=> hue_value >= e.x0 && hue_value < e.x1).map(c=> c.color)[0]
				}
				else if (params_chart.params_datapoints.circles_color_mode === "continuous_color") {
					circleColor = d3[hue_color](coef_colorHue);
				}

				//circleColor = d3[hue_color](coef_colorHue);

				//form the radius
				if (size_field === undefined) {
					circleSize = radius;
					size_coef = 1
				}
				else {
					size_coef = r[size_field]
					circleSize = size_coef * radius
				}
				
				//setup the opacity				
				if (opacity_field === undefined) {
					circleOpacity = 1;
				}
				else {
					circleOpacity = ((r[opacity_field] - opacityMin) / (opacityMax - opacityMin)).toPrecision(4);
					params_chart.params_fields.opacity_params.reverse === true ? circleOpacity = 1 - circleOpacity: {}
				}
				
				//setup stroke color
				params_chart.params_datapoints.circleColor === "red" ? strokeColor = "red" : strokeColor = circleColor


				data_circle = new L.circleMarker(x_y, {
					radius: circleSize,
					color: strokeColor,
					weight: 0.6,
					fillColor: circleColor,
					fillOpacity: circleOpacity,
					original_color: circleColor,
					index: x_y[0] + "-" + x_y[1]
				})
				data_circle.options.size_field = size_field; data_circle.options.size_coef = size_coef


				
				params_chart.data[1].markers.push(data_circle); 				
				params_chart.data[1].x_y.push(x_y)

			})

			params_chart.data[1].datasets = data_input

	    			

 
			//.sauvegarder une image des données source avant transformation
			if (params_chart.data_source_raw.length === 0) {
				params_chart.data_source_raw = data_input
				//params_chart.data_source[0].labels.push(categories)
		        params_chart.data_source[1].markers = data_input; params_chart.data_source[1].popups = [...params_chart.data[1].popups]; 
		        params_chart.data_source[1].borders = [...params_chart.data[1].x_y]; 

		    }		

	}


	init_chart(params_chart, sharedParams) {		

	    //general container for the title + map & legend
	    const grid_title_controls_map_legend =  document.createElement('div'); 
	    Object.assign(grid_title_controls_map_legend, {id: 'grid_title_controls_map_legend_' + params_chart.htmlNode, style: 'display: grid; grid-template-columns: 85% 15%; grid-column-gap: 1%'}) 

	    //grid container for the map & legend
	    const grid_title_controls_map =  document.createElement('div'); 
	    Object.assign(grid_title_controls_map, {id: 'grid_title_controls_map_' + params_chart.htmlNode, style: 'display: inline-grid; grid-template-rows: auto auto auto; grid-row-gap: 1%'})



		var htmlNode = document.getElementById(params_chart.htmlNode)
		//var mymap = new L.map(htmlNode).fitBounds([[51.072228, 2.528016], [42.442288, 3.159714]]);
		var mymap = new L.map(htmlNode, {
			editable: true, 
			fullscreenControl: true,
			fullscreenControlOptions: {position: 'topleft'}
		}).fitBounds([[51.072228, 2.528016], [42.442288, 3.159714]]);
		
	    var parentNode = htmlNode.parentElement


		var layer = new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		})
		mymap.addLayer(layer)

		//------------init layerGroup
		//cercle fictif
		/*var cercle = new L.circle([51.520, -0.11], 2, {
			color: "white",
			weight: 1,
			fillColor: "white",
			fillOpacity: 1
		});
		list_markers.push(cercle);*/

		//register the map instance
		params_chart.map_instance = mymap
		params_chart.chart_type = "leaflet"
		params_chart.chart_subType = "points"





		var layerGroup1 = this.inject_metadata(mymap, params_chart)

	

		//create the title
		
			//1.get the parent node of the map
			var mymap = document.getElementById(params_chart.htmlNode); 
			
			//2.create the title
			var titleContainer = document.createElement('div'); titleContainer.style.display = 'grid'; titleContainer.id = "titleContainer_" + params_chart.htmlNode
			var title = document.createElement('span'); title.id = params_chart.htmlNode + '_title'; title.style = 'align-self: center; justify-self: center'; 
			if (params_chart.title) {title.innerHTML = params_chart.title} else {title.innerHTML = 'Title of the map'}
		

		//create layer for the controls
			//create grid container
			var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: 30px 30px; justify-items: center; margin-top: -8%'; controlsContainer.id = "controlsContainer_" + params_chart.htmlNode

			//create sub grids containers
			var grid_rect = document.createElement('div'); grid_rect.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_rect.id = "grid_rect_" + params_chart.htmlNode
			var grid_circle = document.createElement('div'); grid_circle.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_circle.id = "grid_circle_" + params_chart.htmlNode

			//create control for brush rect
			var controlBrushRect = document.createElement('img'); controlBrushRect.src = "css/font-awesome-svg/square-regular.svg"; controlBrushRect.id = "brushRect_" + params_chart.htmlNode
			controlBrushRect.style.width = "18px"; 
			controlBrushRect.addEventListener("mouseover", function(evt){
				evt.target.style.cursor = "pointer"
				evt.target.style.filter = "invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)"
			} )

			controlBrushRect.addEventListener("mouseout", function(evt){					
				evt.target.style.filter = ""
			} )
			controlBrushRect.title = 'Rectangular brush'
		
		//create control for brush circle
			var controlBrushCircle = document.createElement('img'); controlBrushCircle.src = "css/font-awesome-svg/circle-regular.svg"; controlBrushCircle.id = "brushCircle_" + params_chart.htmlNode
			controlBrushCircle.style.width = "21px"; 
			controlBrushCircle.addEventListener("mouseover", function(evt){ 			        	
				evt.target.style.cursor = "pointer"
				evt.target.style.filter = "invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)"
			} )

			controlBrushCircle.addEventListener("mouseout", function(evt){					
				evt.target.style.filter = ""
			} )
		
		
			controlBrushCircle.title = 'Circular brush'
		


			//create tooltips
			// var tooltip_rect = document.createElement('span'); tooltip_rect.innerHTML = 'Rectangular brush'; tooltip_rect.id =  params_chart.htmlNode + '_tooltip_rect'; //tooltip.className = "tooltiptext"
			// tooltip_rect.style = 'font-size: 14px; visibility: hidden; opacity: 0; transition: opacity 0.6s; width: 125px; background-color: #555; color: #fff; text-align: center; padding: 5px 0; border-radius: 6px;'

			// var tooltip_circle = document.createElement('span'); tooltip_circle.innerHTML = 'Circular brush'; tooltip_circle.id = params_chart.htmlNode + '_tooltip_circle'; //tooltip.className = "tooltiptext"
			// tooltip_circle.style = 'font-size: 14px; visibility: hidden; opacity: 0; transition: opacity 0.6s; width: 115px; background-color: #555; color: #fff; text-align: center; padding: 5px 0; border-radius: 6px;'


			
			//add hover effetc
			// controlBrushRect.addEventListener("mouseover", function(evt){
			// 	if (tooltip_rect.style.visibility === 'hidden') {
			// 		tooltip_rect.style.visibility = 'visible';
			// 		tooltip_rect.style.opacity = '1'
			// 	}
			// })

			// controlBrushRect.addEventListener("mouseleave", function(evt){
			// 	tooltip_rect.style.visibility = 'hidden';
			// 	tooltip_rect.style.opacity = '0'
			// })

			// controlBrushCircle.addEventListener("mouseover", function(evt){
			// 	if (tooltip_circle.style.visibility === 'hidden') {
			// 		tooltip_circle.style.visibility = 'visible';
			// 		tooltip_circle.style.opacity = '1'
			// 	}
			// })

			// controlBrushCircle.addEventListener("mouseleave", function(evt){
			// 	tooltip_circle.style.visibility = 'hidden';
			// 	tooltip_circle.style.opacity = '0'
			// })

		//create container for the brush controls
			// var controlsContainer = document.createElement('div'); controlsContainer.style.display = 'grid'; controlsContainer.style.width = 'fit-content'; controlsContainer.style.gridColumnGap = '0.5em'
			// var gridTemplateColumns = "auto ".repeat(2)
			// controlsContainer.style.gridTemplateColumns = gridTemplateColumns;


			

		//append created elements to the dom
			titleContainer.appendChild(title)

			//brush rect
			//grid_rect.appendChild(tooltip_rect)
			grid_rect.appendChild(controlBrushRect)

			//brush circle
			//grid_circle.appendChild(tooltip_circle)
			grid_circle.appendChild(controlBrushCircle)

			//add controls to a common grid
			controlsContainer.appendChild(grid_rect); controlsContainer.appendChild(grid_circle)

			//add title container to general container (holds title + controls)
			grid_title_controls_map.appendChild(titleContainer)
			//add controlsContainer to general container (holds title + controls)
			grid_title_controls_map.appendChild(controlsContainer)
			//add map to general container (holds title + controls)
			grid_title_controls_map.appendChild(mymap)
			//add general container  to the parent node
			grid_title_controls_map_legend.appendChild(grid_title_controls_map)

			parentNode.appendChild(grid_title_controls_map_legend)



		

		//setup the actions attached to the controls
		setup_controls_actions(params_chart, sharedParams)

		function setup_controls_actions(params_chart, sharedParams) {
			//add listeners to the rect control   
			controlBrushRect.addEventListener('click', function(e) {

				//if a circle brush is in place, remove it first & restor view
				if (params_chart.brush_Circle) {
					params_chart.brush_Circle.remove()

					//reset data view
					//restore datapoints colors
					Object.values(params_chart.map_instance._layers).forEach(l=> {
						if (l.options && l.options.index) {						
							l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
						}
					})

					//clean generated dataset
					sharedParams.spatial_data = []

					//notify crossfilter process the removal of the brush
					params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}
				}


				//set color & border width of the rect
				var options = {color: 'red', weight: 1};
				//start drawing the shape
				params_chart["brush_rect"]=params_chart.map_instance.editTools.startRectangle(undefined, options);
				
				//add actions on events
				params_chart["brush_rect"].on('editable:drawing:end', setup_params_rect);	
				params_chart["brush_rect"].on('editable:dragend', setup_params_rect);
				//params_chart.brush_rect.on('editable:editing', update_brush_values)
				
				params_chart["brush_rect"].on('editable:dragend', mark_drag_flag);
				function mark_drag_flag() {
					params_chart.brush_rect_dragged = true
					setTimeout(()=> {params_chart.brush_rect_dragged = false}, 100)
				}
				params_chart.brush_rect.addEventListener("mouseover", function(evt){ evt.target.editor.feature._path.style.cursor = "move"} )

				params_chart.brush_state_rect = "init"

				//on click outside of  the map, delete the shape
				params_chart.map_instance.on('click', function (e) { 
					if (params_chart.brush_order !== 'rect') {
						return
					}

					var click_latLng = e.latlng
					if (params_chart.brush_rect && !params_chart.brush_rect._bounds.contains(click_latLng) && params_chart.brush_state_rect === "created" && !params_chart.brush_rect_dragged && params_chart.brush_order === 'rect') {
						params_chart.brush_rect.remove()
						if (sharedParams.spatial_data) {sharedParams.spatial_data = []}
						params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}

						//restore datapoints colors
						Object.values(params_chart.map_instance._layers).forEach(l=> {
							if (l.options && l.options.index) {						
								l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
							}
						})

						//set delay for scatters update
						sharedParams.delay_time_scatter = 750

						//delete pressed effect from the control icon
						controlBrushRect.style.transform = ""
				        //lower the shadow
				        controlBrushRect.style.boxShadow = ""

					}
				})				

				//add pressed effect to the control icon
				/* Scaling button to 0.98 to its original size */ 
				this.style.transform = "scale(0.98)"
		        //lower the shadow
		        this.style.boxShadow = "3px 2px 22px 1px rgba(0, 0, 0, 0.24)" 


				//delete pressed effect to the circle control icon
				/* Scaling button to 0.98 to its original size */ 
				controlBrushCircle.style.transform = ""
		        //lower the shadow
		        controlBrushCircle.style.boxShadow = "" 

			})


			

			//register bounds of the shape, send signal to the crossfilter process
			function setup_params_rect() {
				params_chart['brush_rect_latLng'] = params_chart.brush_rect._latlngs
				params_chart['brush_rect_bounds'] = params_chart.brush_rect.getBounds()



				setTimeout(()=> {params_chart.brush_state_rect = "created"}, 100)

				//set border radius to box edges
				params_chart.brush_rect.editor.editLayer.eachLayer(l=> l._icon.style.borderRadius = "5px")

				//add listener to the edges of the shape; when mouseup, update bounds & fire crossfilter
				params_chart.brush_rect.editor.editLayer.eachLayer(l=> {l._icon.addEventListener('mouseup', ()=> {
						params_chart['brush_rect_latLng'] = params_chart.brush_rect._latlngs
						params_chart['brush_rect_bounds'] = params_chart.brush_rect.getBounds()

						params_chart.brush_order = "rect"
						prepare_crossfilter(params_chart, params_chart.brush_rect_bounds, sharedParams)
					})
				})

				//set cursor style when mouseover box edges
				params_chart.brush_rect.editor.editLayer.eachLayer(l=> {
					if (l.latlng.lat === params_chart.brush_rect_bounds._northEast.lat && l.latlng.lng === params_chart.brush_rect_bounds._southWest.lng) {
						l._icon.style.cursor = "nwse-resize"	
					}
					else if (l.latlng.lat === params_chart.brush_rect_bounds._northEast.lat && l.latlng.lng === params_chart.brush_rect_bounds._northEast.lng) {
						l._icon.style.cursor = "nesw-resize"	
					}
					else if (l.latlng.lat === params_chart.brush_rect_bounds._southWest.lat && l.latlng.lng === params_chart.brush_rect_bounds._northEast.lng) {
						l._icon.style.cursor = "nwse-resize"	
					}					
					else if (l.latlng.lat === params_chart.brush_rect_bounds._southWest.lat && l.latlng.lng === params_chart.brush_rect_bounds._southWest.lng) {
						l._icon.style.cursor = "nesw-resize"
					}					
				})

				

				params_chart.brush_order = "rect"				
				prepare_crossfilter(params_chart, params_chart.brush_rect_bounds, sharedParams)				

			}


				

			function prepare_crossfilter(params_chart, brush_shape_bounds, sharedParams) {
				//check if there is a change is the position of the shape
				if (brush_shape_bounds._southWest.lat !== brush_shape_bounds._northEast.lat && brush_shape_bounds._southWest.lng !== brush_shape_bounds._northEast.lng) {
					var lat = [brush_shape_bounds._southWest.lat, brush_shape_bounds._northEast.lat]					
					if (lat[0] < 0 && lat[1] < 0) {
						lat = lat.sort(function(a, b){return a-b})
					}
					else {
						lat = lat.sort()	
					}
					
					var lng = [brush_shape_bounds._southWest.lng, brush_shape_bounds._northEast.lng]
					if (lng[0] < 0 && lng[1] < 0) {
						lng = lng.sort(function(a, b){return a-b})
					}
					else {
						lng = lng.sort()	
					}		

					
					var lat = (Math.round(lat[0] * 100000) / 100000).toString() + "_" + (Math.round(lat[1] * 10000) / 10000).toString()
					var lng = (Math.round(lng[0] * 100000) / 100000).toString() + "_" + (Math.round(lng[1] * 10000) / 10000).toString()
					//var lng = (Math.round(brush_shape_bounds._southWest.lng * 100000) / 100000).toString() + "-" + (Math.round(brush_shape_bounds._northEast.lng * 10000) / 10000).toString()

					//if the shape drawn is a rect
					if (params_chart.brush_order === "rect") {
						if (sharedParams.spatial_data) {sharedParams.spatial_data = []}
						sharedParams.filter_order_origin = "map_brush_rect"
						params_chart['brush_values'] = {sw_lat: brush_shape_bounds._southWest.lat, ne_lat: brush_shape_bounds._northEast.lat, sw_lng: brush_shape_bounds._southWest.lng, ne_lng: brush_shape_bounds._northEast.lng}
						params_chart["brush_keys_values"] = {[params_chart.params_fields.lat+"_brushed"]: [lat], [params_chart.params_fields.lng+"_brushed"]: [lng]}


						//lower opcacity of non brushed datapoints
						//1.launch crossfilter here iot build a rect of datapoints
						//here I use the 'spatial query' to get a filtred dataset in return from the prepare_data_p1 func

						var brush_keys_values = {[params_chart.params_fields.lat+"_brushed"]: [lat], [params_chart.params_fields.lng+"_brushed"]: [lng]}
			        	params_chart.transformations['crossfilter'] = {}
			        	Object.assign(params_chart.transformations.crossfilter, brush_keys_values)

			        	sharedParams.filter_order_origin = 'spatial query'
			        	var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)

			        	//2.build an object of the brushed datapoints
			        	promise_data_input.then(result=> {

			        		//form the dataset that fits with the rect bounds
							var rect_brush_dataset = [], object_datapoints_brushed = {}							
							result.forEach(r=> {
								rect_brush_dataset.push(r)
								object_datapoints_brushed[r.mapCoordonneesLatitude + "-" + r.mapCoordonneesLongitude] = true							
							})

							set_style_outer_datapoints(params_chart, object_datapoints_brushed)

						})

					}

					//if the shape drawn is a circle
					else if (params_chart.brush_order === "circle") {
						//1.launch crossfilter here iot build a rect of datapoints
						var brush_keys_values = {[params_chart.params_fields.lat+"_brushed"]: [lat], [params_chart.params_fields.lng+"_brushed"]: [lng]}
			        	params_chart.transformations['crossfilter'] = {}
			        	Object.assign(params_chart.transformations.crossfilter, brush_keys_values)

			        	
			        	sharedParams.filter_order_origin = 'spatial query'
			        	var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)

			        	//2.use the radius/distanceTo method iot build a circle of datapoints
			        	promise_data_input.then(result=> {

			        		//form the dataset that fits with the circle bounds
							var circle_brush_dataset = [], object_datapoints_brushed = {}							
							result.forEach(r=> {
								var distance_from_center = r['lat_lng'].distanceTo(params_chart.brush_circle_center);	
								if (distance_from_center <= params_chart.brush_circle_radius) {
									circle_brush_dataset.push(r)
									object_datapoints_brushed[r.mapCoordonneesLatitude + "-" + r.mapCoordonneesLongitude] = true			
								} 
							})

			        		//register the dataset formed & send the signal to fire the crossfilter
			        		sharedParams.spatial_data = circle_brush_dataset
							params_chart['brush_values'] = {sw_lat: brush_shape_bounds._southWest.lat, ne_lat: brush_shape_bounds._northEast.lat, sw_lng: brush_shape_bounds._southWest.lng, ne_lng: brush_shape_bounds._northEast.lng}
							params_chart["brush_keys_values"] = {[params_chart.params_fields.lat+"_brushed"]: [lat], [params_chart.params_fields.lng+"_brushed"]: [lng]}


							set_style_outer_datapoints(params_chart, object_datapoints_brushed)



							
			        	})	
					}
				}

				else {params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}}
			}


			function set_style_outer_datapoints(params_chart, object_datapoints_brushed) {
				//lower opacity of non brushed data points
				console.time('map_datapoints_opcacity'); 							
				Object.values(params_chart.map_instance._layers).forEach(l=> {
					if (object_datapoints_brushed.hasOwnProperty(l.options.index)) {
						//l.setStyle({fillOpacity: 1}) 
						l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
					}
					else if (l.options.radius && l.options.size_coef && l.options.weight) {
						//l.setStyle({fillOpacity: 0.1}) 
						l.setStyle({color: "rgb(150, 150, 150)", fillColor: "rgb(230, 230, 230)"}) 
					}
				});
				console.timeEnd('map_datapoints_opcacity')				
			}




			//add listeners to the circle control
			controlBrushCircle.addEventListener('click', function(e) {
				//if a rect brush is in place, remove it first & restor view
				if (params_chart.brush_rect) {
					params_chart.brush_rect.remove()

					//reset data view
					//restore datapoints colors
					Object.values(params_chart.map_instance._layers).forEach(l=> {
						if (l.options && l.options.index) {						
							l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
						}
					})

					//clean generated dataset
					sharedParams.spatial_data = []

					//notify crossfilter process the removal of the brush
					params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}
				}



				//set color & border width of the circle
				var options = {color: 'red', weight: 1};
				params_chart["brush_Circle"]=params_chart.map_instance.editTools.startCircle(undefined, options);
				params_chart["brush_Circle"].on('editable:drawing:end', setup_params_circle);	
				params_chart["brush_Circle"].on('editable:dragend', setup_params_circle);
				
				//change the cursor style when mouse over the circle
				params_chart.brush_Circle.addEventListener("mouseover", function(evt){ 
					evt.target.editor.feature._path.style.cursor = "move"
				} )


				params_chart.brush_state_Circle = "init"



				params_chart.map_instance.on('click', function(e) { 
					if (params_chart.brush_order !== 'circle') {
						return
					}

					var click_latLng = e.latlng
					var distance_from_center = click_latLng.distanceTo(params_chart.brush_circle_center);
					if (distance_from_center > params_chart.brush_circle_radius && params_chart.brush_state_Circle !== "init") {
						//remove the shape
						params_chart.brush_Circle.remove()
						
						//restore datapoints colors
						Object.values(params_chart.map_instance._layers).forEach(l=> {
							if (l.options && l.options.index) {						
								l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
							}
						})

						//clean generated dataset
						sharedParams.spatial_data = []

						//notify crossfilter process the removal of the brush
						params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}

						//set delay for scatters update
						sharedParams.delay_time_scatter = 750

						//delete pressed effect to the circle control icon
						/* Scaling button to 0.98 to its original size */ 
						controlBrushCircle.style.transform = ""
				        //lower the shadow
				        controlBrushCircle.style.boxShadow = "" 				


					} 
				})

				//add pressed effect to the control icon
				/* Scaling button to 0.98 to its original size */ 
				this.style.transform = "scale(0.98)"
		        //lower the shadow
		        this.style.boxShadow = "3px 2px 22px 1px rgba(0, 0, 0, 0.24)" 


				//delete pressed effect to the rect control icon
				/* Scaling button to 0.98 to its original size */ 
				controlBrushRect.style.transform = ""
		        //lower the shadow
		        controlBrushRect.style.boxShadow = "" 				
			})


			
			//register bounds of the shape, send signal to the crossfilter process
			function setup_params_circle() {				
				params_chart.brush_circle_bounds = params_chart.brush_Circle.getBounds()
				params_chart.brush_circle_center = params_chart.brush_Circle.getLatLng()
				params_chart.brush_circle_radius = params_chart.brush_Circle.getRadius()


				//set border radius of the circle handler
				params_chart.brush_Circle.editor.editLayer.eachLayer(l=> l._icon.style.borderRadius = "5px")

				//add event listener to the edges to feed crossfilter process
				params_chart.brush_Circle.editor.editLayer.eachLayer(l=> {l._icon.addEventListener('mouseup', ()=> {
					//update_brush_circle_values()
						params_chart['brush_circle_latLng'] = params_chart.brush_Circle._latlngs
						params_chart['brush_circle_bounds'] = params_chart.brush_Circle.getBounds()
						params_chart.brush_circle_center = params_chart.brush_Circle.getLatLng()
						params_chart.brush_circle_radius = params_chart.brush_Circle.getRadius()				

						params_chart.brush_order = "circle"
						prepare_crossfilter(params_chart, params_chart.brush_circle_bounds, sharedParams)					
					})
				})

				setTimeout(()=> {params_chart.brush_state_Circle = "created"}, 100)

				params_chart.brush_order = "circle"
				prepare_crossfilter(params_chart, params_chart.brush_circle_bounds, sharedParams)

			}


			//register box bounds to feed crossfilter process if the values form a valid shape
			function update_brush_circle_values() {
				// params_chart['brush_circle_latLng'] = params_chart.brush_Circle._latlngs
				// params_chart['brush_circle_bounds'] = params_chart.brush_Circle.getBounds()
				// params_chart.brush_circle_center = params_chart.brush_Circle.getLatLng()
				// params_chart.brush_circle_radius = params_chart.brush_Circle.getRadius()				

				// params_chart.brush_order = "circle"
				// prepare_crossfilter(params_chart, params_chart.brush_circle_bounds, sharedParams)
			}
		}



		


	}




	inject_metadata(mymap, params_chart, data_type, injection_type, updateTime) {
	   params_chart.moveend = []; params_chart.zoomend = [];
	   

		//init flags for buiding the tooltips
		params_chart.layer_added = undefined; params_chart.tooltips_added= undefined
		/*if (params_chart.layer) {
			params_chart.layerGroup_instance.removeLayer(params_chart.layer)
		}*/

		//remove previous layer
		if (params_chart.layer) {
		//retrieve the layer stored in the params_chart
			var layer = params_chart.layer
			var layerGroup1 = params_chart.layerGroup_instance
			layer.forEach(l => {layerGroup1.removeLayer(l)})		
		}

		//if no data prepared, exit
		if (params_chart.data[1].markers.length === 0) {
			return
		}

		//init the layer group
		var layer = [...params_chart.data[1].markers]
		var layerGroup1 = L.layerGroup(layer);		



		params_chart.layerGroup_instance = layerGroup1
		params_chart.layer = [...params_chart.data[1].markers]


		mymap.once('moveend', function(e) {
		   params_chart.layer_added = undefined
			if (params_chart.data[1].markers.length === 0) {
				return}

		   layerGroup1.addTo(mymap);
		   params_chart.layer_added = true
		});		


		//calculate time for fly to bounds & delay scatter charts
		if (params_chart.data[1].markers.length > 0) {calculate_transition_times(params_chart, sharedParams)}



		if (params_chart.data[1].x_y.length > 0) {mymap.flyToBounds(params_chart.data[1].x_y, {'duration':params_chart.time_flyToBounds})}; //


		function add_tooltips(params_chart, mymap) {
			//access to the data points on the layer
			//var circles = Object.values(mymap._layers).filter(l=> l._latlng && l._radius)
			
			//build an object containing the coordinates as key, the layer as value
			var circles = {};
			Object.values(mymap._layers).filter(l=> l._latlng && l._radius).
			forEach(l=> { 
				var key = l._latlng.lat + "-" + l._latlng.lng; 
				circles[key] = l 
			})

			//build an object containing the coordinates as key, the popups as value
			var tooltips = {}
			params_chart.data[1].datasets.forEach(d=> {var key = d.mapCoordonneesLatitude + "-" + d.mapCoordonneesLongitude; tooltips[key] = d })


			//loop through circles object, for each key add popup to the layer
			Object.keys(circles).forEach(key=> {

				//build the tooltip
				var tooltip = [];
				var r = tooltips[key]
				Object.keys(params_chart.popup_fields).forEach(key => { 
					var el = [];
					var fieldName = params_chart.popup_fields[key]["fieldName"];
					var precision = params_chart.popup_fields[key]["toPrecision"];
					if (r[fieldName]) {

						var textBefore = params_chart.popup_fields[key].textBefore + ": "; el.push(textBefore);

						if (params_chart.popup_fields[key].slice) {
							var fieldValue = r[fieldName].toString().slice(params_chart.popup_fields[key].slice[0], params_chart.popup_fields[key].slice[1])							
						}
						else {
							var fieldValue = r[fieldName].toString()
						}
						el.push(fieldValue)

							
						var textAfter = params_chart.popup_fields[key].textAfter; el.push(textAfter);
						
						tooltip.push(el.filter(e=> e!== undefined));

					}
					//popup.filter(e=> e!== undefined).map(f=> f + "<br />").join("")


				});

				var p1 = tooltip.map(f=> f.map(e=> e).join("")); tooltip = p1.map(f=> f + "<br />").join("")


				circles[key].bindTooltip(tooltip);
			})

		}

		

		mymap.once('zoomend', function() {
			//get current zoom
		    let zoom = mymap.getZoom();
		    //const size_field = params_chart.params_fields.size_field;
		    //adapt_tailleCercles(layerGroup1, zoom); //, size_field
		   params_chart.zoomend.push(1)
		   console.log("zoomend: " + params_chart.zoomend.length)
		});
				


		setInterval(invalidateSize, 500)

		//refresh map size, fix for bootstrap bug
		function invalidateSize() {
			params_chart.map_instance.invalidateSize()
		}

	    
	    var interval = setInterval(()=> {
			if (params_chart.layer_added && !params_chart.tooltips_added) {
				var t1 = new Date()
				add_tooltips(params_chart, mymap)
				console.log("time inject tooltips to map: " + (new Date() - t1))
				console.log('tooltips_added')
				params_chart.tooltips_added = true
				//clearInterval(interval)

			} 
	    }, 300)
	   
	   
		function calculate_transition_times(params_chart) {
			params_chart.previousCenter = params_chart.currentCenter
			params_chart.currentCenter = new L.Polygon(params_chart.data[1].x_y)._bounds.getCenter()
			if (params_chart.previousCenter) {
				var distance_from_previous_location = params_chart.currentCenter.distanceTo(params_chart.previousCenter)
				params_chart.distance_from_previous_location = distance_from_previous_location
				console.log({'distance_from_previous_location': params_chart.distance_from_previous_location})

				if (distance_from_previous_location < 1000) {
					params_chart.time_flyToBounds = 0
					params_chart.sharedParams.delay_time_scatter = 200
				}
				else if (distance_from_previous_location >= 1000 && distance_from_previous_location < 5000) {
					params_chart.time_flyToBounds = 1
					params_chart.sharedParams.delay_time_scatter = 1100
				}
				else if (distance_from_previous_location >= 5000 && distance_from_previous_location < 10000) {
					params_chart.time_flyToBounds = 1.5
					params_chart.sharedParams.delay_time_scatter = 1600
				}			
				else if (distance_from_previous_location >= 10000 && distance_from_previous_location < 50000) {
					params_chart.time_flyToBounds = 2
					params_chart.sharedParams.delay_time_scatter = 2100
				}
				else if (distance_from_previous_location >= 50000 && distance_from_previous_location < 100000) {
					params_chart.time_flyToBounds = 2.5
					params_chart.sharedParams.delay_time_scatter = 2600
				}
				else if (distance_from_previous_location >= 100000) {
					params_chart.time_flyToBounds = 3
					params_chart.sharedParams.delay_time_scatter = 3100
				}			

				console.log({'time_flyToBounds': params_chart.time_flyToBounds})
				console.log({'delay_time_scatter': params_chart.sharedParams.delay_time_scatter})
			}
		}

		

		return layerGroup1

	
	}





	setup_legends(params_chart, sharedParams, mode) {
		var t1_bis1 = (new Date())/1000
		//old code
			// var nb_cells = 6
			// if (params_chart.params_legends.show !== true) {
			// 	return
			// }


			// //binning the legend field
			// params_chart.params_legends.nb_cells !== undefined ? nb_cells = params_chart.params_legends.nb_cells : nb_cells = 6
			// params_chart.params_legends.nb_cells !== "" ? nb_cells = params_chart.params_legends.nb_cells : nb_cells = 6
			// var binGenerator = d3.histogram()
			// 	  .domain([params_chart.hue_dataset_extent.min, params_chart.hue_dataset_extent.max])// Set the domain to cover the entire intervall [0;]
			// 	  .thresholds(nb_cells);  // number of thresholds; this will create 19+1 bins

			// var arr_to_bin = params_chart.data[1].datasets.map(h=> h[params_chart.params_fields.hue_params.hue_field])
			// var array_binned = binGenerator(arr_to_bin); array_binned = array_binned.filter(a=> a.length > 0)

		var max_cells = 10;
		params_chart.params_legends.max_cells !== undefined ? max_cells = params_chart.params_legends.max_cells : max_cells = 6
		params_chart.params_legends.max_cells !== "" ? max_cells = params_chart.params_legends.max_cells : max_cells = 6

		if (params_chart.params_legends.show !== true) {
			return
		}


		//in case when the color field is numerical:
		if (params_chart.params_fields.hue_params) {
			//binning the legend field
			var binGenerator = d3.histogram()
				  .domain([params_chart.hue_dataset_extent.min, params_chart.hue_dataset_extent.max])// Set the domain to cover the entire intervall [0;]
				  .thresholds(max_cells);  // number of thresholds; this will create 19+1 bins		



			//bin hue values
			//var hue_statistical_values = params_chart.legends_config.map(h=> h.hue_statistical_value)
			var hue_statistical_values = params_chart.data[1].datasets.map(r=> r[params_chart.params_fields.hue_params.hue_field])
			var array_binned = binGenerator(hue_statistical_values).filter(a=> a.length > 0) ; params_chart.legend_dataset_binned = array_binned

			//build an array of coef colors and extents to feed d3 colors interpolator
			var coef_colors = []
			array_binned.map(a=> {coef_colors.push( {hue_value: d3.mean(a), x0: a.x0, x1: a.x1} ) })

			var legends_colors_setup = [], precision = params_chart.params_legends.toPrecision
			coef_colors.map(c=> { legends_colors_setup.push( {hue_value :c.hue_value, label: (c.x0).toPrecision(precision) + " - " + (c.x1).toPrecision(precision), 
				color: d3.interpolateRdYlGn((c.hue_value - params_chart.hue_dataset_extent.min) / (params_chart.hue_dataset_extent.max - params_chart.hue_dataset_extent.min)) } ) } )

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
			legendsContainer.remove()	

		}


		//create the legends
		var legends_params = {htmlNode: "#"+params_chart.params_legends.htmlNode, chart_id: params_chart.id, max_cells: legends_colors_setup.length, 
			legends_colors_setup: legends_colors_setup}
		generateLegends(legends_params, params_chart, sharedParams)



      	//var legends_circle_container = d3.select("#legends_circle_container")
			  //       legends_circle_container.append('circle')
			  //       	.attr("id", "legends_circle_oversee")
			  //       	.attr("transform", "translate(5,0)")
			  //       	.attr('cx', "10")
			  //       	.attr('cy', "10")
			  //       	.attr('r', "10")
			  //       	.attr('stroke', "red")
			  //       	//.attr('color', "red")
			  //       	.attr('fill', "white")


			  //       legends_circle_container.append("text")
			  //       	.attr("class", "label")
			  //       	.attr("id", "legends_circle_oversee_label_container")
			  //       	.attr("transform", "translate( 38, -8)") 


			  //       var legends_circle_oversee_label_container = d3.select("#legends_circle_oversee_label_container")
			  //       legends_circle_oversee_label_container.append("tspan")
			  //       	//.attr("class", "label")
			  //       	.attr("id", "legends_circle_oversee_label_l1")
			  //       	//.attr("transform", "translate( 33, 12.5)") 
			  //       	.attr("style", 'font-family: "helvetica neue"; font-size: 12px')
			  //       	.attr("x", "0")
			  //       	.attr("dy", "1.2em")

			  //       var text1, text2
			  //       if (sharedParams.language === "en") {text1 = "Circle the"; text2 = "data points"}
			  //       else if (sharedParams.language === "fr") {text1 = "Entourer les"; text2 = "données"}
			  //       document.getElementById('legends_circle_oversee_label_l1').innerHTML = text1

			  //       legends_circle_oversee_label_container.append("tspan")
			  //       	//.attr("class", "label")
			  //       	.attr("id", "legends_circle_oversee_label_l2")
			  //       	//.attr("transform", "translate( 33, 12.5)") 
			  //       	.attr("style", 'font-family: "helvetica neue"; font-size: 12px')
			  //       	.attr("x", "0")
			  //       	.attr("dy", "1.2em")

			  //       document.getElementById('legends_circle_oversee_label_l2').innerHTML = text2




			        

			  //       var legends_circle_oversee = document.getElementById('legends_circle_oversee')
					// legends_circle_oversee.addEventListener("mouseover", function(evt){ 			        	
					// 	evt.target.style.cursor = "pointer"
					// } )

					// legends_circle_oversee.addEventListener("click", function(evt){

					// 			//filter the data & pass parameter for red circling the data points
					// 			if (params_chart.params_datapoints.circling_datapoints === false) {
					// 				params_chart.params_datapoints.circleColor = "red"
					// 				filter_map(params_chart); params_chart.params_datapoints.circling_datapoints = true
					// 			}
					// 			else {
					// 				params_chart.params_datapoints.circleColor = ""
					// 				filter_map(params_chart); params_chart.params_datapoints.circling_datapoints = false
					// 			}
								
					// })


      




        var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
        sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "setup_legends","chart": params_chart.id, exec_time: tf, event_time: (new Date).toLocaleString()})	


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
		params_chart.params_fields.hue_params.domain === undefined ? params_chart.params_fields.hue_params.domain = ["min", "max"] : {}
		params_chart.params_datapoints.circling_datapoints === undefined ? params_chart.params_datapoints.circling_datapoints = false : {}
		params_chart.params_datapoints.circleColor === undefined ? params_chart.params_datapoints.circleColor = "" : {}
		params_chart.params_datapoints.circles_color_mode === undefined ? params_chart.params_datapoints.circles_color_mode = "continuous_color" : params_chart.params_datapoints.circles_color_mode = "continuous_color"
		params_chart.params_legends.nb_cells === undefined ? params_chart.params_legends.nb_cells = 6 : {}
		params_chart.params_legends.show === undefined ? params_chart.params_legends.show = true : {}

		//convert the lat/lng into leaflet format
		sharedParams.data_source.forEach(r=> {
			if (r[params_chart.params_fields.lat] && r[params_chart.params_fields.lng]) {
				r['lat_lng'] = new L.latLng(r[params_chart.params_fields.lat], r[params_chart.params_fields.lng])
			}
		});
	}

	
	update_scatterPlots(params_chart) {
		params_chart.target_scatterPlots.forEach(scatter=> {			   	
			//engage only when the dataset exceeds the limit that fires the spinner for the scatter
			
			//check if the dataset is ready for the scatter
			//setTimeout(()=> {
				
					var check_dataset_ready = setInterval(()=> {
						if (scatter.filter_order === true && scatter.params_chart_target.dataset_filtred.length > scatter.params_chart_target.limit_disable_animation) {
				   		
				   		
				   			console.log('dataset_filtred for scatter is ready')
				   			console.log({mean_surface_scatter: d3.mean(scatter.params_chart_target.dataset_filtred,a=> a.surface), filter_mode: scatter.filter_mode})
				   			//setTimeout(()=> {scatter.updateFunction(scatter.params_chart_target, scatter.sharedParams, scatter.params_chart_target.dataset_filtred)}, 200)
				   			
				   			//the updateFunction fires twice, iot avoid that, fire only when the dataset isn't empty
				   			if (scatter.params_chart_target.dataset_filtred.length > 0) {
				   				scatter.updateFunction(scatter.params_chart_target, scatter.sharedParams, scatter.params_chart_target.dataset_filtred)
				   			}
				   			scatter.filter_order = false
				   			
				   			clearInterval(check_dataset_ready)

				   			//scatter.promise_dataset_filtred.then(r=> {console.log({promise_dataset_filtred: r})})
					   	}												
						
						else {
							console.log('dataset_filtred for scatter is not ready')
						}
					}, 200)
				
			//}, 450)
			

	   	})
	}	


}

// function dataset_extent(domain, dataset, hue_field) {
// 	if (domain[0] === "auto" || domain[0] === 0 || domain[0] === "min") {
// 		var min = d3.min(dataset, o=> o[hue_field])
// 	}
// 	else if (typeof(domain[0]) === "string") {
// 		if (domain[0].indexOf("p") > -1) {
// 			var quartil = domain[0]
// 			quartil = parseFloat(quartil.replace("p",""))
// 			var min = Quartile(dataset.map(o=> o[hue_field]), quartil)
// 		}
// 	};

// 	//check if a max domain is provided, if no pick up the max value of the bin_field
// 	if (domain[1] === "auto" || domain[1] === "max") {
// 		var max = d3.max(dataset, o=> o[hue_field])
// 	}
// 	else if (typeof(domain[1]) === "string") {
// 		if (domain[1].indexOf("p") > -1) {
// 			var quartil = domain[1]
// 			quartil = parseFloat(quartil.replace("p",""))
// 			var max = Quartile(dataset.map(o=> o[hue_field]), quartil)
// 		}
// 	}

// 	return {min: min, max: max}
// }


   function load_d3_legend()
   {
      var head= document.getElementsByTagName('head')[0];
      var script= document.createElement('script');
      script.src= 'https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js';
      head.appendChild(script);
   }
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
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

		//register the map class in the params object
		params_chart.chart_instance = this		

		this.setup_defaults_parameters(params_chart, sharedParams)

		params_chart.sharedParams = sharedParams

		var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)

		var t1 = new Date()
		this.prepare_data_p2(data_filtred, params_chart, sharedParams)
		console.log('classic map prepare_data_p2 time: ' + (new Date() - t1))

	
		//init the map
		var t1 = new Date()
		this.init_chart(params_chart, sharedParams)
		console.log('classic map init_chart time: ' + (new Date() - t1))


		//register the instanciator
		params_chart.instanciator = this

		params_chart.chart_sub_type = "map"

		if (params_chart.params_fields.hue_params)	 {this.setup_legends(params_chart, sharedParams, 'init')}
		else if (params_chart.params_fields.size_params?.size_field) {
			this.setup_legends(params_chart, sharedParams, 'init')
			generate_legend_size(params_chart)
		}

		//display adress & radius if provided		
		setTimeout(()=> this.geoRadius_display(params_chart, sharedParams), 2000)

		this.funcLib(params_chart, sharedParams)

		this.create_associated_charts(params_chart, sharedParams)

	}

	async updateChart(params_chart, sharedParams, filter_object) {
		//v1
		// var data_filtred = await this.prepare_data_p1(params_chart, sharedParams)
		// this.prepare_data_p2(data_filtred, params_chart, sharedParams)
		// this.inject_metadata(params_chart.map_instance, params_chart)

		//v2
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
				params_chart.inject_type = ""
			})
		}
		else {
			this.prepare_data_p2(data_filtred, params_chart, sharedParams)

			var data_type = "data"; var injection_type = "init"
			this.inject_metadata(params_chart.map_instance, params_chart)
			params_chart.inject_type = ""
		}


		function clean_data_map(params_chart) {
			if (params_chart.inject_type === 'change_hue_field') {return} 
			params_chart.data[0].labels = []; params_chart.data[1].datasets = [];
			params_chart.data[1].markers = []; params_chart.data[1].borders; params_chart.inject_type = "init"
		}
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
			//data_chart = getFiltredData(data_chart, filterList, params_chart.id, sharedParams)
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





		if (data_filtred.constructor === Array && data_filtred.length > 0) {			
			
			//if the dataset is built upon a radius, given by an adress, fit the dataset to the bounds of the given radius
			if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length > 0) {
				var func_locator = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
				if (func_locator) {var data_chart = func_locator.funcLib.restrict_dataset_to_radius(data_filtred, params_chart)}
			}

			//data decimation
			data_filtred = data_decimation(params_chart, data_filtred);
			
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


					data_chart = [...dataset_filtred]
					
					//data decimation
					data_chart = data_decimation(params_chart, data_chart);

					
					//if the dataset is built upon a radius, given by an adress, fit the dataset to the bounds of the given radius
					if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length > 0) {
						var func_locator = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')
						if (func_locator) {var data_chart = func_locator.funcLib.restrict_dataset_to_radius(data_chart, params_chart)};
					}



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


		


		//select the fields requiered
		function select_required_fields(params_chart, data_chart) {
			var popup_fields = []; params_chart.tooltip_fields.forEach(o => popup_fields.push(o["field"]));
			var fields = []; Object.assign(fields, popup_fields); 
			fields.push(params_chart.params_fields.lat); fields.push(params_chart.params_fields.lng); 
			if (params_chart.params_fields.hue_params) fields.push(params_chart.params_fields.hue_params.hue_field)
			if (params_chart.params_fields.size_params) fields.push(params_chart.params_fields.size_params.size_field)
			if (params_chart.params_fields.color_params) fields.push(params_chart.params_fields.color_params.color_field)
			fields.push("leaflet_lat_lng")
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
			const hue_field = params_chart.params_fields.hue_params?.hue_field;
			const size_field = params_chart.params_fields.size_params?.size_field; 
			const color_field = params_chart.params_fields.color_params?.color_field;
			if (hue_field) params_chart.legends_field = hue_field + "_binned"
			if (color_field) params_chart.legends_field = color_field
			
			var opacity_field = undefined
			params_chart.params_fields.opacity_params !== undefined ? opacity_field = params_chart.params_fields.opacity_params.opacity_field : opacity_field = undefined;
			var data_circle; var circleColor; var circleSize; var x_y; var el; var popup; var fieldName; var fieldValue; var p1; var unit; var alias; var coef_colorHue;
			let size_coef, radius = 3, opacity, domain_opacity, circleOpacity, opacity_coef, hue_color, strokeColor, circle_type, backgroundColorArray_source

			params_chart.nb_axis = 1
			
			params_chart.data[1].markers = []; params_chart.data[1].popups = []; params_chart.data[1].x_y = []; 
			if (data_input.length === 0) {
				console.log({map: "data_input is empty"})
				return
			}

			//obtenir les catégories (les communes par ex)


			//get min & max values	 
			var domain_hue = params_chart.params_fields.hue_params?.domain
			opacity_field !== undefined ? domain_opacity = params_chart.params_fields.opacity_params.domain : domain_opacity = ["min", "max"];

			if (domain_hue === undefined) {domain_hue = ["min", "max"]}
			if (domain_opacity === undefined) {domain_opacity = ["min", "max"]}





			//get data extent for the hue field
			var domain_scope = params_chart.params_fields.hue_params?.domain_scope;
			//if the user specifies to use the whole dataset
			if (domain_scope === "whole_dataset") {
				params_chart.hue_dataset_extent = dataset_extent(domain_hue, sharedParams.data_main, hue_field);
			}
			else if (domain_scope === "filtred_dataset" || domain_scope === undefined) {
				params_chart.hue_dataset_extent = dataset_extent(domain_hue, data_input, hue_field);
			}			

			var hueMin = params_chart.hue_dataset_extent.min; var hueMax = params_chart.hue_dataset_extent.max; 
			if (params_chart.params_fields.hue_params && params_chart.params_fields.hue_params.hue_color) {
				hue_color = params_chart.params_fields.hue_params.hue_color
			}
			else if (params_chart.params_fields.hue_params && !params_chart.params_fields.hue_params.hue_color) {
				hue_color = "interpolateBlues"
			}
			else if (color_field) {
				var categories = deduplicate_dict(data_input, color_field)

				//if another chart uses the same field as color_field, reuse its color here
				if (sharedParams.registed_colors.hasOwnProperty(color_field)) {
					Object.assign(params_chart.backgroundColorArray_source, sharedParams.registed_colors[color_field])
				}
				else if (Object.values(params_chart.backgroundColorArray_source).length===0) {
					function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}
					//generate colors
					let color_scheme = params_chart.params_fields.color_params.color_scheme || '';
					let colorsOrder = params_chart.params_fields.color_params.colorsOrder || ''
					backgroundColorArray_source = generateColors(categories.length, color_scheme, colorsOrder, color_field, sharedParams)

					//pair colors with the values of color_field
					let i=0
					categories.forEach(axis => {
						params_chart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++;
					})
				}
				
			}
		




			
			//bounds_adjustment
			if (params_chart.bounds_adjustment.adjustment === true) {
				var essai = this.exclusion_extrem_coordinates(params_chart ,data_input, params_chart.bounds_adjustment.domain)
				if (essai.length > 0) {
					data_input = [...essai]
				}
			}

			//build scale size if a sizing is requested			
			if (size_field && params_chart.params_fields.size_params?.max_radius) {
				const min_r_value = d3.min(data_input, r=> r[size_field]);
				const max_r_value = d3.max(data_input, r=> r[size_field]);

				var r_field_in_meters
				const min_radius = params_chart.params_fields.size_params.min_radius || 15;
				const max_radius = params_chart.params_fields.size_params.max_radius || 100;
				let scale_method = params_chart.params_fields?.size_params?.scale_method || "scaleSqrt"
				let scale_func = d3[scale_method]().range([min_radius, max_radius]).domain([min_r_value, max_r_value]);					
				data_input.forEach(r=> {
					//r_field_in_px = ((r[params_chart.r_field] / max_r_value) * params_chart.radius_params.max_radius) * params_chart.radius_params.radius_factor
					r_field_in_meters = scale_func(r[size_field])
					r.r_field_in_meters = r_field_in_meters
				});
			};

			//get data to build popup & data points for projection			
			data_input.forEach(r=> {
				//form x y coord
				x_y = [r[params_chart.params_fields.lat], r[params_chart.params_fields.lng]];


				//form the data circle
				//setup the color


				if (hue_field) {
					coef_colorHue = ((r[hue_field] - hueMin) / (hueMax - hueMin)).toPrecision(4);
					//if the process is fired by legends selection, take the color registred in the 				
					if (params_chart.params_datapoints.circles_color_mode === "discrecte_color") {

						var hue_value = r[hue_field]					
					
						try {
							circleColor = params_chart.legendColors.find(e=> hue_value >= e.x0 && hue_value < e.x1)?.color
						}
						catch (err) {
							console.error(err)
						}
					}
					else if (params_chart.params_datapoints.circles_color_mode === "continuous_color") {
						circleColor = d3[hue_color](coef_colorHue);
					}
					
					//form the radius				
					circleSize = radius;
					size_coef = 1

					//setup stroke color
					params_chart.params_datapoints.circleColor === "red" ? strokeColor = "red" : strokeColor = circleColor
					circle_type = "circleMarker"

					//setup the opacity				
					if (opacity_field === undefined) {
						circleOpacity = 1;
					}
					else {
						circleOpacity = ((r[opacity_field] - opacityMin) / (opacityMax - opacityMin)).toPrecision(4);
						params_chart.params_fields.opacity_params.reverse === true ? circleOpacity = 1 - circleOpacity: {}
					}					

					
				}

				if (color_field) {
					circleColor = params_chart.backgroundColorArray_source[r[color_field]];
					strokeColor = circleColor.replace('0.65', '1')
				}
				if (size_field) {					
					circleSize = r.r_field_in_meters
					if (!color_field) {
						circleColor = params_chart.params_fields.size_params.color || 'red'
					}
					circleOpacity = 0.7;
					circle_type = "circle"
				}
				

				


				data_circle = new L[circle_type](x_y, {
					radius: circleSize,
					color: strokeColor,
					weight: 2.6,
					fillColor: circleColor,
					fillOpacity: circleOpacity,
					original_color: circleColor,
					index: x_y[0] + "-" + x_y[1],
					dataset: r
				})
				data_circle.options.size_field = size_field; data_circle.options.size_coef = size_coef
				data_circle.circle_layer = true

				//enable interaction with the circles
				if (size_field) {		
					data_circle.on("click", function(evt) {
						console.log({circle_data: evt.target.options.dataset})
						circle_interact(params_chart, evt.target.options.dataset);
						evt.target.bringToFront()
					
					})
				}

				
				params_chart.data[1].markers.push(data_circle);
				params_chart.data[1].x_y.push(x_y)

				function circle_interact(params_chart, dataset) {
					const idx = dataset[params_chart.params_fields.lat].toString() +'_'+ dataset[params_chart.params_fields.lng].toString()
					if (params_chart.list_idx_segment_single_selected.includes(idx)) {
						params_chart.list_idx_segment_single_selected = []
						params_chart.list_labels_segment_single_selected = []
						params_chart.list_keys_values_segment_single_selected = []
						circles_color_management(params_chart, "restore_colors")
						params_chart.highlight_selected_point = false
						return
					}
					
					params_chart.list_idx_segment_single_selected.push(idx)
					params_chart.list_labels_segment_single_selected = [{category_field: dataset[params_chart.params_fields.lat]}, {category_field: dataset[params_chart.params_fields.lng]}];
					params_chart.list_keys_values_segment_single_selected = [{lat : dataset[params_chart.params_fields.lat]}, {lng : dataset[params_chart.params_fields.lng]}];
					circles_color_management(params_chart, "highlight_selected_point", {lat: dataset[params_chart.params_fields.lat], lng: dataset[params_chart.params_fields.lng]})
					params_chart.highlight_selected_point = true
				}
				
				//used to turn grey the circles after the circle_interact has benn called 
				function circles_color_management(params_chart, action_type, point_latLng) {
					if (action_type === 'restore_colors') {
						//restore datapoints colors
						params_chart.featureGroup.eachLayer(l=> {							
							l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
						})
					}
					else if (action_type === 'highlight_selected_point') {
						//restore datapoints colors
						params_chart.featureGroup.eachLayer(l=> {
							if (l.options.dataset[params_chart.params_fields.lat] !== point_latLng.lat && l.options.dataset[params_chart.params_fields.lng] !== point_latLng.lng) {
								l.setStyle({color: "rgb(150, 150, 150)", fillColor: "rgb(230, 230, 230)"}) 
							}
							else {
								l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
							}
						})
					}
				}
			})

			params_chart.data[1].datasets = data_input

	    			

 
			//.sauvegarder une image des données source avant transformation
			if (params_chart.data_source_raw.length === 0) {
				params_chart.data_source_raw = data_input
				//params_chart.data_source[0].labels.push(categories)
		        params_chart.data_source[1].markers = data_input; params_chart.data_source[1].popups = [...params_chart.data[1].popups]; 
		        params_chart.data_source[1].borders = [...params_chart.data[1].x_y]; 

		    }		

			//save an image of original params_fields object
			if (!params_chart._params_fields) {
				params_chart._params_fields = _.cloneDeep(params_chart.params_fields)
			}
			

	}


	init_chart(params_chart, sharedParams) {		

	    //general container for the title + map & legend
	    const grid_title_controls_map_legend =  document.createElement('div'); 
		//get original width		
		// var width = document.getElementById(params_chart.htmlNode).style.width
		// if (!width) width = document.getElementById(params_chart.htmlNode).style.maxWidth

		let width
		if (params_chart.style.chart_width ==='inherit') {			
				width = 'inherit'
		}
		else if (isFinite(params_chart.style.chart_width)) {
				width = params_chart.style.chart_width+'px'
		} 
		//clean original width
		document.getElementById(params_chart.htmlNode).style.width = ""; document.getElementById(params_chart.htmlNode).style.maxWidth = "";
	    Object.assign(grid_title_controls_map_legend, {id: 'grid_title_controls_map_legend_' + params_chart.htmlNode, 
			style: `display: grid; grid-template-columns: 84% 15%; grid-column-gap: 4px; width: ${width};`}) 

	    //grid container for the map & legend
		var height = document.getElementById(params_chart.htmlNode).style.height
		if (!height) height = document.getElementById(params_chart.htmlNode).style.maxHeight
	    const grid_title_controls_map =  document.createElement('div'); 
	    Object.assign(grid_title_controls_map, {id: 'grid_title_controls_map_' + params_chart.htmlNode, style: 'display: inline-grid; grid-row-gap: 1%; grid-template-rows: auto auto auto%; '})//height: ' + height
		//params_chart.map_height ? grid_title_controls_map.gridTemplateRows = '5% 7% ' + params_chart.map_height : {}
		//clean original height
		//document.getElementById(params_chart.htmlNode).style.height = ""; document.getElementById(params_chart.htmlNode).style.maxHeight = "";


		var htmlNode = document.getElementById(params_chart.htmlNode)
		htmlNode.style.border = "solid 2px"; 
		htmlNode.style.borderColor= 'rgb(244,67,54,0)'; 
		htmlNode.style.borderRadius= '1%'; 
		htmlNode.style.transition= 'border-color 1.5s'

		var mymap = new L.map(htmlNode, {
			editable: true, 
			fullscreenControl: true,
			fullscreenControlOptions: {position: 'topleft'},
			renderer: L.canvas()			
		}).fitBounds(params_chart.bbox)
		
		
	    var parentNode = htmlNode.parentElement


		var layer = new L.tileLayer('//{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
			attribution: 'donn&eacute;es &copy; <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
			minZoom: 1,
			maxZoom: 20
		})
		mymap.addLayer(layer);
		L.control.scale().addTo(mymap)

		setTimeout(()=> {
			params_chart.map_instance.fitBounds(params_chart.bbox)
		}, 2000);

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






		if (!params_chart.geoRadius || !_.findKey(params_chart.geoRadius, 'center')) {
			if (!params_chart.load_on) {
				this.inject_metadata(mymap, params_chart)
			}
			else if (params_chart.load_on && params_chart.load_on.constructor == Array) {
				params_chart.load_on.forEach(o=> {
					//get the params_chart object
					var chart = params_chart.sharedParams.params_charts.find(c=> c.id === o.chart_id)
					if (chart.list_idx_segment_single_selected.length> 0 || chart.list_idx_segments_multiples_selected.length > 0) {
						this.inject_metadata(mymap, params_chart)
						return
					} 
				})
			}
		}

	

		//create the title
		
			//1.get the parent node of the map
			var mymap = document.getElementById(params_chart.htmlNode); mymap.classList.add('w3-card')

			
			//2.create the title
			var titleContainer = document.createElement('div'); titleContainer.style.display = 'grid'; titleContainer.id = "titleContainer_" + params_chart.htmlNode
			var title = document.createElement('span'); title.id = params_chart.htmlNode + '_title'; title.style = 'align-self: center; justify-self: center'; 
			if (params_chart.title) {title.innerHTML = params_chart.title} else {title.innerHTML = 'Title of the map'}
		

			
		//create node for crossfilter info
			var crossfilterContainer = document.createElement('div'); crossfilterContainer.id = "crossfilterContainer_" + params_chart.id
			//var width = document.getElementById(params_chart.id).clientWidth			
			crossfilterContainer.style = `display: flex; flex-wrap: wrap; width: initial; justify-self: left; margin-left: 80px; column-gap: 4px`
			var title_node = document.createElement('p'); title_node.style = 'font-size: 12px; margin: 4px'; title_node.innerText = 'Filtres: '
			crossfilterContainer.append(title_node)

			var crossfilterContainer_tooltip = document.createElement('div'); crossfilterContainer_tooltip.id = "crossfilterContainer_tooltip_" + params_chart.id		
			crossfilterContainer_tooltip.style = `display: none; width: initial; height: 20px; justify-self: left; column-gap: 4px`
			var phantom_title_node = document.createElement('p'); phantom_title_node.style = 'font-size: 12px; margin: 4px; opacity: 0;'; phantom_title_node.innerText = 'Filtres: '
			crossfilterContainer_tooltip.appendChild(phantom_title_node)
	
			


		//create layer for the controls
			//create grid container
			var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: 30px 30px; justify-items: center; margin-top: -10px'; controlsContainer.id = "controlsContainer_" + params_chart.htmlNode

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
			controlBrushRect.addEventListener("mouseover", function(evt){
				// if (tooltip_rect.style.visibility === 'hidden') {
				// 	tooltip_rect.style.visibility = 'visible';
				// 	tooltip_rect.style.opacity = '1'
				// }
			})

			controlBrushRect.addEventListener("mouseleave", function(evt){
				// tooltip_rect.style.visibility = 'hidden';
				// tooltip_rect.style.opacity = '0'
			})

			controlBrushCircle.addEventListener("mouseover", function(evt){
				// if (tooltip_circle.style.visibility === 'hidden') {
				// 	tooltip_circle.style.visibility = 'visible';
				// 	tooltip_circle.style.opacity = '1'
				// }
			})

			controlBrushCircle.addEventListener("mouseleave", function(evt){
				// tooltip_circle.style.visibility = 'hidden';
				// tooltip_circle.style.opacity = '0'
			})

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
			grid_title_controls_map.appendChild(titleContainer);
			
			grid_title_controls_map.appendChild(crossfilterContainer)
			grid_title_controls_map.appendChild(crossfilterContainer_tooltip)

			//add controlsContainer to general container (holds title + controls)
			grid_title_controls_map.appendChild(controlsContainer)
			//add map to general container (holds title + controls)
			grid_title_controls_map.appendChild(mymap)
			//add general container  to the parent node
			grid_title_controls_map_legend.appendChild(grid_title_controls_map)

			parentNode.appendChild(grid_title_controls_map_legend)

			//create a figure label		
			let fig = create_figure_label(params_chart)
			parentNode.append(fig)
			



		

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
				params_chart.brush_rect.addEventListener("mouseover", function(evt){ 
					let _path = evt.target.editor.feature._path
					if (_path) _path.style.cursor = "move"
				} )

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
								object_datapoints_brushed[r[params_chart.params_fields.lat] + "-" + r[params_chart.params_fields.lng]] = true							
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
							console.time("form circular dataset")
							if (!result.find(f=> f.leaflet_lat_lng)) {
								console.warn('brush on map not working, you should setup the "latLng_fields: {lat:"your lat", lng: "your lng" }" in the sharedParams.transformation section ')
								return
							}
							result.forEach(r=> {
								var distance_from_center = r['leaflet_lat_lng'].distanceTo(params_chart.brush_circle_center);	
								if (distance_from_center <= params_chart.brush_circle_radius) {
									circle_brush_dataset.push(r)
									object_datapoints_brushed[r[params_chart.params_fields.lat] + "-" + r[params_chart.params_fields.lng]] = true			
								} 
							})
							console.timeEnd("form circular dataset")

			        		//register the dataset formed & send the signal to fire the crossfilter
			        		sharedParams.spatial_data = circle_brush_dataset
							params_chart['brush_values'] = {sw_lat: brush_shape_bounds._southWest.lat, ne_lat: brush_shape_bounds._northEast.lat, sw_lng: brush_shape_bounds._southWest.lng, ne_lng: brush_shape_bounds._northEast.lng}
							params_chart["brush_keys_values"] = {[params_chart.params_fields.lat+"_brushed"]: [lat], [params_chart.params_fields.lng+"_brushed"]: [lng]}

							console.time("set style circular dataset")
							set_style_outer_datapoints(params_chart, object_datapoints_brushed)
							console.timeEnd("set style circular dataset")


							
			        	})	
					}
				}

				else {params_chart['brush_values'] = {}; params_chart.brush_keys_values = {}}
			}


			function set_style_outer_datapoints(params_chart, object_datapoints_brushed) {
				//lower opacity of non brushed data points
				console.time('map_datapoints_opcacity'); 							
				var time_set_style_origin = new Date, time_set_style_current = new Date
				params_chart.map_instance.eachLayer(l=> {
					if (object_datapoints_brushed.hasOwnProperty(l.options.index)) {
						if (l.options.color !== l.options.original_color) {
							l.setStyle({color: l.options.original_color, fillColor: l.options.original_color}) 
						}
					}
					else if (l.circle_layer) {
						if (l.options.color !== "rgb(150, 150, 150)") {
							l.setStyle({color: "rgb(150, 150, 150)", fillColor: "rgb(230, 230, 230)"}) 
						}
					}
					time_set_style_current = new Date - time_set_style_origin
				});
				console.timeEnd('map_datapoints_opcacity')				
				console.warn({"time set style task": time_set_style_current})
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
				
				// params_chart["brush_Circle"].on('editable:drawing:move', setup_params_circle);	
				// params_chart["brush_Circle"].on('editable:drag', setup_params_circle);
				
				//change the cursor style when mouse over the circle
				params_chart.brush_Circle.addEventListener("mouseover", function(evt){ 
					let _path = evt.target.editor.feature._path
					if (_path) _path.style.cursor = "move"
				} )


				params_chart.brush_state_Circle = "init"



				params_chart.map_instance.on('click', function(e) { 
					if (params_chart.brush_order !== 'circle' || params_chart.highlight_selected_point) {
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



	create_associated_charts(params_chart, sharedParams) {
		if (params_chart.associated_charts && params_chart.associated_charts.constructor == Array) {
			let id_associated_chart=0, parentElement = document.getElementById('grid_title_controls_map_'+params_chart.htmlNode);
			params_chart.associated_charts.forEach(chart=> {
				if (chart.chart_type === 'tick') {
					//input params
					/*
						{chart_type: 'tick', title: 'Nb de logements par permis de construire', fieldName: 'NB_LGT_TOT_CREES', 
						title_x_axis: "Nb de logements", tooltip_fields = [{field: 'lib_CAT_MOA', alias: 'Type de promoteur'}, {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"},
						{field: "date_collecte", alias: "Date de collecte"}, {field: "lib_NATURE_PROJET", alias: "Nature du projet"},
						]					
					*/
					//create html node
					var chart_node = document.createElement('div');
					chart_node.id = 'associated_chart_'+id_associated_chart+'_'+params_chart.id
					parentElement.append(chart_node)
					
					//init params for the chart
					let params_associated_chart = new params_tick()
					params_associated_chart.htmlNode = chart_node.id
					params_associated_chart.id = chart_node.id
					params_associated_chart.numerical_field_params = {fieldName: chart.fieldName}					
					params_associated_chart.title = chart.title || 'Set a title for the chart'
					params_associated_chart.title_x_axis = chart.title_x_axis || ""
					params_associated_chart.tooltip_fields = chart.tooltip_fields
					params_associated_chart.animation_params = chart.animation_params || params_associated_chart.animation_params
					params_associated_chart.brush_mode = true
					params_associated_chart.style.chart_width = params_chart.style.chart_width*0.75
					params_associated_chart.selection_params.brush.mode = 'highlightEvent'//brushEvent & highlightEvent for continious refresh, brushEndEvent & highlightEndEvent for a refresh at the end of brush move/sizing
					params_associated_chart.highlight_charts = [
					{chart: params_chart.id, highlight: true}
					]
					
					var instantiateur_chart = new Tick_chart(params_associated_chart)
					instantiateur_chart.createChart(params_associated_chart, params_chart.sharedParams)

					
					let monitor_chart_display = setInterval(() => {
						var chart_parent_container = document.getElementById(`parent_container_associated_chart_${id_associated_chart}_${params_chart.id}`)
						if (chart_parent_container) {
							//chart_parent_container.style.marginTop = '45px';
							var crossfilterContainer = document.getElementById(`crossfilterContainer_tooltip_associated_chart_${id_associated_chart}_${params_chart.id}`)							
							crossfilterContainer.remove()
							//adjust the height of the map container
							let map = document.getElementById(params_chart.htmlNode)							
							map.style.height = map.clientHeight - chart_parent_container.clientHeight+'px'
							map.style.minHeight = ''
							clearInterval(monitor_chart_display)
						}						
					}, 100);
						
					
					
				}
			})
		}
	}



	inject_metadata(mymap, params_chart, data_type, injection_type, updateTime) {
	   	params_chart.moveend = []; params_chart.zoomend = [];
	   
		//avoid repeated successives injections
		let time_last_injection = new Date - params_chart.time_injection
		
		if (!isNaN(time_last_injection) && time_last_injection < 300 && params_chart.size_previous_dataset === params_chart.data[1].markers.length) {
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
		params_chart["size_previous_dataset"] = params_chart.data[1].markers.length

		//init flags for buiding the tooltips
		params_chart.layer_added = undefined; params_chart.tooltips_added= undefined
		/*if (params_chart.layer) {
			params_chart.layerGroup_instance.removeLayer(params_chart.layer)
		}*/

		//remove previous layer
	 	remove_previous_layer(params_chart)

		//if no data prepared, exit
		if (params_chart.data[1].markers.length === 0) {
			return
		}

		//init the layer group
		var circles = [...params_chart.data[1].markers]
		//var layerGroup1 = L.layerGroup(circles);	
		//params_chart.layerGroup_instance = layerGroup1
		let featureGroup = L.featureGroup(circles)
		params_chart.featureGroup = featureGroup;


		

		function remove_previous_layer(params_chart) {
			// if (params_chart.layer) {
			// //retrieve the layer stored in the params_chart
			// 	var layer = params_chart.layer				
			// 	layer.forEach(l => {params_chart.layerGroup_instance.removeLayer(l)})		
			// }

	
			console.time('time remove layers'); 
			//params_chart.map_instance.eachLayer(l=> {if ( (l.hasOwnProperty("options") && l.options.hasOwnProperty("dataset")) || l.hasOwnProperty('_tooltip')) {params_chart.map_instance.removeLayer(l)}  }); 
			if (params_chart.featureGroup) {params_chart.map_instance.removeLayer(params_chart.featureGroup)}
			console.timeEnd('time remove layers');

			// console.time('r'); 
			// Object.values(params_map1.map_instance._layers).forEach(l=> {
			// 	if (l.hasOwnProperty("options") && l.options.hasOwnProperty("dataset") || l.hasOwnProperty('_tooltip')) 
			// 	{params_map1.map_instance.removeLayer(l)}
			// })
			// console.timeEnd('r'); 
		 }

		function check_map_display(params_chart) {
			var map_parent_nodes = find_node_parents(document.getElementById(params_chart.htmlNode))
			var map_isHidden;
			map_parent_nodes.forEach(node=> {
				if (node.style.display === "none") {map_isHidden = true}
			})
			return map_isHidden
		}

		function add_circles(params_chart) {

			let monitor_map_display = setInterval(() => {
				var map_isHidden = check_map_display(params_chart)
				if (!map_isHidden) {
					clearInterval(monitor_map_display)
					//remove_previous_layer(params_chart)
					//var circles = [...params_chart.data[1].markers]
					//var layerGroup = L.layerGroup(circles);			
					//layerGroup.addTo(params_chart.map_instance);
					let zoom = params_chart.map_instance.getZoom();
					// params_chart.map_instance.setZoom(zoom+0.5);
					// params_chart.map_instance.setZoom(zoom-0.5)
					//setTimeout(()=> {
						
						params_chart.map_instance.addLayer(params_chart.featureGroup)

					//}, 100);

					register_px_radius(params_chart);					
					setTimeout(()=> {add_tooltips(params_chart, params_chart.map_instance)}, 1500)

					if (params_chart.params_fields.size_params) {
						params_chart.params_fields.size_params.pause_animation = false
						if (!params_chart.params_fields.size_params.animation || Object.keys(params_chart.featureGroup._layers).length>600) {
							handle_opacity(params_chart, 800)
						}
						params_chart.funcLib.adaptSizePropCercles(params_chart)
	
						//pause animation to avoid firing anim resizing while zooming or panning the map
						params_chart.params_fields.size_params.pause_animation = true
					}					
					else if (params_chart.params_fields.hue_params && params_chart.params_fields.hue_params.move_circles) {
						params_chart.funcLib.animCirclesMove(params_chart)
					}
					else {
						handle_opacity(params_chart, 800)
					}
					
				}
			}, 100)


		}

		//put into options object the radius in px for each circle
		function register_px_radius(params_chart) {
			params_chart.featureGroup.eachLayer(ci=> {
				ci.options.radius_px = ci._radius || ci._radiusY
			})
		}


		function handle_opacity(params_chart, duration) {
			d3.select(`#${params_chart.htmlNode} > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g`).style('opacity', 0).transition().duration(duration).style('opacity', 1)

		}

		//calculate time for fly to bounds & delay scatter charts
		if (params_chart.data[1].markers.length > 0) {calculate_transition_times(params_chart, sharedParams)}

		//if the process is triggered by the adressSearch component, disable the flyToBounds process & setup a radius scaling behaviour
		var active_adress = _.find(params_chart.sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')?.adresses, {"selected": true})
		if (params_chart.sharedParams.filter_order_origin === 'adressSearch' && active_adress) {
			var bboxMap = params_chart.map_instance.getBounds();
			var centerMap = params_chart.map_instance.getCenter();			
			var active_adress_radius = active_adress.circle._mRadius

			if (active_adress_radius/centerMap.distanceTo(bboxMap._southWest) > 0.48 && active_adress.radius_direction === 'increase') {
				var current_zoom = params_chart.map_instance.getZoom()
				params_chart.map_instance.setZoom(current_zoom-1)
				add_circles(layerGroup1, params_chart)
				params_chart.layer_added = true				
				add_tooltips(params_chart, mymap);
				params_chart.tooltips_added = true;
				params_chart.sharedParams.highlight_chart_border(params_chart);
			}
			else if (active_adress_radius/centerMap.distanceTo(bboxMap._southWest) < 0.27 && active_adress.radius_direction === 'decrease') {
				var current_zoom = params_chart.map_instance.getZoom()
				params_chart.map_instance.setZoom(current_zoom+1)
				add_circles(layerGroup1, params_chart)
				params_chart.layer_added = true
				add_tooltips(params_chart, mymap);
				params_chart.tooltips_added = true;
				params_chart.sharedParams.highlight_chart_border(params_chart);
			}
			else {
				add_circles(layerGroup1, params_chart)
				params_chart.layer_added = true
				add_tooltips(params_chart, mymap)
				params_chart.tooltips_added = true;
				params_chart.sharedParams.highlight_chart_border(params_chart);				
			}
		}
		else {

			if (params_chart.data[1].x_y.length > 0) {
				params_chart.map_instance.invalidateSize()
				//console.warn({"defect initial fly to time": params_chart.time_flyToBounds})				
				if (!params_chart.time_flyToBounds || params_chart.time_flyToBounds === 0) {
					params_chart.time_flyToBounds = 0.003;					
				}
				// params_chart.time_flyToBounds === 0 ? params_chart.time_flyToBounds = 0.003 : {}
				// params_chart.time_flyToBounds === undefined ? params_chart.time_flyToBounds = 0.003 : {}
				let time_delay = params_chart.time_flyToBounds*1000
				//console.warn({"defect time_delay": time_delay})				

				var map_isHidden = check_map_display(params_chart)
				
				if (!map_isHidden && params_chart.time_flyToBounds) {// && params_chart.circles_added !== true
					params_chart.previousCenter = mymap.getCenter()
					//mymap.flyToBounds(params_chart.data[1].x_y, {'duration':params_chart.time_flyToBounds});
					mymap.flyToBounds(params_chart.data[1].x_y);

					//params_chart.sharedParams.highlight_chart_border(params_chart);
					setTimeout(()=> {
						//add_circles(params_chart);
						params_chart['circles_added'] = true;
						setTimeout(()=> {
							params_chart['circles_added'] = undefined}, 
							10000)
						// console.warn({[params_chart.id]: 'circles added'});
						// console.warn({flag_circles_added: params_chart.circles_added})
						// console.warn({defect_circles: "map_injection"})
					}, 
					time_delay)
					//console.log({time_flyToBounds_map_circles: new Date})
				}
			}
		}

		mymap.once('zoomend', ()=> {
			add_circles(params_chart)
		})
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
			params_chart.data[1].datasets.forEach(d=> {var key = d[params_chart.params_fields.lat] + "-" + d[params_chart.params_fields.lng]; tooltips[key] = d })


			//loop through circles object, for each key add popup to the layer
			Object.keys(circles).forEach(key=> {

				//build the tooltip
				var tooltip = [];
				var r = tooltips[key]
				params_chart.tooltip_fields.forEach(o => { 
					var el = [];
					var fieldName = o["field"];
					var precision = o["toPrecision"];
					if (r && r[fieldName]) {

						var alias = o.alias + ": "; el.push(alias);

						// if (o.slice) {
						// 	var fieldValue = r[fieldName].toString().slice(o.slice[0], o.slice[1])							
						// }
						// else {
						// 	var fieldValue = r[fieldName].toString()
						// }
						// el.push(fieldValue)


						if (o.slice) {
							//convert eventual string values to int
							o.slice = o.slice.map(s=> parseInt(s))
							var fieldValue = r[fieldName].toString().slice(o.slice[0], o.slice[1]) + "...";
						}
						else {
							if (o.toPrecision) {
								var precision = parseInt(o.toPrecision); //el.push(precision)
								var fieldValue = parseFloat(r[fieldName]).toFixed(precision)
							}
							else {
								var fieldValue = r[fieldName].toString()
							}							
						}
						el.push(fieldValue)
	

							
						if (o.unit) {var unit = " "+ o.unit; el.push(unit)};
						
						tooltip.push(el.filter(e=> e!== undefined));

					}
					//popup.filter(e=> e!== undefined).map(f=> f + "<br />").join("")


				});

				var p1 = tooltip.map(f=> f.map(e=> e).join("")); tooltip = p1.map(f=> f + "<br />").join("")


				circles[key].bindTooltip(tooltip);
			})
			console.log({[params_chart.id]: "tooltips added"})

		}

		

		mymap.once('zoomend', function() {
			//get current zoom
		    let zoom = mymap.getZoom();
		    //const size_field = params_chart.params_fields.size_field;
		    //adapt_tailleCercles(layerGroup1, zoom); //, size_field
		   params_chart.zoomend.push(1)
		   console.log("zoomend: " + params_chart.zoomend.length)
		});
				

		//update the legends
		if (params_chart.inject_type === 'change_hue_field') {
			add_circles(params_chart);
			params_chart.instanciator.setup_legends(params_chart, params_chart.sharedParams, 'update')
		}


		//setInterval(invalidateSize, 500)

		//refresh map size, fix for bootstrap bug
		function invalidateSize() {
			params_chart.map_instance.invalidateSize()
		}

	    
	    var interval = setInterval(()=> {
			if (params_chart.layer_added && !params_chart.tooltips_added) {
				var t1 = new Date()				
				//add_tooltips(params_chart, mymap)
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
				//console.log({'distance_from_previous_location': params_chart.distance_from_previous_location})

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

		var max_cells;
		params_chart.params_legends.max_cells ? max_cells = params_chart.params_legends.max_cells : max_cells = 6
		

		if (params_chart.params_legends.show !== true) {
			return
		}


		//in case when the color field is numerical:
		if (params_chart.params_fields.hue_params) {
			//binning the legend field
			var hue_statistical_values = params_chart.data[1].datasets.map(r=> r[params_chart.params_fields.hue_params.hue_field])
			//binning the legend field			
			let array_binned = binGenerator(params_chart, max_cells, hue_statistical_values)



			//bin hue values
			//var hue_statistical_values = params_chart.legends_config.map(h=> h.hue_statistical_value)
			// var hue_statistical_values = params_chart.data[1].datasets.map(r=> r[params_chart.params_fields.hue_params.hue_field])
			// var array_binned = binGenerator(hue_statistical_values).filter(a=> a.length > 0) ; params_chart.legend_dataset_binned = array_binned

			//build an array of coef colors and extents to feed d3 colors interpolator
			var coef_colors = []
			array_binned.map(a=> {coef_colors.push( {hue_value: d3.mean(a), x0: a.x0, x1: a.x1} ) })

			var legends_colors_setup = [], precision = 2
			if (!params_chart.params_fields.hue_params.hue_color) {
				var legend_interpolator_color = "interpolateBlues"
			}
			else {
				var legend_interpolator_color = params_chart.params_fields.hue_params.hue_color
			}

			
			params_chart.params_legends.toPrecision ? precision = params_chart.params_legends.toPrecision : {}
			coef_colors.forEach(c=> { 
				var label = (+c.x0).toFixed(precision) + " - " + (+c.x1).toFixed(precision);
				legends_colors_setup.push( {hue_value :c.hue_value, label: label, 
				color: d3[legend_interpolator_color]((c.hue_value - params_chart.hue_dataset_extent.min) / (params_chart.hue_dataset_extent.max - params_chart.hue_dataset_extent.min)) } ) } )

			params_chart.legends_colors_setup = legends_colors_setup
		}

		//in case when the color field is categorical:
		else if (params_chart.params_fields.color_params) {
			const color_field = params_chart.params_fields.color_params.color_field

			legends_colors_setup = Object.keys(params_chart.backgroundColorArray_source).map(key=> {return {label: key, color: params_chart.backgroundColorArray_source[key]} }).filter(k=> k.label!== 'category_field')

			//filter on current dataset
			let d=deduplicate_dict(params_chart.data[1].datasets, color_field)
			legends_colors_setup= legends_colors_setup.filter(e=> d.includes(e.label))

			
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
		if (params_chart.params_fields.hue_params && !params_chart.params_fields.hue_params.domain) {
			params_chart.params_fields.hue_params.domain = ["min", "max"]
		}
		if (params_chart.params_fields.size_params && !params_chart.params_fields.size_params.domain) {
			params_chart.params_fields.size_params.domain = ["min", "max"]
		}
		params_chart.params_datapoints.circling_datapoints === undefined ? params_chart.params_datapoints.circling_datapoints = false : {}
		params_chart.params_datapoints.circleColor === undefined ? params_chart.params_datapoints.circleColor = "" : {}
		params_chart.params_datapoints.circles_color_mode === undefined ? params_chart.params_datapoints.circles_color_mode = "continuous_color" : params_chart.params_datapoints.circles_color_mode = "continuous_color"
		params_chart.params_legends.nb_cells === undefined ? params_chart.params_legends.nb_cells = 6 : {}
		params_chart.params_legends.show === undefined ? params_chart.params_legends.show = true : {}
		params_chart.figure_auto = sharedParams.params_charts.length
	}

	funcLib(params_chart, sharedParams) {
		params_chart.map_instance.on("zoomstart", ()=> {
			params_chart.zoomstart = true
		})


		let monitor_map_display = setInterval(() => {
			var map_parent_nodes = find_node_parents(document.getElementById(params_chart.htmlNode))
			var map_isHidden;
			map_parent_nodes.forEach(node=> {
				if (node.style.display === "none") {map_isHidden = true}
			})
			if (!map_isHidden && !params_chart.zoomstart) {
				var t1_bis1 = (new Date())/1000
				params_chart.map_instance.invalidateSize()				
				if (params_chart.bbox) {
					params_chart.map_instance.fitBounds(params_chart.bbox)
				}
				else {
					if (navigator.language === "fr-FR") {
						params_chart.map_instance.fitBounds([[51.072228, 2.528016], [42.442288, 3.159714]])
					}
				}
				clearInterval(monitor_map_display);
			}
		}, 1000);


		params_chart.funcLib.adaptSizePropCercles = function (params_chart, opacity) { //, size_field

			let e, param, radius
			let params_zoom_radiusCircles =
			[
				 {"zoom": 18, "coef_radius": 1},
				 {"zoom": 17, "coef_radius": 1},
				 {"zoom": 16, "coef_radius": 1},
				 {"zoom": 15, "coef_radius": 1.5},
				 {"zoom": 14, "coef_radius": 2},
				 {"zoom": 13, "coef_radius": 2.5},
				 {"zoom": 12, "coef_radius": 3.5},
				 {"zoom": 11, "coef_radius": 3.5},
				 {"zoom": 10, "coef_radius": 3.5},
				 {"zoom": 9, "coef_radius": 3.5},	
				 {"zoom": 8, "coef_radius": 3.5},
				 {"zoom": 7, "coef_radius": 3.5},
				 {"zoom": 6, "coef_radius": 3.5},
				 {"zoom": 5, "coef_radius": 3.5}
		
			]


		
			let current_zoom = params_chart.map_instance.getZoom()
			// Determine the number of meters per pixel based on map zoom and latitude			
			const lat = params_chart.map_instance.getCenter().lat
			const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, current_zoom)


			// Create the circle
			//const circle = L.circle(this.map.getCenter(), {radius: radius}))		
			
			
			for (e in params_zoom_radiusCircles) {
				param = params_zoom_radiusCircles[e];
				let animation_time = params_chart.params_fields.size_params.animation_time || 300
				//si le zoom actuel = zoom param, adapter la taille du cercle
				if (current_zoom === param.zoom) {
					if (!params_chart.params_fields.size_params.pause_animation && params_chart.params_fields.size_params.animation && Object.values(params_chart.featureGroup._layers).length<800) {
						params_chart.target_radius_reached=[false];
						params_chart.funcLib.animCircleSizing_v2(params_chart, param, animation_time)
						return
					}
					else {
						params_chart.featureGroup.eachLayer(function (layer) {
							if (layer instanceof L.Circle) {
								layer.setRadius(param.coef_radius * layer.options.radius);
							}
						})
						return
					}
				}
			};
		}
		
		params_chart.funcLib.animCircleSizing_v2 = function(params_chart, param, animation_time) {
			let requestAnimation_handler, animation_speed, ease_function//in meters
			function resize_circles() {
				params_chart.featureGroup.eachLayer(function (layer) {
					if (layer instanceof L.Circle) {
						//assign starting radius
						if (!layer.options.progress_radius) layer.options.progress_radius = 0
						
						//set the progress radius
						if (layer.options.progress_radius < layer.options.radius) {
							var progress_rate = layer.options.progress_radius/layer.options.radius
							var progress_radius = ease_functions[ease_function](progress_rate, 0, layer.options.radius, 1)
							layer.setRadius(param.coef_radius * progress_radius);
							layer.options.progress_radius += animation_speed
							params_chart.target_radius_reached.push(false)
						}
						else {
							layer.setRadius(param.coef_radius * layer.options.radius);
							layer.options.target_radius_reached = true;
							params_chart.target_radius_reached.push(true)
						}					
					}
				})
				
				if (params_chart.target_radius_reached.some(e=> !e)) {
					params_chart.target_radius_reached = [];
					requestAnimation_handler = requestAnimationFrame(resize_circles)
				}
				else if (params_chart.target_radius_reached.every(e=> e)) {
					cancelAnimationFrame(requestAnimation_handler)
				}	
			}
			animation_speed = params_chart.params_fields.size_params.animation_speed || 2;
			ease_function = params_chart.params_fields.size_params.ease_function || "easeInQuad"
			resize_circles()

		}

		params_chart.funcLib.animCirclesMove = function(params_chart) {
			let requestAnimation_handler, bounds, center, distance_bounds_center, animation_time, move_per_refresh, ease_function
			params_chart.target_latLng_reached=[false]
			bounds=params_chart.map_instance.getBounds();
			center = params_chart.map_instance.getCenter();
			distance_bounds_center = center.distanceTo(bounds._southWest)
			animation_time = params_chart.params_fields.animation_time || 1
			//0.00001 = 1 meter
			//0.0001 = 10 meter
			//0.0001 = 100 meter
			move_per_refresh= params_chart.params_fields.hue_params.move_per_refresh || 0.001
			

			//assign starting & target position to the layers
			params_chart.featureGroup.eachLayer(function (layer) {
				if (layer instanceof L.CircleMarker) {
					//assign starting position
					if (!layer.options.progress_position_lat) layer.options.progress_position_lat = parseFloat(center.lat.toPrecision(7));
					if (!layer.options.progress_position_lng) layer.options.progress_position_lng = parseFloat(center.lng.toPrecision(7));
					//assign target position
					if (!layer.options.target_position_lat) layer.options.target_position_lat = parseFloat(layer._latlng.lat.toPrecision(7));
					if (!layer.options.target_position_lng) layer.options.target_position_lng = parseFloat(layer._latlng.lng.toPrecision(7));
					//assign moving direction
					if (layer.options.progress_position_lat < layer.options.target_position_lat) {
						layer.options.moving_direction_lat = 1//increase
					}
					else {layer.options.moving_direction_lat = 0}//decrease
					if (layer.options.progress_position_lng < layer.options.target_position_lng) {
						layer.options.moving_direction_lng = 1
					}
					else {layer.options.moving_direction_lng = 0}					
				}
			})	
					
			function move_circles() {
				params_chart.featureGroup.eachLayer(function (layer) {
					if (layer instanceof L.CircleMarker) {
						//update the circle motion on the lat axis
						if (layer.options.moving_direction_lat === 1) {//increase
							if (layer.options.progress_position_lat < layer.options.target_position_lat) {
								var progress_rate = layer.options.progress_position_lat/layer.options.target_position_lat
								//var progress_distance_lat = ease_functions[ease_function](progress_rate, center.lat, layer.options.target_position_lat, 1)
								var progress_distance_lat = move_per_refresh
								layer.options.progress_position_lat += progress_distance_lat;
							}
						}
						else if (layer.options.moving_direction_lat === 0) {//decrease
							if (layer.options.progress_position_lat > layer.options.target_position_lat) {
								var progress_rate = layer.options.target_position_lat/layer.options.progress_position_lat
								//var progress_distance_lat = ease_functions[ease_function](progress_rate, center.lat, layer.options.target_position_lat, 1)
								var progress_distance_lat = move_per_refresh
								layer.options.progress_position_lat -= progress_distance_lat;
							}
						}

						//update the circle motion on the lng axis
						if (layer.options.moving_direction_lng === 1) {
							if (layer.options.progress_position_lng < layer.options.target_position_lng) {
								var progress_rate = layer.options.progress_position_lng/layer.options.target_position_lng
								//var progress_distance_lng = ease_functions[ease_function](progress_rate, center.lng, layer.options.target_position_lng, 1)
								var progress_distance_lng = move_per_refresh
								layer.options.progress_position_lng += progress_distance_lng;
								params_chart.target_latLng_reached.push(false)
							}
						}
						else if (layer.options.moving_direction_lng === 0) {
							if (layer.options.progress_position_lng > layer.options.target_position_lng) {
								var progress_rate = layer.options.target_position_lat/layer.options.progress_position_lat
								//var progress_distance_lng = ease_functions[ease_function](progress_rate, center.lng, layer.options.target_position_lng, 1)
								var progress_distance_lng = move_per_refresh
								layer.options.progress_position_lng -= progress_distance_lng;
								params_chart.target_latLng_reached.push(false)
							}
						}
						


						layer.setLatLng({lat: layer.options.progress_position_lat, lng: layer.options.progress_position_lng});


					}
				})
				
				if (params_chart.target_latLng_reached.some(e=> !e)) {
					params_chart.target_latLng_reached = [];
					requestAnimation_handler = requestAnimationFrame(move_circles)
				}
				else if (params_chart.target_latLng_reached.every(e=> e)) {
					cancelAnimationFrame(requestAnimation_handler)
				}	
			}
			
			ease_function = params_chart.params_fields.hue_params.ease_function || "easeInQuad"
			move_circles()

		}
		
	}

	geoRadius_display(params_chart, sharedParams) {
		if (!params_chart.geoRadius || !_.findKey(params_chart.geoRadius, 'center')) return
	
		//register the params_adressSearch instance in the map params
		params_chart.params_adressSearch = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')

		params_chart['geoRadius_layers'] = [];
		params_chart.geoRadius.forEach(el=> {
			//add the adress marker
			var newMarker = new L.marker(el.center).addTo(params_chart.map_instance);
			newMarker.bindTooltip(el.adress)
			
			//add radius
			var circle = L.circle([el.center.lat, el.center.lng], {
				color: 'red',
				fillColor: '#f03',
				fillOpacity: 0.05,
				weight: 1,
				radius: el.radius
			}).addTo(params_chart.map_instance);			
			circle.bringToBack()
			el['_layer'] = circle

			//register the circle in the params_adressSearch object
			Object.assign(params_chart.params_adressSearch.adresses[el.adress], {circle: circle})
		})

		

		setInterval(()=> {
			Object.values(params_chart.geoRadius_layers).forEach(l=> {
				l.bringToBack()
			})
		}, 1000)

		//this.geoRadius_resize(params_chart, sharedParams)
	}
	
	geoRadius_resize(params_chart, sharedParams) {
		//resize the circles stocked as leaflet layer in the params_chart, according to the new radius given by the slider component
		params_chart.geoRadius.forEach(el=> {
			el._layer.setRadius(el.radius)
		})
		

		//update_charts(params_chart, sharedParams)		
	
		async function update_charts(params_chart, sharedParams) {
			var sharedParams = params_chart.sharedParams
			var mapCoordonneesLatitude = params_chart.params_fields.lat, mapCoordonneesLongitude = params_chart.params_fields.lng;


			params_chart.promises_data_input = [];
			//circles_bbox stores the trace of all circles bounds, as id, to trigger the crossfilter process
			var circles_bbox={_northEast: {lat: 0, lng: 0}, _southWest: {lat: 0, lng: 0}}
			var latitudes = [], longitudes = [];
			var adresses_candidates = sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch').adresses

			//select adresses to display
			if (_.find(adresses_candidates, {'selected': true})) {
				var adresses = [_.find(adresses_candidates, {'selected': true})]
			}
			else {
				var adresses = Object.values(adresses_candidates)
			};
			
			for (var adress of adresses) {
				var circle_bbox = adress.circle.getBounds()

				var shape_bounds = format_circle_bounds(circle_bbox)
				var lat = shape_bounds.lat, lng = shape_bounds.lng//, adress = adress.adress;				
				
				//get the center, radius
				var center = adress.leaflet_lat_lng, radius = adress.radius;
				
				//register the lat & lng in the params_adressSearch object
				Object.assign(params_chart.params_adressSearch.adresses[adress.adress], {lat_radius: lat, lng_radius: lng})//, circle: circle._layer

				var brush_keys_values = {[mapCoordonneesLatitude+"_brushed"]: [lat], [mapCoordonneesLongitude+"_brushed"]: [lng]}

				params_chart.transformations['crossfilter'] = {}
				Object.assign(params_chart.transformations.crossfilter, brush_keys_values)	
				
				sharedParams['filter_order_origin'] = {};
				sharedParams.filter_order_origin = 'spatial query';
				var promise_data_input = await params_chart.instanciator.prepare_data_p1(params_chart, sharedParams);
				params_chart.promises_data_input.push(promise_data_input)

				//set crossfilter mode for specified traget charts
				// if (params_chart.params_filter_targets && params_chart.params_filter_targets.find(p=> p.mode === "filter_shape")) {
				// 	params_chart.params_filter_targets.find(p=> p.mode === "filter_shape")['brush_keys_values'] = {[mapCoordonneesLatitude+"_brushed"]: [lat], [mapCoordonneesLongitude+"_brushed"]: [lng]}
				// }
			}
			

			
			//assemble the result
			var data_filtred = []; params_chart.promises_data_input.forEach(d=> data_filtred =data_filtred.concat(d))

			//form the dataset that fits with the circle bounds
			var circle_brush_dataset = [], object_datapoints_brushed = {};


			adresses.forEach(adress=> {
				if (!data_filtred.find(f=> f.leaflet_lat_lng)) {
					console.warn('brush on map not working, you should setup the "latLng_fields: {lat:"your lat", lng: "your lng" }" in the sharedParams.transformation section ')
					return
				}

				data_filtred.forEach(r=> {
					var distance_from_center = r['leaflet_lat_lng'].distanceTo(adress.leaflet_lat_lng);	
					if (distance_from_center <= adress.radius) {
						circle_brush_dataset.push(r)
						object_datapoints_brushed[r.mapCoordonneesLatitude + "-" + r.mapCoordonneesLongitude] = true			
					} 
				})
			})

			//register the dataset formed & send the signal to fire the crossfilter
			sharedParams.filter_order_origin = "adressSearch"
			sharedParams.spatial_data = circle_brush_dataset
			params_chart.instanciator.prepare_data_p2(circle_brush_dataset, params_chart, sharedParams)
			params_chart.instanciator.inject_metadata(params_chart.map_instance, params_chart)

			//prepare the values to use in the crossfilter process: let all the graphics to display all the adresses, except for the maps
			// adresses = Object.values(adresses_candidates);
			// for (var adress of adresses) {
			// 	var circle_bbox = adress.circle.getBounds()
			// 	circles_bbox._northEast.lat += circle_bbox._northEast.lat; circles_bbox._northEast.lng += circle_bbox._northEast.lng
			// 	circles_bbox._southWest.lat += circle_bbox._southWest.lat; circles_bbox._southWest.lng += circle_bbox._southWest.lng

			// 	var shape_bounds = format_circle_bounds(circle_bbox)
			// 	var lat = shape_bounds.lat, lng = shape_bounds.lng//, adress = adress.adress;				
			// 	latitudes.push(lat); longitudes.push(lng)
			// };			
			// params_chart['brush_values'] = {sw_lat: circles_bbox._southWest.lat, ne_lat: circles_bbox._northEast.lat, sw_lng: circles_bbox._southWest.lng, ne_lng: circles_bbox._northEast.lng}
			// params_chart["brush_keys_values"] = {[params_chart.params_fields.lat+"_brushed"]: latitudes, [params_chart.params_fields.lng+"_brushed"]: longitudes}

			// //set crossfilter mode for specified traget charts
			// if (params_chart.params_filter_targets && params_chart.params_filter_targets.find(p=> p.mode === "preserve_shape")) {
			// 	params_chart.params_filter_targets.find(p=> p.mode === "preserve_shape")['brush_keys_values'] = {[mapCoordonneesLatitude+"_brushed"]: latitudes, [mapCoordonneesLongitude+"_brushed"]: longitudes}
			// }
			// setTimeout(()=> {params_chart.brush_keys_values = {} }, 2000)

			// 	})
			// }

			function format_circle_bounds(shape_bounds) {
				var lat = [shape_bounds._southWest.lat, shape_bounds._northEast.lat]					
				if (lat[0] < 0 && lat[1] < 0) {
					lat = lat.sort(function(a, b){return a-b})
				}
				else {
					lat = lat.sort()	
				}
				
				var lng = [shape_bounds._southWest.lng, shape_bounds._northEast.lng]
				if (lng[0] < 0 && lng[1] < 0) {
					lng = lng.sort(function(a, b){return a-b})
				}
				else {
					lng = lng.sort()	
				}		

				
				var lat = (Math.round(lat[0] * 100000) / 100000).toString() + "_" + (Math.round(lat[1] * 10000) / 10000).toString()
				var lng = (Math.round(lng[0] * 100000) / 100000).toString() + "_" + (Math.round(lng[1] * 10000) / 10000).toString()
				return {lat: lat, lng: lng}				
			}


		}
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


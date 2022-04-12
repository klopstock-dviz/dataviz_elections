//targetObj is the 
/*var targetObj = {};

var singleSelect = new Proxy(targetObj, {
  set: function (target, key, value) {
      console.log(`${key} set to ${value}`);
      loadChart()
      target[key] = value;
      return true;
  }
});

function loadChart() {
	console.log('chart loaded, values');

}


var test = {};
var p = ObservableSlim.create(test, true, function(changes) {
	console.log(JSON.stringify(changes));
});*/



class Observe_Charts_state {
	constructor() {
		this.legends_array = []
	}





	observe_chart_state(params_chart, params_charts_target, sharedParams) {








		var id_previous_singleSelect = ""
		var id_previous_multiSelect = ""
		var id_previous_brushSelect = ""
		var id_current_legend = ""
		var id_previous_legend = ""
		var current_chart
		var category = "x"
		var sub_category = "x"
		var id_current_singleSelect = ""
		var id_current_brushSelect = ""
		var id_current_multiSelect = ""
		var filter_array = [];
		var elements_to_filter
		


		var legends_array = this.legends_array;
		var _this = this;


		setInterval(function(sharedParams) {

			var sharedParams = params_chart.sharedParams

			//graph bar1
			//observation clic simple
			try{

				if (!params_chart.list_idx_segment_single_selected || !params_chart.list_idx_segments_multiples_selected) {
					return
				};
				
				id_current_singleSelect = params_chart.list_idx_segment_single_selected?.join()
				id_current_multiSelect = params_chart.list_idx_segments_multiples_selected?.join()
				id_current_brushSelect = Object.values(params_chart.brush_values).join()

				
				
				//if a change in single select interaction with the chart is registred between two checks
				if (params_chart.id_previous_singleSelect !== id_current_singleSelect) {

					//if a selection occurs (a slice is clicked)
					if (id_current_singleSelect !== "") {

						sharedParams.time_refresh = new Date();
						//indiquer la détection du clic			

						//ACTIONS TO TRIGGER
						var interaction_type
						if (params_chart.chart_type === 'leaflet' || params_chart.filter_order_origin === 'spatial query') {
							interaction_type = "map_binding"
						}
						else {
							interaction_type = "selection_binding"
						}
						
						_this.set_filter(params_chart, params_charts_target, interaction_type, sharedParams)

						//register the new state
						params_chart.id_previous_singleSelect = params_chart.list_idx_segment_single_selected.join()
						params_chart.status_chart = ''
						params_chart.id_previous_multiSelect = ""
						
						sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)
					}

					//if the selection is released, reset the chart whith it's original data
					else if (id_current_singleSelect === "" && params_chart.id_previous_singleSelect !== undefined) {
						//ACTIONS TO TRIGGER
						var interaction_type
						if (params_chart.chart_type === 'leaflet' || params_chart.filter_order_origin === 'spatial query') {
							interaction_type = "map_binding"
						}
						else {
							interaction_type = "selection_binding"
						}
						

						sharedParams.time_refresh = new Date();

						_this.remove_filter(params_chart, params_charts_target, interaction_type, sharedParams)

						//register the value of the current index as "previous id"
						params_chart.id_previous_singleSelect = params_chart.list_idx_segment_single_selected.join()
						params_chart.status_chart = ''
						params_chart.id_previous_multiSelect = ""


						sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)

					}
				}

			}
			catch (error) {
				console.log("observer 1 ko:" + error.stack)
			}


			//observation clics multiples
			try{


				//declencher si seulement le clic simple n'est pas alimenté
				if (params_chart.id_previous_singleSelect === "" && params_chart.id_previous_multiSelect !== id_current_multiSelect) { //id_previous_singleSelect !== id_current_multiSelect && 

					//if a selection occurs (a slice is clicked)
					if (id_current_multiSelect !== "") {

						sharedParams.time_refresh = new Date();

						//console.log('observer 2 clics multiples:' + params_chart.list_idx_segments_multiples_selected)
						params_chart.id_previous_multiSelect = params_chart.list_idx_segments_multiples_selected.join()

						//ACTIONS TO TRIGGER
						//1.
						var interaction_type = "multiple_selection_binding"
						_this.set_filter(params_chart, params_charts_target, interaction_type, sharedParams)

						sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)


					}
					//if the selection is released, reset the chart whith it's original data
					else if (id_current_multiSelect === "") { // && id_current_singleSelect === ""
						sharedParams.time_refresh = new Date();

						var interaction_type = "multiple_selection_binding"
						_this.remove_filter(params_chart, params_charts_target, interaction_type, sharedParams)

						//register the value of the current index as "previous id"
						params_chart.id_previous_multiSelect = params_chart.list_idx_segments_multiples_selected.join()
						params_chart.status_chart = ''

						sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)

					}
				}
			}
			catch(error){
				console.log("observer 2 ko: " + error.stack)
			}	



			//observation brush selection
			//if a change in single select interaction with the chart is registred between two checks
			if (id_previous_brushSelect !== id_current_brushSelect) {

				//if a selection occurs (a slice is clicked)
				if (id_current_brushSelect !== "") {

					sharedParams.time_refresh = new Date();
					//indiquer la détection du clic
					//console.log('observer 1 clic unique:' + params_chart.list_idx_segment_single_selected)

					//ACTIONS TO TRIGGER
					var interaction_type = "brush_selection_binding"
					_this.set_filter(params_chart, params_charts_target, interaction_type, sharedParams)

					//register the new state
					if (params_chart.brush_values) id_previous_brushSelect = Object.values(params_chart.brush_values).join()
					params_chart.status_chart = ''
					
					
					sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)
				}

				//if the selection is released, reset the chart whith it's original data
				else if (id_current_brushSelect === "") {
					var interaction_type = "brush_selection_binding"

					sharedParams.time_refresh = new Date();

					_this.remove_filter(params_chart, params_charts_target, interaction_type, sharedParams)

					//register the value of the current index as "previous id"
					if (params_chart.brush_values) id_previous_brushSelect = Object.values(params_chart.brush_values).join()
					params_chart.status_chart = ''

					sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)

				}
			}			



			//observation clics legends
			try{

				//dont observe clicks for following visuals
				if (["label", "labelGroup", "slider"].includes(params_chart.chart_type)) {
					return
				}				

				current_chart = params_chart.chart_instance;



				// var legends_state = collect_active_legends(current_chart, _this, params_chart)
				// var active_legends = legends_state["active_legends"]; var hidden_legends = legends_state["hidden_legends"]

				// if (params_chart.chart_type === "chartJS") {var legends_hidden = detect_hidden_legends(current_chart); legends_hidden = deduplicate_array(legends_hidden)}
				// else {var hidden_legends = []}

				// if (active_legends !== undefined) {id_current_legend = active_legends?.join()}
				
				check_clicks_on_legends(params_chart, _this)
				//if a legend is selected && this selection differs from the previous one, update the chart
				//if (params_chart.legend_clicked === true && id_previous_legend !== id_current_legend) {
				if (params_chart.legend_clicked && params_chart.id_previous_legend !== params_chart.id_current_legend && params_chart.interactions_chart_options.selectionOptions  && params_chart.legends_crossfilter !== false) {

					var legends_state = collect_legends(current_chart, _this, params_chart)
					var active_legends = legends_state?.["active_legends"]; var hidden_legends = legends_state?.["hidden_legends"]
					console.log('legend clicked on '+ params_chart.id + ': ' + hidden_legends)

					if (active_legends === undefined || hidden_legends === undefined) {
						return
					}

					//ACTIONS TO TRIGGER
					//register the active legends
					if (params_chart.chart_type === "chartJS") {var chartJS_type = params_chart.chart_instance.config.type}
					//if (chart_type !== "doughnut" && chart_type !== "pie") {
					if (params_chart.chart_type === "chartJS") {
						if (params_chart.nb_axis === 1) {
							params_chart.active_legends = {[params_chart.category_field]: active_legends}
						}
						else if (params_chart.nb_axis === 2) {
							params_chart.active_legends = {[params_chart.sub_category_field]: active_legends}
						}
					}
					else if (params_chart.chart_type === "leaflet") {
						params_chart.active_legends = {[params_chart.legends_field]: active_legends}
					}

					//register hidden legends			
					//if (chart_type !== "doughnut" && chart_type !== "pie") {								
						if (params_chart.nb_axis === 1) {
							params_chart.hidden_legends = {[params_chart.category_field]: hidden_legends}
						}
						else if (params_chart.nb_axis === 2) {
							params_chart.hidden_legends = {[params_chart.sub_category_field]: hidden_legends}
						}
					//}

					sharedParams.time_refresh = new Date();
					var interaction_type = "legends_binding"
					_this.set_filter(params_chart, params_charts_target, interaction_type, sharedParams)

					//reset legend_clicked status
					params_chart.legend_clicked = false
					//params_chart.legend_selected = false



					sharedParams.time_refresh =  (new Date() - sharedParams.time_refresh)/1000; console.log(sharedParams.time_refresh)
				}




				function detect_hidden_legends(current_chart) {										
					var limit = current_chart.legend?.legendItems.length; var status_legends = [];
					for (var i = 0; i < limit; i++) {
						var status_legend = current_chart.legend?.legendItems[i].hidden
						//collect all non hidden slices to push them into the filter array
						if (status_legend === true) {
							status_legends.push(status_legend)
						}
					}
					return status_legends
				};


			}
			catch(error) {
				console.log("observer legends ko: " + error.stack)
			}
			

			//observation clics on map circles
			// try {

			// }
			// catch(error) {
			// 	console.log("observer maps circles ko: " + error.stack)
			// }

			}
		, 20)
		}


	set_filter(params_chart, params_charts_target, interaction_type, sharedParams) {
		sharedParams.crossfilter_status = 'active'
		var params_charts_target_to_filter = params_charts_target.filter(c=> c.filter === true).map(c=> c.chart)
		let filter_array= {}, filter_array_public={}, filter_chart_source={}, filter_array_ref = {};
		params_chart.status_chart = 'active';
		//filter the data of the targeted charts
		for (var i = 0; i < params_charts_target_to_filter.length; i++) {
			var params_chart_target = params_charts_target_to_filter[i]
			console.log({params_chart_target: params_chart_target.id})
			params_chart_target.chart_updated = undefined
			params_chart_target.status_chart = 'target';

			//if the chart is scatter type, show the spinner
			if (params_chart_target.chart_sub_type === "scatter") {
				sharedParams.charts_with_spinners[params_chart_target.id].show_spinner(params_chart_target)
				setTimeout(()=> {sharedParams.charts_with_spinners[params_chart_target.id].hide_spinner(params_chart_target)}, 4500)
			}

			//if there are charts to reset
			if (params_chart.crossfilter_reset_charts) {
				params_chart.crossfilter_reset_charts.forEach(c=> {
					var chart_to_reset = params_charts_target.find(o=> o.chart.id === c)
					if (!chart_to_reset) {
						console.warn(`the provided chart id '${c}' is not valid`)
					} 
					else {
						chart_to_reset = chart_to_reset.chart
						chart_to_reset.list_idx_segment_single_selected = []; chart_to_reset
						chart_to_reset.list_labels_segment_single_selected = []; chart_to_reset.list_labels_segments_multiples_selected = []
						chart_to_reset.list_keys_values_segment_single_selected = []; chart_to_reset.list_keys_values_segments_multiples_selected = [];
						chart_to_reset.brush_keys_values = {}; chart_to_reset.brush_values = {}
						if (chart_to_reset.type === "map") {
							chart_to_reset.selected_legends = []; params_chart.active_polygons = []; chart_to_reset.active_legends = [];}
					}
				})
			}

			//if the target chart is choroplete map, clean its stores clicks
			if (params_chart_target.chart_sub_type === "choroplete_map" && (params_chart_target.list_idx_segment_single_selected.length > 0 || params_chart_target.list_idx_segments_multiples_selected.length > 0)) {
				clean_choroplete_stores_clicks(params_chart_target)
			}

			
			filter_array = {}, filter_array_public = {};

			//if the chart has been drilled down, catch the value of last active hierarchy level
			collect_hierarchy_slice(params_chart, filter_array)

			//if legends has been clicked, sync the charts that share the same legends field
			//prepare for eval
			if (params_chart.hidden_legends && Object.values(params_chart.hidden_legends).length > 0) {var eval_source_hidden_legends = Object.values(params_chart.hidden_legends)[0].length}
			else {var eval_source_hidden_legends = 0}
			if (params_chart_target.hidden_legends && Object.values(params_chart_target.hidden_legends).length > 0) {var eval_target_hidden_legends = Object.values(params_chart_target.hidden_legends)[0].length}
			else {var eval_target_hidden_legends = 0}

			if ((params_chart.legends_field === params_chart_target.legends_field) && (eval_source_hidden_legends > 0 || eval_target_hidden_legends> 0)
			 && interaction_type === "legends_binding") {			
				sync_legends(params_chart, params_chart_target, params_charts_target_to_filter);				
			}




			else {
				
				if (interaction_type === "selection_binding" || interaction_type === "multiple_selection_binding") {
					//v2
					//pick up active legends
					extract_active_legends_v2(params_chart, params_chart_target, filter_array)

					if (interaction_type === "selection_binding") {
						//don't erase a value already registred in the filter array
						if (params_chart.list_keys_values_segment_single_selected.length>0) var key = Object.keys(params_chart.list_keys_values_segment_single_selected[0])[0]
						//if (!filter_array.hasOwnProperty(key)) {
							Object.assign(filter_array, params_chart.list_keys_values_segment_single_selected[0])
						//}
					}
					else if (interaction_type === "multiple_selection_binding") {
						if (params_chart.list_keys_values_segments_multiples_selected.length === 1) {						
							Object.assign(filter_array, params_chart.list_keys_values_segments_multiples_selected[0])							
						}
						else if (params_chart.list_keys_values_segments_multiples_selected.length > 1) {
							//if the filter array holds any key that corresponds to a slice, delete it
							Object.keys(params_chart.list_keys_values_segments_multiples_selected[0]).forEach(key=> {if (filter_array.hasOwnProperty(key)) {delete filter_array[key]} })
							//create each key/value from the chart into the filter array
							params_chart.list_keys_values_segments_multiples_selected.forEach(slice=> {
								Object.keys(slice).forEach(key=> {
									if (slice[key].constructor == Array) {
										if (filter_array.hasOwnProperty(key)) {
											filter_array[key] = filter_array[key].concat(slice[key]);
										}
											
										
										else {
											filter_array[key] = slice[key];
										}
									}
								})
							})
						}
					}	

				}


				else if (interaction_type === 'brush_selection_binding') {
					//check the case when the current chart is an adress_search component, & has specific filter params for the current target
					var find_target_chart = undefined
					params_chart.params_filter_targets ? find_target_chart = params_chart.params_filter_targets.find(c=> c.target_chart_id === params_chart_target.id) : {}
					if (params_chart.chart_type === 'adressSearch' && params_chart.params_filter_targets && find_target_chart && find_target_chart.mode === "filter_shape") {
						//check if there is an active adress, & select the brush value
						var active_adress = _.find(params_chart.adresses, {selected: true})
						if (active_adress) {
							//get lat/lng fields
							if (!params_chart.latLng_fields_params) {
								var lat_field = sharedParams.transformations.latLng_fields.lat, lng_field = sharedParams.transformations.latLng_fields.lng;
							}
							else {
								var lat_field = params_chart.latLng_fields_params.lat_fieldName, lng_field = params_chart.latLng_fields_params.lng_fieldName
							}

							var brush_keys_values = {[lat_field+'_brushed']: [active_adress.lat_radius], [lng_field+'_brushed']: [active_adress.lng_radius]};
							Object.assign(filter_array, brush_keys_values)
							Object.assign(filter_array_public, brush_keys_values)

							
							
						}
						else {
							Object.assign(filter_array, params_chart.brush_keys_values)
							Object.assign(filter_array_public, brush_keys_values)
						}
					}
					else {
						Object.assign(filter_array, params_chart.brush_keys_values)
						Object.assign(filter_array_public, brush_keys_values)
					}
					//pick up active legends
					extract_active_legends_v2(params_chart, params_chart_target, filter_array)
				}


				else if (interaction_type === "legends_binding") {
					//fill the filter dict with the slice(s) selected in the current chart
					//deal with the case when the source chart has 1 axis
					if (params_chart.nb_axis === 1) {
						//if the sub_cat field is available, use it for legend filtering
						if (params_chart.sub_category_field !== undefined) {
							filter_array[params_chart.sub_category_field] = [...this.legends_array];
						}
						//else, use the cat_field for legend filtering
						else if (params_chart.category_field !== undefined) {
							//if the chart is chart JS kind or leaflet
							if (params_chart.chart_type === "chartJS") { 
								filter_array[params_chart.category_field] = [...this.legends_array];
							} 
							//specific code for choropletes, for collecting both legend clicked & associated active polygons
							else if (params_chart.chart_sub_type === 'choroplete_map') {
								filter_array[params_chart.legends_field] = [...this.legends_array];
								filter_array[params_chart.category_field] = params_chart.active_polygons;
							}
							else {
								filter_array[params_chart.legends_field] = [...this.legends_array] 
							}
						}					
					}
					//deal with the case when the source chart has 2 axis
					else if (params_chart.nb_axis === 2) {					
						filter_array[params_chart.sub_category_field] = [...this.legends_array];

					}				


				}

				else if (interaction_type === 'map_binding') {
					if (params_chart.list_keys_values_segment_single_selected.length>0) {
						//if (params_chart.list_keys_values_segment_single_selected.find(f=> f.lat)) {
						//	filter_array={['lat']: [params_chart.list_keys_values_segment_single_selected.find(f=> f.lat)["lat"]], ['lng']: [params_chart.list_keys_values_segment_single_selected.find(f=> f.lng)["lng"]]}
						//}
						//else {
							params_chart.list_keys_values_segment_single_selected.forEach(v=> Object.assign(filter_array, v))
						//}
					}
				}
			}


			//if the current target presents active slices, & doesn't share same category field with the filter array, inject the active slices to the filter array here
			// if (params_chart_target.activ_categories_values.length > 0 && !filter_array.hasOwnProperty(params_chart_target.category_field)) {// && params_chart_target.hierarchy_levels
			// 	if (params_chart_target.category_field) { filter_array[params_chart_target.category_field] = params_chart_target.activ_categories_values.flat().flat().flat() }				
			// }

			//catch the value of last active hierarchy level for the the current target chart
			collect_hierarchy_slice(params_chart_target, filter_array)





			/*in order to preserve previous interactions, collect the slices selected in the third target charts
			only if these slices does not compose the axis of the current target chart*/
			var params_charts_target_collect_slices = params_charts_target.filter(c=> c.collect_active_slices === true).map(c=> c.chart)
			for (var a = 0; a < params_charts_target_collect_slices.length; a++) {

				//if the chart is not the current target
				if (params_charts_target_collect_slices[a].status_chart !== 'target') {
					var third_target_chart = params_charts_target_collect_slices[a]




					if (interaction_type === "selection_binding" || interaction_type === 'map_binding') {						


						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array);
						collect_hierarchy_slice(third_target_chart, filter_array);

						if (third_target_chart.brush_keys_values && Object.values(third_target_chart.brush_keys_values).length>0) {
							var brush_keys_values = _.mapValues(third_target_chart.brush_keys_values, function(v,k) {return v})
							Object.assign(filter_array, brush_keys_values); Object.assign(filter_chart_source, brush_keys_values); 							
						}						
					}



					else if (interaction_type === "multiple_selection_binding" || interaction_type === "legends_binding") {

						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array);
						//extract_active_slices(third_target_chart, filter_chart_source)							
						collect_hierarchy_slice(third_target_chart, filter_array)

						//if the chart is brushed
						if (third_target_chart.brush_keys_values && Object.values(third_target_chart.brush_keys_values).length >0) {
							var brush_keys_values = _.mapValues(third_target_chart.brush_keys_values, function(v,k) {return v})
							Object.assign(filter_array, brush_keys_values); Object.assign(filter_chart_source, brush_keys_values); 						
						}
					}
					

					else if (interaction_type === 'brush_selection_binding') {
						//if the third_target_chart is parametred to not co
						// if ((third_target_chart.crossfilter.find(c=> c.chart === params_chart_target.id) && third_target_chart.crossfilter.find(c=> c.chart === params_chart_target.id).collect_active_slices === false)) {
						// 	return
						// }
						//check the case when the third target chart represents adresses && has a clicked slice
						var current_adress = _.find((sharedParams.params_charts.find(chart=> chart.chart_type === 'adressSearch')?.adresses), {selected: true})
						if (third_target_chart.geoRadius && third_target_chart.geoRadius.length>0 && third_target_chart.active_slices.length>0 && current_adress) {
							//get the lat/lng of the clicked adress
							var latitudes = [], longitudes = [];				
							var mapCoordonneesLatitude = sharedParams.transformations.latLng_fields.lat, mapCoordonneesLongitude = sharedParams.transformations.latLng_fields.lng;							

							latitudes.push(current_adress.lat_radius);
							longitudes.push(current_adress.lng_radius);
							Object.assign(filter_array, {[mapCoordonneesLatitude+'_brushed']: latitudes, [mapCoordonneesLongitude+'_brushed']: longitudes})
						}
						else {
							//clean filter from previous similar brushed axis
							var tmpObj = {}; Object.assign(tmpObj, third_target_chart.brush_keys_values); Object.keys(filter_array).map(o=> delete tmpObj[o])
							//transfer brushed values
							Object.assign(filter_array, tmpObj);
							Object.assign(filter_chart_source, tmpObj)
						}
						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array);
						collect_hierarchy_slice(third_target_chart, filter_array)
						//extract_active_slices(third_target_chart, filter_chart_source)							


					}
					
					
				}
			}



			//collect active legends
			clean_filter_array(filter_array);
			collect_active_legends_setFilter(params_chart, params_chart_target, params_charts_target_collect_slices, filter_array, interaction_type)

		
			var ind_filtering_type = "set_filter"
			

			//clean the filter array from empty fields
			clean_filter_array(filter_array)
			if (Object.keys(filter_array).length > 0 || params_chart_target.to_filter) {
				crossfilter(params_chart, params_chart_target, filter_array, ind_filtering_type, sharedParams)				
				Object.assign(filter_chart_source, filter_array);


			}
			else {
				if (params_chart_target.chart_sub_type === "scatter") {
					sharedParams.charts_with_spinners[params_chart_target.id].hide_spinner(params_chart_target)}
				
				try {
					delete params_chart_target.filtered_by.axis[params_chart.category_field]
					delete params_chart_target.filtered_by.axis[params_chart.sub_category_field]
				}
				catch {}
			}

			params_chart_target.status_chart = '';

		};

		sharedParams.crossfilter_status = 'idle'

			
		


		//refilter the target charts if one of their foreign filtering axis is outdated regarding to the last filter_array axis
			var newObj = {};
			  Object.keys(filter_chart_source).forEach((prop) => {
			    if (filter_chart_source[prop][0] !== '') { newObj[prop] = filter_chart_source[prop]; }
			  });
			delete newObj[""]
			filter_chart_source = _.cloneDeep(newObj)
					
			//operations;

			for (var y = 0; y < params_charts_target_to_filter.length; y++) {
				//1.collect for each target chart it's foreign filtering axis (params_chart.filtered_by.axis)
				var target_chart = params_charts_target_to_filter[y]

				var keys_values_params_barChart = _.mapKeys(target_chart.filtered_by.axis, function(value, key) {
	  				return key;
				}); clean_filter_array(keys_values_params_barChart)
				var keys_params_barChart = Object.keys(keys_values_params_barChart); keys_params_barChart = keys_params_barChart.filter(o=> o !== "")



				//2.regenerate active legends for chartJS charts
				if (target_chart.chart_type === "chartJS") {
					var activeLegends={};
					params_charts_target_to_filter.map(c=> {
						if (c.chart_type === "chartJS") {
							activeLegends[c.legends_field] = c.chart_instance.legend.legendItems.filter(t=> t.text !== "" && t.hidden === false).map(l=> l.text)
						}

					})
					
					params_chart.chart_type === "chartJS" ? activeLegends[params_chart.legends_field] = params_chart.chart_instance.legend?.legendItems.filter(t=> t.text !== "" && t.hidden === false).map(l=> l.text) : {}
				}

				//3.delete obsolete active legends from the filtered axis, the ones that contains "" strings
				var refilter_array = {}; var ind_refilter = false
				delete_empty_legends(keys_values_params_barChart, activeLegends, refilter_array)



				//4.crossfilter the chart
				if (ind_refilter === true) {
					//clean the filter array from empty fields
					clean_filter_array(refilter_array)				
					var ind_filtering_type = "set_filter"
					//if (interaction_type !== "brush_selection_binding") {
						crossfilter(target_chart, target_chart, refilter_array, ind_filtering_type, sharedParams)			
					//reset the indicator
					ind_refilter = false
					//}
				}
			}		
			 

			//filter the chart source it self with all the active slices, except it's own slices
			//remove the category fields of the current chart from the filter to avoid sefl filtering
			var ind_filtering_type = "set_filter"

			//1.extract list of axis of target charts:
			//v3
			//refilter the chart it self if one of the legends became obsolete
			refilter_array = {}; filter_array_ref = {};
			params_chart.filtered_by.axis !== undefined ? delete_empty_legends(params_chart.filtered_by.axis, activeLegends, refilter_array) : {};
			Object.assign(filter_array_ref, params_chart.filtered_by.axis); clean_filter_array(filter_array_ref);



			if (Object.values(filter_array_ref).length > 0 && params_chart.chart_type === 'chartJS' && interaction_type !== "brush_selection_binding") {

				crossfilter(params_chart, params_chart, params_chart.filtered_by.axis, ind_filtering_type, sharedParams)
			}

			function delete_empty_legends(filter_source, activeLegends, refilter_array) {

				Object.keys(filter_source).forEach(key => {
					//if an obsolete legend is detected (""), delete it & replace it from the last version of active legends
					if (filter_source.hasOwnProperty('')) {
						 delete filter_source[key];
						 filter_source[key] = activeLegends[key];
						 Object.assign(refilter_array, filter_source)
						 ind_refilter = true;
					}
					})
			}

			function clean_choroplete_stores_clicks(params_chart_target) {
				params_chart_target.list_final_labels_uniq_selected = []; params_chart_target.list_idx_segment_single_selected = []; params_chart_target.list_idx_segments_multiples_selected = [];
				params_chart_target.list_idx_segments_multiples_selected = []; params_chart_target.list_keys_values_segment_single_selected = []; params_chart_target.list_keys_values_segments_multiples_selected = []
				params_chart_target.list_labels_segment_single_selected = []; params_chart_target.list_labels_segments_multiples_selected = []; 
				params_chart_target.brush_keys_values= {}; params_chart_target.brush_values = {};      				
			}




		async function crossfilter(params_chart, params_chart_target, filter_array, ind_filtering_type, sharedParams) {

			if (params_chart_target.chart_type === "adressSearch") return
			
			
		    //stat exec time
		    var t1 = (new Date())/1000			

			//transfer the vilter array in the params chart target
			params_chart_target.transformations.crossfilter = {};
			params_chart_target.data_crossfiltred = undefined
			
			var chart_is_visible = check_parent_display(params_chart_target)			
			var time_delay
			if (chart_is_visible.chart_display_on) {time_delay = 0}
			else {time_delay = 1000}
			
			setTimeout(() => {
				filter_array_public = build_filter_array_public(params_chart_target, sharedParams, filter_array)
				console.warn({params_chart_target: params_chart_target.id, filter_array_public: filter_array_public})
			}, (time_delay));
				
			
			Object.assign(params_chart_target.transformations.crossfilter, filter_array)
			//console.log(filter_array)
			//save the chart source that filters the current target used to filter the chart
			params_chart_target.filtered_by = {"id": params_chart.id, "params_chart": params_chart, "axis": filter_array}



			//get the data filtred & grouped
			//stats exec time
			var t1_bis1 = (new Date())/1000
			var dataset_filtred = await params_chart_target.instanciator.prepare_data_p1(params_chart_target, sharedParams)
			
			var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
			sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "prepare_data_p1","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	


			//for the scatter charts, sync their update with the leaflet map, if their data length exceeds the limit
			if (params_chart_target.chart_sub_type === "scatter" && dataset_filtred.length > params_chart_target.limit_delay_animation) {
				params_chart_target.dataset_filtred = [...dataset_filtred]
				
				var promise_dataset_filtred = new Promise( (resolutionFunc,rejectionFunc) => {
				    resolutionFunc(params_chart_target.dataset_filtred = [...dataset_filtred])
				});

				

				if (params_chart !== params_chart_target) {
					sharedParams.charts_with_spinners.hasOwnProperty(params_chart_target.id) ? sharedParams.charts_with_spinners[params_chart_target.id].show_spinner(params_chart_target) : {} } 
				//get the map instance
				var params_map = undefined
				sharedParams.params_charts.forEach(c=> { if(c.chart_type === 'leaflet') {params_map = c} })

				//v6
				if (params_map) {
					var currentMapCenter = params_map.map_instance.getCenter()
					var distance_from_previous_location
					if (currentMapCenter && params_map.previousCenter) {
						distance_from_previous_location = currentMapCenter.distanceTo(params_map.previousCenter)
					}
					var delay_time_scatter
					if (distance_from_previous_location < 1000) {
						delay_time_scatter = 100
					}
					else {
						delay_time_scatter = sharedParams.delay_time_scatter 
					}
					setTimeout(updateChart, delay_time_scatter, params_chart_target, sharedParams, dataset_filtred)	
				}
				

			}
			else {
				if (params_chart_target.chart_sub_type === "scatter") {
					params_chart_target.dataset_filtred = [...dataset_filtred]
				}
				updateChart(params_chart_target, sharedParams, dataset_filtred)
			}

			



			//update the targeted chart with the filtred data
			function updateChart(params_chart_target, sharedParams, dataset_filtred) {
				
				//iot prevent update after multiple quick clicks, if the chart is already updated, cancel exec
				if (params_chart_target.chart_updated) {
					return
				}


				if (params_chart !== params_chart_target) {
					sharedParams.charts_with_spinners.hasOwnProperty(params_chart_target.id) ? sharedParams.charts_with_spinners[params_chart_target.id].show_spinner(params_chart_target) : {} } 
				//1.get the instance of the chart to filter
				var chart_to_filter
				params_chart_target.chart_type === "leaflet" ? chart_to_filter = params_chart_target.map_instance : chart_to_filter = params_chart_target.chart_instance;


				//if the chart is chart js type
				if (params_chart_target.chart_type === "chartJS") {
					params_chart_target.data[0].labels = []; params_chart_target.data[1].datasets = [];
					chart_to_filter.config.data.labels = []; 
					for (var ii = 0; ii < chart_to_filter.config.data.datasets.length; ii++) {
						chart_to_filter.config.data.datasets[ii].data = []; chart_to_filter.config.data.datasets[ii].label = "";
						chart_to_filter.config.data.datasets[ii].backgroundColor = []; chart_to_filter.config.data.datasets[ii].borderColor = [];
						chart_to_filter.config.data.datasets[ii].borderWidth = [];
					}
				}
				else if (params_chart_target.chart_type === 'leaflet' && params_chart_target.data) {
					params_chart_target.data[0].labels = []; params_chart_target.data[1].datasets = [];
					params_chart_target.data[1].markers = []; params_chart_target.data[1].x_y = []; params_chart_target.inject_type = "update"
				}	
				else if (['d3', 'html'].includes(params_chart_target.chart_type)) {
					if (params_chart_target.data) {
						params_chart_target.data[0].labels=[]
						params_chart_target.data[1].datasets=[]
					}
				}
				



				//for leaflet case, if the filter return an empty array, cancel the program stay on the same area of the map and show nothing
				if (params_chart_target.chart_type === "leaflet" && dataset_filtred.dataset) { 
					if (dataset_filtred.dataset.length === 0) { return }
				}
				//for chartJS case, if the filter return an empty array, update the chart with empty data & cancel the program
				else if (params_chart_target.chart_type === "chartJS" && dataset_filtred.length === 0) { 
					params_chart_target.chart_instance.update()
					return 
				}
				

				

				//2.3.update de params array of the targeted chart with the filtred dataset
				/*2.1.if the trageted chart has already a selection, indicate to the data processing function to preserve the background color of 
				previous selection*/
				if (params_chart_target.chart_type === 'chartJS' || params_chart_target.chart_type === 'leaflet') {
					if (params_chart_target.list_labels_segment_single_selected.length !== 0 || params_chart_target.list_labels_segments_multiples_selected.length !== 0 
						|| (params_chart_target.brush_values && Object.values(params_chart_target.brush_values).length > 0)) {

						params_chart_target.prepare_data_type = "preserve backgroundColor"

						//stats exec time
						var t1_bis1 = (new Date())/1000
						//setTimeout(prepare_data_p2(dataset_filtred, params_chart_target, sharedParams), 10)

						params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)
		
						var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
						sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	


						


						var data_type = "data"; var injection_type = "update"; var updateTime = undefined
						//setTimeout(inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type), 10)
						

						

						//for maps, check the display
						if (params_chart_target.chart_type === "leaflet") {
							params_chart_target.inject_metadata = false
							let monitor_map_display = setInterval(() => {
								var map_parent_nodes = find_node_parents(document.getElementById(params_chart_target.htmlNode))
								var map_isHidden;
								map_parent_nodes.forEach(node=> {
									if (node.style.display === "none") {map_isHidden = true}
								})
								if (!map_isHidden) {
									clearInterval(monitor_map_display)
									var t1_bis1 = (new Date())/1000
									console.warn({crossfilter_map: t1_bis1})
									var time_delay = 100

									if (params_chart_target.chart_sub_type === "map") {
										var dataset_lenght = params_chart_target.data[1].datasets.length
										params_chart_target.dataset_timeDelay_param.forEach(p=> {
											if (dataset_lenght>= p.dataset_length.min && dataset_lenght<= p.dataset_length.max) { time_delay = p.time_delay}
										})	
									}

									setTimeout(()=> {
										params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
										params_chart_target.inject_metadata = true
										if (params_chart_target.chart_sub_type === "map") {console.warn({defect_circles: "state_management"})}
									},time_delay)
									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
			
			
									params_chart_target.prepare_data_type = ""
									if (params_chart_target.instanciator.setup_legends) params_chart_target.instanciator.setup_legends(params_chart_target, sharedParams, 'update')
									params_chart_target.chart_updated = true
									
								}
							}, 200);
						}
						else {
							var monitor_chart_display = setInterval(() => {
								var check_chart_parent_display = check_parent_display(params_chart_target)
								if (check_chart_parent_display.chart_display_on) {
									clearInterval(monitor_chart_display)
									params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
			
			
									params_chart_target.prepare_data_type = ""
									hide_legends(params_chart_target, 'set_filter')
									params_chart_target.chart_updated = true
									
								}
							}, 300);							

						}


					}
					else {
						params_chart_target.prepare_data_type = ""
						//stats exec time
						var t1_bis1 = (new Date())/1000
						//setTimeout(prepare_data_p2(dataset_filtred, params_chart_target, sharedParams), 10)

						params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)
						var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
						sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	


						
						//2.4.inject into the chart JS config instance the labels & datasets setup above
						var data_type = "data"; var injection_type = "update"; var updateTime = undefined
						//setTimeout(inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type), 10)
						if (params_chart_target.chart_type === "leaflet") {
							params_chart_target.inject_metadata = false
							let monitor_map_display = setInterval(() => {
								var map_parent_nodes = find_node_parents(document.getElementById(params_chart_target.htmlNode))
								var map_isHidden;
								map_parent_nodes.forEach(node=> {
									if (node.style.display === "none") {map_isHidden = true}
								})
								if (!map_isHidden) {
									clearInterval(monitor_map_display)
									var t1_bis1 = (new Date())/1000
									var time_delay = 100

									if (params_chart_target.chart_sub_type === "map") {
										var dataset_lenght = params_chart_target.data[1].datasets.length
										params_chart_target.dataset_timeDelay_param.forEach(p=> {
											if (dataset_lenght>= p.dataset_length.min && dataset_lenght<= p.dataset_length.max) { time_delay = p.time_delay}
										})	
									}
									//console.warn({crossfilter_map: t1_bis1})
									setTimeout(()=> {
										if (!params_chart_target.inject_metadata) {
											params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
											params_chart_target.inject_metadata = true
											if (params_chart_target.chart_sub_type === "map") {console.warn({defect_circles: "state_management"})}
										}										
									},time_delay)
									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
			
									if (params_chart_target.instanciator.setup_legends) params_chart_target.instanciator.setup_legends(params_chart_target, sharedParams, 'update')
									
								}
							}, 100)
						}
						else {
							var monitor_chart_display = setInterval(() => {
								var check_chart_parent_display = check_parent_display(params_chart_target)
								if (check_chart_parent_display.chart_display_on) {
									clearInterval(monitor_chart_display)
									var t1_bis1 = (new Date())/1000
									params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
		
									hide_legends(params_chart_target, 'set_filter')
		
									params_chart_target.chart_updated = true
									
								}
							}, 300);
						}
					}
				}
	 			else if ((params_chart_target.chart_type === 'label' || params_chart_target.chart_type === 'labelGroup') && params_chart_target.updateLabels === true) {
					params_chart_target.value = dataset_filtred
					var monitor_chart_display = setInterval(() => {
						var check_chart_parent_display = check_parent_display(params_chart_target)
						if (check_chart_parent_display.chart_display_on) {
							clearInterval(monitor_chart_display)
							//if the label has been already updated, exit the interval
							if (params_chart_target.chart_updated) {								
								return
							}
							else {
								//remove previous card													
								var cardNode = document.getElementById("card_"+params_chart_target.htmlNode); cardNode.remove()
								params_chart_target.instanciator.init_label(params_chart_target)
								params_chart_target.instanciator.displayText(params_chart_target)
								params_chart_target.updateLabels = undefined
								params_chart_target.chart_updated = true
								
							}
						}
					}, 300);	 				
					

	 			}
	 			else if (params_chart_target.chart_type === 'slider' && d3.sum(Object.values(dataset_filtred)) > 0) {
	 				params_chart_target.instanciator.updateSlider(params_chart_target, dataset_filtred)
	 			}
				else if (['d3', 'html'].includes(params_chart_target.chart_type)) {
					params_chart_target.prepare_data_type = ""
					//stats exec time
					var t1_bis1 = (new Date())/1000
					//setTimeout(prepare_data_p2(dataset_filtred, params_chart_target, sharedParams), 10)

					params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)
					var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
					sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

					
					//2.4.inject into the chart params the labels & datasets setup above
					var data_type = "data"; 
					params_chart_target.injection_type = 'update'
					var monitor_chart_display = setInterval(() => {
						var check_chart_parent_display = check_parent_display(params_chart_target)
						if (check_chart_parent_display.chart_display_on) {
							clearInterval(monitor_chart_display)
							var t1_bis1 = (new Date())/1000
							params_chart_target.instanciator.inject_metadata(params_chart_target);
							var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
							sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

							//hide_legends(params_chart_target, 'set_filter')

							params_chart_target.chart_updated = true							
						}
					}, 300);
				}

				var t2 = (new Date())/1000; var tf = parseFloat((t2-t1).toFixed(3))
				sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", "chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})

				//hide spinner & display chart
				sharedParams.charts_with_spinners.hasOwnProperty(params_chart_target.id) ? sharedParams.charts_with_spinners[params_chart_target.id].hide_spinner(params_chart_target) : {}

				sharedParams.filter_order_origin = undefined
				//params_chart_target.dataset_filtred = []
			}

		}



	}





	remove_filter(params_chart, params_charts_target, interaction_type, sharedParams) {
		var filter_array_ref = {};
		var params_charts_target_to_filter = params_charts_target.filter(c=> c.filter === true).map(c=> c.chart)
		var params_charts_target_collect_slices = params_charts_target.filter(c=> c.collect_active_slices === true).map(c=> c.chart)
		



		for (var i = 0; i < params_charts_target_to_filter.length; i++) {
			var params_chart_target = params_charts_target_to_filter[i]
			params_chart_target.has_been_filtred = false;
			params_chart_target.to_filter = true;
			params_chart.status_chart = 'active'; params_chart_target.status_chart = 'target';
			//record the status

			//if the chart is scatter type, show the spinner
			if (params_chart_target.chart_sub_type === "scatter") {
				sharedParams.charts_with_spinners[params_chart_target.id].show_spinner(params_chart_target)
				setTimeout(()=> {sharedParams.charts_with_spinners[params_chart_target.id].hide_spinner(params_chart_target)}, 4500)
			}

			//if there are charts to reset
			if (params_chart.crossfilter_reset_charts) {
				params_chart.crossfilter_reset_charts.forEach(c=> {
					var chart_to_reset = params_charts_target.find(o=> o.chart.id === c)?.chart
					if (chart_to_reset) {
						chart_to_reset.list_labels_segment_single_selected = []; chart_to_reset.list_labels_segments_multiples_selected = []
						chart_to_reset.list_keys_values_segment_single_selected = []; chart_to_reset.list_keys_values_segments_multiples_selected = []
					}
				})
			}
						
			var filter_array = {};

			//if the chart has been drilled down, catch the value of last active hierarchy level
			extract_active_legends_v2(params_chart, params_chart_target, filter_array);
			collect_hierarchy_slice(params_chart, filter_array)


			//if the chart source presents active slices, inject them to the filter array here
			//if (params_chart.activ_categories_values.length > 0) {
			// 	if (params_chart.category_field) {params_chart.list_keys_values_segments_multiples_selected.map(o=> { filter_array[params_chart.category_field] = o[params_chart.category_field].flat().flat().flat() } )}
			// 	if (params_chart.sub_category_field) {params_chart.list_keys_values_segments_multiples_selected.map(o=> { filter_array[params_chart.sub_category_field] = o[params_chart.sub_category_field].flat().flat().flat() } )}
			// }


			//if the current target presents active slices, inject them to the filter array here
			//bugy code for scatter chart
			// if (params_chart_target.activ_categories_values.length > 0 && params_chart_target.hierarchy_levels) {
			// 	if (params_chart_target.category_field) { filter_array[params_chart_target.category_field] = params_chart_target.activ_categories_values.flat().flat().flat() }
				
			// }

			collect_hierarchy_slice(params_chart_target, filter_array)



			//to secure the filters triggered by previous selections, we must collect the active slices 
			//of all the charts, except the current target & the chart source
			//to do that, we fill the filter array with the active slices of target charts, except the current target
			for (var a = 0; a < params_charts_target_collect_slices.length; a++) {

				//if the chart is not the current target
				if (params_charts_target_collect_slices[a].status_chart !== 'target') {
					var third_target_chart = params_charts_target_collect_slices[a]
					var list_labels_selected = []
					if (interaction_type === "selection_binding" || interaction_type === 'map_binding') {						
						//check if we have hidden legends
						//var has_hidden_legends = third_target_chart.hidden_legends; 
						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array)
						extract_active_slices(params_chart, third_target_chart, filter_array_ref)
						collect_hierarchy_slice(third_target_chart, filter_array)

						//if the chart is brushed
						if (third_target_chart.brush_keys_values && Object.values(third_target_chart.brush_keys_values).length >0) {
							var brush_keys_values = _.mapValues(third_target_chart.brush_keys_values, function(v,k) {return v})
							Object.assign(filter_array, brush_keys_values); Object.assign(filter_array_ref, brush_keys_values); 
						}

						else {list_labels_selected = []}

						//collect the selected labels if they exist
						// if (list_labels_selected.length > 0) {
						// 	filter_array[third_target_chart.category_field] = []; filter_array_ref[third_target_chart.category_field] = [];
						// 	filter_array[third_target_chart.sub_category_field] = []; filter_array_ref[third_target_chart.sub_category_field] = [];

						// 	for (var j = 0; j < list_labels_selected.length; j++) {
						// 		var list_labels = list_labels_selected[j]
						// 		//deal with the case when the source chart has 1 axis
						// 		if (Object.keys(list_labels).length === 1) {
						// 			filter_array[third_target_chart.category_field].push(list_labels.category_field);
						// 			filter_array_ref[third_target_chart.category_field].push(list_labels.category_field)
						// 		}
						// 		//deal with the case when the source chart has 2 axis
						// 		else if (Object.keys(list_labels).length === 2) {
						// 			filter_array[third_target_chart.category_field].push(list_labels.category_field);
						// 			filter_array[third_target_chart.sub_category_field].push(list_labels.sub_category_field)
						// 			filter_array_ref[third_target_chart.category_field].push(list_labels.category_field);
						// 			filter_array_ref[third_target_chart.sub_category_field].push(list_labels.sub_category_field)									
						// 		}								
						// 	}
						// };
					}
					else if (interaction_type === "multiple_selection_binding") {
						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array_ref);
						collect_hierarchy_slice(third_target_chart, filter_array)


						//if the chart is brushed
						if (third_target_chart.brush_keys_values && Object.values(third_target_chart.brush_keys_values).length >0) {
							var brush_keys_values = _.mapValues(third_target_chart.brush_keys_values, function(v,k) {return v})
							Object.assign(filter_array, brush_keys_values); Object.assign(filter_array_ref, brush_keys_values); 
						}						

						else {list_labels_selected = []}

						//collect the selected labels


						//collect the selected labels if they exist
						// if (list_labels_selected.length > 0) {

						// 	var categories_selected_array = []; var sub_categories_selected_array = [];
						// 	for (var j = 0; j < list_labels_selected.length; j++) {
						// 		var list_labels = list_labels_selected[j]

						// 		//collecte the values of the selections into arrays
						// 		//deal with the case when the source chart has 1 axis
						// 		if (Object.keys(list_labels).length === 1) {
						// 			categories_selected_array.push(list_labels.category_field)						
						// 		}
						// 		//deal with the case when the source chart has 2 axis
						// 		else if (Object.keys(list_labels).length === 2) {
						// 			categories_selected_array.push(list_labels.category_field)
						// 			sub_categories_selected_array.push(list_labels.sub_category_field)						
						// 		}								
						// 	}

						// 		//transfert the values into the filter array
						// 		//deal with the case when the source chart has 1 axis
						// 		if (Object.keys(list_labels).length === 1) {
						// 			filter_array[third_target_chart.category_field] = categories_selected_array;
						// 			filter_array_ref[third_target_chart.category_field] = categories_selected_array;
						// 		}
						// 		else if (Object.keys(list_labels).length === 2) {
						// 			filter_array[third_target_chart.category_field] = categories_selected_array;
						// 			filter_array[third_target_chart.sub_category_field] = sub_categories_selected_array
						// 			filter_array_ref[third_target_chart.category_field] = categories_selected_array;
						// 			filter_array_ref[third_target_chart.sub_category_field] = sub_categories_selected_array

						// 		}
						// }


					}


					else if (interaction_type === 'brush_selection_binding') {
						//clean filter from previous similar brushed axis
						var tmpObj = {}; Object.assign(tmpObj, third_target_chart.brush_keys_values); Object.keys(filter_array).map(o=> delete tmpObj[o])
						//transfer brushed values
						Object.assign(filter_array, tmpObj);
						Object.assign(filter_array_ref, tmpObj)

						//transfer active slices
						extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array);
						extract_active_slices(params_chart, third_target_chart, filter_array_ref);
						collect_hierarchy_slice(third_target_chart, filter_array)

					}					
										
					
				}
			}



			//legends processing
			//---------------------1. if the source & target charts share the same legends field, sync their legends
			//prepare eval
			if (params_chart.hidden_legends && Object.values(params_chart.hidden_legends).length > 0) {var eval_source_hidden_legends = Object.values(params_chart.hidden_legends)[0].length}
			else {var eval_source_hidden_legends = 0}
			if (params_chart.hidden_legends && Object.values(params_chart_target.hidden_legends).length > 0) {var eval_target_hidden_legends = Object.values(params_chart_target.hidden_legends)[0].length}
			else {var eval_target_hidden_legends = 0}

			clean_filter_array(filter_array);

			if ((params_chart.legends_field === params_chart_target.legends_field) && eval_source_hidden_legends > 0 && filter_array.hasOwnProperty(params_chart.legends_field) === false) {// && interaction_type === "legends_binding"				
				sync_legends_rm_filter(params_chart, params_chart_target, sharedParams);				
			}
			//---------------------end 1. 
			



			//---------------------2. else if the target chart has hidden legends, restore it's original dataset with hidden legends
			else if (eval_target_hidden_legends > 0) {
				//if the filter_array does not contains a filter for the legend field && an active selection, restore original dataset
				if (filter_array.hasOwnProperty(params_chart_target.legends_field) === false && (params_chart_target.list_keys_values_segments_multiples_selected.length === 0
					)) { //|| Object.values(params_chart_target.brush_keys_values).length === 0
					//restore_original_chart_datasets(params_chart_target, sharedParams);
				}
				
				//else if the target chart has no active selection, allow its filtering
				else if (params_chart_target.list_keys_values_segments_multiples_selected.length === 0) {
					params_chart_target.to_filter = true
					//collect the active slice to 

				}
				
				//else if the target chart has active selection, get its active selection and allow its filtering
				else if (params_chart_target.list_keys_values_segments_multiples_selected.length > 0) {
					params_chart_target.to_filter = true
				}


				
			}
			//---------------------end 2. 


			//---------------------3. else restore the original dataset
			else {
				params_chart_target.to_filter = true
			}




			//---------------------if the source chart has filtred legends & does not share the same legend field with its target, take the active legends
			if (eval_source_hidden_legends > 0 && params_chart.legends_field !== params_chart_target.legends_field) {
				//check the intergity of the array (it shall not contains "")
				var legends_array = Object.values(params_chart.active_legends)[0]; var legends_axis = Object.keys(params_chart.active_legends)[0];
				if (legends_array.filter(i=> i === "").length > 0) {
					//if the legends array contains "", regenerate the array for the legends api
					legends_array = params_chart.chart_instance.legend?.legendItems.filter(l=> l.hidden === false).map(l=> l.text)
				}

				//prior to the active selection over active legends; push the legends only if the filter array does not contains a filter value for the same field
				filter_array.hasOwnProperty(legends_axis) === false ? filter_array[legends_axis] = legends_array.filter(i=> i !== "") : {}
			}
			//---------------------end 





			//collect active legends for third target charts
			clean_filter_array(filter_array);
			//collect_active_legends_rmFilter(params_chart, params_charts_target_collect_slices, filter_array);
			

			//remove the filters no longer activ from the dataset of the target chart
			var ind_filtering_type = "remove_filter"
			//clean the filter array from empty fields
			clean_filter_array(filter_array)
			//if (params_chart_target.has_been_filtred === false) {
			//call filter func if the filter array is not empty
			if (Object.values(filter_array).length > 0 || params_chart_target.to_filter === true) {
				params_chart_target.filtered_by = {};
				crossfilter_rm(params_chart, params_chart_target, filter_array, ind_filtering_type, sharedParams);
			}
			else {
				try {
					delete params_chart_target.filtered_by.axis[params_chart.category_field]
					delete params_chart_target.filtered_by.axis[params_chart.sub_category_field]
				}
				catch {}
			}

			params_chart_target.status_chart = ''

			Object.assign(filter_array_ref, filter_array)

		}





		//refilter the target charts if one of their foreign filtering axis is outdated regarding to the last filter_array axis
			//delete filter_array_ref[""]
			//operations;



			// for (var y = 0; y < params_charts_target_to_filter.length; y++) {
			// 	//1.collect for each target chart it's foreign filtering axis (params_chart.filtered_by.axis)
			// 	var target_chart = params_charts_target_to_filter[y]
			// 	var keys_values_params_barChart = _.mapKeys(target_chart.filtered_by.axis, function(value, key) {
			// 				return key;
			// 	});
			// 	var keys_params_barChart = Object.keys(keys_values_params_barChart); keys_params_barChart = keys_params_barChart.filter(o=> o !== "")



			// 	//2.regenerate active legends
			// 		var activeLegends={};
			// 		params_charts_target_collect_slices.map(c=> {
			// 			if (c.chart_type === "chartJS") {
			// 				activeLegends[c.legends_field] = c.chart_instance.legend.legendItems.filter(t=> t.text !== "" && t.hidden === false).map(l=> l.text)
			// 			}

			// 		})
					
				

			// 	//3.delete obsolete active legends from the filtered axis, the ones that contains "" strings
			// 	var refilter_array = {}; var ind_refilter = false
			// 	delete_empty_legends(keys_values_params_barChart, activeLegends, refilter_array)



			// 	//4.crossfilter the chart
			// 	if (ind_refilter === true) {
			// 		//clean the filter array from empty fields
			// 		clean_filter_array(refilter_array)				
			// 		var ind_filtering_type = "set_filter"
			// 		//if (Object.keys(refilter_array).length > 0) {
			// 			crossfilter_rm(target_chart, target_chart, refilter_array, ind_filtering_type, sharedParams)			
			// 		//reset the indicator
			// 		ind_refilter = false
			// 		//}
			// 	}
			// }




			// //refilter the chart it self if one of the legends became obsolete
			// refilter_array = {}; filter_array_ref = {};
			// delete_empty_legends(params_chart.filtered_by.axis, activeLegends, refilter_array);
			// Object.assign(filter_array_ref, params_chart.filtered_by.axis); clean_filter_array(filter_array_ref);



			// if (Object.values(filter_array_ref).length > 0 &&  interaction_type !== "brush_selection_binding") {

			// 	if (params_chart.chart_type === "leaflet") {
			// 		return
			// 	}


			// 	crossfilter_rm(params_chart, params_chart, params_chart.filtered_by.axis, ind_filtering_type, sharedParams)


			// 	//show all hiddden legends
			// 	var chart_type = params_chart.chart_instance.config.type
			// 	var i = 0; var legend;
			// 	params_chart.filtered_by.axis[params_chart.legends_field] !== undefined ? legend = params_chart.filtered_by.axis[params_chart.legends_field] : legend = []
			// 	params_chart.chart_instance.legend?.legendItems.map(l=> {
			// 		if (chart_type === 'doughnut' || chart_type === 'pie') {										
			// 			legend.indexOf(l.text) > -1 ? params_chart.chart_instance.getDatasetMeta(0).data[i].hidden=false : {};
			// 		}
			// 		else {
			// 			legend.indexOf(l.text) > -1 ? params_chart.chart_instance.getDatasetMeta(i).hidden=false : {};
			// 		}

			// 		i++}
			// 	)
			// 	params_chart.chart_instance.update(0)						

			// }


		function delete_empty_legends(filter_source, activeLegends, refilter_array) {
			if (filter_source !== undefined) {
				Object.keys(filter_source).forEach(key => {
					//if an obsolete legend is detected (""), delete it & replace it from the last version of active legends
					if (filter_source[key].findIndex(i=> i === "") > -1) {
						 delete filter_source[key];
						 filter_source[key] = activeLegends[key];
						 Object.assign(refilter_array, filter_source)
						 ind_refilter = true;
					}
					})
			}
		}		


		

		async function crossfilter_rm(params_chart, params_chart_target, filter_array, ind_filtering_type, sharedParams) {
			//temporary code relative to leaflet
			//if the target chart is leaflet type & shares the same cat field with the source chart, remove all layers and restore the view to its initial level
			/*if (params_chart_target.chart_type === "leaflet" && params_chart_target.chart_subType === "choroplethe" && params_chart.chart_instance.config.type !== "scatter") {
				if (Object.values(params_chart_target.geographic_priority_layers).includes(params_chart.category_field)) {
					//delete the layers
		            Object.values(params_chart_target.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).map(l=> {
		                params_chart_target.map_instance.removeLayer(l)
		            })
					params_chart_target.inject_type = "init_view"
					params_chart_target.map_instance.flyToBounds(params_chart_target.data_source[1].borders);
					return
				}
	            
	            
			}
			else if (params_chart_target.chart_type === "leaflet" && params_chart_target.chart_subType === "points" && params_chart.chart_instance.config.type !== "scatter") {
				if (params_chart.category_field === params_chart_target.category_field) {
		            Object.values(params_chart_target.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).map(l=> {
		                params_chart_target.map_instance.removeLayer(l)
		            })
					return
				}
			}*/				
		    if (params_chart_target.chart_type === "adressSearch") return
			
			params_chart_target.chart_updated = undefined
			params_chart_target.data_crossfiltred = undefined


		    //stat exec time
		    const t1 = (new Date())/1000

			//clean the filter array from empty fields
			var newObj = {};
			  Object.keys(filter_array).forEach((prop) => {
			    if (filter_array[prop][0] !== '') { newObj[prop] = filter_array[prop]; }
			  });
			delete newObj[""]
			filter_array = _.cloneDeep(newObj)

			//transfer the vilter array in the params chart target
			params_chart_target.transformations.crossfilter = {}
			Object.assign(params_chart_target.transformations.crossfilter, filter_array)
			//save the chart source that filters the current target used to filter the chart
			params_chart_target.filtered_by = {"id": params_chart.id, "params_chart": params_chart, "axis": filter_array}

			var time_delay=0
			var chart_is_visible = check_parent_display(params_chart_target)			
			if (chart_is_visible.chart_display_on) {time_delay = 0}
			else {time_delay = 1000}
			
			setTimeout(() => {
				let filter_array_public = build_filter_array_public(params_chart_target, sharedParams, filter_array)
				console.warn({params_chart_target: params_chart_target.id, filter_array_public: filter_array_public})
			}, (time_delay));			
			

			//get the data filtred & grouped
			var dataset_filtred = await params_chart_target.instanciator.prepare_data_p1(params_chart_target, sharedParams)


			//for the scatter charts, sync their update with the leaflet map, if their data length exceeds the limit
			if (params_chart_target.chart_sub_type === "scatter" && dataset_filtred.length > params_chart_target.limit_delay_animation) {
				params_chart_target.dataset_filtred = [...dataset_filtred]
				if (params_chart !== params_chart_target) {
					sharedParams.charts_with_spinners.hasOwnProperty(params_chart_target.id) ? sharedParams.charts_with_spinners[params_chart_target.id].show_spinner(params_chart_target) : {} } 

				//get the map instance
				var params_map = undefined
				sharedParams.params_charts.forEach(c=> { if(c.chart_type === 'leaflet') {params_map = c} })			


				//v6
					if (params_map) {
						setTimeout(updateChart, sharedParams.delay_time_scatter, params_chart_target, sharedParams, dataset_filtred)	
					}


				

			}
			else {
				updateChart(params_chart_target, sharedParams, dataset_filtred, t1)
			}


			
			
			//2.3.update de params array of the targeted chart with the filtred dataset
			/*2.1.if the trageted chart has already a selection, indicate to the data processing function to preserve the background color of 
			previous selection*/
			function updateChart(params_chart_target, sharedParams, dataset_filtred, t1) {
				//iot prevent update after multiple quick clicks, if the chart is already updated, cancel exec
				if (params_chart_target.chart_updated) {
					return
				}



				//0.get the instance of the chart to filter
				var chart_to_filter
				params_chart_target.chart_type === "leaflet" ? chart_to_filter = params_chart_target.map_instance : chart_to_filter = params_chart_target.chart_instance;
				

				//if the chart is chart js type
				if (params_chart_target.chart_type === "chartJS") {
					params_chart_target.data[0].labels = []; params_chart_target.data[1].datasets = [];
					chart_to_filter.config.data.labels = []; 
					for (var ii = 0; ii < chart_to_filter.config.data.datasets.length; ii++) {
						chart_to_filter.config.data.datasets[ii].data = []; chart_to_filter.config.data.datasets[ii].label = "";
						chart_to_filter.config.data.datasets[ii].backgroundColor = []; chart_to_filter.config.data.datasets[ii].borderColor = [];
						chart_to_filter.config.data.datasets[ii].borderWidth = [];
					}
				}
				else if (params_chart_target.chart_type === 'leaflet' && params_chart_target.data) {
					params_chart_target.data[0].labels = []; params_chart_target.data[1].datasets = [];
					params_chart_target.data[1].markers = []; params_chart_target.data[1].x_y = []; params_chart_target.inject_type = "update"
				}	
				else if (['d3', 'html'].includes(params_chart_target.chart_type)) {
					if (params_chart_target.data) {
						params_chart_target.data[0].labels=[]
						params_chart_target.data[1].datasets=[]
					}
				}
					

				if (params_chart_target.chart_type === 'chartJS' || params_chart_target.chart_type === 'leaflet') {
					if (params_chart_target.list_labels_segment_single_selected.length !== 0 || params_chart_target.list_labels_segments_multiples_selected.length !== 0 
						|| Object.values(params_chart_target.brush_values).length > 0) {

						params_chart_target.prepare_data_type = "preserve backgroundColor"
						//stats exec time
						var t1_bis1 = (new Date())/1000
						params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)// -> ko, nb de bordures et couleurs trop élevé
						var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
						sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

						var data_type = "data"; var injection_type = "update"; var updateTime=undefined


						//hide_legends(params_chart_target, 'remove_filter')

						//delay the injection until the map apprears
						if (params_chart_target.chart_type === "leaflet") {
							let monitor_map_display = setInterval(() => {
								var map_parent_nodes = find_node_parents(document.getElementById(params_chart_target.htmlNode))
								var map_isHidden;
								map_parent_nodes.forEach(node=> {
									if (node.style.display === "none") {map_isHidden = true}
								})
								if (!map_isHidden) {
									clearInterval(monitor_map_display)
									var t1_bis1 = (new Date())/1000
									var time_delay = 100

									if (params_chart_target.chart_sub_type === "map") {
										var dataset_lenght = params_chart_target.data[1].datasets.length
										params_chart_target.dataset_timeDelay_param.forEach(p=> {
											if (dataset_lenght>= p.dataset_length.min && dataset_lenght<= p.dataset_length.max) { time_delay = p.time_delay}
										})	
									}

									setTimeout(()=> {
										params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
									},time_delay)

									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
			
									if (params_chart_target.instanciator.setup_legends) params_chart_target.instanciator.setup_legends(params_chart_target, sharedParams, 'update')
									params_chart_target.prepare_data_type = ""
									
								}
							}, 200)
						}
						else {
							var monitor_chart_display = setInterval(() => {
								var check_chart_parent_display = check_parent_display(params_chart_target)
								if (check_chart_parent_display.chart_display_on) {
									clearInterval(monitor_chart_display)
									params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);						
									params_chart_target.prepare_data_type = ""									//params_chart_target.chart_type === "leaflet" ? params_chart_target.instanciator.setup_legends(params_chart, 'update') : {} 	
									
								}
							}, 300);

						}
						

					}
					else {
						params_chart_target.prepare_data_type = ""
						//stats exec time
						var t1_bis1 = (new Date())/1000
						params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)// -> ko, nb de bordures et couleurs trop élevé
						var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
						sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

						//2.4.inject into the chart JS config instance the labels & datasets setup above
						var data_type = "data"; var injection_type = "update"; var updateTime=undefined
						//delay the injection until the map apprears
						if (params_chart_target.chart_type === "leaflet") {
							let monitor_map_display = setInterval(() => {
								var map_parent_nodes = find_node_parents(document.getElementById(params_chart_target.htmlNode))
								var map_isHidden;
								map_parent_nodes.forEach(node=> {
									if (node.style.display === "none") {map_isHidden = true}
								})
								if (!map_isHidden) {
									clearInterval(monitor_map_display)
									var t1_bis1 = (new Date())/1000
									var time_delay = 100

									if (params_chart_target.chart_sub_type === "map") {
										var dataset_lenght = params_chart_target.data[1].datasets.length
										params_chart_target.dataset_timeDelay_param.forEach(p=> {
											if (dataset_lenght>= p.dataset_length.min && dataset_lenght<= p.dataset_length.max) { time_delay = p.time_delay}
										})	
									}

									setTimeout(()=> {
										params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);
									},time_delay)
									var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
									sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	
			
									if (params_chart_target.instanciator.setup_legends) params_chart_target.instanciator.setup_legends(params_chart_target, sharedParams, 'update')
									params_chart_target.prepare_data_type = ""
									
								}
							}, 200)
						}
						else {
							var monitor_chart_display = setInterval(() => {
								var check_chart_parent_display = check_parent_display(params_chart_target)
								if (check_chart_parent_display.chart_display_on) {
									clearInterval(monitor_chart_display)
									params_chart_target.instanciator.inject_metadata(chart_to_filter, params_chart_target, data_type, injection_type, updateTime, sharedParams);						
									params_chart_target.prepare_data_type = ""
									
								}
							}, 300);
							
						}

					}
				}
	 			else if ((params_chart_target.chart_type === 'label' || params_chart_target.chart_type === 'labelGroup') ) {

					var monitor_chart_display = setInterval(() => {
						var check_chart_parent_display = check_parent_display(params_chart_target)
						if (check_chart_parent_display.chart_display_on) {
							clearInterval(monitor_chart_display)
							//remove previous card
							//var title = document.querySelector("#" + params_chart_target.id + "_title"); title.remove(); var card = document.querySelector("#" + 'card_' + params_chart_target.id); card.remove()
							var cardNode = document.getElementById("card_"+params_chart_target.htmlNode); cardNode.remove()
							params_chart_target.instanciator.init_label(params_chart_target)
							params_chart_target.instanciator.displayText(params_chart_target)
							params_chart_target.updateLabels = undefined
							params_chart_target.prepare_data_type = ""
							
						}
					}, 300);


	 			}
	 			else if (params_chart_target.chart_type === 'slider' && d3.sum(Object.values(dataset_filtred)) > 0) {
	 				params_chart_target.instanciator.updateSlider(params_chart_target, dataset_filtred)
	 			} 			
				else if (['d3', 'html'].includes(params_chart_target.chart_type)) {
					params_chart_target.prepare_data_type = ""
					//stats exec time
					var t1_bis1 = (new Date())/1000
					params_chart_target.instanciator.prepare_data_p2(dataset_filtred, params_chart_target, sharedParams)// -> ko, nb de bordures et couleurs trop élevé
					var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
					sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", sub_type: "prepare_data_p2","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

					//2.4.inject into the chart JS config instance the labels & datasets setup above
					var data_type = "data"; 
					params_chart_target.injection_type = 'update'

					var monitor_chart_display = setInterval(() => {
						var check_chart_parent_display = check_parent_display(params_chart_target)
						if (check_chart_parent_display.chart_display_on) {
							clearInterval(monitor_chart_display)
							var t1_bis1 = (new Date())/1000
							params_chart_target.instanciator.inject_metadata(params_chart_target);
							var t2 = (new Date())/1000; var tf = parseFloat((t2-t1_bis1).toFixed(3))
							sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter", sub_type: "inject_metadata","chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

							//hide_legends(params_chart_target, 'set_filter')

							params_chart_target.chart_updated = true
							
						}
					}, 300);
				}
				

				var t2 = (new Date())/1000; var tf = parseFloat((t2-t1).toFixed(3))
				sharedParams.crossfilterProcess_exec_time.push({type: "crossfilter_rm", "chart": params_chart_target.id, exec_time: tf, event_time: (new Date).toLocaleString()})	

				sharedParams.charts_with_spinners.hasOwnProperty(params_chart_target.id) ? sharedParams.charts_with_spinners[params_chart_target.id].hide_spinner(params_chart_target) : {};

				params_chart_target.chart_updated = true

				sharedParams.filter_order_origin = undefined

				//params_chart_target.dataset_filtred = []
			}
		}

		params_chart.status_chart = ''

	

	}





}



function extract_active_slices(params_chart, third_target_chart, filter_array) {

	

		//1.format the active slices into the expected model (in which each value is hold by an array)
		if (third_target_chart.list_labels_segments_multiples_selected.length > 0) {
			var list_labels = _.cloneDeep(third_target_chart.list_labels_segments_multiples_selected)
		}
		else if (third_target_chart.list_labels_segment_single_selected.length > 0) {
			var list_labels = _.cloneDeep(third_target_chart.list_labels_segment_single_selected)
		}

		if (!list_labels) {
			//console.log('no active slice on ' + third_target_chart.id)
			return
		}

		list_labels.map(o=> { 
			if (o.category_field) {
				typeof(o.category_field) === "object" ? o.category_field = o.category_field.flat().flat() : o.category_field = [o.category_field]
			}			
			if (o.sub_category_field) {
				typeof(o.sub_category_field) === "object" ? o.sub_category_field = o.sub_category_field.flat().flat() : o.sub_category_field = [o.sub_category_field]
			}
		})

		//2.clean the data produced by step 1 (detect & delete the empty fields)
		if (list_labels.length > 0 && list_labels.filter(f=> f.category_field !== "").length === 0) {
			filter_array[third_target_chart.sub_category_field] = []; 
			list_labels.map(o=> delete o.category_field)
			list_labels.map(o=> { filter_array[third_target_chart.sub_category_field].push([o.sub_category_field][0]) })
		}
		else if (list_labels.length > 0 && list_labels.filter(f=> f.sub_category_field !== "").length === 0) {
			filter_array[third_target_chart.category_field] = []
			/*if (third_target_chart.bin_params.bin === true) {filter_array[third_target_chart.category_field + "_binned"] = []}
			else {filter_array[third_target_chart.category_field] = []}*/
			list_labels.map(o=> delete o.sub_category_field)
			list_labels.map(o=> { 
				filter_array[third_target_chart.category_field].push([o.category_field][0])

			})
		}				


		//3.check the level of the data to collect (cat or sub cat)
		var collect_cat_field = true, collect_sub_cat_field = true
		if (params_chart.crossfilter && params_chart.crossfilter.find(c=> c.chart.id === third_target_chart.id)) {
			if (params_chart.crossfilter.find(c=> c.chart.id === third_target_chart.id).collect_active_slices) {				
				if (params_chart.crossfilter.find(c=> c.chart.id === third_target_chart.id).level_collect_active_slices === 0) {
					collect_cat_field = true
					collect_sub_cat_field = false
				}
				else if (params_chart.crossfilter.find(c=> c.chart.id === third_target_chart.id).level_collect_active_slices === 1) {
					collect_sub_cat_field = true
					collect_cat_field = false
				}				
			}
		}

		//4.transfert actives slices into the filter array
		//if the filter array does not contains the same field than the category / sub cat field of the third target chart, register the values			
		if (list_labels.length > 0 && collect_cat_field && !filter_array.hasOwnProperty(third_target_chart.category_field)) {//&& filter_array[third_target_chart.category_field]?.flat()?.length>0
			filter_array[third_target_chart.category_field] = []; 
			list_labels.map(o=> {
				typeof(o.category_field) === "object" ? filter_array[third_target_chart.category_field].push(o.category_field.flat()) : filter_array[third_target_chart.category_field] = o.category_field
			})
		}
		if (third_target_chart.sub_category_field &&  list_labels.length > 0 && collect_sub_cat_field && !filter_array.hasOwnProperty(third_target_chart.sub_category_field)) {	//filter_array.hasOwnProperty(third_target_chart.sub_category_field) === false &&
			filter_array[third_target_chart.sub_category_field] = []; 
			list_labels.map(o=> {
				typeof(o.sub_category_field) === "object" ? filter_array[third_target_chart.sub_category_field].push(o.sub_category_field.flat()) : filter_array[third_target_chart.sub_category_field] = o.sub_category_field
			})
		}

}


function get_active_legends(filter_array, params_chart, third_target_chart, filter_type) {

	if (third_target_chart.nb_axis === 2) {
		//consider hidden legends only when the category fields differs
		if (params_chart.sub_category_field !== third_target_chart.sub_category_field) {
			var active_legends = third_target_chart.chart_instance.legend.legendItems.filter(o=> o.hidden === false && o.text !== "")
			
			var legends_array = _.map(active_legends, (o)=> (o.text) );
			filter_array[third_target_chart.sub_category_field] = []; //filter_chart_source[third_target_chart.sub_category_field] = [];
			for (var z = 0; z < legends_array.length; z++) {
				filter_array[third_target_chart.sub_category_field].push(legends_array[z]);
				//filter_chart_source[third_target_chart.sub_category_field].push(legends_array[z])
			}
		}
		//else check the legends actives in the params object
		else if (Object.values(third_target_chart.active_legends).length > 0) {
			filter_array[third_target_chart.sub_category_field] = third_target_chart.active_legends[third_target_chart.sub_category_field]
		}
	}

	//--------------------------------------------------------------------------------------


	if (third_target_chart.nb_axis === 1) {
		if (filter_type === 'set_filter') {
			//if the Axis are the same, priority to the chart source slice
			if (params_chart.category_field === third_target_chart.category_field) {	
				//var active_legends = third_target_chart.chart_instance.legend.legendItems.filter(o=> o.hidden === false && o.text !== "")
				//var legends_array = _.map(active_legends, (o)=> (o.text) );
				var legends_array = Object.values(third_target_chart.active_legends)[0]			
				
				filter_array[third_target_chart.category_field] = []; //filter_chart_source[third_target_chart.category_field] = [];
				for (var z = 0; z < legends_array.length; z++) {
					filter_array[third_target_chart.category_field].push(legends_array[z]);
					//filter_chart_source[third_target_chart.category_field].push(legends_array[z])
				}
			}
			//if the axis of chart source and third target differs
			if (params_chart.category_field !== third_target_chart.category_field) {	

				var legends_array = Object.values(third_target_chart.active_legends)[0]			
				
				filter_array[third_target_chart.category_field] = []; //filter_chart_source[third_target_chart.category_field] = [];
				for (var z = 0; z < legends_array.length; z++) {
					filter_array[third_target_chart.category_field].push(legends_array[z]);
					//filter_chart_source[third_target_chart.category_field].push(legends_array[z])
				}
			}			

		}
		else if (filter_type === 'remove_filter') {
			//else check the legends actives in the params object
				var legends_array = Object.values(third_target_chart.active_legends)[0]
				
				
				filter_array[third_target_chart.category_field] = []; //filter_chart_source[third_target_chart.category_field] = [];
				for (var z = 0; z < legends_array.length; z++) {
					filter_array[third_target_chart.category_field].push(legends_array[z]);

				}
		}
	}						

	//--------------------------------------------------------------------------------------


}




function collect_active_legends_setFilter(params_chart, params_chart_target_toFilter, params_charts_target, filter_array, interaction_type) {
	var params_chart_target = params_charts_target.filter(p => p.status_chart === 'target')[0]
	if (params_chart_target === undefined) {return}

	for (var ii = 0; ii < params_charts_target.length; ii++) {

		//if the chart is not the current target
		if (params_charts_target[ii].status_chart !== 'target') {
			
			var third_target_chartLegends = params_charts_target[ii]

			if (interaction_type === 'selection_binding' || interaction_type === 'multiple_selection_binding' || interaction_type === 'legends_binding') {
				//collecte only in the case when the charts have diffent legend fields
				//1.check that the source and third_target_chart have different legend field
				if (params_chart.legends_field !== third_target_chartLegends.legends_field) {
					//2.check that the target_chart to filter and third_target_chart to scan for legends have different legend field
					//prepare eval for legends alimentation
					if (Object.values(third_target_chartLegends.hidden_legends).length > 0) {var eval_target_hidden_legends = Object.values(third_target_chartLegends.hidden_legends)[0].length}
					else {var eval_target_hidden_legends = 0}

					if (params_chart_target_toFilter.legends_field !== third_target_chartLegends.legends_field && eval_target_hidden_legends >0) {
						collect_active_legends_(filter_array, third_target_chartLegends);
					}

				}
			}
			else if (interaction_type === 'brush_selection_binding') {
				collect_active_legends_(filter_array, third_target_chartLegends);
			}
		}
	}

	function collect_active_legends_(filter_array, third_target_chartLegends) {
		//if the chart has hidden legends, check if the axis is absent from the filter_array before registration
		var has_hidden_legends = third_target_chartLegends.hidden_legends;
		if (has_hidden_legends !== undefined && Object.values(has_hidden_legends).length > 0) {
			if (Object.values(has_hidden_legends)[0].length > 0) {
				
				//params_charts_target.map(p=> p.list_keys_values_segments_multiples_selected).filter(a=> a.length > 0).map(a=> a.findIndex(i=> i["INSEE_COM"]))
				var legends_axis = Object.keys(has_hidden_legends)[0];

				if (filter_array.hasOwnProperty(Object.keys(has_hidden_legends)[0]) === false) {
					var legends_array = Object.values(third_target_chartLegends.active_legends)[0];
					//check the intergity of the array (it shall not contains "")
					if (legends_array.filter(i=> i === "").length > 0) {
						//if the legends array contains "", regenerate the array for the legends api
						legends_array = third_target_chartLegends.chart_instance.legend.legendItems.filter(l=> l.hidden === false).map(l=> l.text)
					}					
					filter_array[legends_axis] = legends_array
				}
			}
		}	
	}
}

//collect active legends for third target charts
function collect_active_legends_rmFilter(params_chart, params_charts_target, filter_array) {
	var params_chart_target = params_charts_target.filter(p => p.status_chart === 'target')[0]
	if (params_chart_target === undefined) {return}
	for (var ii = 0; ii < params_charts_target.length; ii++) {

		//if the chart is not the current target
		if (params_charts_target[ii].status_chart !== 'target') {
			
			var third_target_chartLegends = params_charts_target[ii]

			//collecte only in the case when the charts have diffent legend fields
			if (params_chart.legends_field !== third_target_chartLegends.legends_field && params_chart_target.legends_field !== third_target_chartLegends.legends_field) {
				var has_hidden_legends = third_target_chartLegends.hidden_legends; var list_labels_selected = [];

				//if the chart has hidden legends, check if the axis is absent from the filter_array before registration
				if (has_hidden_legends !== undefined && Object.values(has_hidden_legends).length > 0) {
					if (Object.values(has_hidden_legends)[0].length > 0) {
						
						//params_charts_target.map(p=> p.list_keys_values_segments_multiples_selected).filter(a=> a.length > 0).map(a=> a.findIndex(i=> i["INSEE_COM"]))
						var legends_axis = Object.keys(has_hidden_legends)[0];

						if (filter_array.hasOwnProperty(Object.keys(has_hidden_legends)[0]) === false) {
							var legends_array = Object.values(third_target_chartLegends.active_legends)[0];
							//check the intergity of the array (it shall not contains "")
							if (legends_array.filter(i=> i === "").length > 0) {
								//if the legends array contains "", regenerate the array for the legends api
								legends_array = third_target_chartLegends.chart_instance.legend.legendItems.filter(l=> l.hidden === false).map(l=> l.text)
							}
							filter_array[legends_axis] = legends_array
						}
					}
				}
			}
		}							
	}
}





function clean_filter_array(filter_array) {
	delete filter_array[""]
	delete filter_array["undefined"]
	Object.keys(filter_array).forEach(key => filter_array[key] === undefined ? delete filter_array[key] : {});
	Object.keys(filter_array).forEach(key => filter_array[key][0] === undefined ? delete filter_array[key] : {});
	Object.keys(filter_array).forEach(key => filter_array[key] === [undefined] ? delete filter_array[key] : {});
	Object.keys(filter_array).forEach(key => filter_array[key] === "" ? delete filter_array[key] : {});
	Object.keys(filter_array).forEach(key => filter_array[key][0] === "" ? delete filter_array[key] : {});	
	Object.keys(filter_array).forEach(key => filter_array[key].length === 0 ? delete filter_array[key] : {});
	//delete case filter_array[key] = [[""]]
	Object.keys(filter_array).forEach(key => { 
		if (typeof(filter_array[key]) === "object") { 
			filter_array[key].flat().flat().includes("") ? delete filter_array[key] : {} 
			filter_array[key] = filter_array[key].flat().flat()		
		} 
	})

}


function build_filter_array_public(params_chart, sharedParams, filter_array, filter_array_public) {
	let filter_array_public_header = {}, filter_array_public_tooltip = {};
	Object.keys(filter_array).forEach(key=> {
		var val = filter_array[key];
		if (val.constructor == Array && val.length === 1) {while (val.constructor == Array) {val = val[0]}}
		else if (val.constructor == Array && val.length > 1) val.sort()
		//check if the field is encoded
		var encoded_field = sharedParams.aliases.find(e=> e.field === key)?.target_field;
		var alias = sharedParams.aliases.find(e=> e.field === key)?.alias
		if (encoded_field) {			
			var label_field = sharedParams.common_ref_list.find(o=> o[key] === val)?.[encoded_field]
			if (!label_field && sharedParams.join_fields) {
				if (Object.keys(sharedParams.join_fields).includes(key) || Object.values(sharedParams.join_fields).includes(key)) {
					var key_transcoded = sharedParams.transcode_join_fields(sharedParams.join_fields, key);
					label_field = sharedParams.common_ref_list.find(o=> o[key_transcoded] === val)?.[encoded_field]
				}
			}


			if (label_field) {							
				var label_field_reduced = reduce_lenght(label_field)
				if (alias) {
					filter_array_public_header[alias] = label_field_reduced;
					filter_array_public_tooltip[alias] = label_field
				}
				else {
					filter_array_public_header[alias] = label_field_reduced;
					filter_array_public_tooltip[alias] = label_field					
				}
			}
		}
		else {
			var val_reduced = reduce_lenght(val)
			if (alias) {
				filter_array_public_header[alias] = val_reduced;
				filter_array_public_tooltip[alias] = val;		
			}
			else {
				filter_array_public_header[key] = val_reduced;
				filter_array_public_tooltip[key] = val;		
			}
		}
	
	})
	update_html_node(params_chart, filter_array_public_header)

	function reduce_lenght(value) {
		if (value.constructor == Array && value.length > 6) {value = value.slice(0,6)+"..."}
		else if (value.constructor == String && value.length > 18) {value = value.slice(0,18)+"..."}
		return value
	}

	function update_html_node(params_chart, filter_array_public_header) {
		let node, width
		var args = ""
		//if (!params_chart.filter_array_public_header) params_chart.filter_array_public_header = []
		if (!params_chart.filter_array_public_header) params_chart.filter_array_public_header = {}
		Object.keys(filter_array_public_header).forEach(k=> {
			
			args = `${args} ${k}: ${filter_array_public_header[k]}, `
			
			
			//if the keys is new, add it
			if (!params_chart.filter_array_public_header[k]) {
				params_chart.filter_array_public_header[k] = filter_array_public_header[k]
			}
			//if the key exist, update it
			else if (params_chart.filter_array_public_header[k]) {
				params_chart.filter_array_public_header[k] = filter_array_public_header[k]
			}
		})

		//delete the obsolete keys/values
		Object.keys(params_chart.filter_array_public_header).forEach(k=> {
			if (!filter_array_public_header[k]) {
				delete params_chart.filter_array_public_header[k]
			}
		})
			
		
		
		
		let wait_node_appearance = setInterval(()=> {
			node = document.getElementById('crossfilterContainer_'+params_chart.id);
			var node_tooltip = document.getElementById('crossfilterContainer_tooltip_'+params_chart.id);
			var chart_node = document.getElementById(params_chart.id)
			if (!chart_node) chart_node = document.getElementById(params_chart.htmlNode)
			if (!chart_node) chart_node = document.getElementById(params_chart.chart_instance?.canvas?.id)
			
			
			var width = chart_node.clientWidth
			if (node && width > 0) {	
				clearInterval(wait_node_appearance)			
				let ind_add_tooltip
				Object.keys(params_chart.filter_array_public_header).forEach(k=> {
					var _k = k
					if (String.prototype.replaceAll) { _k = k.replaceAll(' ', '__') }
					else {while (k.includes(' ')) { _k = k.replace(' ', '__')}}
					
					var chart_max_width = chart_node.clientWidth

					if (!node.dataset[_k]) {
						node.dataset[_k] = params_chart.filter_array_public_header[k];
						var filter_node = document.createElement('p'); filter_node.id = `node_${_k}_crossfilterContainer_` + params_chart.id;
						filter_node.style = 'font-size: 12px; width: max-content; height: max-content; color: #ffffff; background-color: #ff5f22; margin: 4px; padding-left: 3px; padding-right: 3px; opacity: 0.8; border-radius: 4px';
						filter_node.innerHTML = `<strong>${k}: </strong>${params_chart.filter_array_public_header[k]}`;

						node.append(filter_node)
						d3.select(`#node_${_k}_crossfilterContainer_` + params_chart.id).style('opacity', 0).transition().duration(1000).style('opacity', 1)

						//if the width of the parent container of the filter nodes > width of the chart container, remove the last node && add a tooltip instead
						if (node.clientWidth >= chart_max_width) {
							filter_node.remove()
							delete node.dataset[_k];
							ind_add_tooltip = true
							console.warn('add_tooltip')
						}
					}
					else if (node.dataset[_k]) {
						var filter_node = document.getElementById(`node_${_k}_crossfilterContainer_` + params_chart.id);
						if (filter_node) {
							var previous_node_text = filter_node.innerText
							filter_node.innerHTML = `<strong>${k}: </strong>${params_chart.filter_array_public_header[k]}`
							if (filter_node.innerText !== previous_node_text) {
								d3.select(`#node_${_k}_crossfilterContainer_` + params_chart.id).style('opacity', 0).transition().duration(1000).style('opacity', 1)
							}
							
						}
					
					}
											
				})

				//delete obsolete nodes
				Object.keys(node.dataset).forEach(_k=> {
					var k = _k
					if (String.prototype.replaceAll) { k = _k.replaceAll('__', ' ') }
					else {while (_k.includes('_')) { k = _k.replace('__', ' ')}}

					if (!params_chart.filter_array_public_header[k]) {
						delete node.dataset[_k]; delete node.dataset[k];
						var filter_node = document.getElementById(`node_${_k}_crossfilterContainer_` + params_chart.id);
						if (filter_node) filter_node.remove()
					}
				})

				//remove previous popoup if exist
				var tooltip_host = document.getElementById("tooltip_host_crossfilterContainer_" + params_chart.id)
				if (tooltip_host) tooltip_host.remove()
				
				if (ind_add_tooltip) {										
					tooltip_host = document.createElement('div'); tooltip_host.id = "tooltip_host_crossfilterContainer_" + params_chart.id
					
					Object.assign(tooltip_host.style, {'font-size': '12px', 
												width: 'max-content', 
												height: 'max-content', 
												color: 'white', 
												'background-color': '#ff5f22',
												margin: '4px',
												'padding-left': '3px',
												'padding-right': '3px',
												opacity: 1,
												position: 'relative',
												'border-radius': '4px'
											})

					var tooltip_title = document.createElement('span'); tooltip_title.style = 'font-size: 12px'; 
					tooltip_title.innerText = 'plus'
					tooltip_host.appendChild(tooltip_title);

					var tooltip_content = document.createElement('div'); tooltip_content.id = 'tooltip_content_crossfilterContainer_' + params_chart.id; 
					var chart_max_width = chart_node.clientWidth;
					Object.assign(tooltip_content.style, {
						visibility: 'hidden',
						width: `${chart_max_width*0.75}px`,
						//width: '160px',
						'background-color': '#555',
						color: '#fff',
						'text-align': 'center',
						'border-radius': '6px',
						padding: '8px 0',
						position: 'absolute',
						'z-index': 1,
						bottom: '-95px',
						left: '50%',
						'margin-left': '-10px',
						display: 'grid',
						rowGap: '3px',
						'word-break': 'break-word'
					})

					
					Object.keys(filter_array_public_header).forEach(k=> {

						
						var filter_node = document.createElement('p'); //filter_node.id = `node_${_k}_crossfilterContainer_` + params_chart.id;
						filter_node.style = 'font-size: 12px; color: white; margin: 4px; padding-left: 3px; padding-right: 3px; opacity: 1; text-align: left';						
						//filter_node.innerText = p
						filter_node.innerHTML = `<strong>- ${k}: </strong>${filter_array_public_tooltip[k]}`;
						tooltip_content.appendChild(filter_node)
					})

					tooltip_host.appendChild(tooltip_content)
					
					
					tooltip_host.addEventListener('mouseover', ()=> {
						d3.select('#tooltip_content_crossfilterContainer_' + params_chart.id).style('visibility', 'visible').style('opacity', 0).transition().duration(1000).style('opacity', 1)
					})

					tooltip_host.addEventListener('mouseout', ()=> {
						tooltip_content.style.visibility = 'hidden'						
					})
					node_tooltip?.appendChild(tooltip_host)
				}
				else {

				}
				
				//node.innerText = "Filtres = " + args;
				
			}
		}, 400)
					
	}
	return filter_array_public_header
	
}


//hide programmatically legends
function hide_legends(params_chart, filter_type) {
	//1.access to the manually hidden legends
	if (params_chart.hidden_legends) {
		var hidden_legends = []
		//get hidden legends
		if (params_chart.hidden_legends.hasOwnProperty(params_chart.category_field)) {
			hidden_legends = params_chart.hidden_legends[params_chart.category_field]
		}
		else if (params_chart.hidden_legends.hasOwnProperty(params_chart.sub_category_field)) {
			hidden_legends = params_chart.hidden_legends[params_chart.sub_category_field]
		}

		//2.get the position of each hidden legend in the legends chart section
		//old code
			// var pos_hidden_legends = {}
			// if (hidden_legends) {
			// 	hidden_legends.map(h=> {
			// 		var pos = params_chart.chart_instance.legend?.legendItems.findIndex(p=> p.text === h)
			// 		if (h !== "" && pos > -1) {pos_hidden_legends[h] = pos}

			// 	})
			// }



			// params_chart.chart_instance.update()

		//if a slice is selected on the source chart, enable the corresponding dataset on the legends
		//check the type of legends config: for pie: params_pieChart1.chart_instance.getDatasetMeta(0).data[0].hidden = true
		var chart_type = params_chart.chart_instance.config.type
		//old code
			// if (filter_type === 'set_filter') {
			// 	//if hidden legends are found, keep them hidden
			// 	if (Object.values(pos_hidden_legends).length > 0) {
			// 		//preserve_filtred_legends(params_chart, pos_hidden_legends, chart_type);
			// 		preserve_filtred_legends(params_chart, hidden_legends, chart_type);
			// 	}
			// 	//else, display all datasets
			// 	else {
			// 		var i = 0;
			// 		params_chart.chart_instance.legend?.legendItems.map(l=> {
			// 			if (chart_type === 'doughnut' || chart_type === 'pie') {
			// 				l.text !== "" ? params_chart.chart_instance.getDatasetMeta(0).data[i].hidden=false : {};
			// 			}
			// 			else {
			// 				l.text !== "" ? params_chart.chart_instance.getDatasetMeta(i).hidden=false : {};
			// 			}

			// 			i++}
			// 		)
			// 		params_chart.chart_instance.update()
			// 	}
			// }

			// //if the selected slice(s) is released on the source chart, show/hide the corresponding datasets according to the legends selected manually
			// else if (filter_type === 'remove_filter') {			
			// 	preserve_filtred_legends(params_chart, hidden_legends, chart_type);
			// }	
		hidden_legends.length > 0 ? preserve_filtred_legends(params_chart, hidden_legends, chart_type) : {};

	}

	
}




function sync_legends(params_chart, params_chart_target, params_charts_target) {
	
	//if the legends of the source chart and target chart are the same, and if there are hidden legends, exec legends synchro and do not let the source chart filter the target
	if ((params_chart.legends_field === params_chart_target.legends_field) && Object.values(params_chart.hidden_legends).length > 0) {

		if (params_chart_target.chart_type !== "chartJS") {
			return
		}

		//get hidden legends
		if (params_chart.hidden_legends.hasOwnProperty(params_chart.category_field)) {
			var hidden_legends = params_chart.hidden_legends[params_chart.category_field]; var active_legends = params_chart.active_legends[params_chart.category_field]
		}
		else if (params_chart.hidden_legends.hasOwnProperty(params_chart.sub_category_field)) {
			var hidden_legends = params_chart.hidden_legends[params_chart.sub_category_field]; var active_legends = params_chart.active_legends[params_chart.sub_category_field]
		}

		

		//save the last version of hidden legends for the params_chart_target
		params_charts_target.map(p=> p.legends_field === params_chart.legends_field ? p.hidden_legends[p.legends_field]=[] : {})
		params_charts_target.map(p=> p.legends_field === params_chart.legends_field ? p.active_legends[p.legends_field]=[] : {})

		params_charts_target.map(p=> p.legends_field === params_chart.legends_field ? hidden_legends.map(h=> p.hidden_legends[p.legends_field].push(h)) : {})
		params_charts_target.map(p=> p.legends_field === params_chart.legends_field ? active_legends.map(h=> p.active_legends[p.legends_field].push(h)) : {})


		//3.loop through the target chart and hide corresponding legends
		//check the type of legends config: for pie: params_pieChart1.chart_instance.getDatasetMeta(0).data[0].hidden = true
		var chart_type = params_chart_target.chart_instance.config.type;
				
		preserve_filtred_legends(params_chart_target, hidden_legends, chart_type);

	}			
}





function sync_legends_rm_filter(params_chart, params_chart_target, sharedParams) {
	
	//if the legends of the source chart and target chart are the same, and if there are hidden legends, exec legends synchro and do not let the source chart filter the target
	if ((params_chart.legends_field === params_chart_target.legends_field) && Object.values(params_chart.hidden_legends).length > 0) {

		//get hidden legends
		var hidden_legends = [];
		if (params_chart.hidden_legends.hasOwnProperty(params_chart.category_field)) {
			hidden_legends = params_chart.hidden_legends[params_chart.category_field]
		}
		else if (params_chart.hidden_legends.hasOwnProperty(params_chart.sub_category_field)) {
			hidden_legends = params_chart.hidden_legends[params_chart.sub_category_field]
		}

		//restore data source for both source & target chart
		var params_charts = [params_chart, params_chart_target]
		if (hidden_legends.length>0) {
			params_charts.map(chart=> {
				//chart.data = _.cloneDeep(chart.data_source);
				chart.prepare_data_type = ""; var data_type = "data"; var injection_type = "update"; var updateTime = 0;
				chart.instanciator.inject_metadata(chart.chart_instance, chart, data_type, injection_type, updateTime, sharedParams) // -> ok
			})
			

			//.loop through the source & target chart and hide corresponding legends
			//check the type of legends config: for pie: params_pieChart1.chart_instance.getDatasetMeta(0).data[0].hidden = true

			var chart_type = params_chart.chart_instance.config.type;			
			preserve_filtred_legends(params_chart, hidden_legends, chart_type);

			var chart_type = params_chart_target.chart_instance.config.type;			
			preserve_filtred_legends(params_chart_target, hidden_legends, chart_type);

			params_chart_target.has_been_filtred = true

		}
		


	}			
}






function restore_original_chart_datasets(params_chart, sharedParams) {
		//get hidden legends
		if (params_chart.hidden_legends[params_chart.category_field] !== undefined) {
			var hidden_legends = params_chart.hidden_legends[params_chart.category_field]
		}
		else {
			var hidden_legends = params_chart.hidden_legends[params_chart.sub_category_field]
		}

		//restore data source for target chart		
		params_chart.data = _.cloneDeep(params_chart.data_source);
		params_chart.prepare_data_type = ""; var data_type = "data"; var injection_type = "update"; var updateTime = 0;
		params_chart.instanciator.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type, updateTime, sharedParams) // -> ok
	

		//3.loop through the target chart and hide corresponding legends
		//check the type of legends config: for pie: params_pieChart1.chart_instance.getDatasetMeta(0).data[0].hidden = true

		var chart_type = params_chart.chart_instance.config.type;		
		preserve_filtred_legends(params_chart, hidden_legends, chart_type);

		params_chart.has_been_filtred = true

}






function preserve_filtred_legends(params_chart, hidden_legends, chart_type) {
	//traverse the array of hidden legends & hide corresponding legends in the target chart	
	var dataset;
	//if target chart is pie type
	if (chart_type === 'doughnut' || chart_type === 'pie') {
		//1.show all hidden datasets
		params_chart.chart_instance.getDatasetMeta(0).data.forEach(d=> d.hidden = false)
		//2.find the pos of the hidden legend in the target chart
		hidden_legends.forEach(legend=> {
			var indexOf_legend = params_chart.chart_instance.legend?.legendItems.findIndex(i=> i.text === legend)
			//2.update legend status
			if (indexOf_legend > -1) {
				params_chart.chart_instance.getDatasetMeta(0).data[indexOf_legend].hidden=true
			}
		})
	}
	else {
		//1.show all hidden datasets
		params_chart.chart_instance.data.datasets.forEach(d=> {Object.values(d._meta)[0].hidden = false })
		//2.hide datasets listed in hidden_legends
		hidden_legends.forEach(legend=> { 
			dataset = params_chart.chart_instance.data.datasets.filter(d=> d.label === legend);
			if (dataset.length>0) {
				Object.values(dataset[0]._meta)[0].hidden = true
			}
		})
	}
	//3.update chart
	params_chart.chart_instance.update(750)	
	//if a brush is in place, reset its coordinates according to the last scales observed
	if (Object.values(params_chart.brush_values).length > 0) {params_chart.funcLib.adapt_brush_v2(params_chart)}
}


function check_clicks_on_legends(params_chart, _this) {
	if (params_chart.chart_type === 'chartJS') {
		var hidden_legends = params_chart.chart_instance.legend?.legendItems.filter(s=> s.hidden).map(l=> l.text)
		var active_legends = params_chart.chart_instance.legend?.legendItems.filter(s=> !s.hidden).map(l=> l.text)
		params_chart.id_current_legend = active_legends?.join()
		// if (hidden_legends.length>0) {			
		// 	//params_chart.legend_selected = true
		// }
	}
	else if (params_chart.chart_type === 'leaflet') {	
		params_chart.id_current_legend = [...params_chart.selected_legends].join()
		// if (params_chart.selected_legends.length>0) {
			
		// 	//params_chart.legend_selected = true
		// }
	}
}

function collect_legends(current_chart, _this, params_chart) {
	//collect current legends if the chart is ChartJS type
	if (params_chart.chart_type === "chartJS" && current_chart.legend) {
		//get active & hidden legends
		var active_legends = current_chart.legend?.legendItems.filter(s=> !s.hidden).map(l=> l.text)
		var hidden_legends = current_chart.legend?.legendItems.filter(s=> s.hidden).map(l=> l.text)

		//registed id trace of active legends		
		params_chart.id_previous_legend = active_legends?.join()
		
		

		//if the legends use a decoded field (label field that corresponds to code field), encode the value of the legend to its initial state (value field instead of label)
		var target_legends = [...active_legends]
		target_legends.length > 0 ? active_legends = process_label_fields(target_legends, params_chart, active_legends) : {}
		//target_legends.length > 0 ? hidden_legends = process_label_fields(target_legends, params_chart, hidden_legends) : {}


		//IF CASE active legends is empty, fill with null the array to filter out all the corresponding lines in the main dataset
		active_legends.length === 0 ? active_legends = ['null, no_value'] : {}
		_this.legends_array = active_legends


		return {active_legends: active_legends, hidden_legends: hidden_legends}
	}

	//collect current legends if the chart is leaflet type
	if (params_chart.chart_type === "leaflet" && params_chart.selected_legends.length > - 1 && params_chart.legends_crossfilter) {
		
		var active_legends = [...params_chart.selected_legends]

		params_chart.id_previous_legend = active_legends?.join()
		
		
		var target_legends = [...active_legends]
		target_legends.length > 0 ? active_legends = process_label_fields(target_legends, params_chart, active_legends) : {}


		_this.legends_array = active_legends


		return {active_legends: active_legends, hidden_legends: []}
	}


		function process_label_fields(target_legends, params_chart, active_legends) {
			if (target_legends.length > 0 && params_chart.fields_to_decode) {
				//for older structure (brut array or object param)
				if (params_chart.fields_to_decode.constructor == Array && params_chart.fields_to_decode.map(r=> Object.values(r).includes(params_chart.legends_field)).some(r=> r)) {
					var active_legends = active_legends.map(l=> encode_field(params_chart, l))
					return active_legends
				}
				else if (params_chart.fields_to_decode.constructor == Object && Object.values(params_chart.fields_to_decode).includes(params_chart.legends_field)) {
					params_chart.fields_to_decode = [params_chart.fields_to_decode]
					var active_legends = active_legends.map(l=> encode_field(params_chart, l))
					return active_legends
				}
				//case when the fields_to_decode object is structured with category_field and/or sub_category_field
				else if (params_chart.fields_to_decode?.legends_field) {
					var active_legends = active_legends.map(l=> encode_field(params_chart, l, params_chart.fields_to_decode.legends_field))
					return active_legends
				}
				else {return active_legends}
			}
			else {return active_legends}
		

			function encode_field(params_chart, legend, legends_field) {
				//case when the fields_to_decode object is structured with category_field and/or sub_category_field
				if (legends_field) {
					var field_to_decode = params_chart.fields_to_decode.legends_field.target_field;
					var mainKey = params_chart.fields_to_decode.legends_field.mainKey;	
					var result = params_chart.data_input.find(f=> f[field_to_decode] === legend)[mainKey]
					return result
				}
				//for older structure (brut array or object param)
				else {
					var field_to_decode = params_chart.fields_to_decode.filter(f => f.mainKey === params_chart.legends_field)[0]			
					var mainKey = field_to_decode.fields[0];
					var lookupKey = field_to_decode.fields[0]	
					var field = params_chart.legends_field
					var lookupTable = [...params_chart.data_input];

					var data_input = [{[mainKey]: legend}]
	
					join_v2(data_input, lookupTable, mainKey, lookupKey, [field])
	
					return data_input[0][params_chart.legends_field]					
				}


			}

		}


}


	function collect_hierarchy_slice(params_chart, filter_array) {
		if (params_chart.previous_hierarchy && Object.keys(params_chart.previous_hierarchy).some(e=> e)) {
			//get last hierarchy level
			var hierarchy_level = Object.values({...params_chart.previous_hierarchy}).pop()
			//feed filter array
			filter_array[hierarchy_level.hierarchy_field] = [hierarchy_level.active_hierarchy_value]
			//turn flag for first in this hierarchy level to false
			//params_chart.current_hierarchy['first_in'] = false
		}
	}


	function extract_active_legends(params_chart, params_chart_target, filter_array) {
		//extract only if the charts don't have the same hidden legend axis
		if (!_.isEqual(params_chart.hidden_legends, params_chart_target.hidden_legends)) {
			if (Object.values(params_chart.active_legends).flat().length>0)  {Object.assign(filter_array, params_chart.active_legends)}
		}
	}

	function extract_active_legends_third(third_target_chart, params_chart_target, filter_array) {
		//extract only if the source & third chart don't have the same hidden legend axis
		if (params_chart.legends_field !== "" && params_chart.legends_field !== third_target_chart.legends_field) {
			if (Object.values(third_target_chart.active_legends).flat().length>0)  {Object.assign(filter_array, third_target_chart.active_legends)}
		}		
	}

	function extract_active_legends_v2(params_chart, params_chart_target, filter_array) {
		//never collect the legends if the target chart shares the same legend field with the source or third chart
		//if the target chart has different legend field from the source or the third, collect the legends
		if (params_chart_target.legends_field !== params_chart.legends_field) {
			if (Object.values(params_chart.active_legends).flat().length>0)  {Object.assign(filter_array, params_chart.active_legends)}	
		}
	}

	function extract_active_legends_third_v2(third_target_chart, params_chart_target, filter_array) {
		//never collect the legends if the target chart shares the same legend field with the source or third chart
		//if the target chart has different legend field from the third chart, collect the legends
		if (!third_target_chart.active_legends || !third_target_chart.hidden_legends) return
		if (params_chart_target.legends_field !== third_target_chart.legends_field) {
			//dont erase the filter array if the key exists
			if (!filter_array.hasOwnProperty(third_target_chart.legends_field)) {
				if (Object.values(third_target_chart.active_legends).flat().length>0)  {Object.assign(filter_array, third_target_chart.active_legends)}	
			}
		}
		//else if the target chart has the same legend field with the third chart, sync their legends
		else if (params_chart_target.legends_field === third_target_chart.legends_field) {
			if (Object.values(third_target_chart.hidden_legends).flat().length>0) params_chart_target.sync_legends = Object.values(third_target_chart.hidden_legends).flat()
		}
	}	

// function show_spinner(params_chart_target) {
// 	if (params_chart_target.chart_type === 'chartJS') {var chart_display = document.getElementById(params_chart_target.ctx.id)}
// 	else if (params_chart_target.chart_type === 'leaflet') {var chart_display = document.getElementById(params_chart_target.htmlNode)}
// 	else {return}

// 	var spinner_display = document.getElementById(params_chart_target.id + '_spinner')

// 	chart_display.style.display = 'none'
// 	if (spinner_display) {spinner_display.style.display = 'grid'}
// }


// function hide_spinner(params_chart_target) {
// 	if (params_chart_target.chart_type === 'chartJS') {var chart_display = document.getElementById(params_chart_target.ctx.id)}
// 	else if (params_chart_target.chart_type === 'leaflet') {var chart_display = document.getElementById(params_chart_target.htmlNode)}
// 	else {return}
		
// 	var spinner_display = document.getElementById(params_chart_target.id + '_spinner')

// 	chart_display.style.display = 'grid'
// 	if (spinner_display) {spinner_display.style.display = 'none'}								
// }


/*class Tchat {

	constructor() {
		mobx.extendObservable(this, {
		messages: [],
		notifications: 0
		})
		this.autre = "toto"
	}
}

let tchat = new Tchat()
mobx.autorun(function() {
	console.log('voici le new messages: ' + tchat.messages.join(", "))
})
tchat.messages.push('hello')*/



// params_bar1 = new param2_customSpec_BarChartsJS()

/*mobx.autorun(function() {
	try{
		setTimeout(()=> console.log('voici le new clic: ' + params_bar1.list_idx_segment_single_selected.join(", ")), 100)
	}
	catch{
		console.log("array to observe not ready")
	}
})*/

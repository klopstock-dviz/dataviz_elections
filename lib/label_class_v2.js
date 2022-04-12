class Label {

	createLabel(params_label, sharedParams) {
		//params_label.transformations.crossfilter = {"INSEE_COM": ["33063"], nb_pieces: [2]}//, "33281"

		this.setup_funcLib(params_label)

		params_label.value = this.prepare_data_p1(params_label, sharedParams)

		this.init_label(params_label)

		params_label.chart_type = "label"
		
		params_label.instanciator = this

        params_label.chart_instance = this

		sharedParams.params_charts.push(params_label)

		params_label.sharedParams = sharedParams

		this.displayText(params_label)
	}

	prepare_data_p1(params_label, sharedParams) {
	    if (params_label.data_crossfiltred) return []

		var d1 = new Date();

	    //exit the process in case the label is part of a map visual, and not fired by a spatial query event
		if (params_label.map_label && (sharedParams.filter_order_origin !== 'spatial query' && sharedParams.filter_order_origin !== 'map_legend_filter')) {
			var label_node = document.getElementById(params_label.htmlNode)
			label_node.style.visibility = 'hidden'
			params_label.value = '-'
			return
		}
		else if (params_label.map_label && (sharedParams.filter_order_origin === 'spatial query' || sharedParams.filter_order_origin === 'map_legend_filter')) {
			var label_node = document.getElementById(params_label.htmlNode)
			label_node.style.visibility = 'visible'
			params_label.value = '-'
		}
		

	    
	    //data source for the bar chart
	    if (sharedParams.filter_order_origin === "spatial query" && sharedParams.spatial_data && sharedParams.spatial_data.length > 0) {
	    	var data_chart = [...sharedParams.spatial_data]
	    }
	    else if (sharedParams.filter_order_origin === "spatial query" && sharedParams.spatial_data && sharedParams.spatial_data.length === 0) {
	    	var data_chart = [...sharedParams.spatial_data]
			var label_node = document.getElementById(params_label.htmlNode)
			label_node.style.visibility = 'hidden'
			params_label.value = '0'
			return			
	    }		
	    else if (params_label.transformations.dataset === undefined) {
	    	var data_chart = [...sharedParams.data_main]
	    	
	    }
	    else if (params_label.transformations.dataset && params_label.transformations.dataset.length>0 ) {
			if (!params_label.transformations['dataset_ready'] && !params_label.transformations.filter) {
				params_label.transformations['dataset_ready'] = [...params_label.transformations.dataset]
				var data_chart = [...params_label.transformations.dataset]
			}
			else if (!params_label.transformations['dataset_ready'] && params_label.transformations.filter) {
				var data_filtred = filter_local_dataset(params_label.transformations.filter, params_label.transformations.dataset);
				//create index
				let i=0; data_filtred.forEach(r=> {r['index'] = i++})				
			 
				//if the data has lat/lng fields, create a leaflet latLng
				if (params_label.latLng_fields_params) {
					data_filtred.forEach(r=> {
						r['leaflet_lat_lng'] = new L.latLng(r[params_label.latLng_fields_params.lat_fieldName], r[params_label.latLng_fields_params.lng_fieldName])
					})
				}
				params_label.transformations['data_main_groupBy_index'] = _.groupBy(data_filtred, 'index'); 
				params_label.transformations['dataset_ready'] = [...data_filtred]
				var data_chart = [...params_label.transformations.dataset_ready]
			}
			else {
				var data_chart = [...params_label.transformations.dataset_ready]
			}			
	    }
		else  {return 'no dataset fits'}




		var filterList = {}, filterList_temp = {};
		//if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
		if (params_label.transformations.crossfilter !== undefined && Object.keys(params_label.transformations.crossfilter).length > 0 ) {
            // params_label.transformations.filter.forEach(arg=> {Object.keys(arg).forEach(key=> filterList_temp[key] = arg[key]) })
            // Object.assign(params_label.transformations.crossfilter, filterList_temp)
			filterList = formFilterArray(params_label, params_label.transformations.crossfilter)
		}




		//if a filter arguments has been provided for the data source, call them back here
		if (params_label.transformations.filter !== undefined) {

			//transform the filterList into an array that we can push in it filter objects
			filterList = Object.values(filterList)

			//don't take fields from the filter object if they are present in the crossfilter
			params_label.transformations.filter.forEach(e=> {if (!filterList.find(f=> f.field === e.field)) {filterList.push(e)} })


			//Object.assign(filterList, params_label.transformations.filter)

			filterList = filterList.filter(l=> l.field !== "");

			//flaten values
			filterList.forEach(e=> {if (e.values) e.values = e.values.flat()})
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if ((params_label.transformations.dataset && params_label.transformations.dataset.length>0) && (Object.keys(filterList).length > 0 || params_label.to_filter === true)) {
			params_label.multithreading = false;
			if (params_label.join) {filterList = sharedParams.join_external_datasets(params_label, filterList)}

			//if a field of the filterList is not present in the data_chart, delete it
			filterList = sharedParams.delete_unwanted_fields(data_chart, filterList)

			var data_filtred = prepare_engage_crossfilter(data_chart, params_label, filterList, sharedParams);
			var dataset_grouped = params_label.funcLib['aggregate_data'](data_filtred)
			return dataset_grouped
		}
		else if (Object.keys(filterList).length > 0 || params_label.to_filter === true) {
			//if a field of the filterList is not present in the data_chart, delete it
			filterList = sharedParams.delete_unwanted_fields(data_chart, filterList)

			var data_filtred = prepare_engage_crossfilter(data_chart, params_label, filterList, sharedParams)	
			// var dataset_grouped = dataset_grouped(data_filtred)
			// return dataset_grouped			
		}
		//else 
		else {var data_filtred = [...data_chart]}




		//case when the result of the crossfilter is an array of data & not an array of promises
		if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> !e).length > 0) {
			//save data indexes
			if (!_.isEmpty(filterList)) {
				params_label.htmlNode_current_filter = filterList.map(o=> Object.values(o).join()).join("|")			
				if (!params_label.history_data_filtred.hasOwnProperty(params_label.htmlNode_current_filter)) {
					params_label.history_data_filtred[params_label.htmlNode_current_filter] = {indexes: deduplicate_dict(data_filtred, 'index')} 
				}
			}

			
			//if the dataset is built upon a radius, given by an adress, fit the dataset to the bounds of the given radius
			if (sharedParams.transformations.geoRadius_filter && sharedParams.transformations.geoRadius_filter.length > 0) {
				var func_locator = sharedParams.params_labels.find(chart=> chart.chart_type === 'adressSearch')
				if (func_locator && data_filtred.find(r=> r.leaflet_lat_lng)) {
					data_filtred = func_locator.funcLib.restrict_dataset_to_radius(data_filtred, params_label);
				}

				else if (func_locator && !data_filtred.find(r=> r.leaflet_lat_lng) && _.find(params_label, 'lat_fieldName')) {
					var lat = params_label.latLng_fields_params.lat_fieldName, lng = params_label.latLng_fields_params.lng_fieldName;
					data_filtred = func_locator.funcLib.restrict_dataset_to_radius(data_filtred, params_label, lat, lng);
				}
				else {
					console.warn('please specify the lat/lng fields for the chart id: ' + params_label.htmlNode);
				}
				
			}


		}
		else if (data_filtred.constructor === Array && data_filtred.length === 0) {return []}
		//case when the result of the crossfilter is a promise
		else {

	        var promise_dataset_ready = process_worker_result(data_filtred, sharedParams, params_label)
	        return promise_dataset_ready


			async function process_worker_result(data_filtred, sharedParams, params_label, filterList) {
				var result = []; var chart, promise_result
				//case when the workers return multiple promises of datasets
				if (data_filtred.constructor === Array && data_filtred.map(e=> e.constructor === Promise).filter(e=> e).length > 0) {
					var promises_result = await Promise.all(data_filtred).then((results)=> {
						results.forEach(r=> {
							result = result.concat(result, r)
						});
						return result	
					}).then(result=> {
						var promise_result = process_promise_result(params_label, sharedParams, result)
						return promise_result
					})

					return promises_result			
				}
				//case when the workers return one promise of dataset
				else {
					await data_filtred.then(r=> result = r)
					var promise_result = await process_promise_result(params_label, sharedParams, result)
					return promise_result
				}

				function process_promise_result(params_label, sharedParams, result) {
					var time_receive_result = new Date() - sharedParams['time_workers_' + params_label.htmlNode]?.start
					if (time_receive_result) sharedParams['time_workers_' + params_label.htmlNode]["time_receive_result"] = time_receive_result

					//filter on the current chart results
					result = result.filter(c=> c.chart === params_label.transformations['filter_origin'])
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
							params_label.htmlNode_current_filter = filterList.map(o=> Object.values(o).join()).join("|")			
							params_label.history_data_filtred[params_label.htmlNode_current_filter] = {indexes: list_indexes} 
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
							var func_locator = sharedParams.params_labels.find(chart=> chart.chart_type === 'adressSearch')
							if (func_locator)  {dataset_filtred = func_locator.funcLib.restrict_dataset_to_radius(dataset_filtred, params_label)}
						}

						

						var time_process_result = new Date() - sharedParams['time_workers_' + params_label.htmlNode]?.start
						if (time_process_result) sharedParams['time_workers_' + params_label.htmlNode]["time_process_result"] = time_process_result						

						var dataset_grouped = params_label.funcLib['aggregate_data'](dataset_filtred)
						
						return dataset_grouped
					}
				}
			}
		}	
		




	}

	init_label(params_label, data) {
		
		var htmlNode = document.getElementById(params_label.htmlNode)

		//create the label box & add it to the document node
		var boxNode = document.createElement('div');
		boxNode.className = params_label.htmlNode + " card card-2"
		boxNode.id = "card_"+params_label.htmlNode
		htmlNode.appendChild(boxNode)

		//add styles to card
		//var card = document.querySelector(`.${params_label.htmlNode} card`)
		//var card = document.querySelector(`.card`)
		var card = document.getElementsByClassName(params_label.htmlNode)[0]
		card.style.background = "#fff";
		card.style.borderRadius = "4px";
		card.style.display = "grid";
		card.style.margin = "0rem";
		card.style.padding = "0.5rem";
		card.style.position = "relative";
		card.style['row-gap'] = '5px'
		card.style.justifyItems = 'center'

		
		card.style.boxShadow = "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)";

		//create the label title
		var label_title = document.createElement('div'); Object.assign(label_title.style, {display: 'flex', 'flex-direction': 'column', 'flex-gap': '2px;'})
		label_title.id = 'label_title_'+params_label.htmlNode
		boxNode.appendChild(label_title)

		
		
		//create the label structure 1
		var labelStructure_node = document.createElement('h1')
		labelStructure_node.className = 'ml14';
		labelStructure_node.id = 'labelStructure_node_'+params_label.htmlNode

		//add styles
			labelStructure_node.style.fontWeight = params_label.fontWeight;
			labelStructure_node.style.fontSize = params_label.fontSize_labels;
			labelStructure_node.style.margin = "0.25rem";
		





		//create the label structure 2 && add it to structure 1
		var labelTextWrapper_node = document.createElement('span')
		labelTextWrapper_node.className = 'text-wrapper'

		//styles
			labelTextWrapper_node.style.position = "relative";
			labelTextWrapper_node.style.display = "inline-block";
			labelTextWrapper_node.style.paddingTop = "0.1em";
			labelTextWrapper_node.style.paddingRight = "0.05em";
			labelTextWrapper_node.style.paddingBottom = "0.15em";
		
		labelStructure_node.appendChild(labelTextWrapper_node)





		//create the label sub structures  && add them to structure 2
		var labeLetters_node = document.createElement('span')
		labeLetters_node.className = 'letters'; labeLetters_node.id = params_label.htmlNode
		//styles
		labeLetters_node.style.display = "inline-block";
		labeLetters_node.style.lineHeight = "1em";
		labeLetters_node.style.width = "max-content"



		

		labelTextWrapper_node.appendChild(labeLetters_node)




		//create the label sub structures  && add them to structure 2
			var labeLine_node = document.createElement('span')
			labeLine_node.className = 'line';  

		//labeLine_node styles
			labeLine_node.style.opacity = "0";
			labeLine_node.style.position = "absolute";
			labeLine_node.style.left = "0";
			labeLine_node.style.height = "1px";
			labeLine_node.style.width = "100%";
			labeLine_node.style.backgroundColor = "#000000";
			labeLine_node.style.transformOrigin = "100% 100%";
			labeLine_node.style.bottom = "0";  

		labelTextWrapper_node.appendChild(labeLine_node)

		//add 
		boxNode.appendChild(labelStructure_node)


			//create the label unit (€ or m²)
			var labelUnit_node = document.createElement('span')
			labelUnit_node.id = 'labelUnit_node_'+params_label.htmlNode
			labelUnit_node.style = 'margin-top: -5px'
			boxNode.appendChild(labelUnit_node)
		}	

		
		  /*-----------------.ml14------------------*/
	displayText(params_label) {
			// Wrap every letter in a span
			//var textWrapper = document.querySelector('.ml14 .letters');

			//add the title
			//if (!params_label.title) return console.warn(`specify title for ${params_label.htmlNode} label`)

			var title_container = document.querySelector('#label_title_' + params_label.htmlNode)
			if (params_label.title.constructor == String) {
				var title_span = document.createElement('span')
				Object.assign(title_span, {innerText: params_label.title, style: 'display: flex; justify-content: center; color: #605f5f; text-align: center'})
				title_container.appendChild(title_span)
			}
			else if (params_label.title.constructor == Array) {
				params_label.title.forEach(title_part=> {
					var title_span = document.createElement('span')
					Object.assign(title_span, {innerText: title_part, style: 'display: flex; justify-content: center; color: #605f5f; text-align: center'})
					title_container.appendChild(title_span)
				})
			}
			
			//add the unit label
			var labelUnit_node = document.getElementById('labelUnit_node_'+params_label.htmlNode)
			if (params_label.unit) labelUnit_node.innerText = params_label.unit

			//add the value
			//var textWrapper = document.querySelector('#labelStructure_node_'+params_label.htmlNode);
			var target_node = document.getElementById("card_"+params_label.htmlNode)
			var textWrapper = target_node.querySelector('.ml14 .letters');
			textWrapper.innerText = params_label.value || 0
			textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");



			anime.timeline({loop: true})
			  .add({
			    targets: '.ml14 .line',
			    scaleX: [0,1],
			    opacity: [0.5,1],
			    easing: "easeInOutExpo",
			    duration: 1250
			  }).add({
			    targets: '.ml14 .letter',
			    opacity: [0,1],
			    translateX: [40,0],
			    translateZ: 0,
			    scaleX: [0.3, 1],
			    easing: "easeOutExpo",
			    duration: 1600,
			    offset: '-=600',
			    delay: (el, i) => 150 + 25 * i
			  }).add({
			    targets: '.ml14',
			    opacity: 0,
			    duration: 1200,
			    easing: "easeOutExpo",
			    delay: 10000000
			  });		
		}


		setup_funcLib(params_label) {
			params_label.funcLib = {}
			params_label.funcLib['aggregate_data'] = function aggregate_data(data_filtred) {
				var filter_object = {};
				//if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
				if (params_label.filtered_by && params_label.filtered_by.axis && Object.keys(params_label.filtered_by.axis).length > 0 ) {
					let result = 0
	
					if (params_label.transformations && params_label.transformations.custom_function) {
						var custom_function_text = params_label.transformations.custom_function
						var custom_function = new Function("dataset", custom_function_text);
						result = custom_function(data_filtred)
						if (!result) result=0
						params_label.updateLabels =true
						params_label.data_crossfiltred = true

						params_label.value = result
						return result
					}
					
					
					if (!params_label.numerical_field_params.selection && !params_label.numerical_field_params.agg_type) {                
						result = undefined
					}
					if (params_label.numerical_field_params.selection === "first") {                
						result = data_filtred[0][params_label.numerical_field_params.fieldName]
					}
					else if (params_label.numerical_field_params.selection === "last") {
						result = data_filtred[data_filtred.length-1][params_label.numerical_field_params.fieldName]
					}
					else if (params_label.numerical_field_params.agg_type === "sum") {result = d3.sum(data_filtred, f=> f[params_label.numerical_field_params.fieldName])}
					else if (params_label.numerical_field_params.agg_type === "median") {result = (d3.median(data_filtred, f=> f[params_label.numerical_field_params.fieldName]))?.toFixed(2)}
					else if (params_label.numerical_field_params.agg_type === "mean") {result = (d3.mean(data_filtred, f=> f[params_label.numerical_field_params.fieldName]))?.toFixed(2)}
					else if (params_label.numerical_field_params.agg_type === "count") {result = data_filtred.length}
	
					if (result) {
						params_label.updateLabels =true
						params_label.data_crossfiltred = true
						params_label.value = result
						return result
					}
					else {
						params_label.value = result
						return result
					}
				}
				else return params_label.value = 0 
			}			
		}

}
class Radar_chart {

	constructor(params_chart) {		
		this.id = params_chart.id
		this.ctx = params_chart.ctx
	    this.category_field = params_chart.category_field
	    this.numerical_field = params_chart.numerical_field
	    this.title_x_axis = params_chart.title_x_axis
	    this.title_y_axis = params_chart.title_y_axis
		this.type = params_chart.type
	    this.responsive = true
	    this.legend_position = params_chart.legend_position[0]
	    this.legend_title = params_chart.legend_title
	    this.legend_clicked = params_chart.legend_clicked
	    this.title = params_chart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0	    


	}


	createChart(params_chart, sharedParams, data_to_transform) {
		this.setup_funcLib(params_chart, sharedParams)
		

		var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		var chart_instance = this.init_chart(params_chart, sharedParams)



		params_chart.instanciator = this
		params_chart.chart_type = "chartJS"
		params_chart.chart_sub_type = "radar"
		
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

	}



	updateChart(params_chart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_chart, sharedParams)

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)

		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(params_chart.chart_instance, params_chart, data_type, injection_type)

	}



	setup_funcLib(params_chart, sharedParams) { 
		params_chart.funcLib['restore_chart_view'] = function(params_chart, sharedParams)	{
	        			
			sharedParams.restore_view(sharedParams)

		}
	}


	

	prepare_data_p1(params_chart, sharedParams, data_to_transform) {

	    var d1 = new Date();

	    //zone de filtrage
	    //filter the primary data source according to the scope of the vizualisation (limited geographic area, range of time, any specific observation)

	    //data source for the chart
	    if (sharedParams.filter_order_origin === "spatial query" && sharedParams.spatial_data && sharedParams.spatial_data.length > 0) {
			var data_chart = [...sharedParams.spatial_data]
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
					
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if (Object.keys(filterList).length > 0 || params_chart.to_filter === true) {
			var data_filtred = prepare_engage_crossfilter(data_chart, params_chart, filterList, data_chuncks, sharedParams)			
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
					//empty array
					if (result_length === 0) {return []}

					else if (result_length > 0) {

						//match the filtred indexes with the main dataset
						console.time('exec build subset crossfilter stacked_chart_instance')
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

						console.timeEnd('exec build subset crossfilter stacked_chart_instance')

						var dataset_grouped = groupData(dataset_filtred, params_chart)

						var time_process_result = new Date() - sharedParams['time_workers_' + params_chart.id].start
						sharedParams['time_workers_' + params_chart.id]["time_process_result"] = time_process_result

						//params_chart.data_promise = dataset_grouped
						return dataset_grouped
					}
				}
			}
		}






	    //zone de regroupements
	    //if one categorical axis, use this groupy method
	    function groupData(data_filtred, params_chart) {
		    var dataset_ChartJS = main_bin(data_filtred, params_chart)

		    
		    function round_values(dataset_ChartJS, agg_fieldName) {
		    	for (var d = 0; d < dataset_ChartJS.length; d++) {	        
		            dataset_ChartJS[d][agg_fieldName] = Math.round(dataset_ChartJS[d][agg_fieldName] * 100) / 100
		        };
		        return dataset_ChartJS
		    }

		    return dataset_ChartJS
		}

	}



	prepare_data_p2(data_input, params_chart, sharedParams) {
		//processus de création d'un nouveau dataset: 
		//params_chart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		//répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
			var categories, sous_categories

			if (params_chart.list_of_axis.length === 0) {
				params_chart.list_of_axis.push(this.category_field); params_chart.list_of_axis.push(this.sub_category_field)
			}
			params_chart.nb_axis = 2
			params_chart.legends_field = this.sub_category_field
			params_chart.active_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.active_legends[params_chart.legends_field] = [];
			params_chart.hidden_legends.hasOwnProperty(params_chart.legends_field) ? {} : params_chart.hidden_legends[params_chart.legends_field] = [];


			//if we have fields to decode
			if (params_chart.fields_to_decode) {
				//if the fields_to_decode is encapsulated into an array, put it into an object
				if (params_chart.fields_to_decode.constructor == Array ) {
					params_chart.fields_to_decode = params_chart.fields_to_decode[0]
				}
				if (params_chart.fields_to_decode.constructor == Object ) {
					//1.obtenir les catégories (les communes par ex)
					var lookupTable = params_chart.fields_to_decode.lookupTable;
					var mainKey = params_chart.fields_to_decode.mainKey;
					var lookupKey = params_chart.fields_to_decode.lookupKey
					var fields = params_chart.fields_to_decode.fields

					params_chart.fields_to_decode.fields.forEach(field=> {
							var res = []
							data_input.map(r=> {res.push(r.hasOwnProperty(field))})
							if (res.filter(r=> !r).length > 0) {
								join_v2(data_input, lookupTable, mainKey, lookupKey, fields)
								res = []
								//1.obtenir les catégories (les communes par ex)
								categories = deduplicate_dict(data_input, field)
								params_chart.data_input = data_input

							}
						}) 
				}
				var categories_source = deduplicate_dict(data_input, this.category_field)
			}
			else {
				//1.obtenir les catégories (les communes par ex)
				categories = deduplicate_dict(data_input, this.category_field)

			}					

			

			//2.obtenir les sous-catégories (la taille des logements par ex: 1p, 2p ...)
			var sous_categories = deduplicate_dict(data_input, this.sub_category_field); sous_categories.sort()
			var nb_categories = categories.length; var nb_sous_categories = sous_categories.length;
	        params_chart.nb_categories = categories.length;
	        params_chart.nb_sous_categories = sous_categories.length


			params_chart.data[0].labels.push(categories)
			params_chart.data_input = data_input



			var categories_original = data_input.map(r=> r[this.category_field])
			params_chart.activ_categories_values = []; params_chart.activ_categories_values.push(deduplicate_array(categories_original));
			params_chart.activ_sub_categories_values = []; params_chart.activ_sub_categories_values.push(sous_categories)
			var nb_categories = params_chart.data[0].labels[0].length


            //4.créer un array borderColor et borderWidth égal à nb_sous_categories
            var borderColorArray = []; 
            var borderWidthArray = [];            
            for (var i = 0; i < nb_categories; i++) {
            	borderColorArray.push('rgba(230, 11, 11, 0)');
            	borderWidthArray.push(1);

        	};



        	var backgroundColorArray = [];
        	if (Object.keys(params_chart.backgroundColorArray_source).length === 0) {
        		var i = 0
        		function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}

        		var status_colors = "empty";
        		var colored_axis = params_chart.sub_category_field;
        		if (sharedParams.used_color_schemes.hasOwnProperty(colored_axis) === true) {
	        		var backgroundColorArray_source = generateColors(nb_sous_categories, sharedParams.used_color_schemes[colored_axis], params_chart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					sous_categories.map(axis => {
						params_chart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        		else {
	        		var backgroundColorArray_source = generateColors(nb_sous_categories, params_chart.colorsConfig.scheme, params_chart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					sous_categories.map(axis => {
						params_chart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        	}



        
			//créer les datasets composés des sous_categories, du champ numérique à représenter, des couleurs des aires et leur bordure
			var backgroundColorArray = [];
	        for (var i = 0; i < nb_sous_categories; i++) {
	        	//1.recupérer la valeur de chaque sous-catégorie (1p, 2p ...)
	        	var sous_categorie = sous_categories[i]

	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	        	//2.1.filtrer le tableau d'entrée de la sous-catégorie    
	        	var dataset = data_input.filter((item)=> item[this.sub_category_field] === sous_categorie)
	            
	            //2.2.récupérer l'array contenant les data
	            var data_array = dataset.map(o=> o[params_chart.numerical_field_params.agg_fieldName])


	            //3.construie l'array contenant les couleurs des aires
	        	backgroundColorArray = [];
	            for (var a = 0; a < nb_categories; a++) {
	            	backgroundColorArray.push(params_chart.backgroundColorArray_source[sous_categories[i]])
	        	};


	            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
	            params_chart.data[1].datasets.push({label: sous_categorie, backgroundColor: backgroundColorArray.map(c=> c.replace("0.65", "0.2")), borderColor: backgroundColorArray.map(c=> c.replace("0.65", "0.95")), 
	            	pointBackgroundColor: backgroundColorArray.map(c=> c.replace("0.65", "0.95")), data: data_array})
	        };



			params_chart.list_idx_segments_existants = [];
			var list_idx_segments_existants = params_chart.list_idx_segments_existants
	        //1.collecter les clés de tous les segments existants
			for (var i = 0; i < (nb_categories); i++) {			

					for (var a = 0; a < (nb_sous_categories); a++) {
						list_idx_segments_existants.push(a + "-" + i)
					}
			}                       

			//.sauvegarder une image des données source avant transformation
			if (params_chart.data_source_raw.length === 0) {
				params_chart.data_source_raw = data_input
				params_chart.data_source[0].labels.push(categories)
		        params_chart.data_source[1].datasets = params_chart.data[1].datasets

		    }


	}



	init_chart(params_chart, sharedParams) {	


		var chart_instance = {
			type: 'radar',
			data: {labels: [], datasets: []},
			options: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: params_chart.title
				},
				scale: {
					ticks: {
						beginAtZero: true
					}
				}
			}
		};


		function add_grid_and_controls(params_chart, sharedParams) {
			//create a general container
				//1.get the parent node of the chart
				var parentElement = params_chart.ctx.parentElement

				var generalContainer = document.createElement('div'); generalContainer.id = "generalContainer_" + params_chart.id;
				generalContainer.style = 'display: grid; box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24); padding: 3%;'

			//create layer for the controls
				//create grid container
				var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: 30px; justify-items: center; margin-top: 0%'; controlsContainer.id = "controlsContainer_" + params_chart.id
				

				//create sub grids containers
				var grid_restore_view = document.createElement('div'); grid_restore_view.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_restore_view.id = "grid_restore_view_" + params_chart.id

			    //create control for restore view
			        const controlRestore = document.createElement('i'); controlRestore.className = "fa fa-undo"; controlRestore.ariaHidden = 'true'; controlRestore.id = "restore_pointer_" + params_chart.id
			        controlRestore.style = "font-size: 110%; margin-top: 8%"; controlRestore.title = 'Restore to initial view'
			        controlRestore.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.color = 'red'} )
			        controlRestore.addEventListener('mouseenter', (evt)=> {evt.target.style.color = 'red'; evt.target.style.cursor = "pointer"});
			        controlRestore.addEventListener('mouseemove', (evt)=> {evt.target.style.color = 'red'; evt.target.style.cursor = "pointer"});
			        controlRestore.addEventListener('mouseleave', (evt)=> {evt.target.style.color = ''});
			        grid_restore_view.append(controlRestore)
			        controlsContainer.append(grid_restore_view)

			        controlRestore.addEventListener("click", evt=> {
			        	params_chart.funcLib.restore_chart_view(params_chart, sharedParams)
			        })

			//append all the elements			
				generalContainer.append(controlsContainer);
				generalContainer.append(params_chart.ctx)
				parentElement.append(generalContainer);

				params_chart.ctx.style.justifySelf = 'center'

		}


		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(chart_instance, params_chart, data_type, injection_type)


		var check_chart_rendering = setInterval(()=>{
				var sum_margin=0; 
				Object.values(params_chart.chart_instance.chartArea).forEach(e=> sum_margin=sum_margin+e)
				var sum_heightWidth = params_chart.chart_instance.height + params_chart.chart_instance.width
				if (!isNaN(sum_margin) || sum_heightWidth > 0) {
					add_grid_and_controls(params_chart, sharedParams)
					clearInterval(check_chart_rendering);

				}
			}, 1000)


		return chart_instance
	}



	inject_metadata(chart_instance, params_chart, data_type, injection_type, updateTime) {
		//alimenter avec les labels
		if (chart_instance.config.data.labels.length === 0) {
			chart_instance.config.data.labels = [...params_chart[data_type][0].labels[0]]
		}


		//alimenter avec les datasets
		if (injection_type === "init") {
			var l = params_chart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_chart[data_type][1].datasets[i])
				chart_instance.config.data.datasets[i] = _.cloneDeep(datasets[i])
			}
			chart_instance.config.data.datasets = _.cloneDeep(datasets)
		}
		else if (injection_type === "update") {
			var l = params_chart[data_type][1].datasets.length;
			var datasets = [];
			for (var i = 0; i < l; i++) {
				datasets.push(params_chart[data_type][1].datasets[i])
				chart_instance.config.data.datasets[i].data = _.cloneDeep(datasets[i].data)
				chart_instance.config.data.datasets[i].label = _.cloneDeep(datasets[i].label)
				chart_instance.config.data.datasets[i].backgroundColor = _.cloneDeep(datasets[i].backgroundColor)
				chart_instance.config.data.datasets[i].borderColor = _.cloneDeep(datasets[i].borderColor)				
				chart_instance.config.data.datasets[i].pointBackgroundColor = _.cloneDeep(datasets[i].pointBackgroundColor)
			}

		}

		if (updateTime === undefined) {updateTime = 750}
		chart_instance.update(updateTime)


		
		//register the chart instance in the param array
		params_chart.chart_instance = chart_instance


		return chart_instance
	}

}	
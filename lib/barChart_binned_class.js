class barChart_binned {

	constructor(params_barChart) {		
		this.id = params_barChart.id
		this.ctx = params_barChart.ctx
	    this.category_field = params_barChart.category_field
	    this.numerical_field = params_barChart.numerical_field
	    this.title_x_axis = params_barChart.title_x_axis
	    this.title_y_axis = params_barChart.title_y_axis
		this.type = params_barChart.type
	    this.responsive = true
	    this.legend_position = params_barChart.legend_position[0]
	    this.legend_title = params_barChart.legend_title
	    this.legend_clicked = params_barChart.legend_clicked
	    this.title = params_barChart.title
	    this.list_segments_selected = []
	    this.nb_categories = 0	    


	}


	createChart(params_barChart, sharedParams, data_to_transform) {
		this.setup_funcLib(params_barChart, sharedParams)

		params_barChart.adapt_to_binMode();

		var data_filtred = this.prepare_data_p1(params_barChart, sharedParams, data_to_transform)

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		//if (params_barChart.instanciator === undefined) {
			var chart_instance = this.init_chart(params_barChart, sharedParams)
		//}
		
		if (params_barChart.interactions_chart_options.hoverOptions === true) {
			this.add_options_hover(chart_instance, params_barChart) }
		if (params_barChart.interactions_chart_options.selectionOptions === true) {
			this.addListeners(params_barChart.ctx, chart_instance, params_barChart, sharedParams) }



		params_barChart.instanciator = this
		params_barChart.chart_type = "chartJS"
		params_barChart.chart_sub_type = "bar"
		
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_barChart) === false) {
			sharedParams.params_charts.push(params_barChart)
		}

		//create the progress spinner
		//create_progress_spinner(params_barChart)		
	}



	updateChart(params_barChart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_barChart, sharedParams)

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(params_barChart.chart_instance, params_barChart, data_type, injection_type)

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

	    //data source for the bar chart
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
						console.time('exec build subset crossfilter stacked_barChart')
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

						console.timeEnd('exec build subset crossfilter stacked_barChart')

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



	prepare_data_p2(data_input, params_barChart, sharedParams) {
		//processus de création d'un nouveau dataset: 
		//params_barChart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		//répeter l'opération autant de fois qu'il y a de sous-catégories (nb_categories)

			const category_field_source = params_barChart.category_field.replace('_binned', "")
			if (params_barChart.list_of_axis.length === 0) {
				params_barChart.list_of_axis.push(this.category_field);
			}
			params_barChart.nb_axis = 1;
			
			
			//1.obtenir les catégories (les communes par ex)
			var categories = deduplicate_dict(data_input, this.category_field); //categories.sort()
			var nb_categories = categories.length; 
	        params_barChart.nb_categories = categories.length;
	        

			//3.création des catégories dans la spec ChartJS (champ labels dans chartJS)
			params_barChart.data[0].labels.push(categories)

			var nb_categories = params_barChart.data[0].labels[0].length


            //4.créer un array borderColor et borderWidth égal à nb_categories
            var borderColorArray = []; 
            var borderWidthArray = [];            
            for (var i = 0; i < nb_categories; i++) {
            	borderColorArray.push('rgba(230, 11, 11, 0)');
            	borderWidthArray.push(1);

        	};


        	var backgroundColorArray = [];
        	if (Object.keys(params_barChart.backgroundColorArray_source).length === 0) {
        		var i = 0
        		function select_generated_color(backgroundColorArray_source, i) { return backgroundColorArray_source[i]}

        		var status_colors = "empty";
        		var colored_axis = category_field_source;
        		if (sharedParams.used_color_schemes.hasOwnProperty(colored_axis) === true) {
	        		var backgroundColorArray_source = generateColors(nb_categories, sharedParams.used_color_schemes[colored_axis], params_barChart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					categories.map(axis => {
						params_barChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        		else {
	        		var backgroundColorArray_source = generateColors(nb_categories, params_barChart.colorsConfig.scheme, params_barChart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					categories.map(axis => {
						params_barChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        	}



			//créer les datasets composés des categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			var data_array = []; var backgroundColorArray = []; var color	
	        for (var i = 0; i < nb_categories; i++) {

	        	var category = data_input[i][category_field_source]
	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	            //2.2.récupérer l'array contenant les data	            
	            data_array.push(data_input[i][params_barChart.bin_params.agg_type]);

	            //3.construie l'array contenant les couleurs des barres	            
	            params_barChart.colorsConfig.monochrome ? color = Object.values(params_barChart.backgroundColorArray_source)[0] : color = params_barChart.backgroundColorArray_source[category]
		        backgroundColorArray.push(color)

	        };


			//if the chart is already clicked, preserve the deactivated slices and maintain they color effect (rgba(194, 194, 194, 1) or lower opacity)
            if (params_barChart.prepare_data_type === "preserve backgroundColor" && params_barChart.active_slices.length > 0) {

            	//find the pos of the active slices in the data input
            	var pos_active_category_field = []
            	params_barChart.active_slices[0].category.forEach(category_value=> {
            		pos_active_category_field.push(data_input.findIndex(d=> d.surface === category_value))
            	})

            	//build an array of grey bckg colors
            	var backgroundColorArray = _.repeat('rgba(240, 240, 240, 0.5);', nb_categories).split(";").filter(b=> b !== "");

            	//give the right color to the active slices
            	pos_active_category_field.forEach(i=> {backgroundColorArray[i] = params_barChart.active_slices[0].backgroundColor})

            }



            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
            params_barChart.data[1].datasets.push({label: params_barChart.label_tooltip, backgroundColor: backgroundColorArray, borderWidth: borderWidthArray, 
            	borderColor: borderColorArray, data: data_array})



   			if (params_barChart.list_idx_segments_existants.length === 0) {
				params_barChart.list_idx_segments_existants = [];
				var list_idx_segments_existants = params_barChart.list_idx_segments_existants
		        //1.collecter les clés de tous les segments existants
				for (var i = 0; i < (nb_categories); i++) {			

						for (var a = 0; a < (nb_categories); a++) {
							list_idx_segments_existants.push(a + "-" + i)
						}
				}
			}

			//.sauvegarder une image des données source avant transformation
			if (params_barChart.data_source_raw.length === 0) {
				params_barChart.data_source_raw = data_input
				params_barChart.data_source[0].labels.push(categories)
		        params_barChart.data_source[1].datasets = params_barChart.data[1].datasets

		    }


	}


	init_chart(params_barChart, sharedParams) {	
		

		var barChart = new Chart(this.ctx, {
				        type: this.type,
				        data: [],
				        options: {
				            responsive: this.responsive,		
				            title: this.title,
			                scales: {
			                    yAxes: [{
			                        ticks: {
			                            beginAtZero: true
			                        }
			                    ,scaleLabel: {
							        display: true,
							        labelString: this.title_y_axis
							      },
							        stacked: true
							     }],

			                    xAxes: [{
			                     scaleLabel: {
							        display: true,
							        labelString: this.title_x_axis
							      },
							     stacked: true
							     }]

			                },
			                
			                animation: {
			                        duration: 1000,
			                        easing: 'easeOutQuad'
			                },
		                    legend: {
		                          display: false
		                          }
				        }
				      });


		//create a general container
			//1.get the parent node of the chart
			var parentElement = params_barChart.ctx.parentElement

			var generalContainer = document.createElement('div'); generalContainer.id = "generalContainer_" + params_barChart.id;
			generalContainer.style = 'display: grid; box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24); padding: 3%;'

		//create layer for the controls
			//create grid container
			var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: 30px; justify-items: center; margin-top: 0%'; controlsContainer.id = "controlsContainer_" + params_barChart.id
			

			//create sub grids containers
			var grid_restore_view = document.createElement('div'); grid_restore_view.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_restore_view.id = "grid_restore_view_" + params_barChart.id

		    //create control for restore view
		        const controlRestore = document.createElement('i'); controlRestore.className = "fa fa-undo"; controlRestore.ariaHidden = 'true'; controlRestore.id = "restore_pointer_" + params_barChart.id
		        controlRestore.style = "font-size: 110%; margin-top: 8%"; controlRestore.title = 'Restore to initial view'
		        controlRestore.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.color = 'red'} )
		        controlRestore.addEventListener('mouseenter', (evt)=> {evt.target.style.color = 'red'; evt.target.style.cursor = "pointer"});
		        controlRestore.addEventListener('mouseemove', (evt)=> {evt.target.style.color = 'red'; evt.target.style.cursor = "pointer"});
		        controlRestore.addEventListener('mouseleave', (evt)=> {evt.target.style.color = ''});
		        grid_restore_view.append(controlRestore)
		        controlsContainer.append(grid_restore_view)

		        controlRestore.addEventListener("click", evt=> {
		        	params_barChart.funcLib.restore_chart_view(params_barChart, sharedParams)
		        })

		//append all the elements			
			generalContainer.append(controlsContainer);
			generalContainer.append(params_barChart.ctx)
			parentElement.append(generalContainer);

			params_barChart.ctx.style.justifySelf = 'center'


		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(barChart, params_barChart, data_type, injection_type)

		return barChart 				
	}

	selections_listeners(params_barChart) {
/*		var t = 2
		singleSelect.params_barChart.list_labels_segment_single_selected.length = t; // console: 'hello_world set to test'
*/
	}
	

	inject_metadata(barChart, params_barChart, data_type, injection_type, updateTime) {
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

		}

		if (updateTime === undefined) {updateTime = 750}
		barChart.update(updateTime)


		//procedure manuelle pour remmetre les couleurs source
		/*bar1.config.data.datasets[2].backgroundColor = _.cloneDeep(params_bar1_deepCopy.data[1].datasets[2].backgroundColor)*/

		//register the chart instance in the param array
		params_barChart.chart_instance = barChart


		return barChart
	}



	maj_couleurs(barChart, params_barChart) {
		//on entre dans cette func pour enlever le focus posé sur les segments

		var nb_categories = params_barChart.nb_categories;
		var backgroundColorArray = [];

		if (params_barChart.colorsConfig.monochrome) {
			var color = Object.values(params_barChart.backgroundColorArray_source)[0] + "|";
			backgroundColorArray = color.repeat(params_barChart.nb_categories).split('|').filter(e=> e!=="")
			barChart.data.datasets[0].backgroundColor = backgroundColorArray
			barChart.update();
		}

		//parcours catégories
		// for (var i = 0; i < nb_categories; i++) {		
			
		// 	//parcours sous-catégories
		// 	// var nb_categories = params_barChart.nb_categories;
		// 	// for (var a = 0; a < nb_categories; a++) {
	
		// 	// 	var backgroundColor = params_barChart.data_source[1].datasets[a].backgroundColor[i];
	
		// 	// 	barChart.config.data.datasets[a].backgroundColor[i] = backgroundColor;
	
		// 	// }


		// 	else {

		// 		color = params_barChart.backgroundColorArray_source[category] 
				
		// 	}
		// 	barChart.data.datasets.filter(l=> l.label !== "").map(l=> l.backgroundColor = params_barChart.backgroundColorArray_source[l.label])//.replace("0.65", "1")
		// 	barChart.update();



		// }
	}	

	reset_border_color(this_chart, params_barChart_deepCopy) {
		/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_barChart_deepCopy);*/

		//remettre config sans bordures
		var nb_categories = params_barChart_deepCopy.nb_categories;

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {
			this_chart.config.data.datasets[0].borderColor[i] = "rgba(230, 11, 11, 0)";			
		}

		this_chart.update();
	}







	add_options_hover(this_chart, params_barChart_deepCopy) {
			var activePoints
			this_chart.config.options.hover = {
	                onHover: function(e) {
	                     var point = this_chart.getElementAtEvent(e);
	                     if (point.length) {
	                        //transformer curseur en pointeur
	                     	e.target.style.cursor = 'pointer'; 

	                     	//effacer les bordures précédantes
	                     	this_chart.update();

	                        //si survol d'un segment, mettre bordure rouge sur élément survolé
	                        activePoints = this_chart.getElementAtEvent(e);                        
	                        if (activePoints[0]) {
	                            //relever l'index de l'élément survolé                    
	                            var idx = activePoints[0]['_index'];
								var datasetIdx = activePoints[0]['_datasetIndex'];

								//collecter la couleur du segment
								var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
								
								//augmenter l'opacité de la bordure
								activePoints[0]._model.borderColor = "rgba(230, 11, 11, 1)";
								params_barChart_deepCopy.border_activated = true
								
								//augmenter l'opacité du segment
								activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")
								activePoints[0]._model.backgroundColor = activePoint_backgroundColor;

								var datasetLabel = activePoints[0]._model.datasetLabel;
								var label = activePoints[0]._model.label;

								//test désactivation couleurs segments non selectionnés
								

	                        }

	                     }
	                     else {
	                     	e.target.style.cursor = 'default';

	                     	if (params_barChart_deepCopy.border_activated === true) {
								params_barChart_deepCopy.instanciator.reset_border_color(this_chart, params_barChart_deepCopy)
								params_barChart_deepCopy.border_activated = false
							}

	                     }
	                }
		}
	}	


	addListeners(ctx, this_chart, params_barChart_deepCopy, sharedParams) {

            //gestion de la bordure en zone blanche
            ctx.addEventListener("mouseover", function(evt){


            });






            //collecter le segment cliqué
            ctx.addEventListener("click", function(evt){
                var activePoints = this_chart.getElementAtEvent(evt);

                if (evt.ctrlKey) {
                	return
                }

                if (activePoints[0]) {

                	try {
	                    var idx = activePoints[0]['_index'];
						var datasetIdx = activePoints[0]['_datasetIndex'];
						var key_composite = datasetIdx + "-" + idx

						var categorie = activePoints[0]._model.label;
		


						//if clic on the same slice, clean the lists
						if (params_barChart_deepCopy.list_idx_segment_single_selected.includes(key_composite)) {
							return
						}



						sharedParams.filter_order_origin = "barChart_binned"
						
						var category_field = params_barChart_deepCopy.category_field;
						

						params_barChart_deepCopy.list_labels_segment_single_selected = [{category_field: [categorie]}];
						params_barChart_deepCopy.list_keys_values_segment_single_selected = [{[category_field] : [categorie]}];



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


	                }    
                }        

            });


            //gestion d'un clic unique sur un segment (pour désactiver les couleurs des segments non selectionnés)
            ctx.onclick = function(evt) {
            	
				if (evt.ctrlKey) {
                	return
                }

                var activePoints = this_chart.getElementAtEvent(evt);
                //si le clic est fait sur un des segments
                if (activePoints[0]) {
                	//1.remettre les couleurs d'origine sur tous les segments
	                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);

                    var idx = activePoints[0]['_index'];
					var datasetIdx = activePoints[0]['_datasetIndex'];
					var key_composite = datasetIdx + "-" + idx


					//if clic on the same slice, quit
					if (params_barChart_deepCopy.list_idx_segment_single_selected.includes(idx)) {
						params_barChart_deepCopy.list_idx_segment_single_selected = [];
						params_barChart_deepCopy.active_slices = [];	                    
						params_barChart_deepCopy.list_idx_segment_single_selected = [];
						params_barChart_deepCopy.list_labels_segment_single_selected = [];
						params_barChart_deepCopy.list_idx_segments_multiples_selected = [];
						params_barChart_deepCopy.list_labels_segments_multiples_selected = [];
						params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
						params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
						params_barChart_deepCopy.active_slices = []
						

						return
					}

					var categorie = activePoints[0]._model.label;
					var nb_categories = params_barChart_deepCopy.nb_categories;


                    //collect color of the slice
					var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
					//augmenter l'opacité du segment
					activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")						


					////il faut annuler le segment unique sélectionné lors sur dernier clic										
                    params_barChart_deepCopy.list_idx_segment_single_selected = [idx];

					var category = activePoints[0]._model.label;
					params_barChart_deepCopy.active_slices = [{idx: [idx], category: [category], backgroundColor: activePoint_backgroundColor}]




					
					/*console.log("idx: " + idx); console.log("datasetIdx: " + datasetIdx); console.log("id dataset: + key_composite")*/
                    var chartData = activePoints[0]['_chart'].config.data;                



                    //collect background color of active point
                	var activBckgColor = this_chart.data.datasets[datasetIdx].backgroundColor[idx]

                	//set grey color for all the slices
                	this_chart.data.datasets[datasetIdx].backgroundColor = _.repeat('rgba(240, 240, 240, 0.5);', nb_categories).split(";").filter(b=> b !== "");

                	this_chart.data.datasets[datasetIdx].backgroundColor[idx] = activBckgColor.replace("0.65", "1");                	
                	this_chart.update()

                }

                //remettre les couleurs d'origine lors d'un clic à l'extérieur des barres
                else {

                    params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy)
					//vider liste des segments selectionnés
					params_barChart_deepCopy.list_idx_segment_single_selected = [];
					params_barChart_deepCopy.list_labels_segment_single_selected = [];
					params_barChart_deepCopy.list_idx_segments_multiples_selected = [];
					params_barChart_deepCopy.list_labels_segments_multiples_selected = [];
					params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
					params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
					params_barChart_deepCopy.active_slices = []
					

                }
            }





            //rés-activer les couleurs de tous les segments
            ctx.ondblclick = function(evt) {
    			//params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy)

				// //vider liste des segments selectionnés
				// params_barChart_deepCopy.list_idx_segment_single_selected = [];
				// params_barChart_deepCopy.list_labels_segment_single_selected = [];
				// params_barChart_deepCopy.list_idx_segments_multiples_selected = [];
				// params_barChart_deepCopy.list_labels_segments_multiples_selected = [];
				// params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
				// params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
				// params_barChart_deepCopy.active_slices = []
				//observableSlim
				/*p.changeBar1 = false;*/

            };
            





	      //gestion d'un clic + shift sur plusiers segments (pour désactiver les couleurs des segments non selectionnés)
	      ctx.addEventListener("click",
	        function(e) {
	            if (e.ctrlKey) {
	                    
	                	//1.remettre les couleurs d'origine sur tous les segments
		                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);

	                    var activePoints = this_chart.getElementAtEvent(e);
	                    var idx = activePoints[0]['_index'];
						
						
						
						var categorie = activePoints[0]._model.label;
						

						var category_field = params_barChart_deepCopy.category_field;
						
						//collect the backgroundcolor of the slice
						var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
						//augmenter l'opacité du segment
						activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")

						var list_idx_segments_existants = params_barChart_deepCopy.list_idx_segments_existants


						//refresh the lists fed by clic+shift
						//1.if the slice selected is not in the current lists, push it
						var pos_slice = params_barChart_deepCopy.list_idx_segments_multiples_selected.indexOf(idx);
						if (pos_slice === -1) {
							if (params_barChart_deepCopy.list_idx_segment_single_selected[0]) {
								params_barChart_deepCopy.list_idx_segments_multiples_selected.push(params_barChart_deepCopy.list_idx_segment_single_selected[0]);
							}
		                    params_barChart_deepCopy.list_idx_segments_multiples_selected.push(idx);		                    

							//restore cat field values
							var categories = [], activePoint_backgroundColors = [], indexes = [];
							params_barChart_deepCopy.active_slices.length > 0 ? categories = params_barChart_deepCopy.active_slices[0].category : {};
							var evaluate = categories.constructor == Array
							if (!evaluate) {
								categories = [categories]};


							//restore indexes
							params_barChart_deepCopy.active_slices.length > 0 ? indexes = params_barChart_deepCopy.active_slices[0].idx : {};
							evaluate = indexes.constructor == Array
							if (!evaluate) {
								indexes = [indexes]};


							//restore background colors
							params_barChart_deepCopy.active_slices.length > 0 ? activePoint_backgroundColors = params_barChart_deepCopy.active_slices[0].backgroundColor : {};
							evaluate = activePoint_backgroundColors.constructor == Array
							if (!evaluate) {
								activePoint_backgroundColors = [activePoint_backgroundColors]};

							//add new cat & sub_cat value
							categories = deduplicate_array(categories); activePoint_backgroundColors = deduplicate_array(activePoint_backgroundColors); indexes = deduplicate_array(indexes);
							categories.push(categorie); activePoint_backgroundColors.push(activePoint_backgroundColor); indexes.push(idx)
							params_barChart_deepCopy.list_labels_segments_multiples_selected = [{category_field: categories}];
							params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [{[category_field]: categories}];
							params_barChart_deepCopy.active_slices = [{idx: indexes, category: categories, backgroundColor: activePoint_backgroundColors}];
							

						}
						//2.delete selected slice from the diffent arrays
						else {
							params_barChart_deepCopy.list_idx_segments_multiples_selected.splice(pos_slice, 1)

							var index_cat = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.findIndex(x => x === categorie);
							params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.splice(index_cat, 1)

							//params_barChart_deepCopy.list_keys_values_segments_multiples_selected[0][params_bar1_deepCopy.category_field].splice(index_cat, 1)

							
							//params_barChart_deepCopy.active_slices[0].category.splice(index_cat, 1)
							params_barChart_deepCopy.active_slices[0].backgroundColor.splice(index_cat, 1)
							params_barChart_deepCopy.active_slices[0].idx.splice(index_cat, 1)
						}


						//vider les listes alimentées par un clic unique
						params_barChart_deepCopy.list_idx_segment_single_selected = []; params_barChart_deepCopy.list_labels_segment_single_selected = [];
						params_barChart_deepCopy.id_previous_singleSelect = ""


	                    //observableSlim
	                    /*p.changeBar1 = false;*/
	                    var chartData = activePoints[0]['_chart'].config.data;
	             

	                    //update colors
	                    var nb_categories = params_barChart_deepCopy.nb_categories;


		            	//find the pos of the active slices in the data input
		            	// var pos_active_category_field = []
		            	// params_barChart.active_slices[0].category.forEach(category_value=> {
		            	// 	pos_active_category_field.push(data_input.findIndex(d=> d.surface === category_value))
		            	// })

		            	//if there is at least one active slice selected, make grey colors
			            if (params_barChart_deepCopy.list_keys_values_segments_multiples_selected.length > 0) {
			            	//build an array of grey bckg colors
			            	var backgroundColorArray = _.repeat('rgba(240, 240, 240, 0.5);', nb_categories).split(";").filter(b=> b !== "");

			            	//give the right color to the active slices
			            	params_barChart_deepCopy.active_slices[0].idx.forEach(i=> {backgroundColorArray[i] = params_barChart_deepCopy.active_slices[0].backgroundColor[0]})
			            	params_barChart_deepCopy.chart_instance.data.datasets[0].backgroundColor = backgroundColorArray
			            }
			            else {
			            	params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);
			            }

						this_chart.update();


				
	            }

	                /*}*/
	        },false)
	}
}




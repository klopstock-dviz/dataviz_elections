class grouped_barChart {

	constructor(params_barChart) {		
		this.id = params_barChart.id
		this.ctx = params_barChart.ctx
	    this.category_field = params_barChart.category_field
	    this.sub_category_field = params_barChart.sub_category_field
	    this.numerical_field = params_barChart.numerical_field
	    this.title_x_axis = params_barChart.title_x_axis
	    this.title_y_axis = params_barChart.title_y_axis
		this.type = params_barChart.type
	    this.responsive = true	    
	    this.legend_title = params_barChart.legend.title
	    this.legend_clicked = params_barChart.legend_clicked
	    this.title = params_barChart.title[0]
	    this.list_segments_selected = []
	    this.nb_categories = 0
	    this.nb_sous_categories = 0


	}

	createChart(params_barChart, sharedParams, data_to_transform) {
		//add params chart to shared params if no present
		if (sharedParams.params_charts.includes(params_barChart) === false) {
			sharedParams.params_charts.push(params_barChart)
		}

		this.setup_funcLib(params_barChart, sharedParams)

		var data_filtred = this.prepare_data_p1(params_barChart, sharedParams, data_to_transform)

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		//if (params_barChart.instanciator === undefined) {
			var chart_instance = this.init_chart(params_barChart, sharedParams)
		//}

		if (params_barChart.interactions_chart_options.hoverOptions === true) {
			this.add_options_hover(chart_instance, params_barChart) }
		if (params_barChart.interactions_chart_options.selectionOptions === true) {
			this.addListeners(params_barChart.ctx, chart_instance, params_barChart) }



		params_barChart.instanciator = this
		params_barChart.chart_type = "chartJS"
		params_barChart.chart_sub_type = "bar"
		

	}


	setup_funcLib(params_chart, sharedParams) { 
		params_chart.funcLib['restore_chart_view'] = function(params_chart, sharedParams)	{
	        			
			sharedParams.restore_view(sharedParams)

		};

		params_chart.funcLib['create_figure_number'] = function(params_chart, sharedParams) {
			params_chart.figure_auto = sharedParams.params_charts.length
		}

		params_chart.funcLib.create_figure_number(params_chart, sharedParams)

	}


	updateChart(params_barChart, sharedParams) {
		var data_filtred = this.prepare_data_p1(params_barChart, sharedParams)

		this.prepare_data_p2(data_filtred, params_barChart, sharedParams)

		var data_type = "data"; var injection_type = "init"
		this.inject_metadata(params_barChart.chart_instance, params_barChart, data_type, injection_type)

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
	    else if (params_chart.transformations.dataset && params_chart.transformations.dataset.length>0 ) {
			//case when dataset is row oriented
			//if (!params_chart.transformations.dataset_orientation || params_chart.transformations.dataset_orientation==='row') {
				if (!params_chart.transformations['dataset_ready'] && !params_chart.transformations.filter) {
					params_chart.transformations['dataset_ready'] = [...params_chart.transformations.dataset]
					var data_chart = [...params_chart.transformations.dataset]
				}
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
			else if (params_chart.transformations.dataset_orientation==='column') {
				
			//}
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
		        var dataset_grouped = _.map(groupedItem, (group, key) => {
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






	prepare_data_p2(data_input, params_barChart, sharedParams) {
		//processus de création d'un nouveau dataset: 
		//params_barChart.data[1].datasets.push({"label":0, backgroundColor: 'red', data: [39889, 19889, 14889]})
		//répeter l'opération autant de fois qu'il y a de sous-catégories (nb_sous_categories)
			let categories, sous_categories, categories_source, sous_categories_source

			if (params_barChart.list_of_axis.length === 0) {
				params_barChart.list_of_axis.push(this.category_field); params_barChart.list_of_axis.push(this.sub_category_field)
			}
			params_barChart.nb_axis = 2
			params_barChart.legends_field = this.sub_category_field;
			params_barChart.fields_to_decode.sub_category_field ? params_barChart.fields_to_decode['legends_field'] = params_barChart.fields_to_decode.sub_category_field : {}
			params_barChart.active_legends.hasOwnProperty(params_barChart.legends_field) ? {} : params_barChart.active_legends[params_barChart.legends_field] = [];
			params_barChart.hidden_legends.hasOwnProperty(params_barChart.legends_field) ? {} : params_barChart.hidden_legends[params_barChart.legends_field] = [];


			//if we have fields to decode
			if (params_barChart.fields_to_decode) {
				//1.get the categories
				if (params_barChart.fields_to_decode.category_field) {
					var lookupTable = params_barChart.fields_to_decode.category_field.lookupTable, mainKey = params_barChart.fields_to_decode.category_field.mainKey;
					var lookupKey = params_barChart.fields_to_decode.category_field.lookupKey, target_field = params_barChart.fields_to_decode.category_field.target_field;
					categories = decode_fields(lookupTable, mainKey, lookupKey, target_field);
					categories_source = deduplicate_dict(params_barChart.data_input, this.category_field)
					this.category_field = target_field
				}
				else {
					categories = deduplicate_dict(data_input, this.category_field); categories_source = categories
				}

				//2.get the sub categories
				if (params_barChart.fields_to_decode.sub_category_field) {
					var lookupTable = params_barChart.fields_to_decode.sub_category_field.lookupTable, mainKey = params_barChart.fields_to_decode.sub_category_field.mainKey;
					var lookupKey = params_barChart.fields_to_decode.sub_category_field.lookupKey, target_field = params_barChart.fields_to_decode.sub_category_field.target_field;
					sous_categories = decode_fields(lookupTable, mainKey, lookupKey, target_field);
					sous_categories_source = deduplicate_dict(params_barChart.data_input, this.sub_category_field)
					this.sub_category_field = target_field
				}
				else {
					sous_categories = deduplicate_dict(data_input, this.sub_category_field); sous_categories.sort(); sous_categories_source = sous_categories	
				}
			}
			else {
				//1.obtenir les catégories (les communes par ex)
				categories = deduplicate_dict(data_input, this.category_field); categories_source = categories
				sous_categories = deduplicate_dict(data_input, this.sub_category_field); sous_categories.sort(); sous_categories_source = sous_categories
				
				params_barChart.data_input = data_input

			}					


			function decode_fields(lookupTable, mainKey, lookupKey, target_field) {				
				var res = []
				data_input.map(r=> {res.push(r.hasOwnProperty(target_field))})
				if (res.filter(r=> !r).length > 0) {
					join_v2(data_input, lookupTable, mainKey, lookupKey, [target_field])
					res = []
					//1.obtenir les catégories (les communes par ex)
					var categories = deduplicate_dict(data_input, target_field)
					params_barChart.data_input = data_input
					return categories
				}
		
			}

			

			//2.obtenir les sous-catégories (la taille des logements par ex: 1p, 2p ...)
			
			var nb_categories = categories.length; var nb_sous_categories = sous_categories.length;
	        params_barChart.nb_categories = categories.length;
	        params_barChart.nb_sous_categories = sous_categories.length


			params_barChart.data[0].labels.push(categories)
			



			var categories_original = data_input.map(r=> r[this.category_field])
			params_barChart.activ_categories_values = []; params_barChart.activ_categories_values.push(deduplicate_array(categories_original));
			params_barChart.activ_sub_categories_values = []; params_barChart.activ_sub_categories_values.push(sous_categories)
			var nb_categories = params_barChart.data[0].labels[0].length


            //4.créer un array borderColor et borderWidth égal à nb_sous_categories
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
        		var colored_axis = params_barChart.sub_category_field;
        		if (sharedParams.used_color_schemes.hasOwnProperty(colored_axis) === true) {
	        		var backgroundColorArray_source = generateColors(nb_sous_categories, sharedParams.used_color_schemes[colored_axis], params_barChart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					sous_categories.map(axis => {
						params_barChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        		else {
	        		var backgroundColorArray_source = generateColors(nb_sous_categories, params_barChart.colorsConfig.scheme, params_barChart.colorsConfig.colorsOrder, colored_axis, sharedParams)
					sous_categories.map(axis => {
						params_barChart.backgroundColorArray_source[axis] = select_generated_color(backgroundColorArray_source, i); 
						i++
						} )
        		}
        	}



			//guide création des sous-catégories dans la spec ChartJS
			//params_barChart.data[1].datasets.push({"label":data_group[i]['nb_pieces'], backgroundColor: 'red', data: [39889, 19889, 14889]})
	        
			//créer les datasets composés des sous_categories, du champ numérique à représenter, des couleurs des barres et leur bordure
			var backgroundColorArray = [];
	        for (var i = 0; i < nb_sous_categories; i++) {
	        	//1.recupérer la valeur de chaque sous-catégorie (1p, 2p ...)
	        	var sous_categorie = sous_categories[i]

	        	//2.récupérer l'array contenant les data associées à la sous-catégorie
	        	//2.1.filtrer le tableau d'entrée de la sous-catégorie    
	        	var dataset = data_input.filter((item)=> item[this.sub_category_field] === sous_categorie)
	            
	            //2.2.récupérer l'array contenant les data
	            var data_array = dataset.map(o=> o[params_barChart.numerical_field_params.agg_fieldName])


	            //3.construie l'array contenant les couleurs des barres
	        	//if preserve colors is turned on, populate first with grey bckg color
	        	backgroundColorArray = [];
	        	if (params_barChart.prepare_data_type === "preserve backgroundColor") {
		            for (var a = 0; a < nb_categories; a++) {
		        		backgroundColorArray.push('rgba(240, 240, 240, 0.5)')
					}
	        	}
	        	//else pick the colors from the central repository	        	
	            else {
		            for (var a = 0; a < nb_categories; a++) {
		            	backgroundColorArray.push(params_barChart.backgroundColorArray_source[sous_categories[i]])
		        	};
	        	}

	            //4.création des sous-catégories (champ label), data associée (champ data dans ChartJS) et couleurs et bordures dans la spec ChartJS 
	            params_barChart.data[1].datasets.push({label: sous_categorie, backgroundColor: backgroundColorArray, borderWidth: borderWidthArray, 
	            	borderColor: borderColorArray, data: data_array})

	        };


			//if the chart is already clicked, preserve the deactivated slices and maintain their color effect (grey or lower opacity)            
			if (params_barChart.prepare_data_type === "preserve backgroundColor") {

				var active_slices_category_fields = [];
				params_barChart.active_slices_v0.forEach((d)=>{active_slices_category_fields.push(d.category_field)})
				//active_slices_category_fields = deduplicate_array(active_slices_category_fields)
				//var active_slices_sub_category_fields = deduplicate_dict(params_barChart_deepCopy.active_slices, "sub_category_field");
				var active_slices_sub_category_fields = [];
				params_barChart.active_slices_v0.forEach((d)=>{active_slices_sub_category_fields.push(d.sub_category_field)})
				//var active_slices_bckgColors = deduplicate_dict(params_barChart_deepCopy.active_slices, "backgroundColor");
				var active_slices_bckgColors = [];
				params_barChart.active_slices_v0.forEach((d)=>{active_slices_bckgColors.push(d.backgroundColor)})
				// var categories = params_barChart.data[0].labels; categories.sort()
				// var sous_categories = deduplicate_dict(this_chart.config.data.datasets, 'label'); sous_categories.sort()
				// var nb_sous_categories = this_chart.data.datasets.length
				var list_index_categories = []//used to register the position of the bckg color that has been highlighted
				for (var ii = 0; ii < nb_categories; ii++) {
					list_index_categories.push(ii)
				}


				//collect the position of the category field in the labels array
				var pos_category = _.map(params_barChart.active_slices_v0, (o)=> categories_source.indexOf(o.category_field) )

				//add the position info in the active_slices array
				for (var c = 0; c < pos_category.length; c++) {
					params_barChart.active_slices_v0[c]["pos"] = pos_category[c]
				}



				//2.loop over the entire datasets (metadata), check if the label of each dataset is in the sub category field  array
				for (var i = 0; i < nb_sous_categories; i++) {
					//list_index_categories = [];
					//1.recupérer la valeur de chaque sous-catégorie (1p, 2p ...)
					var sous_categorie = sous_categories[i];
					var pos_sub_category = active_slices_sub_category_fields.indexOf(sous_categorie);
					

					//filter the active slices array on the current sub category
					var filter1 = _.filter(params_barChart.active_slices_v0, { 'sub_category_field': sous_categorie});

					if (filter1.length > 0) {
						var map2 = _.mapValues(filter1, function(o) { return o.pos + "_" + o.backgroundColor; })

						var pos_cat = 0
						for (var c = 0; c < nb_categories; c++) {
							
							if (c < filter1.length) {

								//get the pos of the separator
								var pos_sep = map2[c].indexOf("_")  //où pos_sep est la position du '_'
								//extract the pos of the category
								pos_cat = map2[c].substring(0, pos_sep)
								pos_cat = parseInt(pos_cat)
								//format proprely the bckg color value
								var bckg_color = map2[c].substr(map2[c].indexOf("_")+1, map2[c].length)
								//register the color at the right position in the bckg color array of the chart's metadata						
								params_barChart.data[1].datasets[i].backgroundColor[pos_cat] = bckg_color

							}


						}
					}

					else {
						for (var c = 0; c <= nb_categories; c++) {
							params_barChart.data[1].datasets[i].backgroundColor[c] = ('rgba(240, 240, 240, 0.5)')
							
						}						
					}


				}

			}


			//v2 to be implemented
				//if (params_barChart.prepare_data_type === "preserve backgroundColor") {
					// params_barChart.active_slices[0].category_field.forEach(category=> {
					// 	var pos_cat_field = params_barChart.chart_instance.data.labels.findIndex(l=> l === category)
					// })

					// var pos_cat_field = params_barChart.chart_instance.data.labels.findIndex(l=> l === params_barChart.active_slices[0].category_field)
					// params_barChart.chart_instance.data.datasets.filter(d=> d.label === params_barChart.active_slices[0].sub_category_field)[0].backgroundColor[pos_cat_field] = params_barChart.active_slices[0].backgroundColor
				//}





			params_barChart.list_idx_segments_existants = [];
			var list_idx_segments_existants = params_barChart.list_idx_segments_existants
	        //1.collecter les clés de tous les segments existants
			for (var i = 0; i < (nb_categories); i++) {			

					for (var a = 0; a < (nb_sous_categories); a++) {
						list_idx_segments_existants.push(a + "-" + i)
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
		var plugin = {
			id: "grouped_barChart1_legend_handler",
		    afterDraw: function (chart) {
		    		var this_chart = params_barChart.chart_instance
		            let legends = chart.legend.legendItems;
		            try {
			            legends.forEach(function (e, i) {
			              var chartLabel = this_chart.config.data.datasets[i].label
			              var legendLabel = this_chart.legend.legendItems[i].text
			              if (chartLabel === legendLabel) {
			              	var bckg_color = this_chart.config.data.datasets[i].backgroundColor.filter((item)=> item !== "rgba(240, 240, 240, 0.5)");
			              	if (bckg_color.length > 0) {
				                e.fillStyle = bckg_color[0];
							}
							else {
								e.fillStyle = "rgba(240, 240, 240, 1)";	
							}	                
			              }                
			            });
			        }
			        catch (error) {console.log(error)}
		    }
		

		};

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
							        stacked: false
							     }],

			                    xAxes: [{
			                     scaleLabel: {
							        display: true,
							        labelString: this.title_x_axis
							      },
							     stacked: false
							     }]

			                },
			                
			                animation: {
			                        duration: 1000,
			                        easing: 'easeOutQuad'
			                },
			             /*    tooltips: {
			                    mode: 'label'
			                },*/
			                legend: {
								display: true,
								position: params_barChart.legend.position,
								align: "start",								
								rtl: true,
								reverse: params_barChart.legend.reverse,
						        labels: {
									boxWidth: params_barChart.legend.labels.boxWidth,
									padding:  params_barChart.legend.labels.padding
						           	}
						        ,			                    
			                    onHover: function(e) {
			                        if (e) {
			                      		e.target.style.cursor = 'pointer';
			                     	}
			                      },
								onClick: function(evt, item) {
							        
							        //Chart.defaults.global.legend.onClick.call(this, evt, item)
							        var pos_dataset = this.chart.data.datasets.map(l=> l.label).indexOf(item.text);
							        var legend_clicked = this.chart.getDatasetMeta(pos_dataset).hidden;
							        if (legend_clicked === false || legend_clicked === null) {
							        	this.chart.getDatasetMeta(pos_dataset).hidden = true;
							        	params_barChart.legend_clicked = true;
							        	params_barChart.chart_instance.update(0)
							        }
							        else {
							        	this.chart.getDatasetMeta(pos_dataset).hidden = false;
							        	params_barChart.legend_clicked = true;
							        	params_barChart.chart_instance.update(0)
							        }

									
		                            console.log('legend_clicked grouped bar: ' + item.text)
		                        }
								
		                	}
				        },
				        plugins: [plugin]
				      });







		function add_grid_and_controls(params_barChart, sharedParams) {
			//create a general container
				sharedParams.create_parent_container(params_barChart, sharedParams)
				//get the parent node of the chart
				let parentElement = document.getElementById('parent_container_' + params_barChart.id)
				parentElement.style.opacity = '0'
				let generalContainer = document.getElementById('general_container_'+params_barChart.id)

				
			//create layer for the controls
				//create grid container
				var controlsContainer = document.createElement('div'); controlsContainer.style = 'display: inline-grid; grid-template-columns: 30px; justify-items: center; margin-top: 0%'; controlsContainer.id = "controlsContainer_" + params_barChart.id
				

				//create sub grids containers
				var grid_restore_view = document.createElement('div'); grid_restore_view.style = 'display: inline-grid; grid-template-columns: auto; justify-items: center'; grid_restore_view.id = "grid_restore_view_" + params_barChart.id

				//colors coding:
					/*red: invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)
					grey: invert(91%) sepia(63%) saturate(3100%) hue-rotate(189deg) brightness(132%) contrast(80%)
					black: invert(0%) sepia(72%) saturate(0%) hue-rotate(328deg) brightness(95%) contrast(106%)*/
			    //create control for restore view
					const controlRestore = document.createElement('img'); controlRestore.src = "css/font-awesome-svg/undo-solid.svg"; controlRestore.id = "restore_pointer_" + params_barChart.id
					controlRestore.style.width= "18px"; controlRestore.title = 'Restore to initial view'

					controlRestore.addEventListener("mouseover", function(evt){evt.target.style.cursor = "pointer"; evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'} )
					controlRestore.addEventListener('mouseenter', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"});
					controlRestore.addEventListener('mouseemove', (evt)=> {evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'; evt.target.style.cursor = "pointer"})
					controlRestore.addEventListener('mouseleave', (evt)=> {
						if (evt.target['data-clicked']) {
							evt.target.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'
						}
						else {evt.target.style.filter = ""}
					});

			        grid_restore_view.append(controlRestore)
			        controlsContainer.append(grid_restore_view)

			        controlRestore.addEventListener("click", evt=> {
			        	params_barChart.funcLib.restore_chart_view(params_barChart, sharedParams)
			        })

			//append all the elements			
				generalContainer.append(controlsContainer);
				generalContainer.append(params_barChart.ctx)
				parentElement.append(generalContainer);

			//create a figure label		
				let fig = create_figure_label(params_barChart);				
				parentElement.append(fig)
				
				params_barChart.ctx.style.justifySelf = 'center'

		}


		//alimenter avec les labels ET LES DATASETS
		var data_type = "data"; var injection_type = "init"
		params_barChart.ctx.style.opacity = '0'
		this.inject_metadata(barChart, params_barChart, data_type, injection_type)


		var check_chart_rendering = setInterval(()=>{
				var sum_margin=0; 
				Object.values(params_barChart.chart_instance.chartArea).forEach(e=> sum_margin=sum_margin+e)
				var sum_heightWidth = params_barChart.chart_instance.height + params_barChart.chart_instance.width
				var height = params_barChart.chart_instance.canvas.width
				if ((!isNaN(sum_margin) || sum_heightWidth > 0) && height > 0) {
					add_grid_and_controls(params_barChart, sharedParams)
					clearInterval(check_chart_rendering);

					setTimeout(() => {
						params_barChart.ctx.style.opacity = '1'
						document.getElementById('parent_container_' + params_barChart.id).style.opacity = '1'
					}, 2000);

				}
			}, 1000)


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

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {		
			
			//parcours sous-catégories
			var nb_sous_categories = params_barChart.nb_sous_categories;
			for (var a = 0; a < nb_sous_categories; a++) {
	/*			backgroundColorArray.push(params_barChart.data[1].datasets[a].backgroundColor[i])*/
				var backgroundColor = params_barChart.data_source[1].datasets[a].backgroundColor[i];
	/*			var borderColor = params_barChart.data[1].datasets[a].borderColor[i];*/
				barChart.config.data.datasets[a].backgroundColor[i] = backgroundColor;
				/*barChart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";*/
			}

			/*barChart.config.data.datasets[i].backgroundColor = backgroundColorArray;*/
			barChart.update();



		}
	}	

	reset_border_color(this_chart, params_barChart_deepCopy) {
		/*console.log("entree_zone_blanche"); console.log(this_chart); console.log(params_barChart_deepCopy);*/

		//remettre config sans bordures
		var nb_categories = params_barChart_deepCopy.nb_categories;

		//parcours catégories
		for (var i = 0; i < nb_categories; i++) {		
			
			//parcours sous-catégories
			var nb_sous_categories = params_barChart_deepCopy.nb_sous_categories;
			for (var a = 0; a < nb_sous_categories; a++) {
				this_chart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";
			};
			
		}

		this_chart.update();

	}




	add_options_hover(this_chart, params_barChart_deepCopy) {
			
			this_chart.config.options.hover = {
	                onHover: function(e) {
	                     var point = this_chart.getElementAtEvent(e);
	                     if (point.length) {
	                        //transformer curseur en pointeur
	                     	e.target.style.cursor = 'pointer'; 

	                     	//effacer les bordures précédantes
	                     	this_chart.update();

	                        //si survol d'un segment, mettre bordure rouge sur élément survolé
	                        var activePoints = this_chart.getElementAtEvent(e);                        
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


	addListeners(ctx, this_chart, params_barChart_deepCopy) {

            //gestion de la bordure en zone blanche
            ctx.addEventListener("mouseover", function(evt){
                var activePoints = this_chart.getElementAtEvent(evt);

                if (activePoints[0]) {

                	try {
						var categorie = activePoints[0]._model.label;
						var sous_categorie = activePoints[0]._model.datasetLabel;

	                }
	                catch {
	                	console.log("segment non detecté, clic à l'exterieur du graph")
	                }    
                }
                else {
                	//remettre config sans bordures

                	/*console.log("entrée en zone blanche 2")*/
					var nb_categories = params_barChart_deepCopy.nb_categories;

					//parcours catégories
					for (var i = 0; i < nb_categories; i++) {		
						
						//parcours sous-catégories
						
				        var nb_sous_categories = params_barChart_deepCopy.nb_sous_categories;

						for (var a = 0; a < nb_sous_categories; a++) {
							this_chart.config.data.datasets[a].borderColor[i] = "rgba(230, 11, 11, 0)";
						};
						this_chart.update();

					}					
                }        

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
						var sous_categorie = activePoints[0]._model.datasetLabel;

						if (params_barChart_deepCopy.fields_to_decode.category_field) {
							var category_field_decoded = params_barChart_deepCopy.fields_to_decode.category_field.target_field;
							var category_field_encoded = params_barChart_deepCopy.fields_to_decode.category_field.mainKey;
							categorie = params_barChart_deepCopy.data_input.find(r=> r[category_field_decoded] === categorie)[category_field_encoded]
						}
						if (params_barChart_deepCopy.fields_to_decode.sub_category_field) {
							var sub_category_field_decoded = params_barChart_deepCopy.fields_to_decode.sub_category_field.target_field;
							var sub_category_field_encoded = params_barChart_deepCopy.fields_to_decode.sub_category_field.mainKey;
							sous_categorie = params_barChart_deepCopy.data_input.find(r=> r[sub_category_field_decoded] === sous_categorie)[sub_category_field_encoded]
						}

						




						//il faut annuler les segments multiples précédemment sélectionnés avant de passer à une sélection unique
						//controler que shift n'a pas été appuyé
						if (evt.ctrlKey === false) {
							params_barChart_deepCopy.list_idx_segments_multiples_selected = []; params_barChart_deepCopy.list_labels_segments_multiples_selected = []
							params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
						};
						////il faut annuler le segment unique sélectionné lors sur dernier clic
						params_barChart_deepCopy.list_labels_segment_single_selected = [];
						params_barChart_deepCopy.list_keys_values_segment_single_selected = [];

						//if clic on the same slice, clean the lists
						if (params_barChart_deepCopy.list_idx_segment_single_selected.includes(key_composite)) {
							return								
						}

						
						var category_field = params_barChart_deepCopy.category_field;
						var sub_category_field = params_barChart_deepCopy.sub_category_field;
						params_barChart_deepCopy.list_labels_segment_single_selected.push({category_field: categorie, sub_category_field: sous_categorie});
						params_barChart_deepCopy.list_keys_values_segment_single_selected.push({[category_field] : [categorie], [sub_category_field]: [sous_categorie]});
						
						//observableSlim
						/*p.changeBar1 = key_composite;*/
						
						//controler que shift n'a pas été appuyé pour éviter des push multiples
						if (evt.ctrlKey === false) {
							params_barChart_deepCopy.list_labels_segments_multiples_selected.push({category_field: categorie, sub_category_field: sous_categorie});
							params_barChart_deepCopy.list_keys_values_segments_multiples_selected.push({[category_field] : [categorie], [sub_category_field]: [sous_categorie]});
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
						params_barChart_deepCopy.active_slices_v0 = []
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
					if (params_barChart_deepCopy.list_idx_segment_single_selected.includes(key_composite)) {
						params_barChart_deepCopy.list_idx_segment_single_selected = [];
						params_barChart_deepCopy.active_slices_v0 = [];
						params_barChart_deepCopy.active_slices = [];
						return
					}

					//v n-1
					var categorie = activePoints[0]._model.label;
					var category_label = categorie
					
					var sous_categorie = activePoints[0]._model.datasetLabel;

					//v n
					var categorie = activePoints[0]._model.label;
					var sous_categorie = activePoints[0]._model.datasetLabel;

					if (params_barChart_deepCopy.fields_to_decode.category_field) {
						var category_field_decoded = params_barChart_deepCopy.fields_to_decode.category_field.target_field;
						var category_field_encoded = params_barChart_deepCopy.fields_to_decode.category_field.mainKey;
						var category_label = category_field_encoded
						categorie = params_barChart_deepCopy.data_input.find(r=> r[category_field_decoded] === categorie)[category_field_encoded]
					}
					if (params_barChart_deepCopy.fields_to_decode.sub_category_field) {
						var sub_category_field_decoded = params_barChart_deepCopy.fields_to_decode.sub_category_field.target_field;
						var sub_category_field_encoded = params_barChart_deepCopy.fields_to_decode.sub_category_field.mainKey;
						sous_categorie = params_barChart_deepCopy.data_input.find(r=> r[sub_category_field_decoded] === sous_categorie)[sub_category_field_encoded]
					}

                    //collect color of the slice
					var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
					//augmenter l'opacité du segment
					activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")						


					////il faut annuler le segment unique sélectionné lors sur dernier clic					
					params_barChart_deepCopy.list_idx_segment_single_selected = [];
                    params_barChart_deepCopy.list_idx_segment_single_selected.push(key_composite);

					//controler que shift n'a pas été appuyé pour éviter des push multiples
					if (evt.ctrlKey === false) {
    	                params_barChart_deepCopy.list_idx_segments_multiples_selected.push(key_composite);//++
						//evo
						params_barChart_deepCopy.active_slices= [{category_label: category_label, category_field: categorie, sub_category_field: sous_categorie, backgroundColor: activePoint_backgroundColor}];
						params_barChart_deepCopy.active_slices_v0= [{category_label: category_label, category_field: categorie, sub_category_field: sous_categorie, backgroundColor: activePoint_backgroundColor}];

    	            }


					
					/*console.log("idx: " + idx); console.log("datasetIdx: " + datasetIdx); console.log("id dataset: + key_composite")*/
                    var chartData = activePoints[0]['_chart'].config.data;                

                    //parcourir toutes les barres pour les mettre en gris sauf celle cliquée
                    var nb_categories = params_barChart_deepCopy.nb_categories;
    
                        for (var i = 0; i < (nb_categories); i++) {
                            //si la categorie parcourue n'est pas la catégorie active
                            var nb_sous_categories = params_barChart_deepCopy.nb_sous_categories;

                            	for (var a = 0; a < (nb_sous_categories); a++) {
                            		var lock_composite = a + "-" + i
                            		//si on entre dans un segment différent du segment actif, griser la couleur du segment
                            		if (key_composite !== lock_composite) {
	                            	//la couleur de fond se désactive ainsi pour le 1er segment: bar1.config.data.datasets[0].backgroundColor[0] = 'grey'
	                            		this_chart.config.data.datasets[a].backgroundColor[i] = "rgba(240, 240, 240, 0.5)";
	                                
	                            	}
									else {
										//collecter la couleur du segment
										var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
										
										//augmenter l'opacité du segment
										activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")
										activePoints[0]._model.backgroundColor = activePoint_backgroundColor;
										this_chart.config.data.datasets[a].backgroundColor[i] = activePoint_backgroundColor;


										//register in the params_chart the active category & it's background color
/*										params_barChart_deepCopy.active_slices["category_field"] = activePoints[0]._model.label;
										params_barChart_deepCopy.active_slices["sub_category_field"] = activePoints[0]._model.datasetLabel;
										params_barChart_deepCopy.active_slices["backgroundColor"] = activePoint_backgroundColor;
*/				


									}

                            	}                            	



                        };

                        //save the colors of the filtred state
						var backgroundColor_array = [];
						for (var i = 0; i < this_chart.config.data.datasets.length; i++) {
							backgroundColor_array.push(this_chart.config.data.datasets[i].backgroundColor[0])
						};
						params_barChart_deepCopy.backgroundColor_array_ClickedState = backgroundColor_array;                        
                        
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
					params_barChart_deepCopy.active_slices_v0 = []
					params_barChart_deepCopy.active_slices = [];
					

                }
            }





            //rés-activer les couleurs de tous les segments
            ctx.ondblclick = function(evt) {
                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy)

				//vider liste des segments selectionnés
				params_barChart_deepCopy.list_idx_segment_single_selected = [];
				params_barChart_deepCopy.list_labels_segment_single_selected = [];
				params_barChart_deepCopy.list_idx_segments_multiples_selected = [];
				params_barChart_deepCopy.list_labels_segments_multiples_selected = [];
				params_barChart_deepCopy.list_keys_values_segment_single_selected = [];
				params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [];
				params_barChart_deepCopy.active_slices_v0 = [];
				params_barChart_deepCopy.active_slices = [];
				//observableSlim
				/*p.changeBar1 = false;*/

            };
            





	      //gestion d'un clic + shift sur plusiers segments (pour désactiver les couleurs des segments non selectionnés)
	      ctx.addEventListener("click",
	        function(e) {
	            if (e.ctrlKey) {
	                    console.log("Shift, yay!");
	                	//1.remettre les couleurs d'origine sur tous les segments
		                params_barChart_deepCopy.instanciator.maj_couleurs(this_chart, params_barChart_deepCopy);

	                    var activePoints = this_chart.getElementAtEvent(e);
	                    var idx = activePoints[0]['_index'];
						var datasetIdx = activePoints[0]['_datasetIndex'];
						var key_composite = datasetIdx+"-"+idx
						
						var categorie = activePoints[0]._model.label;
						var category_label = categorie

						if (params_barChart_deepCopy.fields_to_decode) {
							var category_field_decoded = params_barChart_deepCopy.fields_to_decode.fields[0]
							categorie = params_barChart_deepCopy.data_input.filter(r=> r[category_field_decoded] === categorie)[0][params_barChart_deepCopy.category_field]
						}

						var sous_categorie = activePoints[0]._model.datasetLabel;

						var category_field = params_barChart_deepCopy.category_field;
						var sub_category_field = params_barChart_deepCopy.sub_category_field;
						//collect the backgroundcolor of the slice
						var activePoint_backgroundColor = activePoints[0]._model.backgroundColor;
						//augmenter l'opacité du segment
						activePoint_backgroundColor = activePoint_backgroundColor.replace("0.65", "1")

						var list_idx_segments_existants = params_barChart_deepCopy.list_idx_segments_existants

						//vider les listes alimentées par un clic unique
						params_barChart_deepCopy.list_idx_segment_single_selected = []; params_barChart_deepCopy.list_labels_segment_single_selected = []; params_barChart_deepCopy.list_keys_values_segment_single_selected = []
						params_barChart_deepCopy.id_previous_singleSelect = ""

						//refresh the lists fed by clic+shift
						//1.if the slice selected is not in the current lists, push it
						var pos_slice = params_barChart_deepCopy.list_idx_segments_multiples_selected.indexOf(key_composite);
						if (pos_slice === -1) {							
		                    params_barChart_deepCopy.list_idx_segments_multiples_selected.push(key_composite);	                    

							//restore cat field values
							var categories, sub_categories, category_labels
							categories = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field;
							var evaluate = categories.constructor == Array
							if (!evaluate) {
								categories = [categories]};


							//restore cat label values
							if (params_barChart_deepCopy.fields_to_decode) {
								category_labels = params_barChart_deepCopy.active_slices[0].category_label;
								var evaluate = category_labels.constructor == Array
								if (!evaluate) {
									category_labels = [category_labels]};
								category_labels.push(category_label)
							}

							//restore sub_cat field values							
							sub_categories = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].sub_category_field;
							evaluate = sub_categories.constructor == Array
							if (!evaluate) {
								sub_categories = [sub_categories]};

							//restore background colors
							var activePoint_backgroundColors = _.cloneDeep(params_barChart_deepCopy.active_slices[0].backgroundColor)
							evaluate = activePoint_backgroundColors.constructor == Array
							if (!evaluate) {
								activePoint_backgroundColors = [activePoint_backgroundColors]};

							//add new cat & sub_cat value
							categories.push(categorie); sub_categories.push(sous_categorie); activePoint_backgroundColors.push(activePoint_backgroundColor)
							params_barChart_deepCopy.list_labels_segments_multiples_selected = [{category_field: categories, sub_category_field: sub_categories}];
							params_barChart_deepCopy.list_keys_values_segments_multiples_selected = [{[category_field]: categories, [sub_category_field]: sub_categories}];
							params_barChart_deepCopy.active_slices = [{category_label: category_labels, category_field: categories, sub_category_field: sub_categories, backgroundColor: activePoint_backgroundColors}]

							params_barChart_deepCopy.active_slices_v0.push({category_field: categorie, sub_category_field: sous_categorie, backgroundColor: activePoint_backgroundColor})							

						}
						//2.delete selected slice from the diffent arrays
						else {
							//delete selected index
							params_barChart_deepCopy.list_idx_segments_multiples_selected.splice(pos_slice, 1)

							//find & delete cat value
							var pos_category_value = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.findIndex(i=> i === categorie)
							params_barChart_deepCopy.list_labels_segments_multiples_selected[0].category_field.splice(pos_category_value, 1)
							//params_barChart_deepCopy.list_keys_values_segments_multiples_selected[0][category_field].splice(pos_category_value, 1)


							//find & delete sub cat value
							var pos_sub_category_value = params_barChart_deepCopy.list_labels_segments_multiples_selected[0].sub_category_field.findIndex(i=> i === sous_categorie)
							params_barChart_deepCopy.list_labels_segments_multiples_selected[0].sub_category_field.splice(pos_sub_category_value, 1)
							//params_barChart_deepCopy.list_keys_values_segments_multiples_selected[0][sub_category_field].splice(pos_sub_category_value, 1)


							//find & delete values from active slices
							if (params_barChart_deepCopy.fields_to_decode) params_barChart_deepCopy.active_slices[0].category_label.splice(pos_category_value, 1);
							// params_barChart_deepCopy.active_slices[0].category_field.splice(pos_category_value, 1)
							// params_barChart_deepCopy.active_slices[0].sub_category_field.splice(pos_sub_category_value, 1)
							params_barChart_deepCopy.active_slices[0].backgroundColor.splice(pos_sub_category_value, 1)


							// var index_sub_cat = params_barChart_deepCopy.list_labels_segments_multiples_selected.findIndex(x => x.sub_category_field === sous_categorie);
							// params_barChart_deepCopy.list_labels_segments_multiples_selected.splice(index_sub_cat, 1)

							// var index_sub_cat = params_barChart_deepCopy.list_keys_values_segments_multiples_selected.findIndex(x => x[sub_category_field][0] === sous_categorie);
							// params_barChart_deepCopy.list_keys_values_segments_multiples_selected.splice(index_sub_cat, 1)

							var index_sub_cat = params_barChart_deepCopy.active_slices_v0.findIndex(x => x.sub_category_field === sous_categorie);
							params_barChart_deepCopy.active_slices_v0.splice(index_sub_cat, 1)
						}



	                    //observableSlim
	                    /*p.changeBar1 = false;*/
	                    var chartData = activePoints[0]['_chart'].config.data;
	             

	                    //parcourir toutes les barres pour les mettre en gris sauf celles cliquées
	                    var nb_segments_existants = params_barChart_deepCopy.list_idx_segments_existants.length;
	                    var nb_categories = params_barChart_deepCopy.nb_categories;
						

	                    //v2
						//1.extract into separate arrays the labels array (metadata), the category field, sub category field  & bckg color (active slices)
						
						var active_slices_category_fields = [];
						if (params_barChart_deepCopy.fields_to_decode) {
							params_barChart_deepCopy.active_slices.forEach((d)=>{active_slices_category_fields.push(d.category_label)}); active_slices_category_fields = active_slices_category_fields.flat();
						}
						else  {
							params_barChart_deepCopy.active_slices.forEach((d)=>{active_slices_category_fields.push(d.category_field)}); active_slices_category_fields = active_slices_category_fields.flat();
						}
						//var active_slices_sub_category_fields = deduplicate_dict(params_barChart_deepCopy.active_slices, "sub_category_field");
						var active_slices_sub_category_fields = [];
						params_barChart_deepCopy.active_slices.forEach((d)=>{active_slices_sub_category_fields.push(d.sub_category_field)}); active_slices_sub_category_fields = active_slices_sub_category_fields.flat();
						//var active_slices_bckgColors = deduplicate_dict(params_barChart_deepCopy.active_slices, "backgroundColor");
						var active_slices_bckgColors = [];
						params_barChart_deepCopy.active_slices.forEach((d)=>{active_slices_bckgColors.push(d.backgroundColor)}); active_slices_bckgColors = active_slices_bckgColors.flat();
						var categories = this_chart.config.data.labels; categories.sort(); categories = categories.flat();

						var sous_categories = this_chart.config.data.datasets.filter(dataset => typeof(dataset.label) !== 'object');
						sous_categories = deduplicate_dict(sous_categories, 'label'); sous_categories.sort(); sous_categories = sous_categories.flat();
						//var sous_categories = deduplicate_dict(this_chart.config.data.datasets, 'label'); sous_categories.sort()						
						//var nb_sous_categories = this_chart.data.datasets.length
						//var sous_categories = this_chart.legend.legendItems.filter(legend => typeof(legend.text) !== 'object' && legend.hidden === false);
						//var sous_categories = _.map(sous_categories, (o)=> (o.text) );
						var nb_sous_categories = sous_categories.length
						var list_index_categories = []//used to register the position of the bckg color that has been highlighted

						//2.loop over the entire datasets (metadata), check if the label of each dataset is in the sub category field  array
						for (var i = 0; i < nb_sous_categories; i++) {
							//1.recupérer la valeur de chaque sous-catégorie (1p, 2p ...)
							list_index_categories = [];
							var sous_categorie = sous_categories[i];
							var pos_sub_category = active_slices_sub_category_fields.indexOf(sous_categorie);

							for (var a = 0; a < active_slices_sub_category_fields.length; a++) {
								var active_sub_category_field = active_slices_sub_category_fields[a]
														
								//3.if the check is true:
								if (active_sub_category_field === sous_categorie) {
									// 3.2.with this pos a, get the category field value from the array of category fields, built in step 1
									var active_slices_category_field_value = active_slices_category_fields[a];
							 		//3.3.get the bckg color value from the array of bckg colors, built in step 1
									var active_slice_bckgColor = active_slices_bckgColors[a];
									//3.4.collect the position of the category field value in the array of labels, built in step 1 (pos b)
									var pos_category_field = categories.indexOf(active_slices_category_field_value)
									//3.5.access the pos b of the bckg colors array (metadata) and replace it's value with the bckg color value
									
									//3.6.put in light grey all the other values except the above
									for (var c = 0; c <= nb_categories; c++) {
										if (c === pos_category_field) {
											this_chart.config.data.datasets[i].backgroundColor[c] = active_slice_bckgColor;
											list_index_categories.push(c);
										}
										else if (list_index_categories.indexOf(c) === -1) {
											this_chart.config.data.datasets[i].backgroundColor[c] = ('rgba(240, 240, 240, 0.5)')
										}
										
									}
								}
							

								//4.1.replace all the values of the bckg colors array (metadata) with light grey
								else if (pos_sub_category === -1) {
									for (var c = 0; c <= nb_categories; c++) {
										this_chart.config.data.datasets[i].backgroundColor[c] = ('rgba(240, 240, 240, 0.5)')
										
									}
								

								}
							}
						};
						this_chart.update();


				
	            }

	                /*}*/
	        },false)
	}
}




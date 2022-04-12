//import * as Comlink from "./comlink.mjs";
class sharedParams {
  	constructor() {
	    this.used_color_schemes = {}
	    this.transformations = {filter: ""}
	    this.data_source = []
	    this.data_main = []
	    //this.params_data_filtred = {dataset: [], filter: ""}
	    this.params_data_filtred = {}
	    this.list_of_axis = []
	    this.time_refresh = 0
	    this.interaction_events = {}
	    this.language = "en"
	    this.crossfilterProcess_exec_time = []
	    this.crossfilterData_exec_time = []
	    this.params_charts = []
	    this.multithreading = true
	    this.phase = 'init'
	    this.charts_with_spinners = {}
	    this.registed_colors = {}
		//example spec filter transformations
		/*transformations = {filter: [{field: "INSEE_COM", operation: "include", values: ["33063","64445","17300","33281","87085","17306"]},
											{field: "nb_pieces", operation: "<", value: 9},
											{field: "nb_pieces", operation: "between", valueMin: 3, valueMax: 8}]}*/	


	}


	prepare_data_source(data_source) {

	    var d1 = new Date();

		//convert the lat/lng into leaflet format
		if (this.transformations.latLng_fields) {
			data_source.operational_data.forEach(r=> {
				if (r[this.transformations.latLng_fields.lat] && r[this.transformations.latLng_fields.lng]) {
					r['leaflet_lat_lng'] = new L.latLng(r[this.transformations.latLng_fields.lat], r[this.transformations.latLng_fields.lng])
					r.latLng = r[this.transformations.latLng_fields.lat]+"_"+r[this.transformations.latLng_fields.lng]
				}
			});
		}

	    //filter the primary data source according to the scope given in transformations spec bellow
	    let geoRadius_data_filter = []; let data_filtred = [...data_source.operational_data]
	    if (this.transformations.filter) {
		    this.transformations.filter.forEach(f=> {
		        
		        if (f.operation === "include") {
		            data_filtred = data_filtred.filter((item)=> f.values.indexOf(item[f.field]) !== -1)
		        }
		        else if (f.operation === "exclude") {
		            data_filtred = data_filtred.filter((item)=> f.values.indexOf(item[f.field]) === -1)
		        }        
		        else if (f.operation === "<") {
		            var fieldName = f.field; var fieldValue = f.value
		            data_filtred = data_filtred.filter((item)=> item[fieldName] < fieldValue)
		        }
		        else if (f.operation === ">") {
		            var fieldName = f.field; var fieldValue = f.value
		            data_filtred = data_filtred.filter((item)=> item[fieldName] > fieldValue)
		        }
		        else if (f.operation === "<=") {
		            var fieldName = f.field; var fieldValue = f.value
		            data_filtred = data_filtred.filter((item)=> item[fieldName] <= fieldValue)
		        }
		        else if (f.operation === ">=") {
		            var fieldName = f.field; var fieldValue = f.value
		            data_filtred = data_filtred.filter((item)=> item[fieldName] >= fieldValue)
		        }
		        else if (f.operation === "between") {
		            var fieldName = f.field; var fieldValueMin = f.valueMin; var fieldValueMax = f.valueMax;
		            data_filtred = data_filtred.filter((item)=> item[fieldName] >= fieldValueMin && item[fieldName] <= fieldValueMax)
		        }        

		        //result_filter.push(data_filtred)

		    })
		}



	    //add the indexes
	    var i = 0
	    data_filtred.forEach(r=> {
	    	r['index'] = i;
	    	i++
	    })

		var i = 0
	    data_source.operational_data.forEach(r=> {
	    	r['index'] = i;
	    	i++
	    })	    


	    //save data filtred	    
		this.data_main = [...data_filtred]
		//group by data by indexes		
		this.data_main_groupBy_index = _.groupBy(data_filtred, 'index'); 






	    //filter the geojson if provided
		if (data_source.join_fields) {
			this.join_fields = {...data_source.join_fields}
		}

	    if (data_source.geojson_data) {			
			//check if the geo data has a bbox
			if (!data_source.geojson_data.find(f=> f.bbox)) {
				data_source.geojson_data.forEach(o=> {
					let bbox, turf_poly;					
					try {
						turf_poly=turf.helpers.polygon(o.geometry.coordinates);
						bbox=turf.bbox.default(turf_poly);
						o.bbox = bbox;
					}
					catch(e) {
						console.warn('on bbox creation:'+e)
					}
					
				})
			}
			data_filtred = deepCopyArray(data_source.geojson_data);

		    if (this.transformations.filter) {

				let filter_array = [];
				if (this.join_fields) {					
					this.transformations.filter.forEach(o=> {
						if (Object.keys(this.join_fields).includes(o.field)) {
							filter_array.push({...o})
							filter_array[filter_array.length-1].field = this.join_fields[o.field]
						}
						else if (Object.values(this.join_fields).includes(o.field)) {
							filter_array.push({...o})
							filter_array[filter_array.length-1].field = o.field
						}
					})
				}
			    
				if (filter_array.length === 0) {filter_array = this.transformations.filter}
			    filter_array.map(f=> {
			        if (f.operation === "include" && data_filtred.find(e=> e[f.field])) {
			            data_filtred = data_filtred.filter((item)=> f.values.indexOf(item[f.field]) !== -1)
			        }
			        else if (f.operation === "exclude" && data_filtred.find(e=> e[f.field])) {
			            data_filtred = data_filtred.filter((item)=> f.values.indexOf(item[f.field]) === -1)
			        }
			    })
			}
		this.geojson_data = deepCopyArray(data_filtred)
		}





		console.log("tps exec filter data_source: " + (new Date() - d1)/1000)    

		//save the data source
	    this.data_source = deepCopyArray(data_source.operational_data); data_source = []

	}

	
	setup_crossfilter(sharedParams) {
		sharedParams.chartsUpdateTime = 1000
		this.params_charts.map(c=> {

		  var observe_ = new Observe_Charts_state();

		  //build list of third charts
		  var third_charts = [];
		  //var crossfilter_objects = ['crossfilter', 'legends_crossfilter'];
		  var crossfilter_objects = ['crossfilter'];
		  this.params_charts.filter(cc=> cc.id !== c.id).map(chart=> { 
		  	var filter, collect_active_slices
			crossfilter_objects.forEach(crossfilter=> {
				//check the crossfilter object provided is an array
				if (c[crossfilter] && c[crossfilter].constructor != Array) {
					console.warn('the crossfilter param for the chart :' + c.id + ' must be an array')
					return
				}
				//case when the user specified crossfilter params for a specific chart (the current target chart, named here 'chart')
				if (c[crossfilter] && c[crossfilter].find(e=> e.chart == chart.id)) {
					var crossfilter_param = c[crossfilter].find(e=> e.chart == chart.id);
					//replace the id of the chart specified by the user, by the params_chart instance
					crossfilter_param.chart = sharedParams.params_charts.find(chart=> chart.id === crossfilter_param.chart)
					
					//case when both filter & collect_active_slices are specified by the user spec
					if (c[crossfilter] && crossfilter_param.hasOwnProperty('filter') && crossfilter_param.hasOwnProperty('collect_active_slices')) {
						third_charts.push(crossfilter_param)	
					}
					//case when only filter is specified by the user spec, collect_active_slices is always true
					else if (c[crossfilter] && crossfilter_param.hasOwnProperty('filter')) {		  		
						third_charts.push({chart: crossfilter_param.chart, filter: crossfilter_param.filter, collect_active_slices: true}) 
					}
				}
				
				//case when the user specified filter as false, iot exclude the current target chart from the crossfilter process
				else if (c.filter === false) {
					if (c.collect_active_slices === undefined || c.collect_active_slices === true) {
						third_charts.push({chart: chart, filter: false, collect_active_slices: true}) 
					}
					else if (c.collect_active_slices === false) {
						third_charts.push({chart: chart, filter: false, collect_active_slices: false}) 
					}		  		

				}
				else if (c.filter === true || c.filter === undefined) {
					if (chart.filter === undefined || chart.filter !== false) {chart.filter = true }
					if (chart.collect_active_slices === undefined || chart.collect_active_slices !== false) {chart.collect_active_slices = true }
					third_charts.push({chart: chart, filter: chart.filter, collect_active_slices: chart.collect_active_slices}) 
				}
		  	})
		  	
		  })

		  c.sharedParams = sharedParams
		  //put the scatter chart in the last position		  		  
		  move_scatterChart_last()
		  observe_.observe_chart_state(c, third_charts, c.sharedParams)


		  
			function move_scatterChart_last() {
			  third_charts.forEach(e=> {
			  	//1.check the type of the chart
			  	var chart_type = e.chart.chart_sub_type
			  	//if scatter, get its position in the array and move it to the end of the array
			  	if (chart_type === 'scatter') {
			  		var pos = third_charts.findIndex(elem=> elem === e)
			  		array_move(third_charts, pos, third_charts.length - 1)
			  	}
			  })
			}

		})	

		
		//activate multi threading
		if (sharedParams.multithreading) {
			this.dispatch_data_to_workers(sharedParams, sharedParams.data_main)
			//this.dispatch_data_to_workers(sharedParams, sharedParams.data_source)
		}

		sharedParams.phase = 'running'


		//create figure numbre for the charts
		var i=1; 
		sharedParams.params_charts.forEach(c=> {
			c.figure_auto = i;
			i++;
		})


		this.build_common_ref_list(sharedParams)
	}



	dispatch_data_to_workers(sharedParams, input_dataset) {


		var nb_threads = window.navigator.hardwareConcurrency


		//split the data source into the nb of cores
		//1.calculate the length of each chunk & the  intervals of rows
		var size_chunks= Math.floor(input_dataset.length/nb_threads)
		var intervals = [], min = 0
		for (var i = 0; i < nb_threads; i++) {
		  var min = min;
		  var max = min + size_chunks
		  intervals.push({min: min, max: max})
		  //min = max+1
		  min = max
		}


		console.time('map-reduce')
		console.time('slice');
		//2.slice the data
		var data_chunks = intervals.map(i=> input_dataset.slice(i.min, i.max)); 
		console.timeEnd('slice')

		//3.create the nb of webworkers that match the nb of cores, then pass the data the each web worker
		sharedParams['Workers_crossfilter'] = {}
		for (var i = 0; i < nb_threads; i++) {
			//create worker

			async function init() {
				var worker = new Worker("./lib/webWorker_crossfilter.js");
				const service = Comlink.wrap(worker);				
				
				var data_chunk = data_chunks[i]
				var id = sharedParams.params_charts.map(c=> c.id).map(c=> c.substr(0,1) + c.substr(-1)).join("-") + "_" + i
				
				service.hold_data({data_source: data_chunk, id: id})

				sharedParams.Workers_crossfilter['Worker_crossfilter_' + i] = {worker_instance: service, indexes:  [], exec_crossfilter: false}
			}
			init()
		}

	}		
	

	restore_view(sharedParams) {
		//clean all store lists & enable each chart to crossfilter
		sharedParams.params_charts.forEach(c=> { 
			c.list_labels_segment_single_selected = [];
			c.list_labels_segments_multiples_selected = [];
			c.list_keys_values_segment_single_selected = [];
			c.list_keys_values_segments_multiples_selected = [];
			c.brush_keys_values = {};
			c.hidden_legends = {};
			c.active_legends = {};
			c.to_filter = true;

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

			//if the chart has hierarchy layers, restore 1st layer
				if (c.hierarchy_levels) {
					c.category_field = c.hierarchy_levels[0];
					c.previous_hierarchy = undefined;
	             	var icon_hierarchy_ = document.getElementById("icon_hierarchy_" + c.id); icon_hierarchy_ ? icon_hierarchy_.style.color = '' : {}
		        	c.list_controls ? c.list_controls.controlPrevious_hierarchy.style.color = 'rgba(194, 194, 194, 1)' : {}
				}


		})
		//send signal of crossfilter from 1rst chart JS chart listed
		sharedParams.params_charts.filter(c=> c.chart_type === 'chartJS')[0].list_idx_segment_single_selected = ['restore']
		//clean the crossfilter signals of each chart
		sharedParams.params_charts.forEach(c=> { 
			c.list_idx_segment_single_selected = [];
			c.list_idx_segments_multiples_selected = [];	
			c.to_filter = undefined
		})
		//restore state of 1rst chart, with sending crossfilter signal from 2nd chart listed
		sharedParams.params_charts.filter(c=> c.chart_type === 'chartJS')[0].to_filter = true
		sharedParams.params_charts.filter(c=> c.chart_type === 'chartJS')[1].list_idx_segment_single_selected = ['restore'];
		setTimeout(()=> {
			sharedParams.params_charts.filter(c=> c.chart_type === 'chartJS')[1].list_idx_segment_single_selected = [];
			sharedParams.params_charts.filter(c=> c.chart_type === 'chartJS')[0].to_filter = undefined
		}, 1000);


		//restore colors
		sharedParams.params_charts.forEach(c=> { 
			c.instanciator.maj_couleurs ? c.instanciator.maj_couleurs(c.chart_instance, c) : {}
		})

	}




	updateCharts(sharedParams) {

		//1.erase previous data loaded
		sharedParams.params_charts.map(c=> {
	  
		  //if the chart is chart js type
		  if (c.chart_type === "chartJS") {
			c.data[0].labels = []; c.data[1].datasets = [];
			//c.chart_instance.config.data.labels = []; 
			/*for (var ii = 0; ii < c.chart_instance.config.data.datasets.length; ii++) {
			  c.chart_instance.config.data.datasets[ii].data = []; c.chart_instance.config.data.datasets[ii].label = "";
			  c.chart_instance.config.data.datasets[ii].backgroundColor = []; c.chart_instance.config.data.datasets[ii].borderColor = [];
			  c.chart_instance.config.data.datasets[ii].borderWidth = [];
			}*/
			//c.chart_instance.data.datasets = [];
			c.chart_instance.data.datasets.forEach(d=> {
				d.label ? d.label = "" : {}; 
				d.data ? d.data = [] : {};
				d.backgroundColor ? d.backgroundColor = [] : {}; 
				d.borderColor ? d.borderColor = [] : {}; 
				d.borderWidth ? d.borderWidth = [] : {}; 
				d.labels ? d.labels = [] : {};
			})
			c.chart_instance.data.labels ? c.chart_instance.data.labels = [] : {}
			//c.chart_instance.update(0)
		  }
		  else if (c.chart_type === 'leaflet') {
			c.data[0].labels = []; c.data[1].datasets = [];
			c.data[1].markers = []; c.data[1].x_y = []; c.inject_type = "init"
		  }     
		})
	  
		//2.erase previous barckround colors
		// sharedParams.params_charts.map(c=> { 
		//   c.backgroundColorArray_source = {}
		// })
	  
		//3.update the charts
		sharedParams.params_charts.map(c=> {
			if (c.instanciator && c.instanciator.updateChart && typeof(c.instanciator.updateChart) == 'function') {
				c.instanciator.updateChart(c, sharedParams)
			}
		})

		sharedParams.chartsUpdateTime = 750
	  }
	  



	  join_external_datasets(params_chart, filterList) {
		if (!_.isEmpty(filterList)) {
			filterList.forEach(f=> {
				if (params_chart.join.join_fields[f.field]) {
					f.field = params_chart.join.join_fields[f.field] 
				}
			})
		}
		return filterList
	  }
	  
	//delete fields from the filterList used in the prepare_data_p1, that don't exist in the dataset to be filtred
	delete_unwanted_fields(data_chart, filterList) {
		var run_again = undefined;
		function delete_order(data_chart, filterList) {
			if (_.isEmpty(filterList) || !_.isArray(filterList)) return
			filterList.forEach(o=> {
				if (!_.find(data_chart, o.field)) {
					var pos = filterList.findIndex(e=> e.field === o.field)
					filterList.splice(pos, 1)
					run_again = true
				}
				// else {
				// 	run_again = false
				// }					
			})
		}
		delete_order(data_chart, filterList)
		while (run_again) {
			delete_order(data_chart, filterList);
			run_again = false
		}

		return filterList
	}


	sync_external_charts(params_chart, sharedParams, active_segment_value) {
		if (!params_chart.graphics_to_synchronise || params_chart.graphics_to_synchronise.constructor != Array || !params_chart.graphics_to_synchronise.find(e=> e.id)) {
			console.warn('at ' + params_chart.id + ', the graphics_to_synchronise object contains errors')
			return
		}

		
		if (params_chart.graphics_to_synchronise)
		params_chart.graphics_to_synchronise.forEach(g=> {
			//find the charts to be sync
			sharedParams.sharedParams_array.forEach(sh=> {
			var chart_to_sync = _.find(sh.params_charts, {id: g.id})
			if (chart_to_sync) {
				var join_fields = g.join_fields
				//check if there is a delay
				if (g.delay_time) {
					setTimeout(()=> {sync_chart(params_chart, chart_to_sync, active_segment_value, join_fields)}, g.delay_time)
				}
				//check if there is a condition to meet iot sync the chart
				else if (g.on_display) {
					var check_display = setInterval(()=> {
						var el_target = document.getElementById(g.on_display);
						if (el_target && el_target.style.display !== "" && el_target.style.display !== "none") {
							sync_chart(params_chart, chart_to_sync, active_segment_value, join_fields)
							clearInterval(check_display)
						}
					}, 500)
				}
				else {
					sync_chart(params_chart, chart_to_sync, active_segment_value, join_fields)
				}
			}
			})
			
		})


		function sync_chart(params_chart, chart_to_sync, active_segment_value, join_fields) {
			//sync clic / brush values
			Object.assign(chart_to_sync.list_labels_segment_single_selected, params_chart.list_labels_segment_single_selected)
			Object.assign(chart_to_sync.list_labels_segments_multiples_selected, params_chart.list_labels_segments_multiples_selected)
			Object.assign(chart_to_sync.brush_keys_values, params_chart.brush_keys_values)
			Object.assign(chart_to_sync.active_slices, params_chart.active_slices)
			Object.assign(chart_to_sync.list_idx_segment_single_selected, params_chart.list_idx_segment_single_selected)  
			Object.assign(chart_to_sync.list_idx_segments_multiples_selected, params_chart.list_idx_segments_multiples_selected)
			Object.assign(chart_to_sync.brush_values, params_chart.brush_values)

			if (join_fields) {
				var cat_field_transcoded = sharedParams.transcode_join_fields(join_fields, params_chart.category_field)
				//create defensive copy
				var list_keys_values_segment_single_selected = deepCopyArray(params_chart.list_keys_values_segment_single_selected);
				var list_keys_values_segments_multiples_selected = deepCopyArray(params_chart.list_keys_values_segments_multiples_selected)
				
				if (list_keys_values_segment_single_selected.length>0) {
					list_keys_values_segment_single_selected.forEach(o=> {
						o[cat_field_transcoded] = o[params_chart.category_field]
						delete o[params_chart.category_field]
					})
				}

				Object.assign(chart_to_sync.list_keys_values_segment_single_selected, list_keys_values_segment_single_selected)

				
				var list_keys_values_segments_multiples_selected = deepCopyArray(params_chart.list_keys_values_segments_multiples_selected)
				if (list_keys_values_segments_multiples_selected.length>0) {
					list_keys_values_segments_multiples_selected.forEach(o=> {
						o[cat_field_transcoded] = o[params_chart.category_field]
						delete o[params_chart.category_field]
					})
				}

				Object.assign(chart_to_sync.list_keys_values_segments_multiples_selected, list_keys_values_segments_multiples_selected)
			}
			else {
				Object.assign(chart_to_sync.list_keys_values_segment_single_selected, params_chart.list_keys_values_segment_single_selected);
				Object.assign(chart_to_sync.list_keys_values_segments_multiples_selected, params_chart.list_keys_values_segments_multiples_selected)
			}
			
			chart_to_sync.sharedParams.filter_order_origin = chart_to_sync.id
		
			//sync colors
			//1.get the pos of active_segment_value
			var pos_active_segment_value = chart_to_sync.chart_instance.data.labels.indexOf(active_segment_value)
		
			//2.update colors
			var nb_of_categories = chart_to_sync.chart_instance.data.datasets[0].backgroundColor.length
			for (let index = 0; index < nb_of_categories; index++) {
				
				if (pos_active_segment_value > -1 && index !== pos_active_segment_value) {
				chart_to_sync.chart_instance.data.datasets[0].backgroundColor[index] = "rgba(240, 240, 240, 0.5)"
				}
				else if (index === pos_active_segment_value) {
				var color = chart_to_sync.backgroundColorArray_source[active_segment_value];
				color = color.replace(', 0.65)', ', 1)')
				chart_to_sync.chart_instance.data.datasets[0].backgroundColor[index] = color;
				}
				else if (pos_active_segment_value === -1) {
				var label_value = chart_to_sync.chart_instance.data.labels[index]
				chart_to_sync.chart_instance.data.datasets[0].backgroundColor[index] = chart_to_sync.backgroundColorArray_source[label_value]
				}
			}
			
			setTimeout(()=> {chart_to_sync.chart_instance.update()}, 200)
		
			}			
	}

	

	filter_external_charts(params_chart, sharedParams, active_segment_value) {
		if (!params_chart.graphics_to_filter || params_chart.graphics_to_filter.constructor != Array || !params_chart.graphics_to_filter.find(e=> e.id)) {
			console.warn('at ' + params_chart.id + ', the graphics_to_filter object contains errors')
			return
		}

		
		if (params_chart.graphics_to_filter)
		params_chart.graphics_to_filter.forEach(g=> {
			//find the charts to be sync
			sharedParams.sharedParams_array.forEach(sh=> {
			var chart_to_filter = _.find(sh.params_charts, {id: g.id})
			if (chart_to_filter) {				
				var join_fields = g.join_fields
				if (join_fields) {
					var cat_field_transcoded = sharedParams.transcode_join_fields(join_fields, params_chart.category_field)
					Object.keys(active_segment_value).forEach(k=> {
						if (Object.keys(join_fields).includes(k) || Object.values(join_fields).includes(k)) {
							active_segment_value[cat_field_transcoded] = active_segment_value[k]
							delete active_segment_value[params_chart.category_field]
						}
					})

				}
				//check if there is a delay
				chart_to_filter.inject_type = 'update'
				chart_to_filter.filtered_by['axis'] = active_segment_value;
				if (g.delay_time) {
					setTimeout(()=> {chart_to_filter.instanciator.updateChart(chart_to_filter, chart_to_filter.sharedParams, active_segment_value)}, g.delay_time)
				}
				//check if there is a condition to meet iot sync the chart
				else if (g.on_display) {
					var check_display = setInterval(()=> {
						var el_target = document.getElementById(g.on_display);
						if (el_target && el_target.style.display !== "" && el_target.style.display !== "none") {
							chart_to_filter.instanciator.updateChart(chart_to_filter, chart_to_filter.sharedParams, active_segment_value)
							clearInterval(check_display)
						}
					}, 500)
				}
				else {
					chart_to_filter.instanciator.updateChart(chart_to_filter, chart_to_filter.sharedParams, active_segment_value)
				}

				build_filter_array_public(chart_to_filter, chart_to_filter.sharedParams, active_segment_value)
			}
			})
			
		})

	}




	trigger_chart_display(params_chart, sharedParams) {
		let chart_source = sharedParams.params_charts.find(c=> c.id === params_chart.build_on.params_chart_id)
		let monitor_chart_source_clicks = setInterval(() => {
			if (!chart_source) {
				console.warn(`unable to mount the display of the chart ${params_chart.id}, the source chart ${params_chart.build_on.params_chart_id} is undefined`)
				clearInterval(monitor_chart_source_clicks)
			}
			else {
				if (chart_source.list_idx_segment_single_selected.length > 0 || chart_source.list_idx_segments_multiples_selected.length > 0 || !_.isEmpty(chart_source.brush_values) > 0) {
					//if (chart_source.chart_type = "chartJS") {chart_source.chart_instance.options.animation.duration = 2400}
					//params_chart.ctx.style.visibility = "visible";
					params_chart.ctx.style.filter = 'blur(0px)';
					var container_messageWait = document.querySelector('#messageWait_'+params_chart.id)
					if (container_messageWait) {
						Object.assign(container_messageWait.style, {
							opacity: "0", 
							display: 'none',
							backgroundColor: 'rgba(232, 232, 232, 0.6)',
							height: params_chart.ctx.clientHeight*0.95+'px',
							width: params_chart.ctx.clientWidth+'px',
							}
						)}
				}
				else {
					//params_chart.ctx.style.opacity = "0"
					//params_chart.ctx.style.visibility = "visible";
					params_chart.ctx.style.filter = 'blur(5px)';
					let marginTop = 0
					if (params_chart.chart_sub_type === 'pie') marginTop='30%'
					var container_messageWait = document.querySelector('#messageWait_'+params_chart.id)
					if (container_messageWait) {
						Object.assign(container_messageWait.style, {
							opacity: "0.7", 
							display: 'grid',
							backgroundColor: 'rgba(232, 232, 232, 0.6)',
							height: params_chart.ctx.clientHeight*0.95+'px',
							width: params_chart.ctx.clientWidth+'px',
							marginTop: marginTop
						})}
				}
			}
		}, 200);
	}



	create_parent_container(params_chart, sharedParams) {
		//create parent container for the general container, the title, the controls, the brush & chart
		const parent_container = document.createElement('div'); var id_parent = 'parent_container_' + params_chart.id


		//inject user styles
		if (params_chart.style) {
			//get original width		
			if (params_chart.style.chart_width) {var width_px = params_chart.style.chart_width*1.1+"px"; var width = params_chart.style.chart_width}
			else {var width = 400, width_px = "400px"}

			//get margins
			if (params_chart.style.marginTop) {var marginTop = params_chart.style.marginTop}
			else {var marginTop = "0px"}
		}

		const general_container = document.createElement('div'); var id_general = 'general_container_' + params_chart.id
		if (params_chart.style.boxShadow) {var boxShadow = "box-shadow: 0px 2px 5px 1px rgba(0, 0, 0, 0.24)"}
		else {var boxShadow = ""}
		Object.assign(parent_container, {id: id_parent, style: `display: none; grid-template-rows: auto auto; grid-row-gap: 4px; ${boxShadow}; padding: 5px; justify-self: center; margin-top: ${marginTop}; border: solid 2px; border-color: rgb(244,67,54,0); border-radius: 1%; transition: border-color 1.5s;`})
		//parent_container.style += ''
		Object.assign(general_container, {id: id_general, style: `display: none; grid-template-rows: auto auto auto; grid-row-gap: 1%; padding: 5px; justify-self: center; position: relative`})

		if (params_chart.chart_type === 'chartJS') {
			var monitor_chart_instance_creation = setInterval(() => {
				if (params_chart.chart_instance.constructor == Object) {
					params_chart.chart_instance.options.maintainAspectRatio = false
					clearInterval(monitor_chart_instance_creation)
				}
			}, 1000);
		}
				
					
		parent_container.style.width = width_px; 
		//parent_container.style.height = (width*params_chart.style.aspectRatio+50)+"px"			
		parent_container.style.height = "max-content"

		general_container.style.width = width_px; 
		general_container.style.height = (width*params_chart.style.aspectRatio)+"px"			

		//create the title
		
			//1.get the parent node of the chart				
			
			//2.create the title
			var titleContainer = document.createElement('div'); titleContainer.id = "titleContainer_" + params_chart.id
			titleContainer.style = "display: grid; width: max-content; height: max-content; justify-self: center"

			if (params_chart.title.constructor == Array) {
				params_chart.title.forEach(title=> {
					create_title_text(params_chart, title)
				})
			}
			else if (params_chart.title.constructor == String) {
				create_title_text(params_chart, params_chart.title)
			}
			
			parent_container.append(titleContainer)

			function create_title_text(params_chart, title_text) {
				var title = document.createElement('span'); title.id = params_chart.id + '_title'; title.style = 'align-self: center; justify-self: center; height: max-content; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #666'; 
				title.innerText = title_text
				titleContainer.append(title);
			}			
		
		//create node for crossfilter info
			var crossfilterContainer = document.createElement('div'); crossfilterContainer.id = "crossfilterContainer_" + params_chart.id
			//var width = document.getElementById(params_chart.id).clientWidth
			crossfilterContainer.style = `display: flex; flex-wrap: wrap; width: initial; height: 20px; justify-self: left; column-gap: 4px`
			//crossfilterContainer.style = `display: grid; grid-template-columns: auto auto auto auto; grid-template-rows: auto auto; width: initial; height: 40px; justify-self: left; column-gap: 4px; row-gap: 2px`
			var title_node = document.createElement('p'); title_node.style = 'font-size: 12px; margin: 4px'; title_node.innerText = 'Filtres: '
			crossfilterContainer.append(title_node)
			parent_container.append(crossfilterContainer)

			var crossfilterContainer_tooltip = document.createElement('div'); crossfilterContainer_tooltip.id = "crossfilterContainer_tooltip_" + params_chart.id		
			crossfilterContainer_tooltip.style = `display: flex; width: initial; height: 20px; justify-self: left; column-gap: 4px`
			var phantom_title_node = document.createElement('p'); phantom_title_node.style = 'font-size: 12px; margin: 4px; opacity: 0;'; phantom_title_node.innerText = 'Filtres: '
			crossfilterContainer_tooltip.appendChild(phantom_title_node)
			parent_container.append(crossfilterContainer_tooltip)

		//insert parent & general container after the chart node
		//1.check the chart type
		let chart_node
		if (params_chart.ctx) {
			chart_node = params_chart.ctx
		}
		else if (params_chart.htmlNode) {
			chart_node = document.getElementById(params_chart.htmlNode)
		}
		insertAfter(chart_node, parent_container)
		insertAfter(chart_node, general_container)
		//move the chart node inside the genegral container
		general_container.append(chart_node)
		//move the genegral container inside the parent
		parent_container.append(general_container);

		//create a figure label		
		// let fig = create_figure_label(params_chart)
		// parent_container.append(fig)
		
		if (params_chart.build_on?.messageWait) {
			let container_messageWait = document.createElement('div'); container_messageWait.id = 'messageWait_'+params_chart.id
			container_messageWait.style = `display: grid; opacity: 0.7; border-radius: 5px; background-color: rgba(232, 232, 232, 0.6); width: ${width*1.0}; padding: 4px; text-align: center; position: absolute; border: solid 1px; justify-self: center; align-self: center`
			let parent_chart = sharedParams.params_charts.find(c=> c.id === params_chart.build_on.params_chart_id)				
			if (parent_chart.figure) {var message_figure = parent_chart.figure}
			else {var message_figure = `(figure ${parent_chart.figure_auto})`}
			let messageWait = document.createElement('h6'); messageWait.style = 'opacity: 0.8; color: black; justify-self: center; align-self: center; place-self: center;text-align: center;'; messageWait.innerText = params_chart.build_on.messageWait + ` ${message_figure}`;
			container_messageWait.append(messageWait);
			general_container.append(container_messageWait)
			
			if (params_chart.chart_type === 'chartJS') {
				chart_node.style.opacity = '0'
			}
			else if (params_chart.chart_type === 'leaflet') {
				document.getElementById(params_chart.htmlNode).style.opacity = '0'
			}
		}

		parent_container.style.display = "grid"
		general_container.style.display = "grid"


		function insertAfter(referenceNode, newNode) {
			referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
		}
	}	


	//build ref_list of encoded fields to decode, and the associated labels
	build_common_ref_list(sharedParams) {
		let common_ref_list = [], common_ref_list_content, lookupTable = [], codes_labels = [], mainKey, target_field, alias;
		sharedParams.params_charts.forEach(p=> {
			if (p.fields_to_decode && ['bar', 'pie', 'curve'].includes(p.chart_sub_type)) {
				if (p.fields_to_decode.constructor == Array) {
					lookupTable = p.fields_to_decode[0].lookupTable; mainKey = p.fields_to_decode[0].mainKey, target_field = p.fields_to_decode[0].fields[0], alias = p.fields_to_decode[0].alias
					if (!common_ref_list.includes(lookupTable[0])) {
						common_ref_list = common_ref_list.concat(lookupTable)
						codes_labels.push({field: mainKey, target_field: target_field, alias: alias})
					}
				}
				else if (p.fields_to_decode.constructor == Object) {
					lookupTable = p.fields_to_decode.lookupTable; mainKey = p.fields_to_decode.mainKey, target_field = p.fields_to_decode.fields[0], alias = p.fields_to_decode.alias
					if (!common_ref_list.includes(lookupTable[0])) {
						common_ref_list = common_ref_list.concat(lookupTable)
						codes_labels.push({field: mainKey, target_field: target_field, alias: alias})
					}
				}
			}
			else if (p.fields_to_decode && p.chart_sub_type === 'grouped_bar') {
				if (p.fields_to_decode.category_field) {
					lookupTable = p.fields_to_decode.category_field.lookupTable; mainKey = p.fields_to_decode.category_field.mainKey, target_field = p.fields_to_decode.category_field.target_field, alias = p.fields_to_decode.category_field.alias
					if (!common_ref_list.includes(lookupTable[0])) {
						common_ref_list = common_ref_list.concat(lookupTable)
						codes_labels.push({field: mainKey, target_field: target_field, alias: alias})
					}            
				}
				if (p.fields_to_decode.sub_category_field) {
					lookupTable = p.fields_to_decode.sub_category_field.lookupTable; mainKey = p.fields_to_decode.sub_category_field.mainKey, target_field = p.fields_to_decode.sub_category_field.target_field, alias = p.fields_to_decode.sub_category_field.alias
					if (!common_ref_list.includes(lookupTable[0])) {
						common_ref_list = common_ref_list.concat(lookupTable)
						codes_labels.push({field: mainKey, target_field: target_field, alias: alias})
					}            
				}
			}
	
			sharedParams.common_ref_list = common_ref_list;
			sharedParams.codes_labels = codes_labels
			if (sharedParams.aliases) {
				sharedParams.aliases.forEach(o=> {
					// //if the current field exists in the fields to encode array && have an alias, neutralize it
					// if (sharedParams.codes_labels.find(e=> e.field === o.field) && sharedParams.codes_labels.find(e=> e.field === o.field).alias) {
					// 	o.field = undefined
					// }
					//if the current element (alias object field) exists in the fields to encode array && does not have an alias, use the current alias
					if (sharedParams.codes_labels.find(e=> e.field === o.field) && !sharedParams.codes_labels.find(e=> e.field === o.field).alias) {
						sharedParams.codes_labels.find(e=> e.field === o.field).alias = o.alias;
					}
					//if the current field does not exists in the fields to encode array, add it
					else if (!sharedParams.codes_labels.find(e=> e.field === o.field)) {
						sharedParams.codes_labels.push(o)
					}
					
					
				})			
			}
			sharedParams.aliases = [...sharedParams.codes_labels]; sharedParams.codes_labels = undefined
		})
	}


  	transcode_join_fields(join_fields, field_to_transcode) {
		var transcoded_field;    
		if (Object.keys(join_fields).includes(field_to_transcode)) {
			transcoded_field = join_fields[field_to_transcode]
		}
		else if (Object.values(join_fields).includes(field_to_transcode)) {
			var _join_fields = {..._.invert(join_fields)}
			transcoded_field = _join_fields[field_to_transcode]
		}
		return transcoded_field 
	}  


	position_brush_transformer(params_chart) {
		if (params_chart.brush_mode) {
			return
			var monitor_brush_creation = setInterval(() => {
				//let svg_brushParent = d3.select(`#brushParent_${params_chart.id} > svg`)
				let svg_brushParent = d3.select('.svg-plot_brushParent_'+params_chart.id)

				var transformer_brushParent = d3.select('#transformer_brushParent_'+params_chart.id)
				if (!svg_brushParent.empty()) {
					let left = params_chart.chart_instance.chartArea.left, top = params_chart.chart_instance.chartArea.top;
					let width =params_chart.chart_instance.chartArea.width, height= params_chart.chart_instance.chartArea.height;

					svg_brushParent
						.attr('transform', `translate(${left}, ${top})`)
						.attr('width', width)
						.attr('height', height)

					transformer_brushParent
						//.attr('transform', `translate(${left}, ${top})`)
						.attr('width', width)
						.attr('height', height);

					let brush = d3.select('#brush_'+params_chart.id)
					brush.attr('width', width).attr('height', height)

					let brush_overlay = d3.select(`#brush_${params_chart.id} > rect.overlay`)
					brush_overlay.attr('width', width).attr('height', height)

					//preserve scales position & dim
					d3.select('#svg-y_axis' + '_' + params_chart.id)
						.attr('width', params_chart.yScale.width)
						.attr('height', params_chart.yScale.height)
						//.attr('transform', `translate`)

					//preserve scales position & dim
					d3.select('#svg-x_axis' + '_' + params_chart.id)
						.attr('width', params_chart.xScale.width)
						.attr('height', params_chart.xScale.height)
						.attr('transform', `translate(${params_chart.xScale.transform.translateX}, ${params_chart.xScale.transform.translateY})`)						

					//clearInterval(monitor_brush_creation)
				}
			}, 1000);

		}		
	}

	create_continuous_brush_controls(params_chart) {
		let chart_node, chart_instance
		if (params_chart.ctx) {
			chart_node = params_chart.ctx
		}
		else if (params_chart.htmlNode) {
			chart_node = document.getElementById(params_chart.htmlNode)
		}
	
		//get the parent node of the chart			
		let parentElement = document.getElementById('parent_container_' + params_chart.id)
		let general_container = document.getElementById('general_container_'+params_chart.id)
		general_container.style.justifySelf = 'start'
		parentElement.style.opacity = '1'
		

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
		let height
		if (params_chart.style.chart_height) {
			height = params_chart.style.chart_height+"px"
		}
		else {
			height = (width*params_chart.style.aspectRatio)+"px"
		}
		
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

		chart_node.style.justifySelf = 'center'


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
					//hide custom handles at first
					// let customHandles=document.getElementsByClassName("handle--custom"+params_chart.id)
					// for (let index = 0; index < customHandles.length; index++) {
					// 	customHandles[index].style.display='none';							
					// }					
					params_chart.brush_customHandles.attr('display', 'none')
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
				params_chart.brush_customHandles.attr('display', 'none')
				svgSceen.style.display = 'block'
			}

			//clean previous bush
			var brushBox = d3.select('#brush_' + chart_node.id)
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
			var brushBox = d3.select('#brush_' + chart_node.id)
			try{
				brushBox.call(d3.brush().clear)
			}
			catch (err) {
				console.error('brush clean error: ' +err)
			}


			//deactivate behaviour for other controls
			params_chart.brush = false; params_chart.zoom_in = false

			
		})
		

	}
	

	create_continuous_brush_windows(params_chart) {
		//remove previous brush elements if they exist
		let svg_parent = d3.select('#svg_parent_container' + '_' + params_chart.id)
		if (!svg_parent.empty()) svg_parent.remove()
		
		const brush_node_name = '#brushParent_' + params_chart.id
		const container = d3.select(brush_node_name);

		var canvasChart_id = params_chart.id
		var canvasChart = document.getElementById(canvasChart_id)//.getContext('2d');
		// Init SVG
		let width, height, margin_left, margin_top
		if (params_chart.chart_type === "chartJS") {
			width = params_chart.chart_instance.chartArea.width;
			height = params_chart.chart_instance.chartArea.height;
			margin_left = params_chart.chart_instance.chartArea.left;
			margin_top = params_chart.chart_instance.chartArea.top
	
		}
		else if (params_chart.chart_type === "d3") {
			width = params_chart.canvasWidth;
			height = params_chart.canvasHeight;
			margin_left=params_chart.margin.left; margin_top=params_chart.margin.top;
		}

		const svgChart = container.append('svg:svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'svg-plot_brushParent_' + params_chart.id)
			.attr('id', 'svg_parent_container' + '_' + params_chart.id)
			.attr('style', 'position: absolute')
			.attr('transform', `translate(${margin_left}, ${margin_top})`)
			.append('g')
			.attr('id', 'transformer_brushParent_' + params_chart.id)
			
			

		



		const svgSceen = document.getElementsByClassName('svg-plot_brushParent_' + params_chart.id)[0]
		
		svgSceen.style.display = 'none'
		
		Object.assign(params_chart.sharedParams.interaction_events, {[canvasChart_id]: {type_event: {click: false}, brushed: false}})

		
		// var brush_width = Object.values(params_chart.chart_instance.scales)[0].maxWidth //- params_chart.chart_instance.scales["x-axis-1"].margins.right
		// var brush_height = Object.values(params_chart.chart_instance.scales)[1].height

		//test option:
		
		//var brush_height_curve_param = params_chart.chart_instance.scales["y-axis-0"].height
		params_chart.brush_dim = {width: width, height: height}		    
		const brush = d3.brushX().extent([[0, 0], [width, height]])
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
	   

		//custom handles
			var brushResizePath = function(d) {
				var e = +(d.type == "e"),
					x = e ? 1 : -1,
					y = height / 2;
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
	  

		function brush_startEvent() {
			console.log('start');
			var s = d3.event.selection

			var check_brush_state
			if (['scatter', 'bubble'].includes(params_chart.chart_sub_type)) {
				check_brush_state = d3.sum(s[0]) - d3.sum(s[1])
			}
			else if (params_chart.chart_sub_type === 'tick') {
				check_brush_state = s[1] - s[0]
			}
			
			//if the brush is inactiv, restore original colors
			if (check_brush_state === 0) {
				//params_chart.funcLib.restorColors(params_chart, params_chart.sharedParams);					
				params_chart.brush_values = {}
				params_chart.brush_keys_values = {}

				//if (check_brush_state=== 0 && params_chart.selection_params.brush.mode === 'highlight') {
					//disable animations for scatterplots
				//	if (params_chart.chart_sub_type === 'scatter' || params_chart.chart_sub_type === 'bubble') {
						//params_chart.funcLib.restor_external_scatterplots_colors(params_chart);
						//params_chart.chart_instance.options.transitions.active.animation.duration = 0; // disables the animation for 'active' mode
				//	}
					//params_chart.funcLib.restore_choroplete_map_tiles_color(params_chart)	
					
				//}
				params_chart.funcLib.restorColors(params_chart)
				restore_external_charts_colors(params_chart)
				
				handle.attr("display", "none");
				
			}

		}

		function brush_brushEvent() {
			const s = d3.event.selection;
			if (s && params_chart.selection_params.brush.mode === 'brushEvent') {
				params_chart.funcLib.highlight_brush(params_chart, s)
				params_chart.funcLib.activate_brush_filter(params_chart,s)
			}        
			else if (s && params_chart.selection_params.brush.mode === 'highlightEvent') {
				params_chart.funcLib.highlight_brush(params_chart, s)
				params_chart.funcLib.activate_brush_highlight(params_chart,s)
			}

			handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - height / 4] + ")"; });
		}




		function brush_endEvent() {
			const s = d3.event.selection;
			console.log(s)
			if (s && params_chart.selection_params.brush.mode === 'brushEndEvent') {
				params_chart.funcLib.activate_brush_filter(params_chart,s)
			}
			else if (s && params_chart.selection_params.brush.mode === 'highlightEndEvent') {
				params_chart.funcLib.activate_brush_highlight(params_chart,s)	
			}
		}

		var id = canvasChart.parentNode.id;
		var querySelectorOverlay = '#' + id + ' > svg > g > g > rect.overlay';
		
		
		var overlay = document.querySelector(querySelectorOverlay)
		params_chart.brush_area = {overlay: {x: overlay.x.baseVal.value, y: overlay.y.baseVal.value, width: overlay.width.baseVal.value, height: overlay.height.baseVal.value},
									gap_left:0, gap_top: 0}

		params_chart.ind_generate_brush = true;


		function restore_external_charts_colors(params_chart) {
			params_chart.highlight_charts?.forEach(chart_id=> {				
				//get params chart instance
				let params_chart_target = params_chart.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
				
				if (params_chart_target) {
					//let brush_intervals = get_brush_intervals(params_chart, params_chart_target);
					if (params_chart_target.chart_sub_type === 'scatter' || params_chart_target.chart_sub_type === 'bubble') {
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
							l.setStyle({'fillColor': l.options.original_color});
							l.setStyle({'color': l.options.original_color});												
						})
						restoreMapsLegendColors(params_chart_target)
					}
					else if (params_chart_target.chart_sub_type === 'choroplete_map') {												
						params_chart_target.featureGroup.eachLayer(l=> {
							l.setStyle({'fillColor': l.options.style.fillColor_source});
						});						
					}
				}
			})

			function restoreMapsLegendColors(params_chart) {
				let legend=document.getElementById("grid-container_legends_" + params_chart.id)
				legend.childNodes.forEach(c=> {
					//display original color
					c.firstChild.style.backgroundColor = c.firstChild['data-originalColor']
				})
			}

			
		}
	}


	create_standard_tooltip(params_chart, tooltip_list, mouseX, mouseY) {
		let tooltip_container, tooltip_content
		if (!params_chart.tooltip_container) {
			tooltip_container = document.createElement('div'); tooltip_container.id = "tooltip_container_" + params_chart.id
					
			Object.assign(tooltip_container.style, {'font-size': '12px', 
										width: 'max-content', 
										height: 'max-content', 
										color: 'white', 
										'background-color': '#ff5f22',
										margin: '4px',
										'padding-left': '3px',
										'padding-right': '3px',
										opacity: 1,
										position: 'absolute',
										'border-radius': '4px',
										opacity: 0.95
									})
		
			tooltip_content = document.createElement('div'); tooltip_content.id = 'tooltip_content_' + params_chart.id; 
			
			Object.assign(tooltip_content.style, {
				visibility: 'visible',
				width: `max-width`,
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
				'word-break': 'break-word',
				opacity: 0.95
			})
	
		}
		else {
			tooltip_container = document.getElementById("tooltip_container_" + params_chart.id);
			tooltip_content = document.getElementById('tooltip_content_' + params_chart.id); 
		}
		
		Object.keys(tooltip_list).forEach(k=> {

			if (!tooltip_container.innerText.includes(k)){
				var tootlip_node = document.createElement('p'); //tootlip_node.id = `node_${_k}_crossfilterContainer_` + params_chart.id;
				tootlip_node.style = 'font-size: 12px; color: white; margin: 4px; padding-left: 3px; padding-right: 3px; opacity: 1; text-align: left; width: max-content';
				tootlip_node.id = `tooltipText_${k}_${params_chart.id}`
				tootlip_node.innerHTML = `<strong>- ${k}: </strong>${tooltip_list[k]}`;
				tooltip_content.appendChild(tootlip_node)

			}
			else {
				var tootlip_node = document.getElementById(`tooltipText_${k}_${params_chart.id}`);
				tootlip_node.innerHTML = `<strong>- ${k}: </strong>${tooltip_list[k]}`;
			}

		})
		
		let parent_chart_container = document.getElementById('parent_container_'+params_chart.id);
		if (!params_chart.tooltip_container) {
			tooltip_container.appendChild(tooltip_content)
			params_chart.tooltip_container = tooltip_container			
			parent_chart_container.append(tooltip_container)
			//document.body.append(tooltip_container)
		}
		tooltip_container.style.display = ''
		let x_parent_chart_container = parent_chart_container.getBoundingClientRect().x;
		let y_parent_chart_container = parent_chart_container.getBoundingClientRect().y;
		
		//tooltip_container.style.transform= `translate(${mouseX-x_parent_chart_container-tooltip_container.scrollWidth-12}px, ${mouseY-y_parent_chart_container}px)`

		d3.select('#tooltip_container_' + params_chart.id)
			.style("opacity", 0)
			.style("transform", `translate(${params_chart.mouseX_previous}px, ${params_chart.mouseY_previous})px`)			
			.transition().duration(500)
			.style("opacity", 0.95)
			.style("transform", `translate(${mouseX-x_parent_chart_container-tooltip_container.scrollWidth-12}px, ${mouseY-y_parent_chart_container}px)`);

		params_chart.mouseX_previous = mouseX-x_parent_chart_container-tooltip_container.scrollWidth-12;
		params_chart.mouseY_previous = mouseY-y_parent_chart_container;


		let mousemove_tooltip_container = tooltip_container.addEventListener('mousemove', (e)=> {
			if (Math.abs(params_chart.mouseX - e.x)>4) {//&& e.y !== mouseY) {
				tooltip_container.style.display = 'none'
				removeEventListener('mousemove', mousemove_tooltip_container)
			}
		})
	}

	highlight_chart_border(params_chart) {
		let container
		if (params_chart.chart_type === 'chartJS' || params_chart.chart_type === 'd3') {
			container =document.querySelector('#parent_container_'+params_chart.id)
		}
		else if (params_chart.chart_type === 'leaflet') {
			container =document.getElementById(params_chart.htmlNode)
		}
		
		if (!container) return

		container.style.borderColor = 'rgb(244,67,54,1)'

		setTimeout(()=> {
			container.style.borderColor = 'rgb(244,67,54,0)'
		}, 1600)		
	}


	get_backgroundColor(params_chart, name) {
		let color_keys, color_values, color_key, color_value;
		params_chart.sharedParams.sharedParams_array.some(sh=> {                    
			let registed_colors_values = Object.values(sh.registed_colors)
			if (sh.registed_colors && registed_colors_values.length >0) {                        
				registed_colors_values.some(o=> {
					color_keys = Object.keys(o);
					color_values = Object.values(o);

					
					color_keys.some(c=> {
						//case when the name of the color key is included in the name of the btn;
						if (name.includes(c)) {
							color_value = o[c];
							return color_value
						}
						//case when the name of the btn is included in the name of the color key;
						else if (c.includes(name)) {
							color_value = o[c];
							return color_value
						}
					})
					return color_value
				})                        
			}
			if (color_value) return color_value
		});
		if (color_value) return color_value
	}	
}
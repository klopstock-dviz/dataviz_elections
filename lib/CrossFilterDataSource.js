
function generate_crossfilter_predicat(filterList) {
	var fl = (Object.values(_.groupBy(filterList, 'field')))
	var dyn_filter = "if (", dyn_filter_tmp = "";
	fl.forEach(e=> {		
		var operation_type = e.map(o=> o.operation);
		if (operation_type.includes('include')) {
			var expr = "(";
			e[0].values.forEach(el=> {
				if (typeof(el) === 'string') {el = '"' + el + '"'}
				expr = expr + "row." + e[0].field + " === " + el + ' || '
			})
			expr = expr.substring(0, expr.lastIndexOf('||'))
			expr = expr+")"
			dyn_filter_tmp = dyn_filter_tmp + expr + " && ";
		}
		else if (operation_type.includes('exclude')) {
			var expr = "(";
			e[0].values.forEach(el=> {
				if (typeof(el) === 'string') {el = '"' + el + '"'}
				expr = expr + "row." + e[0].field + " !== " + el + ' && '
			})
			expr = expr.substring(0, expr.lastIndexOf('&&'))
			expr = expr+")"
			dyn_filter_tmp = dyn_filter_tmp + expr + " && ";		
		}
		else if (operation_type.includes('>=') || operation_type.includes('<=')) {
			e.forEach(op=> {
				if (op.operation === '>=') {
					var expr = "row." + op.field + " >= " + op.value;
					dyn_filter_tmp = dyn_filter_tmp + expr + " && ";
				}
				else if (op.operation === '<=') {
					var expr = "row." + op.field + " <= " + op.value;
					dyn_filter_tmp = dyn_filter_tmp + expr + " && ";
				}
			}) 
		}
		else if ((operation_type.includes('>') && !operation_type.includes('=')) || (operation_type.includes('<') && !operation_type.includes('='))) {
			e.forEach(op=> {
				if (op.operation === '>') {
					var expr = "row." + op.field + " > " + op.value;
					dyn_filter_tmp = dyn_filter_tmp + expr + " && ";
				}
				else if (op.operation === '<') {
					var expr = "row." + op.field + " < " + op.value;
					dyn_filter_tmp = dyn_filter_tmp + expr + " && ";
				}
			}) 
		}	
		else if (e.length > 1 && (operation_type.includes("between") || operation_type.includes("brush_map"))) {
			var nb_op = 1
			dyn_filter_tmp += '('
			e.forEach(op=> {
				//set the conjuction to use
				if (nb_op < e.length) {
					var conjuction = " || "
				}
				else {conjuction = ") && "}
				//build the expression
				var expr = "(" + "row." + op.field + " >= " + op.valueMin + ' && '  + "row." + op.field + " <= " + op.valueMax + ")"			
				dyn_filter_tmp = dyn_filter_tmp + expr + conjuction;
				nb_op++
			})

		}
		else if (e.length === 1 && (operation_type.includes("between") || operation_type.includes("brush_map"))) {
			var expr = "(" + "row." + e[0].field + " >= " + e[0].valueMin + ' && '  + "row." + e[0].field + " <= " + e[0].valueMax + ")"			
			dyn_filter_tmp = dyn_filter_tmp + expr + " && ";		
		}
		else if (e.length > 1 && operation_type.includes("between_binMode")) {
			var nb_op = 1
			dyn_filter_tmp += '('
			e.forEach(op=> {
				//set the conjuction to use
				if (nb_op < e.length) {
					var conjuction = " || "
				}
				else {conjuction = ") && "}
				var expr = "(" + "row." + op.field + " >= " + op.valueMin + ' && '  + "row." + op.field + " < " + op.valueMax + ")";
				dyn_filter_tmp = dyn_filter_tmp + expr + conjuction;
				nb_op++
			})
		}
		else if (e.length === 1 && operation_type.includes("between_binMode")) { 
			var expr = "(" + "row." + e[0].field + " >= " + e[0].valueMin + ' && '  + "row." + e[0].field + " < " + e[0].valueMax + ")";
			dyn_filter_tmp = dyn_filter_tmp + expr + " && ";		
		}
	})

	dyn_filter_tmp = dyn_filter_tmp.substring(0, dyn_filter_tmp.lastIndexOf(' && '))
	dyn_filter = "if(" + dyn_filter_tmp + ")"
    if (String.prototype.replaceAll) {
        dyn_filter = dyn_filter.replaceAll('_binned', ''); dyn_filter = dyn_filter.replaceAll('_brushed', '')
    }
    else {
        while (dyn_filter.includes('_binned')) {dyn_filter = dyn_filter.replaceAll('_binned', '')}; while (dyn_filter.includes('_brushed')) {dyn_filter = dyn_filter.replaceAll('_brushed', '')}
    }
	return dyn_filter
}



function build_func_crossfilter(predicate, array) {
	var func = "console.time('t'); var result_for=[]; var array_max = array.length;for (var i=0; i < array_max; i++) {var row = array[i];" + predicate + "{result_for.push(row)} }; console.timeEnd('t'); return result_for"
	var custom_filter_loop_dyn = new Function("array", func);
	var result_for = custom_filter_loop_dyn(array)
	return result_for
}

function CrossFilterDataSource(data_source, filterList) {
    if (filterList.length > 0) {
        var predicate = generate_crossfilter_predicat(filterList);
        var result = build_func_crossfilter(predicate, data_source)
        return result
    }
    else return data_source
}



function formFilterArray(params_chart, filterList) {
    var filter_array = {};
    Object.assign(filter_array, filterList)

    var filter_array_transformed=[]; 
    Object.keys(filter_array).forEach(key=> {
        if (key.includes('_brushed')) {
            filter_array[key].forEach(value=> {
                var pos_sep = value.indexOf("_");
                var valueMin = parseFloat(value.substring(0, pos_sep));
                var valueMax = parseFloat(value.substring(pos_sep+1));
                filter_array_transformed.push({field:key.replace('_brushed', ''), operation: "between", valueMin: valueMin, valueMax: valueMax});            
            })
        }
        else if (key.includes('_binned')) {
            filter_array[key].forEach(value=> {
                var pos_sep = value.indexOf("-");
                var valueMin = parseFloat(value.substring(0, pos_sep));
                var valueMax = parseFloat(value.substring(pos_sep+1));
                filter_array_transformed.push({field:key.replace('_binned', ''), operation: "between_binMode", valueMin: valueMin, valueMax: valueMax});            
            })
        }
        else {
            filter_array_transformed.push({field:key, operation: "include", values: filter_array[key]});
        }
    });

    //flaten the values for the include operations
    filter_array_transformed.map(o=> { if (o.operation === "include" && typeof(o.values) === "object") {o.values = o.values.flat()} })

    //reset crossfilet object
    if (params_chart.reset_crossfilter === undefined) {params_chart.transformations.crossfilter = {} }
    

    return filter_array_transformed

}





function prepare_engage_crossfilter(data_chart, params_chart, filterList, sharedParams) {
    //stat exec time
    var t1 = (new Date())/1000, data_chuncks = [];
    //transform the filterList into an array that we can push in it filter objects
    filterList = Object.values(filterList).filter(l=> l.field !== "")
                
                    
    //prepare data filter
    //1.check if the filter contains binned field
    //var filter_binned_fields = filterList.filter(o=> o.field.indexOf("_binned") > -1)

    //2.check if the filter contains brushed field
    //var filter_brushed_fields = filterList.filter(o=> o.field.indexOf("_brushed") > -1)

    //handle the case of binned values
    // if (filter_binned_fields.length > 1) {              
    //     //2.1.rebuild an array of all non binned fields
    //     var filterList_non_binned_fields = filterList.filter(f=> f.field.indexOf("_binned") === -1)

    //     //map
    //     filter_binned_fields.map(binned_field=> { 
    //         var final_filterList = [...filterList_non_binned_fields]

    //         //2.2.fusion the array built in 2.1 with each object of filter_binned_fields
    //         final_filterList.push(binned_field)

    //         //2.3.launch the crossfilter func with the array built in 2.2   
    //         var data_chunck = getFiltredData(data_chart, final_filterList, params_chart, sharedParams)

    //         data_chuncks = data_chuncks.concat(data_chunck)
    //         //console.table(final_filterList)
    //         final_filterList = []
    //     })

    //     var t2 = (new Date())/1000; var tf = parseFloat((t2-t1).toFixed(3))
    //     sharedParams.crossfilterData_exec_time.push({[params_chart.id]: tf, time: (new Date).toLocaleString()})

    //     params_chart.data_crossfiltred = true

    //     return data_chuncks

        
    // }

    //handle the regular case of discrete values
    //else {
        var data_chuncks = getFiltredData(data_chart, filterList, params_chart, sharedParams);

        params_chart.data_crossfiltred = true

        return data_chuncks

    //}       
}

function getFiltredData(data_chart, filterList, params_chart, sharedParams) {

    //build the id used by the current cross-filter process
    var id_current_filter = filterList.map(o=> Object.values(o).join()).join("|")
    

    //check if the current id filter exist in previous generated filters
    var id_previous = ""

    //if the current filter exist in the record of previous filters, use its promise
    // if (sharedParams.params_data_filtred.hasOwnProperty(id_current_filter) && params_chart.multithreading !== false) {
    //     //timing
    //     var t1 = new Date()
    //     sharedParams['time_workers_' + params_chart.id] = {start: t1}        

    //     //indicate that this chart has inherited from another chart filter
    //     params_chart.transformations['filter_origin'] = sharedParams.params_data_filtred[id_current_filter].generatedBy
    //     return sharedParams.params_data_filtred[id_current_filter].promise
    // }

    var reuse_promise = undefined
    if (sharedParams.params_data_filtred?.hasOwnProperty(id_current_filter) && params_chart.multithreading !== false) {
        var chart_generator = sharedParams.params_data_filtred[id_current_filter].generatedBy
        if (chart_generator === params_chart.id) {
            var reuse_promise = true
        }
        else {var reuse_promise = false}
    }
    if (reuse_promise) {
        //timing
        var t1 = new Date()
        sharedParams['time_workers_' + params_chart.id] = {start: t1}        

        //indicate that this chart has inherited from another chart filter
        params_chart.transformations['filter_origin'] = sharedParams.params_data_filtred[id_current_filter].generatedBy
        return sharedParams.params_data_filtred[id_current_filter].promise
    }    
    //else proceed to a new crossfilter operation
    else {
        //if multithreading = false, use single thread
        if (!sharedParams.multithreading || sharedParams.phase === 'init' || params_chart.multithreading === false) {
            var data_chart = CrossFilterDataSource(data_chart, filterList);
            params_chart.transformations['filter_origin'] = params_chart.id
            return data_chart
        }
        //else use all created threads
        else if (sharedParams.multithreading && sharedParams.phase === 'running') {
            var promise_dataset_filtred = process_filter()            
            
            //save the id filter & associated promise
            if ((params_chart.chart_type === "chartJS" || params_chart.chart_type === "leaflet") && !id_current_filter.includes('between')) {
                sharedParams.params_data_filtred[id_current_filter] = {promise: promise_dataset_filtred, generatedBy: params_chart.id} 
            }
            params_chart.transformations['filter_origin'] = params_chart.id
            return promise_dataset_filtred
         }
    }
    

    

 

    async function process_filter() {
        let promises = []
        //timing
        var t1 = new Date()
        sharedParams['time_workers_' + params_chart.id] = {start: t1}

        //dispatch filter params among the workers
        Object.values(sharedParams.Workers_crossfilter).forEach(w=> {            
            var promise = w.worker_instance.crossfilter({filterList: filterList, chart: params_chart.id})
            w['exec_crossfilter'] = true
            promises.push(promise)
        })

        //
        sharedParams.promises = promises

        //gather the promises for the datasets filtred
        sharedParams.promises_results=[]                
        await Promise.all(promises).then((results)=> {results.forEach(r=> {sharedParams.promises_results=sharedParams.promises_results.concat(r)} )} )

        return sharedParams.promises_results

    }    

    
}


function filter_local_dataset(filterArray, data_filtred) {
    filterArray.forEach(f=> {
		        
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

    return data_filtred
}
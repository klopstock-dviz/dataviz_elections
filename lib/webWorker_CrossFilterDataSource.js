self.onmessage = function(e) {
  
  if (typeof(CrossFilterDataSource) === "undefined") {
    console.time('import scripts')
    //importScripts('CrossFilterDataSource.js')
    console.timeEnd('import scripts')
  }

  if (!buffer_container) {
  	var buffer_container = {}
  } 

	var filterList = [{field: "INSEE_COM", operation: "include", values: ["31555","06088","44109","34172","67482","33063","75115","59350","35238","75120","75118","75119","51454","75113","42218","83137","76351","75117","75116", "38185"]}, 
	{field: "nb_pieces", operation: "<", value: 7}, {field: "prix_m2_vente", operation: "<", value: 15000}, {field: "taux_rendement_n7", operation: "<", value: 20}
	,{field: "surface", operation: "<", value: 300}]

  if (e.data.message === 'hold_data_buffer') {
  	var data_source = e.data.buffer
  	var typed_array = new Float32Array(data_source)
  	buffer_container[e.data.typed_array_title] = typed_array
  	console.log("data_source.length: " + data_source.length)
  	postMessage('data received & hold')	
  	return
  }


  if (e.data.message === 'hold_data') {
  	var data_source = e.data.data_source  	
  	this.data_source = data_source
  	console.log("data_source.length: " + data_source.length)
  	postMessage('data received & hold')	
  	return
  }



	if (e.data.message === "Crossfilter") {
		CrossFilterDataSource_inner(this.data_source, filterList)
	}
  
  
  console.time('CrossfilterWorker1')
  var dataset_filtred = CrossFilterDataSource_inner(data_source, filterList)
  console.timeEnd('CrossfilterWorker1')
  postMessage(dataset_filtred);


	function CrossFilterDataSource_inner(data_source, filterList) {
	    filterList.map(f=> {
	        
	        if (f.operation === "include") {
	            data_source = data_source.filter((item)=> f.values.indexOf(item[f.field]) !== -1)		            
	        }
	        else if (f.operation === "exclude") {
	            data_source = data_source.filter((item)=> f.values.indexOf(item[f.field]) === -1)
	        }        
	        else if (f.operation === "<") {
	            var fieldName = f.field; var fieldValue = f.value
	            data_source = data_source.filter((item)=> item[fieldName] < fieldValue)
	        }
	        else if (f.operation === ">") {
	            var fieldName = f.field; var fieldValue = f.value
	            data_source = data_source.filter((item)=> item[fieldName] > fieldValue)
	        }
	        else if (f.operation === "<=") {
	            var fieldName = f.field; var fieldValue = f.value
	            data_source = data_source.filter((item)=> item[fieldName] <= fieldValue)
	        }
	        else if (f.operation === ">=") {
	            var fieldName = f.field; var fieldValue = f.value
	            data_source = data_source.filter((item)=> item[fieldName] >= fieldValue)
	        }
	        else if (f.operation === "between") {
	            var fieldName = f.field; var fieldValueMin = f.valueMin; var fieldValueMax = f.valueMax;
	            data_source = data_source.filter((item)=> item[fieldName] >= fieldValueMin && item[fieldName] <= fieldValueMax)
	        }
	        else if (f.operation === "between_binMode") {
	            var fieldName = f.field.replace("_binned", ""); var fieldValueMin = f.valueMin; var fieldValueMax = f.valueMax;
	            data_source = data_source.filter((item)=> item[fieldName] >= fieldValueMin && item[fieldName] < fieldValueMax)
	        }		        
	    })

	    return data_source
	}

 }

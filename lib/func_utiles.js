
(function(exportName) {
  var exports = exports || {};
  /**
   * 创建开发者工具状态监听器
   *
   * @param {Object|Function} options 配置项
   * @param {number} options.delay 侦测频率，单位：ms
   * @param {boolean} options.once 只触发一次
   * @param {string} option.label 显示文字
   * @param {Function} options.onchange 状态发生改变 function (status) {}
   * @return {Object} 返回开发者工具状态监听器
   */
  function create(options) {
    if (typeof options === "function") {
      options = {
        onchange: options
      };
    }
    options = options || {};
    var delay = options.delay || 1000;
    var instance = {};
    instance.onchange = options.onchange;
    var status = "unknown";
    /**
     * 获取开发者工具状态
     *
     * @return {string} "unknown": 未知, "on": 开启, "off": 关闭
     */
    function getStatus() {
      return status;
    }
    instance.getStatus = getStatus;
    function checkHandler() {
      if (
        window.Firebug &&
        window.Firebug.chrome &&
        window.Firebug.chrome.isInitialized
      ) {
        setStatus("on");
        return;
      }
      var r = /./;
      r.toString = function() {
        checkStatus = "on";
        setStatus("on");
      };
      checkStatus = "off";
      console.log("%c", r, options.label || "");
      
      if (!options.once) {
        if (console.clear) {
          console.clear();
          //console.log('reload page')
          //window.location.reload(true)
        }
      }
      setStatus(checkStatus);
    }
    /**
     * 设置开发者工具状态
     *
     * @param {string} value 状态 "unknown": 未知, "on": 开启, "off": 关闭
     */
    function setStatus(value) {
      if (status !== value) {
        status = value;
        if (typeof instance.onchange === "function") {
          instance.onchange(value);
        }
      }
    }
    var timer;
    if (!options.once) {
      setInterval(checkHandler, delay);
      window.addEventListener("resize", checkHandler);
    } else {
      checkHandler();
    }
    /**
     * 是否已释放
     */
    var freed;
    /**
     * 释放资源
     */
    function free() {
      if (freed) {
        return;
      }
      freed = true;
      if (!options.once) {
        window.removeEventListener("resize", checkHandler);
        clearInterval(timer);
      }
    }
    instance.free = free;
    return instance;
  }
  exports.create = create;
  if (typeof define === "function") {
    if (define.amd || define.cmd) {
      define(function() {
        return exports;
      });
    }
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  } else {
    window[exportName] = exports;
  }
})("jdetects");

// jdetects.create(function(status) {
// 	console.log(status);  
// });


function deduplicate_dict(dict, champ) {
  unique = [...new Set(dict.map(p => p[champ]))];
  return unique
}

function deduplicate_array(array) {
  unique = [...new Set(array)];
  return unique
}
 


function trier(key, order = 'asc') {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      return 0;
    }

    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//randomize arrays
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }; return array
}


//change the position of an element in an array
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};


function data_decimation(params_chart, dataset) {
  if (dataset.length < params_chart.limit_decimation) { return dataset}
  
  console.time('data decimation time for ' + params_chart.id)
  //1.get dataset length
  var dataset_length = dataset.length
  //2.calculate data to decimate
  var data_to_decimate = dataset_length - params_chart.limit_decimation
  //3.calculate the rate of decimation
  var rate_of_decimation = data_to_decimate/dataset_length
  //4.calculate the nb of rows to delete each 10 rows
  var nb_of_rows_to_delete = Math.floor((10*data_to_decimate)/dataset_length)

  //5.generate the sample of the rows to delete
  var model_rows_to_delete = [];

  function get_row_index() {
    var row_index = getRandomInt(10)
    if (model_rows_to_delete.includes(row_index)) {get_row_index()}
    else {model_rows_to_delete.push(row_index)}
  }
  for (var i = 0; i < nb_of_rows_to_delete; i++) { get_row_index()}   
  model_rows_to_delete.sort()


  //build the array of the indexes to delete
  var rows_to_delete = []
  for (var i = 0; i < dataset_length; i++) {
    //6.1.get the rows indexes for the current tenth group of rows
    if (Number.isInteger(i/10)) {
      var groupRows = i/10
      model_rows_to_delete.forEach(i=> rows_to_delete.push(groupRows*10+i))

    }
        }     

        //delete unwanted rows
        var rows_to_delete_length = rows_to_delete.length
  for (var i = rows_to_delete_length - 1; i >= 0; i--) {
    dataset.splice(rows_to_delete[i], 1)
  }

  console.timeEnd('data decimation time for ' + params_chart.id)

  return dataset
}


function dataset_extent(domain, dataset, hue_field) {
  if (!dataset || dataset.length === 0) return;

  if (domain[0] === "auto" || domain[0] === 0 || domain[0] === "min") {
    var min = d3.min(dataset, o=> o[hue_field])
  }
  else if (typeof(domain[0]) === "string") {
    if (domain[0].indexOf("p") > -1) {
      var quartil = domain[0]
      quartil = parseFloat(quartil.replace("p",""))
      var min = Quartile(dataset.map(o=> o[hue_field]), quartil)
    }
  };

  //check if a max domain is provided, if no pick up the max value of the bin_field
  if (domain[1] === "auto" || domain[1] === "max") {
    var max = d3.max(dataset, o=> o[hue_field])
  }
  else if (typeof(domain[1]) === "string") {
    if (domain[1].indexOf("p") > -1) {
      var quartil = domain[1]
      quartil = parseFloat(quartil.replace("p",""))
      var max = Quartile(dataset.map(o=> o[hue_field]), quartil)
    }
  }

  return {min: min, max: max}
}



function concat_typed_arrays(typed_arrays) {
  var length = 0
  typed_arrays.forEach(arr=> {
    length = length+arr.length
  })

  var concatenated_arrays = new Uint32Array(length);

  var previous_arr_length=0
  typed_arrays.forEach(arr=> {
    concatenated_arrays.set(arr, previous_arr_length)
    previous_arr_length = previous_arr_length + arr.length
  })

  //exclude doubles values
  concatenated_arrays = Array.from(new Set(concatenated_arrays))

  return concatenated_arrays
}



function create_progress_spinner(params_chart) {
  //1.create the elements
  var grid_container = document.createElement('div'); grid_container.style = 'display: grid; align-self: center'; grid_container.id = params_chart.id + '_gridContainer'
  var spinner = document.createElement('div'); spinner.className="lds-dual-ring"; spinner.id= params_chart.id + "_spinner"; spinner.style.display = 'none';
  spinner.style.alignSelf = 'center'; spinner.style.justifySelf = 'center'; spinner.style.margin = 'auto'
  
  //2.append the grid to the parent element of the chart
  //2.1 get the parent element of the chart
  if (params_chart.chart_type === 'chartJS' && params_chart.chart_sub_type === "scatter") {
    var parentElement = document.getElementById(params_chart.parentNode)
    parentElement.appendChild(spinner)
  }
  else if (params_chart.chart_type === 'chartJS' && params_chart.chart_sub_type !== "scatter") {
    var parentElement = params_chart.ctx.parentElement
    

  }
  // else if (params_chart.chart_type === 'leaflet') {
  //   var parentElement = document.getElementById(params_chart.id).parentElement
  // }
  // //2.2 append the grid
  // parentElement.appendChild(grid_container)

  // //3.append the chart & the spinner to the grid      
  // if (params_chart.chart_type === 'chartJS' && params_chart.chart_sub_type === 'scatter') {
  //   //var chart_node = document.getElementById(params_chart.ctx.id)
  //   parentElement.appendChild(spinner)
  // }
  // else if (params_chart.chart_type === "leaflet" && params_chart.chart_sub_type === "map") {var chart_node = document.getElementById(params_chart.id)}
  // chart_node.style.alignSelf = 'center'
  // grid_container.appendChild(chart_node)
  // grid_container.appendChild(spinner)
}

function create_spinner(spinner_type) {
  //source: https://loading.io/css/
  //1.create the elements
  var grid_container = document.createElement('div'); grid_container.style = 'display: grid; align-self: center'; 
  var spinner = document.createElement('div'); spinner.className=spinner_type || 'lds-ellipsis';
  spinner.style.alignSelf = 'center'; spinner.style.justifySelf = 'center'; spinner.style.margin = 'auto'

  //build the inner structure according to the spinner type
  if ([undefined, 'lds-ellipsis'].includes(spinner_type)) {
    spinner.innerHTML='<div></div><div></div><div></div><div></div>'
  };
  if (spinner_type === 'lds-roller') {
    spinner.innerHTML='<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>'
  }
  
  grid_container.append(spinner)
  return grid_container
}


function downloadTextFile(text, name) {
  const a = document.createElement('a');
  const type = name.split(".").pop();
  a.href = URL.createObjectURL( new Blob([text], { type:`text/${type === "txt" ? "plain" : type}` }) );
  a.download = name;
  a.click();
}


function download_csv(array_to_transform, sep, fileName) {
    function array_to_csv(array_to_transform, sep) {
        var array_of_result = [Object.keys(array_to_transform[0]).join(sep) + '\n'];
        array_to_transform.forEach(row => {
            var values = Object.values(row).join(sep) + '\n'
            array_of_result.push(values)
        });
        return array_of_result
    }

    var array_as_csv = array_to_csv(array_to_transform, sep)

    //create download node
    const a = document.createElement('a'); a.id = fileName
    const type = fileName.split(".").pop();
    a.href = URL.createObjectURL( new Blob([array_as_csv], { type:`text/${type === "txt" ? "plain" : type}` }) );
    //window.open(a.href, '_self');
    a.download = fileName;
    a.click();

    a.remove()
}


function compare_arrays(arr, target) {return target.every(v => arr.includes(v))};

function detect_page_display(params_chart, sharedParams) {
  let watch = setInterval(()=> {
    var target_el = document.getElementById(params_chart.build_on.el_id)
    if (params_chart.build_on.display && target_el.style.display !== '' && target_el.style.display !== 'none') {
      params_chart.funcLib.init_chart(params_chart, sharedParams);
      clearInterval(watch);
    }
    else if (params_chart.build_on.classValue && target_el.classList.contains(params_chart.build_on.classValue)) {
      params_chart.funcLib.init_chart(params_chart, sharedParams);
      clearInterval(watch)
    }      
  }, 500)
}
//downloadTextFile(JSON.stringify(data), 'myObj.json');


// async function bench_workers_timing(sharedParams, filterList, params_chart) {
//     var t1 = new Date()
//     let promises = []
//     Object.values(sharedParams.Workers_crossfilter).forEach(w=> {            
//         var promise = w.worker_instance.crossfilter({filterList: filterList, chart: params_chart.id})
//         w['exec_crossfilter'] = true
//         promises.push(promise)
//     })

//     sharedParams.promises = promises

//     var result=[]   
//     await Promise.all(promises).then((results)=> {results.forEach(r=> {result=result.concat(r)} )} )

    

//     if (result.constructor == Promise) {
//       await result.then(r=> result = r)
//     }    
    
//     var time_workers = new Date() - t1    

    
//     //filter on the current chart results
//     result = result.filter(c=> c.chart === params_chart.id)
//     var indexes = result.map(r=> r.indexes)
//     //var indexes = [...result]

//     var result_length = d3.sum(indexes.map(r=> r.length))

//     //match the filtred indexes with the main dataset
//     var dataset_filtred = [];
//     indexes.forEach(index=> {
//         index.forEach(row_index=> {
//             dataset_filtred.push(sharedParams.data_main_groupBy_index[row_index][0])
//             //dataset_filtred.push(sharedParams.data_source_groupBy_index[row_index][0])
//         })                      
//     })

//     var time_total = new Date() - t1
//     return {time_workers: time_workers, time_total: time_total}

// }



// var arrayChangeHandler = {
//   get: function(target, property) {
//     console.log('getting ' + property + ' for ' + target);
//     // property is index in this case
//     return target[property];
//   },
//   set: function(target, property, value, receiver) {
//     console.log('setting ' + property + ' for ' + target + ' with value ' + value);
//     target[property] = value;
//     // you have to return true to accept the changes
//     return true;
//   }
// };

// var originalArray = [];
// var proxyToArray = new Proxy( originalArray, arrayChangeHandler );


// var arrayChangeHandler2 = {
//     get: function(target, property, value) {
//     // you have to return true to accept the changes
//     return true;
//   },
//   set: function(target, property, value, receiver) {
//     if (property === 'moveend') {
//       target[property] = target[property] + 1
//       //target[property] = value;
//     }
//     else if (property === 'update_scatter') {
//       var c = CrossFilterDataSource(value.data_source, value.transformations.filter);
//       target[property] = target[property] + 1
//       console.log(c.length);
//     }
    
//     // you have to return true to accept the changes
//     return true;
//   }  
// };




// var myCar = { 

//     /* Properties */
//     color: "blue", 
//     make: "Toyota", 
//     moveend: [],
    
//     /* Getter methods */
//     getColor: function() { 
//   return this.color; 
//     }, 
//     getMake: function() { 
//   return this.make; 
//     },  

//     /* Setter methods */
//     setColor: function(newColor) {
//         this.color = newColor;
//     },
//     setMake: function(newMake) {
//   this.make = newMake;
//     },
//     listenChange: function(s, a, b) {
//       if (this.moveend.length > 0) {
//         s.upd(a,b)
//         console.log(s.res)}
//     }
// };



//turf calc area
//1.get original poly
//var p=polygons[0].polygone.geometry.coordinates
//2.create a turf poly
//turf_poly = turf.helpers.polygon(p)
//3.calc the area of the turf poly
//turf.area.default(turf_poly)




//def join
function join_v2(mainTable, lookupTable, mainKey, lookupKey, fields) {
  var t1 = new Date()
  var l = lookupTable.length,
      m = mainTable.length,
      lookupIndex = [],
      output = [];
  for (var i = 0; i < l; i++) { // loop through l items
      var row = lookupTable[i];
      lookupIndex[row[lookupKey]] = row; // create an index for lookup table
  }
  for (var j = 0; j < m; j++) { // loop through m items
      var mainRow = mainTable[j];
      var lookupRow = lookupIndex[mainRow[mainKey]]; // get corresponding row from lookupTable
      if (lookupRow !== undefined) {output.push(select(mainRow, lookupRow, fields))}; // select only the columns you need
  }

  function select(mainRow, lookupRow, fields) {        
    fields.forEach(f=> {
      lookupRow.hasOwnProperty(f) ? mainRow[f] = lookupRow[f] : {}
    })
    return mainRow            
  };  

  console.log('join_v2 time for: [' + fields + ']: ' + (new Date() - t1))
  //return output;
}



function join_aggregate(mainTable, lookupTable, mainKey, lookupKey, field, selection) {
  var t1 = new Date()
  var l = lookupTable.length,
      m = mainTable.length,
      lookupIndex = [],
      output = [];

  // loop through lookupTable items
  //1.group the items of lookup table by the lookup key
  var t2 = new Date()
  var groups = _.groupBy(lookupTable, lookupKey);
  console.log('group fields: ' + (new Date() - t2))
  //2.aggregate the items grouped
  var items_grouped = {}; 
  var t3 = new Date()
  Object.values(groups).forEach(gr=> { 
    if (selection === "count") {return items_grouped[gr[0][lookupKey]]= gr.length}
    else {return items_grouped[gr[0][lookupKey]]= d3[selection](gr, f=> f[field]) }
  }) 
  console.log('aggregate fields: ' + (new Date() - t3))

  //3.loop through mainTable items & add computed field
  //v1
  var t1bis = new Date()
  for (var j = 0; j < m; j++) {
      var mainRow = mainTable[j];
      var lookupRow = items_grouped[mainRow[mainKey]]; // get corresponding row from lookupTable
      if (lookupRow) output.push(select(mainRow, lookupRow, field)); // select only the columns you need      
  }
  console.log('v1 loop through mainTable items & add computed field: ' + (new Date() - t1bis))

  //v2
  var t1bis = new Date()
  var keys_grouped = Object.keys(items_grouped)
  mainTable.filter(r=> keys_grouped.includes(r[mainKey])).forEach(r=> {
      var mainRow = r;
      var lookupRow = items_grouped[mainRow[mainKey]]; // get corresponding row from lookupTable
      if (lookupRow != undefined) output.push(select(mainRow, lookupRow, field)); // select only the columns you need      
  })
  console.log('v2 loop through mainTable items & add computed field: ' + (new Date() - t1bis))

  function select(mainRow, lookupRow, field) {              
    mainRow[selection + "_" + field] = lookupRow      
    return mainRow            
  };  

  console.log('join & ' + selection + ' time for: ' + field + ': ' + (new Date() - t1))
  //return output;
}



// fonction ko ?
function join_aggregate_multiple_fields(mainTable, lookupTable, mainKey, lookupKey, fields) {
  var t1 = new Date()
  var l = lookupTable.length,
      m = mainTable.length,
      lookupIndex = [],
      output = [];

  // loop through lookupTable items
  //1.group the items of lookup table by the lookup key
  var t2 = new Date()
  var groups = _.groupBy(lookupTable, lookupKey);
  console.log('group fields: ' + (new Date() - t2))
  //2.aggregate the items grouped
  var items_grouped = {}; 
  var t3 = new Date()
  Object.values(groups).forEach(gr=> {       
      items_grouped[gr[0][lookupKey]] = fields.map(f=> {
        if (f.selection === 'count') {return {[f.field]: gr.length} }
        else {return {[f.field]: d3[f.selection](gr, s=> s[f.field])} } 
      }) 
  })
  console.log('aggregate fields: ' + (new Date() - t3))

  //3.loop through mainTable items & add computed field
  //v1
  var t1bis = new Date()
  for (var j = 0; j < m; j++) {      
      var mainRow = mainTable[j];
      var lookupRow = items_grouped[mainRow[mainKey]]; // get corresponding row from lookupTable
      if (lookupRow) output.push(select(mainRow, lookupRow, fields)); // select only the columns you need      
  }
  console.log('v1 loop through mainTable items & add computed field: ' + (new Date() - t1bis))

  //v2
  /*var t1bis = new Date()
  var keys_grouped = Object.keys(items_grouped)
  mainTable.filter(r=> keys_grouped.includes(r[mainKey])).forEach(r=> {
      var mainRow = r;
      var lookupRow = items_grouped[mainRow[mainKey]]; // get corresponding row from lookupTable
      if (lookupRow) output.push(select(mainRow, lookupRow, field)); // select only the columns you need      
  })
  console.log('v2 loop through mainTable items & add computed field: ' + (new Date() - t1bis))*/

  
  function select(mainRow, lookupRow, fields) {              
    fields.map(f=> {
      var value = lookupRow.filter(ff=>  ff[f.field])
      //v1
      if (value.length > 0) {
        mainRow[f.field] = value[0][f.field]
      }
      else {
        mainRow[f.field] = 0
      }
      //v2
      //value.length > 0 ? mainRow[f.selection + "_" + f.field] = value[0][f.field] : {}
    })
      return mainRow            
  };  


  var f = fields.map(e=> e.field)
  console.log('join_aggregate_v2 time for: [' + f + '] : ' + (new Date() - t1))
  //return output;
}






function groupBy_aggregate(dataset, groupBy_key, agg_params) {
  agg_params.forEach(o=> {
    if (!o.field) {return `unable to execute the function. The aggregation field is not proprely named. The expected format is [{field: "xxx", operation: "xxx"}]`}
    if (!dataset.find(f=> f[o.field])) {
      return `unable to execute the function. The aggregation field ${o.field} don't exist in the dataset`
    }
  })
  if (!dataset.find(f=> f[groupBy_key])) {
    return "unable to compute the groupBy. The dataset, the groupBy_key or the agg_field are invalid"
  }

  let groups = _.groupBy(dataset, groupBy_key);
  if (groups && !groups.hasOwnProperty(undefined)) {
    let final_result = {}, result = [], value, return_msg
    Object.keys(groups).forEach(k=> {
      agg_params.forEach(o=> {
        if (o.operation === 'count') {
          value = groups[k].length
        }
        else if (['mean', 'median', 'sum'].includes(o.operation)) {
          value = d3[o.operation](groups[k], f=> f[o.field])
        }
        else if (o.operation === 'first') {
          value = groups[k][0][o.field]
        }
        else if (o.operation === 'last') {
          var last_pos = groups[k].length
          value = groups[k][last_pos-1][o.field]
        }
        else {
          return_msg = 'agg_type is unknown'
        }
        //result.push({field_name: [o.operation+"_"+o.field], value: value})
        if (!final_result.hasOwnProperty(k)) {
          final_result[k] = {}
        }
        final_result[k][groupBy_key] = k
        final_result[k][o.operation+"_"+o.field] = value
      })
      result.forEach(f=> {
        //final_result[k] = {[groupBy_key]: k, [f.field_name]: value}
      })
      
    })
    
    if (return_msg) {
      return return_msg}
    else {
      return Object.values(final_result)
    }
  }
  
}





//insert a node after another node
function insertHtmlNodeAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

//create a figure number for the charts
function create_figure_label(params_chart) {
  if (params_chart.figure) {
    var figure_number = params_chart.figure
  }
  else {
    var figure_number = params_chart.figure_auto;// params_chart.figure = 'figure ' + figure_number
  }
  let fig = document.createElement('span'); fig.style = "align-self: end; justify-self: center; font-size: 12px; font-weight: bold; color: grey; margin-top: 15px" 
  fig.innerText = 'Figure '+ figure_number;
  
  return fig
}


//traverse html node parents
function find_node_parents(node) {
  if (!node || !node.parentElement) return  
  var current_node = node.parentElement;
  let parent_nodes = [current_node];
  for (let index = 0; index < 1000; index++) {    
    current_node = parent_nodes[index]
    if (current_node && current_node.parentElement) {
      parent_nodes.push(current_node.parentElement)
    }
    else {
      return parent_nodes
    }    
  }
}


//asses parent display
//returns true is a parent node is displayed (! none)
function check_parent_display(params_chart) {
  var chart_parent_nodes = find_node_parents(document.getElementById(params_chart.id))
  if (!chart_parent_nodes) {
    chart_parent_nodes = find_node_parents(document.getElementById(params_chart.htmlNode))
  }
  if (!chart_parent_nodes) {
    chart_parent_nodes = find_node_parents(document.getElementById(params_chart.chart_instance?.canvas?.id))
  }

    
  var chart_display_off, chart_display_on;
  chart_parent_nodes.forEach(node=> {
    if (node.style.display === "none") {chart_display_off = true}
  })
  chart_display_off ? chart_display_on = false : chart_display_on = true
  return {chart_display_on: chart_display_on}
}


function deepCopyArray(data_source) {
  let data_copy = [];
  data_source.forEach(r=> data_copy.push({...r}))
  return data_copy
}

function check_qpv(communes_selected, qpv_polys, data_stats_communes, ref_insee) {
  let qpv_comm_selected =[]; 
  communes_selected.forEach(com=> {
    qpv_polys.forEach(qpv=> {
      if (qpv.LIST_COMARR_2020.includes(com)) {
        //var population_totale = data_stats_communes.find(r=> r.CODGEO === com).P17_POP
        qpv_comm_selected.push({commune: com, qpv: qpv.QP, lib_qpv: qpv.LIB_QP, type_population: "qpv", population: qpv.Pop_2013})
      } 
    }) 
  })
  //add the communes with 0 pop in qpv
  var arr= deduplicate_dict(qpv_comm_selected, 'commune')
  var diff = _.difference(communes_selected, arr).forEach(d=> {
    qpv_comm_selected.push({commune: d, qpv: "", lib_qpv: "", type_population: "qpv", population: 0})
  })
  
  let group = d3.nest().key(k=> k.commune).rollup(p=> d3.sum(p, v=> v.population)).entries(qpv_comm_selected)
  let qpv_stats = [];
  group.forEach(o=> {
    var commune = o.key
    var lib_commune = ref_insee.find(e=> e.INSEE_COM === commune).LIBCOM
    var population_commune = data_stats_communes.find(r=> r.CODGEO === commune).P17_POP
    qpv_stats.push({commune: commune, lib_commune: lib_commune, type_population: "Commune", population: population_commune, part_pop_qpv: +(o.value/population_commune).toFixed(2)})
    qpv_stats.push({commune: commune, lib_commune: lib_commune, type_population: "QPV", population: o.value, part_pop_qpv: +(o.value/population_commune).toFixed(2)})
  })
  return qpv_stats
}



function transpose_table(_args) {
  let data = _args.data, 
  parent_column_name = _args.parent_column_name
  trans_column_name = _args.trans_column_name, 
  agg_column_name = _args.agg_column_name, 
  columns_to_preserve = _args.columns_to_preserve, 
  columns_to_transpose = _args.columns_to_transpose
  let table_transposed = [], col_name = '', output = {}
  
  //control the validity of the given args
  if (data.length === 0) return 'please provide a valid dataset'
  if (columns_to_transpose.length === 0) return "the argument 'columns_to_transpose' is empty"
  if (columns_to_preserve.length === 0) return "the argument 'columns_to_preserve' is empty"
  columns_to_transpose.forEach(col=> {
      if (!data.find(f=> f[col.field])) return "operation cancelled, the field '" + col.field + "' from the argument 'columns_to_transpose' does not exist in the dataset"
  })

  columns_to_preserve.forEach(col=> {
      if (!data.find(f=> f[col])) return "operation cancelled, the field '" + col + "' from the argument 'columns_to_preserve' does not exist in the dataset"
  })

  if (!trans_column_name) {
      trans_column_name = ""
      columns_to_transpose.forEach(col=> {
          trans_column_name = trans_column_name + "+" + col.field
      })
      trans_column_name = trans_column_name.slice(1)
  }
  if (!agg_column_name) agg_column_name = 'count'
  

  data.forEach(r=> {
      columns_to_transpose.forEach(col=> {
          if (col.alias) {col_name = col.alias}
          else {col_name = col.field}


          if (parent_column_name) {
            output = {[parent_column_name]: col.parent_field, [trans_column_name]: col_name, [agg_column_name]: r[col.field]}
          }
          else {
            output = {[trans_column_name]: col_name, [agg_column_name]: r[col.field]}
          }

          table_transposed.push(output)

          columns_to_preserve.forEach(c=> {
              table_transposed[table_transposed.length-1][c] = r[c]
          })
  
      })


  })
  
  return table_transposed
}



function binGenerator(params_chart, max_cells, min_cells, array_to_bin) {
  var array_binned = _.repeat(1, 11);
  var index = max_cells
  while (array_binned.length > max_cells) {
    

    var binGenerator = d3.histogram()
    .domain([params_chart.bin_min, params_chart.bin_max])// Set the domain to cover the entire intervall [0;]
    .thresholds(index);  // number of thresholds; this will create 19+1 bins		

    //bin hue values					
    var array_binned = binGenerator(array_to_bin).filter(a=> a.length > 0) ;

    if (array_binned.length > max_cells && index > min_cells) {
      index--
    }
    else {					
      array_binned[array_binned.length-1].x1++							
      params_chart.array_binned = array_binned
      max_cells = array_binned.length
    }					  
  }
  return array_binned
}



function build_int_arr(length) {
  let arr=[]; 
  console.time('pop arr'); 
  for (let i=0; i<length;i++) {
    arr.push(i*2)
  }; 
  console.timeEnd('pop arr');
  return arr
}

function custom_mean(arr) {
  var sum=0; var arr_length = arr.length; for (let i=0; i<arr_length; i++) {sum = sum+arr[i]};
  return sum/arr_length
}

function custom_sum(arr) {
  var sum=0; for (let i=0; i<arr.length; i++) {sum = sum+arr[i]};
  return sum
}

function custom_count(arr) {
	var arr_lenght = arr.length
	return arr_lenght
}

function custom_sort(arr) {
	return arr.sort()
}
//console.time('custom mean'); var m = custom_mean(arr); console.timeEnd('custom mean')
//console.time('custom sum'); var s = custom_sum(arr); console.timeEnd('custom sum')
//console.time('d'); r=d3.sum(arr); console.timeEnd('d')

var func = "return d3.sum(dataset, r=> r.C17_RP_HSTU1P_SUROCC)/d3.sum(dataset, r=> r.C17_RP_HSTU1P)"
function build_dataset(logements_iris) {
  var dataset = logements_iris.filter(r=> r.COM === '22278')
  return dataset}

var custom_function = new Function(func)


//clear console
// var checkStatus;   
// var element = document.createElement('any');
// element.__defineGetter__('id', function() {
//     checkStatus = 'on';
// });

// setInterval(function() {
//     checkStatus = 'off';
//     console.log(element);
//     console.clear();
//     //window.location.reload(true)
// }, 500);
    
let key_press={}
document.addEventListener('keydown', (e)=> {
  if (e.code === 'ControlLeft') {
     key_press[e.code] = {key: e.code, time: new Date}     
     check_touchs_combination(key_press)
  }
  if (e.code === 'ShiftLeft') {
    key_press[e.code] = {key: e.code, time: new Date}     
    check_touchs_combination(key_press)
  }
  if (e.code === 'KeyJ') {
    key_press[e.code] = {key: e.code, time: new Date}     
    check_touchs_combination(key_press)
  }

  function check_touchs_combination(key_press) {
    var dates_key_down = Object.values(key_press).map(o=> o.time)
    var interval_key_down = d3.max(dates_key_down) - d3.min(dates_key_down)
    if (compare_arrays(Object.keys(key_press), ['ControlLeft', 'ShiftLeft', 'KeyJ']) && interval_key_down < 10000 ) {
      console.log('ctrl+shifltLeft+J');
      key_press = {}
    }
  }
  // if (key_press.hasOwnProperty('ControlLeft') && e.code === 'ShiftLeft') {
  //   key_press[e.code] = {key: e.code, time: new Date} 
  //     if (key_press.hasOwnProperty('ShiftLeft') && e.code === 'KeyJ') {
  //       key_press[e.code] = {key: e.code, time: new Date} 
  //       console.log('ctrl+shifltLeft+J')
  //       key_press = {}
  //     }
  // } 

  
})




let ease_functions = {}
  ease_functions.easeLinear = function(t, b, c, d) {
      return c * t / d + b;
  }

  ease_functions.easeInQuad = function (t, b, c, d) {
      return c * (t /= d) * t + b;
  }

  ease_functions.easeOutQuad = function(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
  }

  ease_functions.easeInOutQuad = function (t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t + b;
      return -c / 2 * ((--t) * (t - 2) - 1) + b;
  }
  //Sinusoidal easing in
  ease_functions.easeInSine = function easeInSine (t, b, c, d) {
      return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  }
  //Sinusoidal easing out
  ease_functions.easeOutSine = function(t, b, c, d) {
      return c * Math.sin(t / d * (Math.PI / 2)) + b;
  }
  //Sinusoidal easing in and out
  ease_functions.easeInOutSine = function(t, b, c, d) {
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  }
  //Exponential easing in
  ease_functions.easeInExpo = function(t, b, c, d) {
      return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
  }
  //Exponential easing out
  ease_functions.easeOutExpo = function(t, b, c, d) {
      return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  }
  //Exponential easing in and out
  ease_functions.easeInOutExpo = function(t, b, c, d) {
      if (t == 0) return b;
      if (t == d) return b + c;
      if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
  }
  //Circular easing in
  ease_functions.easeInCirc = function(t, b, c, d) {
      return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  }
  //Circular easing out
  ease_functions.easeOutCirc = function(t, b, c, d) {
      return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  }
  //Circular easing in and out
  ease_functions.easeInOutCirc = function(t, b, c, d) {
      if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
  }
  //Cubic easing in
  ease_functions.easeInCubic = function(t, b, c, d) {
      return c * (t /= d) * t * t + b;
  }
  //Cubic easing out
  ease_functions.easeOutCubic = function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t + 1) + b;
  }
  //Cubic easing in and out
  ease_functions.easeInOutCubic = function(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t + 2) + b;
  }
  //Quartic easing in
  ease_functions.easeInQuart = function(t, b, c, d) {
      return c * (t /= d) * t * t * t + b;
  }
  //Quartic easing out
  ease_functions.easeOutQuart = function(t, b, c, d) {
      return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  }
  //Quartic easing in and out
  ease_functions.easeInOutQuart = function(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
  }
  //Quintic easing in
  ease_functions.easeInQuint = function(t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
  }
  //Quintic easing out
  ease_functions.easeOutQuint = function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }
  //Quintic easing in and out
  ease_functions.easeInOutQuint = function(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  }
  //Elastic easing in
  ease_functions.easeInElastic = function(t, b, c, d) {
      var s = 1.70158;
      var p = 0;
      var a = c;
      if (t == 0) return b;
      if ((t /= d) == 1) return b + c;
      if (!p) p = d * .3;
      if (a < Math.abs(c)) {
          a = c;
          var s = p / 4;
      }
      else var s = p / (2 * Math.PI) * Math.asin(c / a);
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  }
  //Elastic easing out
  ease_functions.easeOutElastic = function(t, b, c, d) {
      var s = 1.70158;
      var p = 0;
      var a = c;
      if (t == 0) return b;
      if ((t /= d) == 1) return b + c;
      if (!p) p = d * .3;
      if (a < Math.abs(c)) {
          a = c;
          var s = p / 4;
      }
      else var s = p / (2 * Math.PI) * Math.asin(c / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  }
  //Elastic easing in and out
  ease_functions.easeInOutElastic = function(t, b, c, d) {
      var s = 1.70158;
      var p = 0;
      var a = c;
      if (t == 0) return b;
      if ((t /= d / 2) == 2) return b + c;
      if (!p) p = d * (.3 * 1.5);
      if (a < Math.abs(c)) {
          a = c;
          var s = p / 4;
      }
      else var s = p / (2 * Math.PI) * Math.asin(c / a);
      if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
  }
  //Back easing in
  ease_functions.easeInBack = function(t, b, c, d) {
      let s
      if (s == undefined) s = 1.70158;
      return c * (t /= d) * t * ((s + 1) * t - s) + b;
  }
  //Back easing out
  ease_functions.easeOutBack = function(t, b, c, d) {
      let s
      if (s == undefined) s = 1.70158;
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  }
  //Back easing in and out
  ease_functions.easeInOutBack = function(t, b, c, d) {
      let s
      if (s == undefined) s = 1.70158;
      if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
      return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
  }    


//hash func: https://github.com/garycourt/murmurhash-js
function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;
	
	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;
	
	while (i < bytes) {
	  	k1 = 
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;
		
		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}
	
	k1 = 0;
	
	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);
		
		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}
	
	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}

function createButtonRippleEffect(element) {
  let target_el, posX, posY
  if (['PointerEvent', 'MouseEvent'].includes(element.constructor.name)) {
    target_el = element.currentTarget;    
    posX = element.clientX;
    posY = element.clientY;
  }
  else if (['HTMLDivElement', 'HTMLButtonElement'].includes(element.constructor.name)) {
    target_el = element
    let BoundingClientRect = element.getBoundingClientRect();
    posX = (BoundingClientRect.right - BoundingClientRect.left)/2;
    posY = (BoundingClientRect.bottom - BoundingClientRect.top)/2;    
  }
  
  const diameter = Math.max(target_el.clientWidth, target_el.clientHeight);
  const circle = document.createElement("span");  
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${posX - target_el.offsetLeft - radius}px`;
  circle.style.top = `${posY - target_el.offsetTop - radius}px`;
  circle.classList.add("ripple");

  const ripple = target_el.getElementsByClassName("ripple")[0];

  if (ripple) {
      ripple.remove();
  }

  if (!target_el.classList.contains('button_ripple_effect')) {
    target_el.classList.add('button_ripple_effect')
  }
  
  target_el.appendChild(circle);
}


function	isMarkerInsidePolygon(marker, poly) {
  /*source:
  https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
  https://github.com/substack/point-in-polygon
  */
      if (!marker || !poly) return
      
      var inside = false;
      //check if the marker object is a leaflet latLng point or marker
      let x, y
      if (marker.lat) {
        x = marker.lat; y = marker.lng
      }
      else if (marker.getLatLng) {
        x = marker.getLatLng().lng; y = marker.getLatLng().lat;
      }
      
      for (var ii=0;ii<poly.getLatLngs().length;ii++){
          var polyPoints = poly.getLatLngs()[ii];
          for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
              var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
              var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

              var intersect = ((yi > y) != (yj > y))
                  && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
          }
      }

      return inside;
  };


function create_droplist_fields(params_chart, droplist_fields, droplist_ID, inputBarOptions) {
  //create droplist for fields permutation
  //1.general container for the droplist
  var generalContainer_droplist = document.createElement('div'); 
  Object.assign(generalContainer_droplist, {
    className: '', 
    id: 'dropdownContainer_' + droplist_ID + '_'+params_chart.id,
  })
    
  Object.assign(generalContainer_droplist.style, {
    height: 'max-content',
    width: '100%',
    display: 'grid',
    'column-gap': '1px',
    'row-gap': '10px',
    'grid-template-columns': 'auto auto',
    //'align-items': 'center',
  })
  
  
  //2.create buttons
  //dropdown list
  var button_droplist = document.createElement('img'); 
  Object.assign(button_droplist, {
      //className: 'w3-button w3-teal', 
      id: `button_dropdown_${droplist_ID}_${params_chart.id}`, 
      src: 'css/font-awesome-svg/caret-square-down-solid.svg',
      title: 'Afficher la liste'
  })
  
  Object.assign(button_droplist.style, {
    width: "14px",
    boxShadow: '0 0 5px rgb(142 137 137 / 70%)',
    borderRadius: '2px',
    "align-self": 'center',    
  });

  button_droplist.addEventListener('mouseover', (e)=> {
    e.target.style.filter = 'invert(79%) sepia(50%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)';
    e.target.style.cursor = 'pointer'
  })
  button_droplist.addEventListener('mouseout', (e)=> {
    e.target.style.filter = 'invert(0%) sepia(72%) saturate(0%) hue-rotate(328deg) brightness(95%) contrast(106%)';
    e.target.style.cursor = ''
  });

  button_droplist.addEventListener('click', (e)=> {      
      var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
      if (!droplist.className.includes("w3-show")) {
        droplist.classList.add("w3-show");
        Object.values(droplist.getElementsByTagName('LI')).forEach(e=> {
          e.style.display = 'block'; 
          e.firstElementChild.style.display = 'block' 
        })
        e.target.title = 'Masquer';
        droplist.style.zIndex = '10';
      } 
      else { 
        droplist.classList.remove("w3-show");
        e.target.title = 'Afficher la liste'
        droplist.style.zIndex = '0'
      }
  })

   


  //clear button to clean the search area
  var button_clear_search = document.createElement('img'); 
  Object.assign(button_clear_search, {
      //className: 'w3-button w3-teal', 
      id: `button_clear_input_POI_${droplist_ID}_${params_chart.id}`, 
      src: 'css/font-awesome-svg/close-times-solid.svg',
      title: 'Effacer'
  });
  button_clear_search.dataset.input_searchBar_id = `input_text_${droplist_ID}_${params_chart.id}`
  
  Object.assign(button_clear_search.style, {
    width: "11.5px",
    transform: "translateX(-10px)",
    position: 'absolute',
    filter: 'invert(10%) sepia(25%) saturate(103%) hue-rotate(1543deg) brightness(132%) contrast(90%)',
    transition: 'opacity 1s',
    visibility: 'hidden',
    opacity: 0,
  });

  // button_clear_search.addEventListener('mouseover', (e)=> {e.target.style.width = '13px';})
  // button_clear_search.addEventListener('mouseout', (e)=> {e.target.style.width = '11.5px';})

  button_clear_search.addEventListener('click', ()=> {
      var input_searchBar = document.getElementById(`input_text_${droplist_ID}_${params_chart.id}`);
      var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
      var ul_container = droplist.getElementsByTagName('UL');

      //clear the input zone
      if (input_searchBar) {input_searchBar.value = ''}
      
      //clear & close the droplist
      droplist.classList.remove("w3-show");
      
      Object.values(ul_container[0].children).forEach(e=> {
        e.remove();
      })
           
  })

  button_clear_search.addEventListener('mouseover', (e)=> {
    e.target.style.visibility = 'visible';
    e.target.style.opacity = '1';
    e.target.style.cursor = 'pointer'
  });

  //add a spinner in the search box
  let spinner = create_spinner('lds-ellipsis');

  //positionning
  let check_chart_rendering = setInterval(()=>{
					
    var parent_container_display = check_parent_display(params_chart)
    if (parent_container_display.chart_display_on) {
      clearInterval(check_chart_rendering)
      let droplist_ID = params_chart.droplist_ID-1
      let input_searchBar = document.getElementById(`input_text_${droplist_ID}_${params_chart.id}`);
      if (!input_searchBar) return;

      let bbox_input_searchBar = input_searchBar.getBoundingClientRect();
      let button_clear_search =  document.getElementById(`button_clear_input_POI_${droplist_ID}_${params_chart.id}`);
      if (!button_clear_search) return;

      var input_searchBar_cs = getComputedStyle(input_searchBar);
      // let x = bbox_input_searchBar.width - (button_clear_search.clientWidth*2 - button_clear_search.clientWidth/2);
      // let input_border_top = parseFloat(input_searchBar_cs.borderTopWidth.replace('px', ''));
      // let input_padding_top = parseFloat(input_searchBar_cs.paddingTop.replace('px', ''));

      // let y = button_clear_search.clientWidth/2 - input_border_top - input_padding_top;

      let x = getComputedStyle(input_searchBar).width.replace('px','') - getComputedStyle(button_clear_search).width.replace('px','');
      let y = getComputedStyle(button_clear_search).height.replace('px', '')/2

      //expected output: translate(169px, 8.3px)
      button_clear_search.style.transform = `translate(${x}px, ${y}px)`

      //position the spinner in the search box    
      //spinner.style.transform = `translate(${x}px, ${y}px)`
    }
  }, 1000)

  //buggy code, fix later
      // document.addEventListener('click', (e)=> {            
      //     var droplist = document.getElementById("droplistBody_"+params_chart.id);
      //     if (e.target.id === button_droplist.id) {
      //         if (droplist.classList.contains("w3-show")) {
      //             droplist.classList.remove("w3-show");    
      //         }
      //         else {
      //             droplist.classList.add("w3-show");
      //         }
      //     }
      //     else if (e.target.id !== droplist.id) {
      //         droplist.classList.remove("w3-show");
      //     }

      // })

  //create an outer container for the input box & the clear button
  let outerContainer_input_searchBar = document.createElement('div');
  outerContainer_input_searchBar.id = `outerContainer_input_searchBar_POI_${droplist_ID}_${params_chart.id}`;
  outerContainer_input_searchBar.style.display = 'flex';
  
  //create input field
    let input_searchBar = document.createElement('input'), placeholder;            
    placeholder = 'Cliquer pour ajouter'
    input_searchBar.autocomplete="off"

    Object.assign(input_searchBar, {
      type: 'text', 
      id: `input_text_${droplist_ID}_${params_chart.id}`, 
      placeholder: placeholder,       
      //title: 'Type a field name'
    });

    input_searchBar.dataset.droplist_path = `droplistBody_${droplist_ID}_${params_chart.id}`,    
    

    Object.assign(input_searchBar.style, {
      // "background-image": "url('css/img/searchicon.png')",
      // "background-position": "10px 12px",
      // "background-repeat": "no-repeat",
      "width": "156px",
      height: '24px',
      "font-size": "11.5px",
      //"padding": "12px 20px 12px 40px",
      border: "1px solid #ddd",
      //"margin-bottom": "12px",
    })

    input_searchBar.addEventListener('keyup', (e)=> {
      if (!inputBarOptions) return
      if (!inputBarOptions.searchBar) return

        var input, filter, ul, li, span, i, txtValue;
        input = document.getElementById(`input_text_${droplist_ID}_${params_chart.id}`);
        filter = input.value.toUpperCase();
        //ul = document.getElementById("myUL");
        var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
        li = droplist.getElementsByTagName("li");
        for (i = 0; i < li.length; i++) {
            txtValue = undefined
            span = li[i].getElementsByTagName("span")[0];
            if (span) {txtValue = span.textContent || span.innerText}
            if (txtValue?.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }                    
      })

    //display the dropdown
    input_searchBar.addEventListener('click', (e)=> {
      let ul_container = document.getElementById(`droplist_fields_${droplist_ID}_${params_chart.id}`);
      if (ul_container) {
        ul_container = Object.values(ul_container.children).filter(c=> c.tagName !== 'HR')
        
        if (ul_container.length > 0) {
          let droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
          
          if (inputBarOptions && inputBarOptions.openDroplistOnclick) {
            if (!droplist.className.includes("w3-show")) droplist.classList.add("w3-show");
          }
        }
      };
      // let button_clear_search = document.getElementById(`button_clear_input_POI_${droplist_ID}_params_chart.id`);
      // button_clear_search.style.visibility = 'visible';
      // button_clear_search.style.opacity = '1';

    });

    //on escape key press, close the list
    input_searchBar.addEventListener('keydown', (e)=> {
      if (e.key === "Escape") {
        var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
        droplist.classList.remove("w3-show");
      }
    })

    //display the clear button
    input_searchBar.addEventListener('mousemove', (e)=> {
      let button_clear_search = document.getElementById(`button_clear_input_POI_${droplist_ID}_${params_chart.id}`);
      button_clear_search.style.visibility = 'visible';
      button_clear_search.style.opacity = '1';
    });

    input_searchBar.addEventListener('mouseover', (e)=> {
      let button_clear_search = document.getElementById(`button_clear_input_POI_${droplist_ID}_${params_chart.id}`);
      button_clear_search.style.visibility = 'visible';
      button_clear_search.style.opacity = '1';
    });

    input_searchBar.addEventListener('mouseout', (e)=> {
      let button_clear_search = document.getElementById(`button_clear_input_POI_${droplist_ID}_${params_chart.id}`);
      button_clear_search.style.opacity = '0';
      //setTimeout(()=> {button_clear_search.style.visibility = 'hidden'}, 1000);
    })

    outerContainer_input_searchBar.append(input_searchBar)
    generalContainer_droplist.append(outerContainer_input_searchBar, button_droplist,)
    
  //create droplist body
      var droplist_body = document.createElement('div'); 
      Object.assign(droplist_body, {
          className: "w3-dropdown-content w3-bar-block w3-card-4 w3-animate-zoom", 
          id: `droplistBody_${droplist_ID}_${params_chart.id}`, 
          style: 'width:max-content; padding: 5px; width: 180px;'
      })
      
      Object.assign(droplist_body.dataset, {
        input_text_zone: `input_text_${droplist_ID}_${params_chart.id}`,
        droplist_ID: droplist_ID
      })
      
  //attach events to the droplist body
  document.addEventListener("keydown", function(e) {
    if (e.code === "Escape") {
        var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);
        droplist.classList.remove("w3-show");
    }
  });


  //create ul node
      var ul_container = document.createElement('ul'); 
      Object.assign(ul_container, {
          className: 'dropdown-menu', 
          id: `droplist_fields_${droplist_ID}_${params_chart.id}`, 
          style: "list-style-type: none;padding: 0; margin: 0;"
      })
      



    
    droplist_fields?.some(element => {
      if (!element || element === '') return element
      let nb_of_fields=0
      var field_li;
      field_li = document.createElement('li');
      label = element;
      var field = document.createElement('span'); 
      Object.assign(field, {
          href:'', 
          className: "w3-bar-item w3-button droplist_field", 
          innerHTML: label
      })
      field.style.padding = '4px 6px';
      field.style.cursor = 'pointer';

      //on click, fill the input text zone with the span value & close the droplist
      field.addEventListener('click', (e)=> {
        let input = document.getElementById(`input_text_${droplist_ID}_${params_chart.id}`);
        input.value = field.innerText

        //if (inputBarOptions.closeDroplistOnclick) {
          var droplist = document.getElementById(`droplistBody_${droplist_ID}_${params_chart.id}`);    
          droplist.classList.remove("w3-show");  
        //}
                
      })

      // field.addEventListener('mouseover', ()=> {
      //     field.style.cursor = 'pointer'
      // })
          
      field_li.append(field)
      //add separator
      let separator = document.createElement('hr');
      separator.style.border= 0;
      separator.style['border-top'] = '2px solid #eee';
      separator.style.margin = '1px 0';
      

      if (field_li) ul_container.append(field_li, separator)
    });

  if (ul_container.childElementCount>0) ul_container.lastElementChild.remove()


  droplist_body.append(ul_container);
  generalContainer_droplist.append(droplist_body, button_clear_search,);

  //adjust the pos of the dropdown list
  setTimeout(()=> {
    let height_input_searchBar = input_searchBar.clientHeight
    droplist_body.style.marginTop = 24+'px';  
  }, 1000)

  return {container_droplist: generalContainer_droplist, input_text_zone :input_searchBar, button_clear_search}
}


function adjust_font_color_contrast(backgroundColor) {
  if (!backgroundColor) return 'white'
  let fontColor = "white"
  if (backgroundColor.includes('rgba')) {
      let _backgroundColor = backgroundColor.replace('rgba(', '').replace(')','').split(', ').map(e=> e++);
      let color_to_num=d3.sum(_backgroundColor.map(e=> e++));
      if (color_to_num>500) fontColor = 'black'
  }
  else if (backgroundColor.includes('rgb')) {
      let _backgroundColor = backgroundColor.replace('rgb(', '').replace(')','').split(', ').map(e=> e++);
      let color_to_num=d3.sum(_backgroundColor.map(e=> e++));
      if (color_to_num>500) fontColor = 'black'
  }
  else if (backgroundColor.includes('#')) {
      let rgb_backgroundColor = d3.color(backgroundColor)
      let color_to_num = rgb_backgroundColor.r+rgb_backgroundColor.g+rgb_backgroundColor.b
      if (color_to_num>550) fontColor = 'black'
  }
  

  return fontColor
}

function display_alert_msg(msg, position, display_duration) {
  let container_alert_msg = document.createElement('div');
  container_alert_msg.id = 'container_alert_msg';
  Object.assign(container_alert_msg.style, {
    opacity: 0,
    display: "grid",
    justifyItems: 'center',
    padding: '10px',
    backgroundColor: '#2196f3',
    transition: 'opacity 2s',
    top: position.top,
    left: position.left,
    position: 'absolute',
    zIndex: 100000,
    borderRadius: '6px'
  });

  if (msg.constructor.name === 'Array') {
    msg.forEach(m=> {
      create_msg_span(m, container_alert_msg)
    })
  }
  else if (msg.constructor.name === 'String') {
    create_msg_span(msg, container_alert_msg)
  }
  
  function create_msg_span(msg, container_alert_msg) {
    let msg_text = document.createElement('span');
    let marginTop
    if (msg === '_______________') marginTop='-15px';
    Object.assign(msg_text.style, {
      color: 'white',
      fontSize: '15px',
      marginTop: marginTop || 0
    })
    msg_text.innerText = msg;
    container_alert_msg.append(msg_text)    
  }

  document.body.append(container_alert_msg);
  container_alert_msg.style.opacity = '0.9';

  //apply correction to the postion of the container
  let top_correction=parseFloat(getComputedStyle(container_alert_msg).height.replace('px', ''));
  let left_correction=parseFloat(getComputedStyle(container_alert_msg).width.replace('px', ''));
  container_alert_msg.style.top = position.top-top_correction/2;
  container_alert_msg.style.left = position.left-left_correction/2;

  setTimeout(() => {
    container_alert_msg.style.opacity = '0';
    setTimeout(()=> {container_alert_msg.remove()}, 2000);
  }, display_duration || 4000);

  
}
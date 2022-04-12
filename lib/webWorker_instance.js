self.onmessage = function(e) {
  
  if (typeof(CrossFilterDataSource) === "undefined") {
    console.time('import scripts')
    importScripts('CrossFilterDataSource.js', "d3.v5.min.js")
    console.timeEnd('import scripts')
  }

  if (!buffer_container) {
  	var buffer_container = {}
  } 

  if (e.data.order === 'hold_data') {
    this.order = e.data.order
    this.id_worker = e.data.id
    this.data_source = e.data.data_source
    console.log("data_source.length: " + data_source.length)
    postMessage('data received & hold') 
    return
  }


  if (e.data.message === "Crossfilter") {
    console.time('Crossfilter worker' + this.id)
    var data_filtred = CrossFilterDataSource(this.data_source, e.data.filterList)
    
    //translate the indexes into a typed array
    var indexes = new Uint32Array(data_filtred.map(r=> r.index))

    postMessage( {
      message: "crossfilter_indexes",
      indexes: indexes.buffer,
      },
      [
          indexes.buffer,
          
      ]
    )

    console.timeEnd('Crossfilter worker' + this.id)

  }  


}

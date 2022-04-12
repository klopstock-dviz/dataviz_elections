importScripts("comlink.js");

  if (typeof(CrossFilterDataSource) === "undefined") {
    console.time('import scripts')
    importScripts('CrossFilterDataSource.js', "d3.v5.min.js", "lodash.min.js")
    console.timeEnd('import scripts')
  }


const service = {
	hold_data: value => hold_DataSource(this, value),
	crossfilter: value => CrossFilterData(this.data_source, value)
};

function hold_DataSource(worker_globalScope, value) {
	worker_globalScope.data_source = value.data_source
	worker_globalScope.id = value.id
	this['time_exec_crossfilter'] = []
	return "data_registred"
}

function CrossFilterData(data_source, value) {
	var t1 = new Date()
	if (value.chart === 'map1') {
		var hold = 1
	}
	var indexes = new Uint32Array(CrossFilterDataSource(data_source, value.filterList).map(r=> r.index))
	var tf = new Date() - t1
	this.time_exec_crossfilter.push({chart: value.chart, time: tf})
	return {indexes: indexes, chart: value.chart}
}



Comlink.expose(service, self);
//Comlink.transfer(service4, [service4.buffer]);
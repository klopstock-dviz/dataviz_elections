class Worker_crossfilter {
  constructor() {
    this.worker = new Worker('lib/webWorker_instance.js');
    this.buffer_container = {}
    this.worker.addEventListener('message', (e) => {

		if (e.data.message === 'hold_data') {

		}

    });
  }
}
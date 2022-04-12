class params_groupControl {
	constructor() {
	    this.groupID = ""
	    this.list_controls = {}
	    this.list_charts = {}
	    this.dataset = []
	    this.dataset_filtred = []
	    this.instanciator = this
	    this.id_previous_singleSelect = ""
	    this.id_previous_multiSelect = ""	    
	}


    //methode used by group sliders to filter an extrenal dataset (not the fact table)
    filter_external_dataset(params_chart) {
    	    	
    	var dataset_to_filter = [...params_chart.groupControls.dataset]    	    	

    	//build list of all filter values
    	var filterList = Object.values(params_chart.groupControls.list_controls).map(s=> {if (s.selected_values) return s.selected_values })

    	//filter
    	dataset_to_filter = CrossFilterDataSource(dataset_to_filter, filterList)

		params_chart.groupControls.dataset_filtred = [...dataset_to_filter]


		function update_charts(params_chart) {
			Object.values(params_chart.groupControls.list_charts).map(s=> {
				if (s.created) {
					s.instanciator.updateChart(s)
					s.filterList = filterList
				}
			})			
		}

		update_charts(params_chart)

    }	
}
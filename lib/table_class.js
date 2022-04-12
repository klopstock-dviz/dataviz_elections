class Table {

	createChart(params_chart, sharedParams) {
		//params_chart.transformations.crossfilter = {"INSEE_COM": ["33063", "33281"], nb_pieces: [2]}//, "33281"
		this.prepare_data_p1(params_chart, sharedParams)

		this.init_table(params_chart, sharedParams)

		params_chart.chart_type = "table"
		params_chart.chart_sub_type = "table"

		params_chart.instanciator = this
		params_chart.id = params_chart.htmlNode
		
		//add params chart to shared params if no present
		if (sharedParams && sharedParams.params_charts.includes(params_chart) === false) {
			sharedParams.params_charts.push(params_chart)
		}

		params_chart.created = true
	}

	updateChart(params_chart, sharedParams) {
		this.prepare_data_p1(params_chart, sharedParams)
		params_chart.updated = true
		this.init_table(params_chart)
	}

	prepare_data_p1(params_chart, sharedParams) {
	    var d1 = new Date();
	    

	    //get the dataset to use: by default use the operationnal dataset
    	if (!params_chart.groupControls) {
	    	var data_chart = [...sharedParams.data_main];
    	}
    	else if (params_chart.groupControls && params_chart.groupControls.dataset) {
    		if (params_chart.groupControls.dataset_filtred.length > 0) {var data_chart = params_chart.groupControls.dataset_filtred}
    		else {var data_chart = params_chart.groupControls.dataset}
    		//register the current params_chart in the groupControls list
    		params_chart.groupControls.list_charts[params_chart.htmlNode] = params_chart
    		params_chart.filter = false
    	}

    


	    //filter the dataset if specified
		var filterList = {};
		//if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
		if (params_chart.transformations && params_chart.transformations.crossfilter !== undefined && Object.keys(params_chart.transformations.crossfilter).length > 0 ) {
			filterList = formFilterArray(params_chart)
		}



		var data_chuncks = [];
		//if a filter arguments has been provided for the data source, call them back here
		if (params_chart.transformations && params_chart.transformations.filter !== undefined) {

			//transform the filterList into an array that we can push in it filter objects
			filterList = Object.values(filterList)

			params_chart.transformations.filter.map(e=> filterList.push(e))

			//Object.assign(filterList, params_chart.transformations.filter)

			filterList = filterList.filter(l=> l.field !== "")
			
			//if the current filter ID is different from the shared filter id, call the filter function
			//data_chuncks = getFiltredData(data_chart, filterList, params_chart.id)
		}


		//if the state management proccess detected filtering values, prepare & engage the crossfilter here
		if (Object.keys(filterList).length > 0) {
			data_chuncks = prepare_engage_crossfilter(data_chart, params_chart, filterList, data_chuncks, sharedParams)
			data_chart = data_chuncks
		}

		
		params_chart.data_input = data_chart
		

		

	}

	init_table(params_chart, sharedParams) {


    	var table_container = document.getElementById(params_chart.htmlNode); table_container.className = 'w3-container'; //table_container.id = params_chart.htmlNode + "_table_container"


    	//if the chart exists, erase it
    	if (params_chart.created === true) {
    		var table_structure = document.getElementById(params_table1.htmlNode + "_table_structure");
    		table_structure.remove()
    	}

    	//1.create the title
    	var title = document.createElement('span');
		//<div id="sliders_grid" style="display: grid;">                                    
		title.id = params_chart.htmlNode + "_title"
		if (params_chart.title_params.label) title.innerHTML = params_chart.title_params.label

		params_chart.title_params.fontSize ? title.style.fontSize = params_chart.title_params.fontSize : title.style.fontSize = '14px'
		params_chart.title_params.fontWeight ? title.style.fontSize = params_chart.title_params.fontWeight : title.style.fontWeight = 'normal'
		params_chart.title_params.fontFamily ? title.style.fontFamily = params_chart.title_params.fontFamily : title.style.fontFamily = 'sans-serif'		
		

		//2.append the title to the parent element
		table_container.appendChild(title)

		//3.create the table
		//3.1.create the table structure
		var table_structure = document.createElement('table'); table_structure.id = params_chart.htmlNode + "_table_structure"; 
		table_structure.className = 'w3-table-all w3-hoverable;'

		//3.2.create the headers
		//headers structure
		var table_headers_wrapper = document.createElement('thead')
		var table_headers = document.createElement('tr'); table_headers.className = 'w3-light-grey'; table_headers.style = '0.5px solid lightgrey'
		//headers fields
		params_chart.fields.forEach(f=> {
			//create grid container for sort icon + column label
			//var header_cell_container = document.createElement('div'); header_cell_container.style = 'display: grid; grid-template-columns: auto auto; justify-content: start; grid-column-gap: 5px; width: min-content'
			//create header cell
			var header_cell = document.createElement('th'); header_cell.style = 'border: 0.5px solid lightgrey'
			//create header grid iot position label & sort icon side by side
			var header_cell_container = document.createElement('div'); header_cell_container.style = 'display: grid; grid-template-columns: auto auto auto; justify-content: start; grid-column-gap: 5px; width: min-content;'
			
			//create header label
			var header_label = document.createElement('span');
			if (f.alias) {header_label.innerHTML = f.alias} else {header_label.innerHTML = f.field}
			header_label['data-field'] = f.field

			//create sort icon
			var sort_icon_asc = document.createElement('span'); sort_icon_asc.className = 'material-icons'; sort_icon_asc.id = params_chart.htmlNode + "_" + f.field + '_sort_icon_asc'; sort_icon_asc.innerHTML = 'north'; sort_icon_asc.style = 'cursor: pointer; color: grey; font-size: 16px; font-weight: bold'
			var sort_icon_dsc = document.createElement('span'); sort_icon_dsc.className = 'material-icons'; sort_icon_dsc.id = params_chart.htmlNode + "_" + f.field + '_sort_icon_dsc'; sort_icon_dsc.innerHTML = 'south'; sort_icon_dsc.style = 'cursor: pointer; color: grey; font-size: 16px; font-weight: bold'

			//check if the field is already sorted, if so set color for the sort icon
			/*if (params_chart.fields_sorted.hasOwnProperty(f.field) && params_chart.fields_sorted[f.field] === 'asc') {
				sort_icon_asc.style.color = 'red'
			}
			if (params_chart.fields_sorted.hasOwnProperty(f.field) && params_chart.fields_sorted[f.field] === 'desc') {
				sort_icon_dsc.style.color = 'red'			
			}*/

			//make the sort icons clickable
			sort_icon_asc.addEventListener('click', (e)=> {
				params_chart.sort_data = {}
				params_chart.sort_data['key'] = f.field; params_chart.sort_data['order'] = 'asc'
				this.init_table(params_chart)				
				var sort_icon = document.getElementById(params_chart.htmlNode + "_" + f.field + '_sort_icon_asc')			
				sort_icon.style.color = 'red'; sort_icon.nextElementSibling.style.color = 'grey'
				params_chart.fields_sorted[f.field] = 'asc'
			})			

			sort_icon_dsc.addEventListener('click', (e)=> {
				params_chart.sort_data = {}
				params_chart.sort_data['key'] = f.field; params_chart.sort_data['order'] = 'desc'
				this.init_table(params_chart)
				var sort_icon = document.getElementById(params_chart.htmlNode + "_" + f.field + '_sort_icon_dsc')
				sort_icon.style.color = 'red'; sort_icon.previousElementSibling.style.color = 'grey'
				params_chart.fields_sorted[f.field] = 'desc'
			})						

			//add header label & sort icon the the header cell container
			header_cell_container.appendChild(header_label); header_cell_container.appendChild(sort_icon_asc); header_cell_container.appendChild(sort_icon_dsc)
			
			header_cell.appendChild(header_cell_container)
			table_headers.appendChild(header_cell)

		})
		if (params_chart.add_checkbox === true) {
			var header_cell = document.createElement('th'); header_cell.innerHTML = 'Select'; table_headers.appendChild(header_cell)}//header_cell.className = 'w3-center'

		//append elements
		table_headers_wrapper.appendChild(table_headers)
		table_structure.appendChild(table_headers_wrapper)
		table_container.appendChild(table_structure)

		




		//create the rows
		if (params_chart.data_input.length === 0) return
		var data_input = params_chart.data_input

		//sort the data
		if (params_chart.sort_data && Object.keys(params_chart.sort_data).includes('key') && Object.keys(params_chart.sort_data).includes('order')) {
			params_chart.data_input.sort(trier(params_chart.sort_data.key, params_chart.sort_data.order))
		}

		var limit = params_chart.limit; var backgroundColors = {0: '#fff', 1: '#f1f1f1', hover: '#cccccc'}
		for (var i = 0; i < limit; i++) {
			//access the data row
			var row = data_input[i]

			//create the html row element
			var row_container = document.createElement('tr');row_container.className = 'row_container'; row_container.id = params_chart.htmlNode + "_row_" + i
			if (i % 2 == 0) {row_container.style.backgroundColor = backgroundColors[0]; row_container["data-backgroundColor"] = backgroundColors[0]} 
			else {row_container.style.backgroundColor = backgroundColors[1]; row_container["data-backgroundColor"] = backgroundColors[1]}; row_container["data-index"] = i

			//cross fields specified for the table & retrieve their values
			params_chart.fields.forEach(f=> {
				//1.retrieve the value of the field for the current row
				if (row && f.field && row.hasOwnProperty(f.field)) {var value = row[f.field]}
				//2.create the cell
				var row_cell = document.createElement('td'); row_cell.style = 'border: 0.5px solid lightgrey'
				if (value) row_cell.innerHTML = value

				//append element
				row_container.appendChild(row_cell)
			})

			//add checkbox
			if (params_chart.add_checkbox === true) {
				var row_cell = document.createElement('td')
				var checkbox_container = document.createElement('label'); checkbox_container.className = "pure-material-checkbox"; //checkbox_container.margin = "7px 20px"
				var checkbox_input = document.createElement('input'); checkbox_input.type = "checkbox"; checkbox_input.id = params_chart.htmlNode + '_checkbox_input_' + i
				checkbox_input['data-category_field'] = row[params_chart.category_field]
				var checkbox_span = document.createElement('span'); checkbox_span.innerHTML = " "
				
				checkbox_input.addEventListener("click", function(e) {

					params_chart.list_idx_segments_multiples_selected.push(e.target['data-category_field'])
				})
				checkbox_container.appendChild(checkbox_input); checkbox_container.appendChild(checkbox_span); row_cell.appendChild(checkbox_container)

				row_container.appendChild(row_cell)

			}

			//add hover effect
			row_container.addEventListener("mouseover", function(e) { 
				e.target.parentElement.style.backgroundColor = backgroundColors['hover']
				e.target.parentElement.lastElementChild.firstElementChild.style.backgroundColor = backgroundColors['hover'];
				console.log('ok 1')
				e.target.parentElement.lastElementChild.firstElementChild.firstElementChild.style.backgroundColor = backgroundColors['hover']
				console.log('ok 2')
				e.target.parentElement.lastElementChild.firstElementChild.lastElementChild.style.backgroundColor = backgroundColors['hover']
				console.log('ok 3')
			})
			row_container.addEventListener("mouseleave", function(e) {
				e.target.style.backgroundColor = e.target['data-backgroundColor']
				e.target.lastElementChild.firstElementChild.style.backgroundColor = e.target['data-backgroundColor'];
				e.target.lastElementChild.firstElementChild.firstElementChild.style.backgroundColor = e.target['data-backgroundColor']
				e.target.lastElementChild.firstElementChild.lastElementChild.style.backgroundColor = e.target['data-backgroundColor']
			})
			
			table_structure.appendChild(row_container)
		


		}

			if (params_chart.animation && params_chart.animation.axis) {direction = params_chart.animation.axis}
			else {var direction = 'translateY'}
			anime({
			  	targets: ".row_container",  		
				[direction]: 750,
				direction: 'reverse',
				easing: 'easeInOutSine',
				duration: 500,
				delay: anime.stagger(50, {from: 'last'})
			});		


		//set display options
		if (params_chart.display && params_chart.display.modal) {
			var modal_node = document.getElementById(params_chart.display.htmlNode)

			//check if the table has been activated by filters
			//params_chart.filterList.map(f=> Object.keys(f)).filter(a=> a.length > 0).length
			if (params_chart.updated === true) modal_node.style.display = 'block'
		}


		//resize forever the sort icons		
		/*setInterval(()=> {
			var sort_icons = document.getElementById(params_chart.htmlNode + 'sort_icons')
			sort_icons.style = 'color: grey; font-size: 16px; font-weight: bold'}, 100)*/

	}




}


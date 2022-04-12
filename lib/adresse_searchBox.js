

class adressSearch {

	createChart(params_chart) {
		this.setup_specific_parameters(params_chart);

		params_chart.chart_type = "adressSearch"
		params_chart.chart_sub_type = "adressSearch"



		//create html elements
		var outer_container = document.createElement('div'); outer_container.id = params_chart.htmlNode + "_outer_container"; outer_container.style = 'display: grid; grid-template-columns: auto; justify-content: space-between; grid-row-gap: 5px'
		var container_autocomplete = document.createElement('div'); container_autocomplete.id = params_chart.htmlNode + "_container"; container_autocomplete.className = "autocomplete"
		var container_input_clearInput = document.createElement('div'); container_input_clearInput.id = params_chart.htmlNode+'container_input_clearInput'; container_input_clearInput.style = 'display: flex; width: 320px; height: max-content'
		var title = document.createElement('span'); title.id = params_chart.htmlNode + '_title'; title.innerHTML = params_chart.title_params.label; title.style = 'margin-bottom: 3px; white-space: nowrap; height: max-content; align-self: end;'
		var input_element = document.createElement('input'); input_element.id = params_chart.htmlNode + '_input'; input_element.type = 'text'; input_element.name = params_chart.placeholder; input_element.placeholder = params_chart.placeholder
		var clear_input = document.createElement('span'); clear_input.className = 'material-icons';
		//var clear_input_text = document.createElement('span'); clear_input_text.id = params_chart.htmlNode + "_clear_input_text"; clear_input_text.innerHTML = 'Clean'; clear_input_text.style = 'display: none'
		var container_selected_items = document.createElement('div'); container_selected_items.id = params_chart.htmlNode + "_container_selected_items"; 
		


		//config layout
			var parentElement = document.getElementById(params_chart.htmlNode)
			//parentElement.style = 'display: inline-flex; grid-column-gap: 0px';

			container_selected_items.style = 'display: none; padding: 5px; row-gap: 3px; width: max-content; height: max-content; border: solid 1px darkgrey; border-radius: 3%; overflow: hidden; transition: right 0.4s ease-out; grid-template-columns: inherit; column-gap: 8px; margin-bottom: 0.2em; margin-top: 24px'
			

		//style html elements
	    container_autocomplete.style = "position: relative; display: grid; justify-content: space-between; height: max-content;"
	    params_chart.width ? container_autocomplete.style.width = params_chart.width : container_autocomplete.style.width = "200px;"
	    input_element.style = "width: 120%; border: 1px solid transparent; background-color: #f1f1f1; padding: 10px;"
	    params_chart.fontSize ? input_element.style.fontSize = params_chart.fontSize : input_element.style.fontSize = "13px"
		clear_input.style = 'align-self: center; color: grey; margin-left: -30px'; clear_input.innerHTML = "close"
		
		
		if (params_chart.title_params) {
			params_chart.title_params.fontSize ? title.style.fontSize = params_chart.title_params.fontSize : title.style.fontSize = '14px'
			params_chart.title_params.fontWeight ? title.style.fontSize = params_chart.title_params.fontWeight : title.style.fontWeight = 'normal'
			params_chart.title_params.fontFamily ? title.style.fontFamily = params_chart.title_params.fontFamily : title.style.fontFamily = 'sans-serif'
		}
		

		//add method for clearing text
		clear_input.addEventListener("click", function(e) {
			input_element.value = ''
		})
		clear_input.addEventListener("mouseover", function(e) {
			//clear_input_text.style.display = 'grid'
			clear_input.style.cursor = 'pointer'

		})
		/*clear_input.addEventListener("mouseleave", function(e) {
			clear_input_text.style.display = 'none'
		})*/		


		//append elements
		if (params_chart.title_params && params_chart.title_params.label) {container_autocomplete.appendChild(title)}
		container_input_clearInput.appendChild(input_element); container_input_clearInput.appendChild(clear_input);
		container_autocomplete.appendChild(container_input_clearInput)		

		//move load data button inside the container_autocomplete
		const button_load_data_adresses = document.getElementById(params_chart.btn_loader_node);
		container_autocomplete.appendChild(button_load_data_adresses)
		
		outer_container.appendChild(container_autocomplete)			
		//outer_container.appendChild(container_selected_items)	
		var p = document.getElementById(params_chart.htmlNode)
		p.appendChild(outer_container)
		p.appendChild(container_selected_items)	



		//register the text search in the list controls class
    	if (params_chart.groupControls && params_chart.groupControls.dataset) {
    		var data_chart = params_chart.groupControls.dataset
    		//register the current params_chart in the groupControls list
    		params_chart.groupControls.list_controls[params_chart.htmlNode] = params_chart
    		params_chart.filter = false
    	}

		//register the insitanciator
		params_chart['instanciator'] = this

		
		function autocomplete() {
			/*the autocomplete function takes two arguments,
			the text field element and an array of possible autocompleted values:*/
			var currentFocus;
			//filter undefined
			var arr = params_chart.adressesList.filter(e=> e);
			//turn into upper case
			arr.forEach(e=> {
				if (typeof(e) === "string") {
					e = e.toUpperCase()
				}
			})

			

			/*execute a function when someone writes in the text field:*/
			var inp = document.getElementById(params_chart.htmlNode + '_input')
			inp.addEventListener("input", async function(e) {
				let fetchAdresse, result_global, result_adresses
				//set overflow of the parent elem iot display the list if proposit°
				var parentElement = document.getElementById(params_chart.htmlNode); parentElement.style.overflow = "visible"
				//START AUTOcomplet° from 6 car
                if (this.value && this.value.length < 4) return
                
                var a, b, i, val = this.value;
                
                var adress_to_search = val.replace("  ", "+");
                adress_to_search = val.replace(" ", "+");
                adress_to_search = val.replace(",", "+")


				await ask_adress()
				async function ask_adress() {
					try {
						let u = "https://api-adresse.data.gouv.fr/search/?q=" + adress_to_search;
						//let headers = {method: 'POST', headers:{mode: 'no-cors', 'Content-Type': 'application/json',}}
						fetchAdresse = await fetch(u);
						result_global = await fetchAdresse.json();
						result_adresses = result_global.features.map(o=> o.properties.label)
					}
					catch(err) {
						console.warn('erreur sur api-adresse.data.gouv: ' + err)
						//window.location.reload(true)
						return
						//setTimeout(()=> {ask_adress(), 500})
					}
				}
				

				/*close any already open lists of autocompleted values*/
				closeAllLists();
				if (!val) { return false;}
				currentFocus = -1;
				/*create a DIV element that will contain the items (values):*/
				a = document.createElement("DIV");
				a.setAttribute("id", this.id + "autocomplete-list");
				a.setAttribute("class", "autocomplete-items");

				//add style
				a.style = 'position: absolute; border: 1px solid #d4d4d4; border-bottom: none; border-top: none; z-index: 99; top: 100%; left: 0; right: 0;'
				/*append the DIV element as a child of the autocomplete container:*/
				this.parentNode.appendChild(a);

				/*for each item in the array...*/
				for (i = 0; i < result_adresses.length; i++) {
				/*check if the item starts with the same letters as the text field value:*/

					
					/*create a DIV element for each matching element:*/
					b = document.createElement("DIV");
					/*make the matching letters bold:*/
					//b.innerHTML = "<strong>" + result_adresses[i].substr(0, val.length) + "</strong>";
					b.innerHTML = result_adresses[i].substr(0, val.length)
					b.innerHTML += result_adresses[i].substr(val.length);
					/*insert a input field that will hold the current array item's value:*/
					b.innerHTML += "<input type='hidden' value='" + result_adresses[i] + "'>";

					//add style
					b.style = "padding: 10px; cursor: pointer; background-color: #fff; border-bottom: 1px solid #d4d4d4;"

					//add style on hover
					b.addEventListener("mouseover", function(e) {
						e.target.style = "background-color: #e9e9e9; padding: 10px; cursor: pointer; border-bottom: 1px solid #d4d4d4;"
					});

					//restore style when leaving the element
					b.addEventListener("mouseleave", function(e) {
						//set style for hovered element
						e.target.style = "padding: 10px; cursor: pointer; background-color: #fff; border-bottom: 1px solid #d4d4d4;"
					});		      
					

					/*execute a function when someone clicks on the item value (DIV element):*/
					b.addEventListener("click", function(e) {
						/*insert the value for the autocomplete text field:*/
						var container_selected_items = document.getElementById(params_chart.htmlNode + '_container_selected_items'); 
						container_selected_items.style.height = 'max-content'; container_selected_items.style.visibility = "visible";
						// container_selected_items.style.width = '110%'
						// setTimeout(()=> {
						// 	var originalWidth = container_selected_items.offsetWidth;
						// 	var projectedWidth = (originalWidth  * 1.1) + "px"
						// 	container_selected_items.style.width = projectedWidth;
						// }, 1000)


						inp.value = this.getElementsByTagName("input")[0].value;
						const adress_clicked = inp.value
                        //get lat_lon, citycode & dep code for the selected adress
                        var pos_item = result_global.features.findIndex(o=> o.properties.label === inp.value);
                        var lat_lng = result_global.features[pos_item].geometry.coordinates; params_chart['leaflet_lat_lng'] = new L.latLng(lat_lng[1], lat_lng[0])
						var citycode = result_global.features[pos_item].properties.citycode
						var context = result_global.features[pos_item].properties.context
						var citycode_dep = citycode.substring(0,2)
						var context_dep = context.substring(0,2)
						
						!params_chart['adresses'] ? params_chart['adresses'] = {} : {}
						params_chart.adresses[adress_clicked] = {citycode: citycode, dep: citycode_dep, adress: adress_clicked, lat_lng: lat_lng, leaflet_lat_lng: params_chart['leaflet_lat_lng']}
						//Object.assign(params_chart.adresses.inp.value, {citycode: citycode, dep: citycode_dep})
						//params_chart.adresses[inp.value] = {citycode: citycode, dep: citycode_dep}



						var list_idx_segments_multiples_selected = [lat_lng]
						// params_chart.list_labels_segments_multiples_selected.push({category_field: lat_lng})
						// params_chart.list_keys_values_segments_multiples_selected.push({[params_chart.category_field]: lat_lng})
						params_chart.selected_values = {field:params_chart.category_field, operation: "include", values: list_idx_segments_multiples_selected};

						//add the selected item in the container box
							//1.create a grid
							var grid_selectedItem = document.createElement('div'); 
							grid_selectedItem.style = "display: grid; grid-template-columns: auto auto; justify-content: start; grid-column-gap: 5px; border: 1px solid rgb(175 175 175); border-radius: 4px; padding: 2px; width: max-content; background-color: rgb(212, 212, 212, 0.3)"
							//2.create text node
							var selectedItem = document.createElement('span')
							let formated_adress = inp.value
							if (inp.value.length> 30) formated_adress = params_chart.funcLib.format_adress(inp.value)							
							selectedItem.innerHTML = formated_adress
							
							selectedItem.style = 'align-self: center; width: max-content;'
							params_chart.fontSize ? selectedItem.style.fontSize = params_chart.fontSize : selectedItem.style.fontSize = "13px"
							//3.create remove toogler
							/*var removeToogler = document.createElement('span')
							removeToogler.innerHTML = "x"*/
							var removeToogler = document.createElement('span'); removeToogler.className = 'material-icons'; removeToogler.style = 'align-self: center; font-size: 18px'
							removeToogler.style.color = 'red'
							removeToogler.innerHTML = "highlight_off"

							removeToogler.addEventListener('mouseover', function(e) {		          	
								e.target.style = 'color: red; align-self: center; font-size: 18px; cursor: pointer'
							})
							removeToogler.addEventListener('click', function(e) {
								//disable transition style & restore height in %
								container_selected_items.style.height = 'max-content'; //container_selected_items.style.transition = ""; 

								//remove the item form the store lists
								var itemToRemove = e.target.previousElementSibling.innerHTML;
								var pos = list_idx_segments_multiples_selected.indexOf(itemToRemove);
								if (pos>=0)	{
									list_idx_segments_multiples_selected.splice(pos,1);
									params_chart.list_keys_values_segments_multiples_selected.splice(pos,1);
									params_chart.list_labels_segments_multiples_selected.splice(pos,1);
									params_chart.selected_values = {field:params_chart.category_field, operation: "include", values: list_idx_segments_multiples_selected};
								}

								//remove the radius range
								var nextElementSibling = e.target.parentElement.nextElementSibling
								if (nextElementSibling && nextElementSibling.innerText.includes('Rayon')) {
									nextElementSibling.remove()
								}
									

								//remove the item itself			          					        
								e.target.previousElementSibling?.remove(); e.target.parentElement?.remove(); e.target?.remove();

								//remove the adress pin from the maps							
								if (params_chart.pin_adress) params_chart.funcLib['remove_markers_from_maps'](params_chart, sharedParams_array, itemToRemove, 'single')
							})

						

						if (params_chart.sliders) {
							//create radius param
							//1.radius param container
							var radius_container = document.createElement('div'); radius_container.style = 'display: flex; align-self: center; column-gap: 15px'

							//2.text & value
							var radius_text = document.createElement('span'); radius_text.innerText = 'Rayon: '; radius_text.style = 'font-size: 13px; color: grey; font-family: monospace'
							var radius_value = document.createElement('span'); radius_value.style = 'font-size: 12px; color: grey; font-family: monospace; background-color: rgba(212, 212, 212, 0.3); border: 1px solid rgb(175, 175, 175); border-radius: 3px'

							//3.slider
							var radius_slider = document.createElement('div'); radius_slider.style = 'width: 150px' //radius_slider.innerText = '______________'; 
							create_slider(radius_slider, radius_value, inp.value, params_chart)
							//assembly of radius elemts
							radius_container.appendChild(radius_text); radius_container.appendChild(radius_slider); radius_container.appendChild(radius_value)
						}

						//4.add created item to the sub grid
						grid_selectedItem.appendChild(selectedItem); grid_selectedItem.appendChild(removeToogler); 

						//5.add the sub grid to the general grid of selected items
						//var container_selected_items = document.getElementById(params_chart.htmlNode + '_container_selected_items')					
						container_selected_items.appendChild(grid_selectedItem);
						if (params_chart.sliders) container_selected_items.appendChild(radius_container)

						//save the height in px
						params_chart.clientHeightPx = container_selected_items.clientHeight - parseFloat(container_selected_items.style.padding.replace("px",""))*2 + "px"
							
						//update the container width
						container_selected_items.style.display = 'grid'; container_selected_items.style.gridTemplateColumns = 'auto auto'
						container_selected_items.style.width = 'max-content'

						/*close the list of autocompleted values,
						(or any other open lists of autocompleted values:*/
						closeAllLists();

						//call filter if this control belong to a group control
						if (params_chart.groupControls && params_chart.groupControls.dataset) {
							params_chart.groupControls.instanciator.filter_external_dataset(params_chart)
						}					

						//pin the adresses
						if (params_chart.pin_adress) params_chart.funcLib.pin_adress(params_chart, sharedParams_array)


						//check the rendering of all the maps, then add the adresses to each map
						if (!params_chart.funcLib.monitor_maps_rendering) {
							let i = 0
							params_chart.funcLib.monitor_maps_rendering = setInterval(() => {
								if (sharedParams_array && sharedParams_array.length > 0) {									
									if (params_chart.pin_adress) params_chart.funcLib.pin_adress(params_chart, sharedParams_array);
									i++
								};
								if (i === 5) {
									clearInterval(params_chart.funcLib.monitor_maps_rendering)
								}
							}, 2000);
						}


					});
					a.appendChild(b);
					
			  }
			});
			/*execute a function presses a key on the keyboard:*/
			inp.addEventListener("keydown", function(e) {
			  var x = document.getElementById(this.id + "autocomplete-list");
			  if (x) x = x.getElementsByTagName("div");
			  if (e.code == "ArrowDown") {
			    /*If the arrow DOWN key is pressed,
			    increase the currentFocus variable:*/
			    currentFocus++;
			    /*and and make the current item more visible:*/
			    addActive(x);
			  } else if (e.code == "ArrowUp") { //up
			    /*If the arrow UP key is pressed,
			    decrease the currentFocus variable:*/
			    currentFocus--;
			    /*and and make the current item more visible:*/
			    addActive(x);
			  } else if (e.code == "Enter") {
			    /*If the ENTER key is pressed, prevent the form from being submitted,*/
			    e.preventDefault();
			    if (currentFocus > -1) {
			      /*and simulate a click on the "active" item:*/
			      if (x) x[currentFocus].click();
			    }
			  }
			});
			function addActive(x) {
				/*a function to classify an item as "active":*/
				if (!x) return false;
				/*start by removing the "active" class on all items:*/
				removeActive(x);
				if (currentFocus >= x.length) currentFocus = 0;
				if (currentFocus < 0) currentFocus = (x.length - 1);
				/*add class "autocomplete-active":*/
		      	//restore all elements found to original style
		      	var a = document.getElementsByClassName('autocomplete-items')
		      	Object.values(a[0].children).forEach(child=> {child.style = "padding: 10px; cursor: pointer; background-color: #fff; border-bottom: 1px solid #d4d4d4;" })

				x[currentFocus].classList.add("autocomplete-active");
				x[currentFocus].style = "padding: 10px; cursor: pointer; border-bottom: 1px solid #d4d4d4;"

				if (params_chart.arrow_nav_style && params_chart.arrow_nav_style.backgroundColor) {x[currentFocus].style.backgroundColor = params_chart.arrow_nav_style.backgroundColor} 
				else { x[currentFocus].style.backgroundColor = "DodgerBlue" }
				if (params_chart.arrow_nav_style && params_chart.arrow_nav_style.color) {x[currentFocus].style.color = params_chart.arrow_nav_style.color} 
				else { x[currentFocus].style.color = "#ffffff" }

				
			}

			function removeActive(x) {
				/*a function to remove the "active" class from all autocomplete items:*/
				for (var i = 0; i < x.length; i++) {
				  x[i].classList.remove("autocomplete-active");
				}
			}


			function closeAllLists(elmnt) {
				/*close all autocomplete lists in the document,
				except the one passed as an argument:*/
				var x = document.getElementsByClassName("autocomplete-items");
				for (var i = 0; i < x.length; i++) {
					  if (elmnt != x[i] && elmnt != inp) {
					    x[i].parentNode.removeChild(x[i]);
					  }
				}
			}
			/*execute a function when someone clicks in the document:*/
			document.addEventListener("click", function (e) {
			  closeAllLists(e.target);
			});


			function create_slider(slider_node, value_node, adress, params_chart) {				
				var start_radius = 500
				noUiSlider.create(slider_node, {
					start: [start_radius],
					step: 10,
					connect: 'lower',
					range: {
						'min': [50],
						'30%': [1000],
						'70%': [3000],
						'max': [5000]
					}
				});

				//register the init value in the params chart
				Object.assign(params_chart.adresses[adress], {radius: start_radius})
				
				//listen to the creation of the maps, when so, get the bounds of the circles created
				var listen_circles_creation = setInterval(()=> {
					if (params_chart.sharedParams) {
						var circles_created = Object.values(params_chart.adresses).map(e=> e.circle).every(c=> c)
						if (circles_created) {
							Object.values(params_chart.adresses).forEach(value=> {
								var circle_bbox = value.circle.getBounds()

								var shape_bounds = params_chart.funcLib.format_circle_bounds(circle_bbox);
								var lat = shape_bounds.lat, lng = shape_bounds.lng;
								value['lat_radius'] =lat;
								value['lng_radius'] =lng;
							})

							params_chart.funcLib['form_brush_objects'](params_chart)

							clearInterval(listen_circles_creation)
						}
					}
				}, 100)


				//update the value on slider move
				slider_node.noUiSlider.on('update', function (values, handle) {
					//remove alerte span
					var alerte = document.getElementById(adress+"_alerte")
					alerte ? alerte.remove() : {}

					//1.register the info of the new radius
					var radius = +values[handle];
					value_node.innerHTML = '&nbsp;' + values[handle] + ' m &nbsp;';
					//!params_chart['adresses'] ? params_chart['adresses'] = {} : {}
					//params_chart.adresses[adress] = {radius: +values[handle]}
					var current_radius = params_chart.adresses[adress].radius
					Object.assign(params_chart.adresses[adress], {radius: +values[handle]});
					var new_radius = params_chart.adresses[adress].radius
					if (new_radius > current_radius) {var radius_direction = "increase"} else  {var radius_direction = "decrease"}
					Object.assign(params_chart.adresses[adress], {radius_direction: radius_direction});

					if (!params_chart.sharedParams) { return }

					//2.resize the radius of the circle
					params_chart.adresses[adress].circle.setRadius(radius)

					//3.gets the bounds of the resized circle
					var circle_bbox = params_chart.adresses[adress].circle.getBounds()

					var shape_bounds = params_chart.funcLib.format_circle_bounds(circle_bbox)
					var lat = shape_bounds.lat, lng = shape_bounds.lng//					
					params_chart.adresses[adress]['lat_radius'] =lat
					params_chart.adresses[adress]['lng_radius'] =lng

					//4.form a brush_key_values object, with a crossfilter source as 'adresse_Search'
					params_chart.funcLib['form_brush_objects'](params_chart)


					//adapt the radius of the target maps
					// if (params_chart.sharedParams) {
					// 	//register
					// 	params_chart.sharedParams.params_charts.forEach(chart=> {
					// 		if (chart.hasOwnProperty('geoRadius_layers')) {								
					// 			chart.geoRadius.filter(adr=> adr.adress === adress)[0].radius = +values[handle]
					// 			params_chart.sharedParams.filter_order_origin = 'adressSearch'
					// 			chart.instanciator.geoRadius_resize(chart)
					// 		}
					// 	})					
					// }



				});
				
			}
		}

		/*An array containing all the country names in the world:*/
		//var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre & Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts & Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Turks & Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];

		/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
		autocomplete(params_chart.search_list);
	}

	add_to_sharedParams(params_chart, sharedParams) {
		//register the search box in the sharedParams
		sharedParams.params_charts.push(params_chart)
		params_chart['sharedParams'] = sharedParams
	}

	//add variables the the params_chart to enable the behaviour of the radius slider (crossfiler)
	setup_specific_parameters(params_chart) {
		//specific for adress bar
		params_chart.adressesList = []		
		params_chart.brush_values = {}
		params_chart.brush_keys_values = {}		
		params_chart.hidden_legends = {}
		params_chart.active_legends = {}
		params_chart.filtered_by = {}		
		params_chart['transformations'] = {crossfilter: {}};
		params_chart['funcLib'] = {};

		params_chart['funcLib']['restrict_dataset_to_radius'] = function (dataset, params_chart_target, lat, lng) {
			if (!params_chart_target.geoRadius && _.find(params_chart.adresses, {'selected': true})) {
				var adresses = [_.find(params_chart.adresses, {'selected': true})]
			}
			else {
				var adresses = Object.values(params_chart.adresses)
			}
			var circle_brush_dataset = [];
			

			//restrict the dataset by distance from center to radius
			adresses.forEach(adress=> {
				dataset.forEach(r=> {
					if (r['leaflet_lat_lng']) {
						var distance_from_center = r['leaflet_lat_lng'].distanceTo(adress.leaflet_lat_lng);	
						if (distance_from_center <= adress.radius) {
							circle_brush_dataset.push(r)					
						}
					}
					else {
						var l = r['leaflet_lat_lng']
					}
				})
			})
			return circle_brush_dataset
		}

		params_chart.funcLib['format_circle_bounds'] = function(shape_bounds) {
			var lat = [shape_bounds._southWest.lat, shape_bounds._northEast.lat]					
			if (lat[0] < 0 && lat[1] < 0) {
				lat = lat.sort(function(a, b){return a-b})
			}
			else {
				lat = lat.sort()	
			}
			
			var lng = [shape_bounds._southWest.lng, shape_bounds._northEast.lng]
			if (lng[0] < 0 && lng[1] < 0) {
				lng = lng.sort(function(a, b){return a-b})
			}
			else {
				lng = lng.sort()	
			}		

			
			var lat = (Math.round(lat[0] * 100000) / 100000).toString() + "_" + (Math.round(lat[1] * 10000) / 10000).toString()
			var lng = (Math.round(lng[0] * 100000) / 100000).toString() + "_" + (Math.round(lng[1] * 10000) / 10000).toString()
			return {lat: lat, lng: lng}				
		}


		params_chart.funcLib['form_brush_objects'] = function(params_chart) {
			//4.1.prepare the values to inject in the brush_values
			var circles_bbox={_northEast: {lat: 0, lng: 0}, _southWest: {lat: 0, lng: 0}}
			var latitudes = [], longitudes = [];				
			var mapCoordonneesLatitude = params_chart.sharedParams.transformations.latLng_fields.lat, mapCoordonneesLongitude = params_chart.sharedParams.transformations.latLng_fields.lng;
			Object.values(params_chart.adresses).forEach(value=> {
				//form the values to use in the brush_keys_values object
				longitudes.push(value.lng_radius); latitudes.push(value.lat_radius)
				
				//form the values to use in the brush_values object
				var circle_bbox = value.circle.getBounds()
				circles_bbox._northEast.lat += circle_bbox._northEast.lat; circles_bbox._northEast.lng += circle_bbox._northEast.lng
				circles_bbox._southWest.lat += circle_bbox._southWest.lat; circles_bbox._southWest.lng += circle_bbox._southWest.lng
			})
			
			//4.2.update filter_order_origin value
			if (params_chart.sharedParams.sharedParams_array && params_chart.sharedParams.sharedParams_array.length>0) {
				params_chart.sharedParams.sharedParams_array.forEach(sh=> sh.filter_order_origin = "adressSearch")				
			}
			else {
				params_chart.sharedParams.filter_order_origin = "adressSearch";
			}

			//4.3.inject the values in the brush objects
			params_chart.brush_keys_values = {[mapCoordonneesLatitude+"_brushed"]: latitudes, [mapCoordonneesLongitude+"_brushed"]: longitudes}
			params_chart['brush_values'] = {sw_lat: circles_bbox._southWest.lat, ne_lat: circles_bbox._northEast.lat, sw_lng: circles_bbox._southWest.lng, ne_lng: circles_bbox._northEast.lng}
			
		}

		params_chart.funcLib['pin_adress'] = function(params_chart, sharedParams_array) {
			//remove previous markers
			params_chart.funcLib['remove_markers_from_maps'](params_chart, sharedParams_array, "", 'all')

			//add the markers
			Object.values(params_chart.adresses).forEach(a=> {
				var lng =  a.leaflet_lat_lng;
				//add to the map
				//marker.addTo(params_choroplethe_map_com_apercu_prix_vente_m2.map_instance)
				add_marker_to_maps(params_chart, sharedParams_array, lng, a.adress)


			})

			function add_marker_to_maps(params_chart, sharedParams_array, lng, adress) {
				if (!sharedParams_array) {
					console.warn(`for ${params_chart.id}, sharedParams_array in undefined`)
					return
				}
				sharedParams_array.forEach(sh=> {
					sh.params_charts.forEach(pm=> {
						if (pm.chart_type === "leaflet" && pm.chart_sub_type!== "isochrone" && !pm.pin_adresses.hasOwnProperty(adress)) {
							//var marker = new L.marker(lng)
							let marker = L.marker(lng, 
								{icon: L.AwesomeMarkers.icon({
									icon: 'home', 
									prefix: 'fa', 
									markerColor: 'blue', 
									iconColor: 'white'}) 
								}
							)							
							marker.options.pin_adress = adress
							params_chart.pin_adresses[`${pm.id}_${adress}`] = {marker: marker, adress: adress}
							let tooltip = params_chart.funcLib.format_adress(adress);
							marker.addTo(pm.map_instance).bindTooltip(adress)
							pm.pin_adresses[adress] = marker
							//console.log(`add to map ${pm.id} adress ${adress}`)
						}
					})
				})
			}


			// function remove_marker_from_maps(params_chart, sharedParams_array, adress) {

			// }
		}


		params_chart.funcLib['remove_markers_from_maps'] = function (params_chart, sharedParams_array, adress, mode) {
			if (!sharedParams_array) {
				console.warn(`for ${params_chart.id}, sharedParams_array in undefined`)
				return
			}
			sharedParams_array.forEach(sh=> {
				sh.params_charts.forEach(pm=> {
					if (pm.chart_type === "leaflet") {
						if (mode === 'all') {
							pm.map_instance.eachLayer(l=> {
								if (l.options?.adress_pin) {
									pm.map_instance.removeLayer(l)
								}
							})
						}
						else if (mode === 'single') {
							// pm.map_instance.eachLayer(l=> {
							// 	if (l.options?.adress_pin === adress) l.remove()
							// })	
							
							pm.map_instance.removeLayer(params_chart.pin_adresses[`${pm.id}_${adress}`].marker)
							delete params_chart.pin_adresses[`${pm.id}_${adress}`]
							delete params_chart.adresses[adress]
							delete pm.pin_adresses[adress]

						}
					}
				})
			})
		}

		params_chart.funcLib.format_adress = function(adress) {
			const re=/[0-9]{4,6}/;
			let matcher = adress.match(re);
			if (matcher && matcher.length>0 && matcher.index) {
				let index = matcher.index;
				let rue = adress.substring(0, index);
				let commune = adress.substring(index,);
				adress = `<span>${rue} <br/> ${commune}</span>`
				return adress
			}
			else return adress
		}

	}
}




function filter_dataOp_radius(params_chart) {
	var new_dataset = [];
	if (params_chart.sharedParams) {
		var center = Object.values(params_chart.adresses)[0].leaflet_lat_lng
		params_chart.sharedParams.data_main.forEach(r=> {
			var dist = center.distanceTo(r.lat_lng)
			if (dist < 200)  {
				new_dataset.push(r)
			}
	
		})
	}	
}
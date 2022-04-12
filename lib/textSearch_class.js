

class textSearch {

	createChart(params_chart) {
		params_chart.chart_type = "textSearch"
		params_chart.chart_sub_type = "textSearch"



		//create html elements
		var outer_container = document.createElement('div'); outer_container.id = params_chart.htmlNode + "_outer_container"; outer_container.style = 'display: grid; grid-template-columns: auto; justify-content: space-between; grid-row-gap: 5px'
		var container_autocomplete = document.createElement('div'); container_autocomplete.id = params_chart.htmlNode + "_container"; container_autocomplete.className = "autocomplete"
		var container_input_clearInput = document.createElement('div'); container_input_clearInput.id = params_chart.htmlNode + 'container_input_clearInput'; container_input_clearInput.style = 'display: flex; width: 320px; height: max-content'
		var title = document.createElement('span'); title.id = params_chart.htmlNode + '_title'; title.innerHTML = params_chart.title_params.label; title.style = 'margin-bottom: 3px; white-space: nowrap;'
		var input_element = document.createElement('input'); input_element.id = params_chart.htmlNode + '_input'; input_element.type = 'text'; input_element.name = params_chart.placeholder; input_element.placeholder = params_chart.placeholder
		var clear_input = document.createElement('span'); clear_input.className = 'material-icons';
		//var clear_input_text = document.createElement('span'); clear_input_text.id = params_chart.htmlNode + "_clear_input_text"; clear_input_text.innerHTML = 'Clean'; clear_input_text.style = 'display: none'
		var container_selected_items = document.createElement('div'); container_selected_items.id = params_chart.htmlNode + "_container_selected_items"; 
		


		//config layout according to the pos of the box_selected_elements
		if (params_chart.box_selected_items && params_chart.box_selected_items.position === 'right' ) {
			var parentElement = document.getElementById(params_chart.htmlNode)
			//parentElement.style = 'display: inline-flex; grid-column-gap: 25px';
			container_selected_items.style = 'display: none; justify-content: space-between; padding: 5px; row-gap: 2px; width: max-content; height: max-content; border: solid 1px darkgrey; border-radius: 3%; overflow: hidden; transition:< right 0.4s ease-out; column-gap: 3px; margin-bottom: 0.2em; margin-top: 24px'
			//toggle_container_selected_items.className = 'fa fa-caret-left'; toggle_container_selected_items.style.visibility = "hidden"
		}
		else if (params_chart.box_selected_items && (params_chart.box_selected_items.position === 'bottom' || !params_chart.box_selected_items.position)) {
			var toggle_container_selected_items	= document.createElement('i'); toggle_container_selected_items.id = params_chart.htmlNode + "_toggle_container_selected_items"; 
			container_selected_items.style = 'display: none; grid-template-columns: auto; justify-content: space-between; padding: 5px; row-gap: 2px; width: max-content; height: max-content; border: solid 1px darkgrey; border-radius: 3%; overflow: hidden; transition: height 0.4s ease-out; margin-top: 24px'
			toggle_container_selected_items.className = 'fa fa-caret-up';
			toggle_container_selected_items.style = 'transition: 0.6s; width: max-content;'
		}

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

		//add method to show/hide selected items list
		if (toggle_container_selected_items) {
			toggle_container_selected_items.addEventListener("mouseover", function(e) { 
				e.target.style.cursor = 'pointer';
			})

			toggle_container_selected_items.addEventListener("click", function(e) {

				if (container_selected_items.style.height !== "0px") {

					//set the height in px
					container_selected_items.style.height = params_chart.clientHeightPx
					
					//reduce the height
					setTimeout(()=> {
						container_selected_items.style.height = "0px"; 
						toggle_container_selected_items.className = "fa fa-caret-down"
					}, 10)

					setTimeout(()=> {
						//container_selected_items.style.display = 'none';
						container_selected_items.style.visibility = "hidden";
					}, 500)

				}
				else if (container_selected_items.style.height === "0px") {				
					//container_selected_items.style.display = 'grid';
					container_selected_items.style.visibility = "visible";
					//SET HEIGHT IT PX IOT ALLOW CSS TRANSITION
					container_selected_items.style.height = params_chart.clientHeightPx				
					toggle_container_selected_items.className = "fa fa-caret-up"

					//set height in % to reach height extent
					//setTimeout(()=> {container_selected_items.style.height = '100%'}, 450) 
					setTimeout(()=> {container_selected_items.style.height = parseFloat(params_chart.clientHeightPx.replace('px','')) + parseFloat(container_selected_items.style.padding.replace('px',''))*1.5 + 'px'; container_selected_items.style.height = "max-content"}, 400) 
				}
			})		
		}

		//append elements
		if (params_chart.title_params && params_chart.title_params.label) {container_autocomplete.appendChild(title)}
		container_input_clearInput.appendChild(input_element); container_input_clearInput.appendChild(clear_input);
		container_autocomplete.appendChild(container_input_clearInput)		

		//move load data button inside the container_autocomplete
		// const button_load_data_communes = document.getElementById('load_data_communes');
		// if (button_load_data_communes) container_autocomplete.appendChild(button_load_data_communes)

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
		
		function autocomplete(arr) {
			/*the autocomplete function takes two arguments,
			the text field element and an array of possible autocompleted values:*/
			var currentFocus;
			//filter undefined
			arr = arr.filter(e=> e);
			//turn into upper case
			arr.forEach(e=> {
				if (typeof(e) === "string") {
					e = e.toUpperCase()
				}
			})

			

			/*execute a function when someone writes in the text field:*/
			var inp = document.getElementById(params_chart.htmlNode + '_input')
			inp.addEventListener("input", function(e) {
				//set overflow of the parent elem iot display the list if proposit°
				var parentElement = document.getElementById(params_chart.htmlNode); parentElement.style.overflow = "visible"
				//START AUTOcomplet° from n car
                if (this.value && this.value.length < 3) return

				var a, b, i, val = this.value;
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

				var res=[]; 					
				arr.forEach(e=> {
					if (e[params_chart.search_mode](val)) {
						res.push(e)
					}
				})
				//sort the list
				res = res.sort()
				//limit the nb of elements
				res = res.splice(0, params_chart.search_results_length)

				/*for each item in the array...*/
				for (i = 0; i < res.length; i++) {
				/*check if the item starts with the same letters as the text field value:*/

					
					/*create a DIV element for each matching element:*/
					b = document.createElement("DIV");
					/*make the matching letters bold:*/
					//b.innerHTML = "<strong>" + res[i].substr(0, val.length) + "</strong>";
					b.innerHTML = res[i].substr(0, val.length)
					b.innerHTML += res[i].substr(val.length);
					/*insert a input field that will hold the current array item's value:*/
					b.innerHTML += "<input type='hidden' value='" + res[i] + "'>";

					//add style
					b.style = "padding: 10px; cursor: pointer; background-color: #fff; border-bottom: 1px solid #d4d4d4;"

					//add style on hover
					b.addEventListener("mouseover", function(e) {
						e.target.style = "background-color: #e9e9e9; cursor: pointer; border-bottom: 1px solid #d4d4d4; padding: 10px;"//
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

						params_chart.list_idx_segments_multiples_selected.push(inp.value)
						params_chart.list_labels_segments_multiples_selected.push({category_field: inp.value})
						params_chart.list_keys_values_segments_multiples_selected.push({[params_chart.category_field]: inp.value})
						params_chart.selected_values = {field:params_chart.category_field, operation: "include", values: params_chart.list_idx_segments_multiples_selected};

						//add the selected item in the container box
						//1.create a grid
						var grid_selectedItem = document.createElement('div'); 
						grid_selectedItem.style = "display: grid; grid-template-columns: auto auto; justify-content: start; grid-column-gap: 5px; border: 1px solid #d4d4d4; border-radius: 4px; padding: 2px; width: max-content"
						//2.create text node
						var selectedItem = document.createElement('span')
						selectedItem.innerHTML = inp.value
						selectedItem.style = 'align-self: center'
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
							var pos = params_chart.list_idx_segments_multiples_selected.indexOf(itemToRemove);
							params_chart.list_idx_segments_multiples_selected.splice(pos,1);
							params_chart.list_keys_values_segments_multiples_selected.splice(pos,1);
							params_chart.list_labels_segments_multiples_selected.splice(pos,1);
							params_chart.selected_values = {field:params_chart.category_field, operation: "include", values: params_chart.list_idx_segments_multiples_selected};

							//remove the item itself			          					        
							e.target.previousElementSibling.remove(); e.target.parentElement.remove(); e.target.remove();

						})

						//4.add created item to the sub grid
						grid_selectedItem.appendChild(selectedItem); grid_selectedItem.appendChild(removeToogler)

						//5.add the sub grid to the general grid of selected items
						//var container_selected_items = document.getElementById(params_chart.htmlNode + '_container_selected_items')					
						container_selected_items.appendChild(grid_selectedItem);

						//save the height in px
						params_chart.clientHeightPx = container_selected_items.clientHeight - parseFloat(container_selected_items.style.padding.replace("px",""))*2 + "px"
							
						//update the container width
						if (params_chart.box_selected_items && params_chart.box_selected_items.position === 'right') {
							container_selected_items.style.display = 'grid'
							container_selected_items.style.width = 'max-content'
						}
						else if (params_chart.box_selected_items && (params_chart.box_selected_items.position === 'bottom' || !params_chart.box_selected_items.position)) {
							container_selected_items.style.display = 'grid'
							container_selected_items.style.width = 'max-content'
						}

						//calc margin top for the the container_selected_items, based on its height & the height of its adjacent element (outer_container)
						//1.height of outer_container
						//setTimeout(() => {
							// var height_outer_container = outer_container.clientHeight;
							// var height_container_selected_items = container_selected_items.clientHeight;
							// var marginTop = (height_outer_container/2) - (height_container_selected_items/2)
							// container_selected_items.style.marginTop = marginTop+"px"				
						//}, 500);		
										
						/*close the list of autocompleted values,
						(or any other open lists of autocompleted values:*/
						closeAllLists();

						//call filter if this control belong to a group control
						if (params_chart.groupControls && params_chart.groupControls.dataset) {
							params_chart.groupControls.instanciator.filter_external_dataset(params_chart)
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
		}

		/*An array containing all the country names in the world:*/
		//var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre & Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts & Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Turks & Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];

		/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
		autocomplete(params_chart.search_list);
	}
}





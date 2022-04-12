class Button_group {
    constructor(params_control) {

    }

    createControl(params_control, sharedParams) {
        this.setup_params_user(params_control)

        //add params chart to shared params if no present
		if (!sharedParams.params_charts.includes(params_control)) {
			sharedParams.params_charts.push(params_control)
		}
        
        params_control.instanciator = this;

        params_control.sharedParams = sharedParams;

        params_control.chart_type = 'html'

        this.init_control(params_control);

        //get the data/ filter values that will by used by the buttons to trigger the crossfilter process
        let data_chart = this.prepare_data_p1(params_control, sharedParams);

        //
        this.prepare_data_p2(data_chart ,params_control);

        this.inject_metadata(params_control, this, undefined, undefined, undefined);
    }

    prepare_data_p1(params_control, sharedParams) {
        let data_chart
        if (params_control.data_driver && params_control.data_driver.chart_type === 'adressSearch') {
            if (!params_control.data_driver.adresses) return [];
            data_chart = Object.values(params_control.data_driver.adresses);
            //build an indexed dict from the lat/lng values
            if (params_control.sharedParams.data_main && (!params_control.sharedParams.data_main_indexed || params_control.update_data_main)) {
                params_control.sharedParams.data_main_indexed={};
                params_control.sharedParams.data_main.forEach(r=> {
                    if (r.lat) {
                        let idx = r.lat+"_"+r.lng;
                        params_control.sharedParams.data_main_indexed[idx] = r
                    }                    
                });
                params_control.sharedParams.data_main_arr_latLngs = params_control.sharedParams.data_main.map(r=> {if (r.lng) return [r.lng, r.lat]}).filter(r=> r && r[0]);
            }
            delete params_control.transformations.crossfilter?.lat; delete params_control.transformations?.crossfilter.lng;            

            return data_chart
        }
        else if (sharedParams.filter_order_origin === 'spatial query') {
            data_chart = [...sharedParams.spatial_data];
            //delete the lat/lng crossfilter values as they were just a routing signal for the spatial queries
            delete params_control.transformations.crossfilter.lat;
            delete params_control.transformations.crossfilter.lng;
        }
        else if (params_control.transformations.dataset) {                         
            data_chart = [...params_control.transformations.dataset];            
        }
        else {
            data_chart = [...sharedParams.data_main];            
        }

        var filterList = {};
        //if the crossfilter is provided, extract & transform values of the filter_array (provided by the crossfilter process)
        if (params_control.transformations.crossfilter !== undefined && Object.keys(params_control.transformations.crossfilter).length > 0 ) {
            filterList = formFilterArray(params_control, params_control.transformations.crossfilter)
        }


        //if a filter arguments has been provided for the data source, call them back here
        if (params_control.transformations.filter) {

            //add the filter parameters to to main filter list
                //1.transform the filterList into an array that we can push in it filter objects
                filterList = Object.values(filterList)
                //2.extract & push the parameters of the initial filter list into the main filter list
                //don't take fields from the filter object if they are present in the crossfilter
                params_control.transformations.filter.forEach(e=> {if (!filterList.find(f=> f.field === e.field)) {filterList.push(e)} })
                //3.remove the empty fields
                filterList = filterList.filter(l=> l.field !== "")
        }

		if (data_chart && data_chart.length>0 && (Object.keys(filterList).length > 0)) {
			params_control.multithreading = false;            

			//if a field of the filterList is not present in the data_chart, delete it
			filterList = sharedParams.delete_unwanted_fields(data_chart, filterList)

			var data_filtred = prepare_engage_crossfilter(data_chart, params_control, filterList, sharedParams);

            return data_filtred
		}
        else return data_chart
        // else if (data_chart && data_chart.length>0 && params_control.to_filter) {
        //     //filterList = sharedParams.delete_unwanted_fields(data_chart, filterList);
        //     return [];
        // }


    }

    prepare_data_p2(data_chart ,params_control) {
        /*to rectify the glitchs caused by the setInterval watcher of the inject_metadata method:
        reload the prepare_data_p1 to generate a new dataset with the last filters*/
        if (data_chart.length === 0 && !params_control.prepare_data_reloaded) {
            data_chart = params_control.instanciator.prepare_data_p1(params_control, sharedParams);
            params_control.prepare_data_reloaded = true;
        }
        params_control.data_input = data_chart;
        params_control.prepare_data_reloaded = true
        return
    }


    init_control(params_control) {
        if (!params_control.id) params_control.id = params_control.htmlNode

        //create an outer container for the title & the buttons
        let outerContainer = document.createElement('div');
        outerContainer.id = params_control.id + '_outerContainer';
        Object.assign(outerContainer.style, {
            display: 'grid',
            rowGap: '5px',
            justifyItems: 'center',
            alignItems: 'center',
            padding: '5px',
            borderRadius: '5px',
            'box-shadow': '0 0 5px rgb(142 137 137 / 70%)',
            height: 'max-content',
            margin: params_control.style.margin
        })
        
        
        let groupButton_title = document.createElement('span');        
        groupButton_title.innerText = params_control.title
        groupButton_title.style = 'font-color: #3c3b3b; font-size: 14px; text-align: center; width: 130px'


        //create inner container for the buttons
        //let innerContainer = document.createElement('div');
        let innerContainer = document.getElementById(params_control.htmlNode);
        //innerContainer.id = params_control.htmlNode + '_innerContainer';
        Object.assign(innerContainer.style, 
            {
                display: params_control.style.orientation || 'flex',
                padding: '5px',
                gap: '5px',
                justifyItems:params_control.style.justifyItems || 'center',
            }
        );

        let parentElement = document.getElementById(params_control.htmlNode).parentElement;

        outerContainer.append(groupButton_title, innerContainer);
        parentElement.append(outerContainer)
        

    }

    create_button(params_control, name, latLng, backgroundColor, fontColor, number) {      
        
        if (!backgroundColor){ backgroundColor = get_backgroundColor(params_control, name)};
        //in case no registred corresponding color found, take gray
        if (!backgroundColor) backgroundColor = 'gray'


        //adjust font color according to the background color (avoid white text on light backgrounds)
        fontColor = adjust_font_color_contrast(backgroundColor)
        //btn container
        let btn_container, btn, number_container, paddingRight='0px'
        btn_container = document.createElement('div');
        btn_container.id = params_control.id+'btn_container_'+name.slice(0,20);
        if (number) paddingRight = '8px'
        Object.assign(btn_container.style, {
            display: 'flex',
            columnGap: '10px',
            paddingRight: paddingRight,
            justifyItems: 'center',
            alignItems: 'center',
            opacity: 0,
            borderRadius: '4px',
            backgroundColor: backgroundColor,
            transition: 'opacity 1s',
            width: 'max-content'
        });


        btn = document.createElement('button');
            btn.id = params_control.id+'_btn_'+name.slice(0,20)
            btn.className = 'button_ripple_effect'
            name = format_adress(name)
            if (number) {
                if (name.length>20) {btn.innerHTML = name.slice(0,20)+'...'}
                else {btn.innerHTML = name}
            }
            else {btn.innerHTML = name}
            
            Object.assign(btn.style, {
                fontSize: '12px',
                backgroundColor: backgroundColor,
                padding: '0.2rem 0.6rem',
                borderRadius: '2px',
                transition: 'all 1s',
                color: fontColor
            })

            btn.dataset.backgroundColor = backgroundColor;
            if (latLng) btn.dataset.latLng = latLng;
            btn.dataset.name = name;

            if (number) {
                number_container = document.createElement('div');
                Object.assign(number_container.style, {
                    display: 'grid',
                    'background-color':'white',
                    borderRadius: '10px', 
                    width: '20px',
                    height: 'max-content',
                    'justify-content': 'center'
                });

                let number_span = document.createElement('span');
                Object.assign(number_span.style, {
                    fontSize: '13.5px',
                    color: 'black',
                    transform: 'rotateX(0deg)',
                    transition: 'all 1s'
                })
                number_span.innerText = 0

                number_container.append(number_span)

                setTimeout(()=> {
                    animate_number(number, number_span)
                },1000)

                btn.title = name
            }


            btn.addEventListener('click', (e)=> {
                let interaction
                //trigger the ripple effect
                createButtonRippleEffect(e)
                
                
                let innerContainer = document.getElementById(params_control.htmlNode);

                //case when the initial btn state has to be restored on second click                    
                    if (params_control.selection_params.restore) {
                        //if the btn is hit once, disable all the other btns
                        if (!e.target.dataset.clicked || e.target.dataset.clicked === '0') {
                            unselect_btns(innerContainer)
                            
                            //update the current button style/data
                            update_target_btn(e)

                            interaction = 'filter'
                        }
                        //if the btn is hit twice, restore all the other btns style/data
                        else if (e.target.dataset.clicked && e.target.dataset.clicked === '1') {
                            restore_btns(innerContainer)
                            
                            interaction = 'restore'
                        }

                    }
                //case when the initial btn state has to be restored on second click                    
                    else if (!params_control.selection_params.restore) {
                        //disable all the other btns
                        unselect_btns(innerContainer)
                        
                        //update the current button style/data
                        update_target_btn(e)
                    }

                    


                if (params_control.selection_params.crossfilter) {
                    //clear click stores
                        params_control.list_idx_segment_single_selected = [] //stock le segment selectionné suite à un clic simple (ex: 0-0 pour le 1er segment)
                        params_control.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
                        params_control.list_keys_values_segment_single_selected = [] //stock le vrai label du segment selectionné suite à un clic simple (ex: communes 13 et nb_pieces 1)
                        params_control.list_keys_values_segments_multiples_selected = [] //stock les vrais labels des segments selectionnés suite à un clic multiple (ex: communes 13 et nb_pieces 1)
                        params_control.list_idx_segments_multiples_selected = [] //stock les segments selectionnés suite à un clic + shift
                        params_control.list_labels_segments_multiples_selected = [] //stock les labels des segments selectionnés suite à un clic + shift        



                    if (params_control.category_field) {
                        params_control.list_labels_segment_single_selected = [{category_field: btn.innerText}];
                        params_control.list_keys_values_segment_single_selected = [{[params_control.category_field]: btn.innerText}];
                        params_control.list_idx_segment_single_selected = [btn.innerText];
                    }
                    else if (params_control.data_driver && params_control.data_driver.chart_type === 'adressSearch') {
                        let _location = JSON.parse('['+btn.dataset.latLng+']');
                        params_control.sharedParams.userAdress = _location;
                        
                        params_control.instanciator.get_iso_open_route_service(params_control, _location)
                        let check_iso_ready = setInterval(()=> {
                            if (params_control.iso_ready) {
                                clearInterval(check_iso_ready);
                                let point_in_poly_dataset = [];

                                console.time('turf pointsWithinPolygon')
                                
                                let points = turf.helpers.points(params_control.sharedParams.data_main_arr_latLngs);
                                let searchWithin = turf.helpers.polygon(params_control.iso);
                                let ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
                                if (ptsWithin.features && ptsWithin.features.length> 0) {
                                    ptsWithin.features.forEach(e=> {
                                        let idx = e.geometry.coordinates[1]+'_'+e.geometry.coordinates[0];
                                        let row = params_control.sharedParams.data_main_indexed[idx]
                                        if (row) point_in_poly_dataset.push(row)
                                    })    
                                }
                                console.timeEnd('turf pointsWithinPolygon')


                                params_control.sharedParams.filter_order_origin = 'spatial query';
                                params_control.filter_order_origin = 'spatial query';
                                params_control.sharedParams.spatial_data = point_in_poly_dataset;
                                params_control.iso_ready = undefined;

                                //register the value of the current click
                                params_control.list_keys_values_segment_single_selected = [{lat : [_location[1]]}, {lng : [_location[0]]}];
                                params_control.list_idx_segment_single_selected = [_location.join()];
                                                        
                                
                            }
                        }, 100)

                    }

                }
                else if (params_control.selection_params.highlight) {
                    let target_markers = e.target.dataset.name
                    if (target_markers === 'Transport public') target_markers = 'Arrêt de '
                    params_control.highlight_charts?.forEach(chart_id=> {
                        //get params chart instance
                        let params_chart_target = params_control.sharedParams.params_charts.find(param=> param.id === chart_id.chart)
                        if (params_chart_target && params_chart_target.chart_type === 'leaflet') {
                            if (interaction === 'filter') {
                                params_chart_target.lock_markers_opacity = true;        
                                params_chart_target.active_layers = target_markers;                        
                                // params_chart_target.map_instance.eachLayer(l=> {
                                    //     if (l.options && l.options.label ) {
                                    //         let zIndex_max = d3.max(params_chart_target.arr_markers_source.map(m=> m._zIndex))
                                    //         l.options.zIndex_source = l._zIndex;
                                    //         if (!l.options.label.includes(target_markers) ) {
                                    //             //l.setOpacity(0);
                                    //             l._icon.style.transition = 'opacity 1s';
                                    //             l.setOpacity(0);
                                    //             l.remove()                                   
                                    //         }
                                    //         else {
                                    //             l._icon.style.transition = 'opacity 1s';
                                    //             l.setOpacity(1)
                                    //             l._bringToFront();
                                    //             l.setZIndexOffset(zIndex_max)
                                    //         }
                                    //     }
                                    // })

                            
                                //delete visible markers form the map
                                params_chart_target.map_instance.eachLayer(l=> {
                                    if (l.options && l.options.shapeType && ['poi_marker', 'polyline'].includes(l.options.shapeType)) {
                                        if (l._icon) l._icon.style.transition = 'opacity 1s';
                                        l.setOpacity(0)
                                        setTimeout(()=> {l.remove()}, 1000)
                                        
                                    }
                                })

                                //add the filtred markers
                                let _subset_markers = params_chart_target.arr_markers_source.filter(l=> l.options.label && l.options.label.includes(target_markers));
                                let subset_markers=[], i=0;
                                _subset_markers = shuffleArray(_subset_markers);
                                for (let l of _subset_markers) {
                                    if (i<250) {
                                        subset_markers.push(l)
                                        i++
                                    }
                                }
                                subset_markers.forEach(l=> {
                                    //register the zIndex
                                    // let zIndex_max = d3.max(params_chart_target.arr_markers_source.map(m=> m._zIndex))
                                    // l.options.zIndex_source = l._zIndex;
                                    //check & add the layer to the map
                                    if (l.options.label && l.options.label.includes(target_markers) ) {
                                        l.addTo(params_chart_target.map_instance)

                                        l._icon.style.transition = 'opacity 1s';
                                        setTimeout(()=> {l.setOpacity(1)}, 200)
                                        l._bringToFront();
                                        //l.setZIndexOffset(zIndex_max)
                                    }


                                });

                                
                            }
                            else if (interaction === 'restore') {
                                params_chart_target.map_instance.closePopup();
                                
                                params_chart_target.lock_markers_opacity = false;
                                params_chart_target.active_layers = undefined;
                                // params_chart_target.map_instance.eachLayer(l=> {
                                    //     if (l.options && l.options.label ) {
                                    //         l.setOpacity(1);
                                    //         l.setZIndexOffset(l.options.zIndex_source);
                                    //     }
                                    // });
                                
                                //remove existing layers added by the filter interaction
                                params_chart_target.arr_markers_source.forEach(l=> {
                                    if (params_chart_target.map_instance.hasLayer(l) && !l.options.center_iso) l.remove();
                                })
                                
                                //restore the sampled dataset of markers
                                params_chart_target.arr_markers.forEach(l=> {
                                    l.addTo(params_chart_target.map_instance)
                                    l.setOpacity(0)
                                    l._icon.style.transition = 'opacity 1s';
                                    l.setOpacity(1);
                                })
                            }
                            params_chart_target.map_instance.closePopup()

                            //bring to front center marker
                            setTimeout(()=> {
                                params_chart_target.featureGroup_markers.getLayers().find(l=> l.options.center_iso)._bringToFront()
                            }, 1200)
                        }
                    
                    })
                    
                }
                
                function unselect_btns(innerContainer) {
                    Object.values(innerContainer.children).forEach(b=> {                        
                        b.style.backgroundColor= '#d0cccc'; //light grey
                        b.firstElementChild.style.backgroundColor= '#d0cccc'; //light grey
                        //b.lastElementChild.style.backgroundColor= 'grey';
                        b.firstElementChild.dataset.clicked = 0
                    })
                }

                function restore_btns(innerContainer) {
                    Object.values(innerContainer.children).forEach(b=> {
                        b.style.backgroundColor= b.firstElementChild.dataset.backgroundColor; 
                        b.firstElementChild.style.backgroundColor= b.firstElementChild.dataset.backgroundColor;
                        //b.lastElementChild.style.backgroundColor= 'grey';
                        b.firstElementChild.dataset.clicked = 0
                    })
                }                


                function update_target_btn(e) {
                    e.target.parentElement.style.backgroundColor= e.target.dataset.backgroundColor;
                    e.target.style.backgroundColor=e.target.dataset.backgroundColor
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.backgroundColor="white"
                    e.target.dataset.clicked = 1
                }

            });
            
            if (number) {btn_container.append(btn, number_container)}
            else {btn_container.append(btn)}

            return btn_container


            function get_backgroundColor(params_control, name) {
                let color_keys, color_values, color_key, color_value;
                params_control.sharedParams.sharedParams_array.some(sh=> {                    
                    let registed_colors_values = Object.values(sh.registed_colors)
                    if (sh.registed_colors && registed_colors_values.length >0) {                        
                        registed_colors_values.some(o=> {
                            color_keys = Object.keys(o);
                            color_values = Object.values(o);

                            
                            color_keys.some(c=> {
                                //case when the name of the color key is included in the name of the btn;
                                if (name.includes(c)) {
                                    color_value = o[c];
                                    return color_value
                                }
                                //case when the name of the btn is included in the name of the color key;
                                else if (c.includes(name)) {
                                    color_value = o[c];
                                    return color_value
                                }
                            })
                            return color_value
                        })                        
                    }
                    if (color_value) return color_value
                });
                if (color_value) return color_value
            }

            function animate_number(target_number, html_node) {
                let requestAnimation_handler, animation_speed, ease_function, progress_number=0
                let fps = params_control.fps_value_anim || 15;

                function animate_number() {
                    if (progress_number<target_number) {                
                        let timeout = 1000 / fps                        
                        setTimeout(() => {
                            progress_number++
                            html_node.innerText = progress_number                            
                            requestAnimation_handler = requestAnimationFrame(animate_number);
                        }, timeout);                        
                    }
                    else {
                        html_node.innerText = target_number;
                        html_node.style.transform = 'rotateX(360deg)'
                        cancelAnimationFrame(requestAnimation_handler)
                    }                    
                }
                animate_number()
            }        


            function format_adress (adress) {
                const re=/[0-9]{4,6}/;
                let matcher = adress.match(re);
                if (matcher && matcher.length>0 && matcher.index) {
                    let index = matcher.index;
                    let rue = adress.substring(0, index);
                    let commune = adress.substring(index,);
                    adress = `${rue}<br/>${commune}`
                    return adress
                }
                else return adress
            }            

            
    }

    inject_metadata(params_control, instanciator, data_type, injection_type, updateTime) {
        if (!params_control.data_input || params_control.data_input.length === 0) return
        
        let check_chart_rendering = setInterval(()=>{
            let parent_container_display = check_parent_display(params_control)
            if (parent_container_display.chart_display_on) {
                clearInterval(check_chart_rendering);
                let innerContainer = document.getElementById(params_control.htmlNode)
                if (params_control.data_driver && params_control.data_driver.chart_type === 'adressSearch') {
                    params_control.data_input.forEach(d=> {                    
                        let color = undefined
                        let btn = params_control.instanciator.create_button(params_control, d.adress, d.lat_lng, color);
                        innerContainer.append(btn)                        
                        setTimeout(()=> {btn.style.opacity = 1}, 300)                        
                    })
                }
                else if (params_control.category_field && params_control.numerical_field_params && ['sum', 'count', 'mean', 'median'].includes(params_control.numerical_field_params.agg_type)) {
                    if (arr_poi_to_display && params_control.filtered_by.id) {
                        //restrict the dataset to the desired facilities as listed in arr_poi_to_display
                        let arr_params_markers = params_control.instanciator.prepare_data_poi(params_control, params_control.data_input);
                        
                        //sort the dataset
                        let _arr_params_markers=[];
                        Object.keys(arr_params_markers).forEach(k=> {
                            _arr_params_markers.push({key: k, l: arr_params_markers[k].length})
                        });
                        _arr_params_markers.sort(trier('l', 'desc'))

                        //remove previous btns
                        let innerContainer = document.getElementById(params_control.htmlNode)
                        if (innerContainer.childElementCount>0) Object.values(innerContainer.children).forEach(c=> c.remove())

                        //create the btns
                        let arr_btn=[];
                        _arr_params_markers.forEach(e=> {
                            let name = e.key, number = e.l, backgroundColor, fontColor='white';
                            if (name === 'Transport public') {
                                backgroundColor = params_control.data_input.find(e=> e.libelle_equipement?.includes('Arrêt de '))?.colorHEX
                            }
                            else {
                                backgroundColor = params_control.data_input.find(e=> e.libelle_equipement?.includes(name))?.colorHEX
                            }
                    
                            if (!backgroundColor) {
                                backgroundColor = 'grey'
                            }

                            if (['#ffca91', 'lightgray'].includes(backgroundColor)) {
                                fontColor = 'black'
                            }
                    
                            let btn = params_control.instanciator.create_button(params_control, name, undefined, backgroundColor, fontColor, number)
                            innerContainer.append(btn)                        
                            setTimeout(()=> {btn.style.opacity = 1}, 300);                            
                            arr_btn.push(btn)
                        });

                        
                    
                            
                    }
                    else {
                        console.log('n')
                    } 
                }                                
            }
        }, 200);


    }

	get_iso_open_route_service(params_control, _location) {
		let github_token = '5b3ce3597851110001cf624880dfd5c82fff4542977ea0486794cb08';
		let gmail_token = '5b3ce3597851110001cf6248354afa103776467b94a6a6e4c6a4e248';
		let polys_requested = [];

		
		if (!params_control.ors_token) {
			params_control.ors_token = github_token
		}
		else {
			params_control.ors_token = gmail_token
		}


		//get from the switch_profil_user widget
		let profil_user = params_control.sharedParams.profil_user_route || 'foot-walking'
		//get from the slider_range widget
		let range = params_control.sharedParams.profil_user_range_route || 5*60;

		let params_iso = {
			locations: [_location],
			method: 'time', //'Time' for ign api
			//method_ign: 'Time',
			profile: profil_user,
			range: [range],
		}

		let id_request = profil_user + '_' + range + '_' + JSON.stringify(params_iso.locations)

        if (!params_control.requested_isopolys) {
            params_control.requested_isopolys = {};
            params_control.sharedParams.requested_isopolys = {};
        }
		if (params_control.requested_isopolys[id_request]) {
			var resp = params_control.requested_isopolys[id_request].request_response

			params_control.iso = resp.features[0].geometry.coordinates
            params_control.iso_ready = true
		}

		params_control.params_iso = params_iso

		let request = new XMLHttpRequest();

        let u = `https://api.openrouteservice.org/v2/isochrones/${params_control.params_iso.profile}`
		request.open('POST', u);

		request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
		request.setRequestHeader('Content-Type', 'application/json');
		request.setRequestHeader('Authorization', params_control.ors_token);


		request.onreadystatechange = function () {
			//console.warn({this: this, status: this.status, readyState: this.readyState})
			if (this.readyState === 4 && this.status === 200) {
				let resp = JSON.parse(this.responseText);

				//reset the token to use
				params_control.ors_token = undefined;

				//register the request response
				params_control.requested_isopolys[id_request] = {id_request: id_request, request_response: resp};
                params_control.sharedParams.requested_isopolys[id_request] = {id_request: id_request, request_response: resp}
                
                params_control.iso = resp.features[0].geometry.coordinates
                params_control.iso_ready = true
			}
			else if (this.readyState === 4 && this.status === 0) {
				console.warn('limit request per min reached')
			}
		};
		request.onerror = ()=> {
			console.warn('reload the request with the backup token')
			params_control.ors_token = gmail_token;
			setTimeout(()=> {get_iso_open_route_service(params_control)}, 1000)
		}
		var body = `{"locations":${JSON.stringify(params_control.params_iso.locations)},"range":[${params_control.params_iso.range}]}`;
		request.send(body);

	}  
    
    prepare_data_poi(params_chart, arr_params_markers) {
        if (arr_poi_to_display) arr_params_markers = arr_params_markers.filter(r => arr_poi_to_display.includes(r.TYPEQU));
 
        //drop duplicates where the id= falities+lat+lng
        arr_params_markers.forEach(r=> r.id = r.libelle_equipement+'_'+r.lat+'_'+r.lng)
        arr_params_markers = _.uniqBy(arr_params_markers, 'id');

        //group dataset by facilities
        let group_arr_params_markers = _.groupBy(arr_params_markers, 'libelle_equipement');            

        //simplify the records with breaklines (rm br)
        Object.keys(group_arr_params_markers).forEach(k=> {
            let isMultiLigne=k.indexOf('\n+')
            if (isMultiLigne>1) {
                let simplified_key = k.substring(0, isMultiLigne)
                arr_params_markers[simplified_key] = arr_params_markers[k]
                delete arr_params_markers[k]
            }            
        })

        //group the public transport records into one rubric
        //group the records
        let t = [];
        Object.keys(group_arr_params_markers).forEach(k => {
            if (k.includes('Arrêt de ')) {
                t.push({ 'Transport public': group_arr_params_markers[k] });
                delete group_arr_params_markers[k];
            };
        });


    
        let f = {}, c = [];
        t.forEach(e => c = c.concat(e['Transport public']));
    
        //deduplicate the records
        c.forEach(e => e.id = e.libelle_equipement + '_' + e.ligne);
        c = _.uniqBy(c, 'id');
        f['Transport public'] = c;
    
        //assign the result to the original dataset
        Object.assign(group_arr_params_markers, f);

		//slice the dataset by selecting the n first records
            function getSlice(range) { return parseInt((range * 30) / 900); }
            let slice = getSlice(params_chart.sharedParams.profil_user_range_route);
            if (params_chart.sharedParams.profil_user_route === 'driving-car') slice=slice*2;
            arr_params_markers=[];
            
            Object.keys(group_arr_params_markers).forEach(k => {
                if (group_arr_params_markers[k].length > slice) { 
                    //group_arr_params_markers[k] = group_arr_params_markers[k].slice(0, slice)
                }
            });

 
        return group_arr_params_markers
    }    


    setup_params_user(params_control) {
        if (params_control.selection_params.highlight) params_control.selection_params.crossfilter = false
    }
}
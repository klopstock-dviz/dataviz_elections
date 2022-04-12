class params_map_isochrone {
    constructor() {
        this.id = 'mapid'
        this.htmlNode = 'mapid'
        this.arr_markers =[]
        this.arr_user_markers =[]               
        this.params_created_isopolys = []
        this.created_polygones = {}
        this.created_polylines = {}
        this.requested_isopolys = {}
        this.requested_polylines = {}
        this.itin_params = {itin_easingFunc:'easeInOutQuad', flyToBounds: true}//easeLinear'        
        this.droplist_fields = []
        this.droplist_ID = 0
        this.overpass_api_requested_bbox = {}
        this.selected_legends = []
        this.brush_values = {}

        this.list_idx_segment_single_selected = [] //stock le segment selectionné suite à un clic simple (ex: 0-0 pour le 1er segment)
        this.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
        this.list_keys_values_segment_single_selected = [] //stock le vrai label du segment selectionné suite à un clic simple (ex: communes 13 et nb_pieces 1)
        this.list_keys_values_segments_multiples_selected = [] //stock les vrais labels des segments selectionnés suite à un clic multiple (ex: communes 13 et nb_pieces 1)
        this.list_idx_segments_multiples_selected = [] //stock les segments selectionnés suite à un clic + shift
        this.list_labels_segments_multiples_selected = [] //stock les labels des segments selectionnés suite à un clic + shift
        this.list_final_labels_uniq_selected = new Set() //stock les labels sans doublons des segments selectionnés suite à tous types de clics (simple ou clic + shift)    
        this.brush_keys_values = {}        
        this.transformations= {crossfilter:{}}
        this.filtered_by = {}
        this.pin_adresses = {}
        this.public_transport_routes_params = {colorsRoutes: {}, color_idx:0, colorSchemes: [], ease_animation_circles: "easeInQuad", speed_animation_circles: 0.5}
        this.results_citymapper_transit_time={}
        this.funcLib = {
            generate_color_scheme: function (_this) {
				let _colorSchemes = ["schemeTableau10", "schemeAccent", "schemeCategory10", "schemeDark2", "schemePaired", "schemePastel1", "schemePastel2", "schemeSet1", "schemeSet2", "schemeSet3"];
				let colorSchemes=[]
				_colorSchemes.map(cs=> d3[cs]).forEach(cs=> colorSchemes=colorSchemes.concat(cs));
                //delete clear colors
                _colorSchemes=[];
                colorSchemes.forEach(c=> {
                    let is_clear = adjust_font_color_contrast(c);
                    if (is_clear === 'white') {
                        _colorSchemes.push(c);
                    }
                })
                _this.public_transport_routes_params.colorSchemes = _colorSchemes
            },
            //events to fire for escape key
            escape_keyup: function(params_map) {
                params_map.map_instance.on('keydown', (e)=>  {
                    if (e.originalEvent.key === "Escape") {
                        //restore the map to its initial view (close popups, stops icons, restore icons opacity...)
                        params_map.funcLib.restore_map_state(params_map)
                    }
                });
            },

            restore_map_state: function(params_map) {
                //restore initial zoom level

                let latLngs = params_map.params_iso.isopoly_latLngs[0].map(e=> {return [e[1], e[0]]})
                params_map.map_instance.flyToBounds(latLngs);

                //bring to front home icons & restore their opacity
                params_map.funcLib._bringToFront_home_icons(params_map)

                //lower opacity of the routes
                params_map.map_instance.eachLayer(l=> {
                    if (l.options && l.options.shapeType === 'polyline') {
                        l.setStyle({opacity: 0, color: 'grey', fillColor: 'grey'})
                    }
                })

                //close popups & tooltips
                params_map.map_instance.closePopup(); params_map.map_instance.closeTooltip();

                //delete public transport stops
                if (params_map.featureGroup_public_transport_stops) {
                    params_map.featureGroup_public_transport_stops.remove();
                    params_map.lock_markers_opacity = false
                }

                params_map.display_public_transport_transit_time=false;
                params_map.display_public_transport_network=false;
                params_map.arr_markers.forEach(m=> m.options.display_public_transport_network = false)
    
                params_map.popupRouteActive=false;
                params_map.keep_popup=false

                //restore opacity of all markers
                if (params_map.lock_markers_opacity) return

                if (!params_map.active_layers || params_map.active_layers === 'all') {
                    params_map.arr_markers.forEach(m=> m.setOpacity(1));
                }
                else {
                    params_map.arr_markers.forEach(m=> {
                        if (m.options.label && m.options.label.includes(params_map.active_layers)) {
                            m.setOpacity(1)
                        }
                    });
                }
            },

            //re-order isopoly layers position (brin to front the smallest layers first)
            re_orderIsopolyLayers: function (params_map) {
                let isopolys
                let check_isopolys_loading = setInterval(() => {
                    isopolys=Object.values(params_map.map_instance._layers).find(p=> p.options?.shapeType === 'isopoly')
                    if (isopolys) {
                        isopolys=Object.values(params_map.map_instance._layers).
                        filter(p=> p.options?.shapeType === 'isopoly').
                        map(p=> 
                            {
                                var poly = p.options.source_coordinates;
                                poly = turf.helpers.polygon(poly);
                                var area = turf.area.default(poly);
                                return {area: area, poly: p} 
                                
                        })
                        isopolys.sort(trier('area', 'desc')).forEach(p=> p.poly.bringToFront())

                        let largestBounds = isopolys.map(p=> p.poly.options.source_coordinates)
                        
                        // setTimeout(()=> {
                        // 	params_map.map_instance.flyToBounds(largestBounds)}
                        // , 0)
                            

                        clearInterval(check_isopolys_loading)
                    }

                }, 500);
            },
            //used to create the html struct that holds the adress suggestions for the user markers
            create_poi_html_body: function(params_map, ul_container, input_path, droplist_path) {
                let field_li = document.createElement('li');
                var field = document.createElement('span'); 
                Object.assign(field, {
                    href:'', 
                    className: "w3-bar-item w3-button droplist_field", 
                })
                field.style.padding = '4px 6px';
                field.style.cursor = 'pointer';
                field.style.fontSize = '11.5px';

                //on click, fill the input text zone with the span value & close the droplist
                field.addEventListener('click', (e)=> {
                    params_map.funcLib.select_adress_proposition(e, params_map, ul_container, input_path, droplist_path)


                })

                    
                field_li.append(field)
                //add separator
                let separator = document.createElement('hr');
                separator.style.border= 0;
                separator.style['border-top'] = '2px solid #eee';
                separator.style.margin = '1px 0';

                ul_container.append(field_li, separator)
                
                return field
            },
            select_adress_proposition: function(e, params_map, ul_container, input_path, droplist_path) {
                let input = document.getElementById(input_path);
                input.value = e.target.dataset.adress;
                input.dataset.adress = e.target.dataset.adress;
                input.dataset.adress_object = e.target.dataset.adress_object;

                //dataset.input_action = 'add marker from map click'

                //reset cursor style on map hover
                params_map.map_instance._container.addEventListener('mouseover', (e)=> {e.target.style.cursor = ''})
                
                //reset the span styles
                let spans = ul_container.getElementsByTagName('SPAN');
                Object.values(spans).forEach(span=> {
                    span.style.backgroundColor = '';
                    span.style.borderRadius = '5px'					
                })

                //style the selected span
                e.target.style.backgroundColor = 'rgb(255 152 0 / 30%)';
                e.target.style.borderRadius = '5px'


                //hide the droplist
                var droplist = document.getElementById(droplist_path);
                droplist.classList.remove("w3-show");  						


                //case when the process is to add a marker from an adress input
                    
                    //add the new marker
                    if (e.target.dataset.latLng) {
                        let latLng = JSON.parse(`[${e.target.dataset.latLng}]`);
                        input.dataset.latLng = latLng
                        //technique to update the latLng for the actual marker
                            //get the leaflet marker id of the last pined marker
                            //let markerID = Object.values(e.target.parentElement.parentElement.children).filter(c=> c.firstElementChild?.dataset.markerID).find(li=> li.firstElementChild.dataset.markerID)?.firstElementChild.dataset.markerID;
                            let markerID = input.dataset.markerID
                            let markerExist = params_map.map_instance._layers[parseInt(markerID)] || false
                            
                            //if the marker doesn't exist, create it
                            //tooltip creation
                            let tooltip
                            if (e.target.dataset.adress_object) {
                                let rue = JSON.parse(e.target.dataset.adress_object).rue;
                                let commune = JSON.parse(e.target.dataset.adress_object).commune;
                                tooltip = `${rue} <br/> ${commune}`
                            }
                            else tooltip = e.target.dataset.adress;

                            let newMarker
                            let _hr='<hr style="margin: 5px 0; border: 0; border-top: 0.5px solid #ddd3d3">'
                            if (!markerID || markerID === 'undefined' || !markerExist) {                                
                                newMarker = new LeafletCustomMarker().createMarker(latLng, 'red').addTo(params_map.map_instance).bindTooltip(tooltip +_hr+'Cliquer pour interagir').openTooltip()
                                newMarker.options.adress = e.target.dataset.adress
                                input.dataset.markerID = newMarker._leaflet_id;                                
                            }
                            //else update the latLng of the marker
                            else if (markerExist) {
                                newMarker = params_map.map_instance._layers[parseInt(markerID)]
                            }

                            if (newMarker) {
                                newMarker.setLatLng(latLng);
                                newMarker.bindTooltip(tooltip+_hr +'Cliquer pour interagir').openTooltip()
                                prepare_create_popup(newMarker, params_map, tooltip)


                                newMarker.on('popupopen', e=> {
                                    e.target.options.popup_visibility = true;
                                    //add the liteners to the popup btns
                                    let _popup_container = params_map.map_instance._popup._container;
                                    params_map.instanciator.add_listeners_to_popup(_popup_container, newMarker, params_map);

                                });

                                newMarker.on('popupclose', e=> {
                                    e.target.options.popup_visibility = false
                                })
        
                            }
                            


                        //set the zoom of the map
                        if (params_map.map_instance.getZoom() < 16 || e.target.dataset.input_action === 'add marker from adress input') {
                            params_map.map_instance.flyTo(latLng, 16)
                        }
                        // else if (e.target.dataset.input_action === 'add marker from adress input') {
                        // 	params_map.map_instance.flyTo(latLng, 16)
                        // }

                        input.dataset.waitForNewMarker = false;
                        input.dataset.isFilledWithAdress = true;
                    }

                function prepare_create_popup(marker, params_map, popup_message) {
                    //create the popup
                    let popup= params_map.instanciator.build_marker_popup_html_body(popup_message);
                    marker.bindPopup(popup);

                    marker.on('popupopen', e=> {
                        e.target.options.popup_visibility = true
                    })

                    marker.on('popupclose', e=> {
                        e.target.options.popup_visibility = false
                    })
                
                    params_map.arr_user_markers.push(marker);
                }

            },
            
            create_new_poi_container: function(params_map, container_POI, outerContainer_POI) {
                let inputBarOptions = {searchBar: true, openDroplistOnclick: false}
                let POI_input = create_droplist_fields(params_map, params_map.droplist_fields, params_map.droplist_ID, inputBarOptions)
                let POI_container_droplist = POI_input.container_droplist;
                let POI_input_text_zone = POI_input.input_text_zone;
                let button_clear_search = POI_input.button_clear_search

                POI_input_text_zone.dataset["waitForNewMarker"]=false
                POI_input_text_zone.style.width = '180px'
                POI_input_text_zone.classList.add(params_map.id+'_input_poi');

                POI_container_droplist.classList.add('w3-animate-zoom')
                Object.assign(POI_container_droplist.style, {
                    width: 'inherit',
                    border: '1px dashed darkgrey',
                    borderRadius: '5px',
                    padding: '5px',
                    opacity: '0'
                })



                //create settings buttons for the marker
                    let outerContainer_settings_controls = document.createElement('div');
                    outerContainer_settings_controls.id = `outerContainer_settings_controls_${params_map.droplist_ID}_${params_map.id}`
                    Object.assign(outerContainer_settings_controls.style, {
                        display: 'grid',
                        width: 'inherit',
                        'row-gap': '10px',
                        'column-gap': '10px',
                        'grid-column-start': 1,
                        'grid-column-end': 3,	
                        'grid-template-columns': 'auto auto'		
                    })
                    //settings controls title
                        var title_outerContainer_settings_controls = document.createElement('span');
                        title_outerContainer_settings_controls.id = `title_outerContainer_settings_controls_${params_map.droplist_ID}_${params_map.id}`
                        Object.assign(title_outerContainer_settings_controls.style, {
                            'font-size': '12.5px',
                            color: '#262728',
                            'justify-self': 'center',
                            //'border-bottom': '0.5px solid darkgrey',
                        })
                        
                        title_outerContainer_settings_controls.innerText = 'Personnaliser le repère';

                    //icon controls display panel
                        let button_display_settings_panel = document.createElement('img'); 
                        Object.assign(button_display_settings_panel, {
                            //className: 'w3-button w3-teal', 
                            id: `button_display_settings_panel_${params_map.droplist_ID}_${params_map.id}`, 
                            src: 'css/font-awesome-svg/cog-solid.svg',
                            title: 'Afficher les paramètres'
                        })
                        button_display_settings_panel.dataset.droplist_ID = params_map.droplist_ID

                        Object.assign(button_display_settings_panel.style, {
                            width: "14px",
                            boxShadow: '0 0 5px rgb(142 137 137 / 70%)',
                            borderRadius: '6px',
                            "align-self": 'center',								
                            opacity: '1'
                        });

                        
                        
                        button_display_settings_panel.addEventListener('click', (e)=> {
                            let droplist_ID = button_display_settings_panel.dataset.droplist_ID
                            let container_settings_controls = document.getElementById(`container_settings_controls_${droplist_ID}_${params_map.id}`);
                            if (container_settings_controls.style.display === 'none') {
                                //container_settings_controls.style.transform = 'translate(10px, 24px)';									
                                container_settings_controls.style.display = 'flex'									
                                                                    
                                container_settings_controls.style.opacity = '1'
                                container_settings_controls.style.transform = 'rotateX(0deg) translate(0px, 24px)';
                                container_settings_controls.style.zIndex = '5'
                                e.target.title = 'Masquer'
                                e.target.dataset.panel_visibility = '1'
                            }
                            else {									
                                container_settings_controls.style.transform = 'rotateX(90deg) translate(0px, 24px)';

                                setTimeout(() => {
                                    container_settings_controls.style.display = 'none'
                                    container_settings_controls.style.opacity = '0';
                                    container_settings_controls.style.zIndex = '0'
                                }, 1000); 
                                e.target.title = 'Afficher les paramètres';
                                e.target.dataset.panel_visibility = '0'
                                container_settings_controls.style.zIndex = '0'
                            }
                        })

                        button_display_settings_panel.addEventListener('mouseover', (e)=> {
                            e.target.style.filter = 'invert(79%) sepia(50%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)';
                            e.target.style.cursor = 'pointer';
                        })

                        button_display_settings_panel.addEventListener('mouseout', (e)=> {
                            e.target.style.filter = 'invert(0%) sepia(72%) saturate(0%) hue-rotate(328deg) brightness(95%) contrast(106%)';
                            e.target.style.cursor = ''								
                        });


                    outerContainer_settings_controls.append(title_outerContainer_settings_controls, button_display_settings_panel)

                    let container_settings_controls = document.createElement('div');
                    container_settings_controls.id = `container_settings_controls_${params_map.droplist_ID}_${params_map.id}`						
                    Object.assign(container_settings_controls.style, {
                        display: "none",
                        width: 'max-content',
                        'column-gap': '6px',
                        position: 'absolute', 
                        backgroundColor: 'white',
                        padding: '10px',
                        boxShadow: 'rgb(142 137 137 / 70%) 0px 0px 5px',
                        borderRadius: '2px',
                        transform: 'rotateX(90deg) translate(0px, 24px)',
                        opacity: '0',
                        //transform: 'rotateX(90deg)',
                        transition: 'all 1s'//opacity 0.5s, 
                    })
                    
                    
                    //pickup color
                        var container_color_picker = document.createElement('div');
                        container_color_picker.style = 'display: grid; width: max-content;';

                        var label_color_picker = document.createElement('label'); 
                        label_color_picker.for = `color_picker_${params_map.droplist_ID}_${params_map.id}`;
                        label_color_picker.style = 'font-size: 11.5px; color: #262728; margin-top: -5px; justify-self: center;'
                        label_color_picker.innerText = 'Couleur'
                        // //let texts_array = ['Couleur du', 'repère'];
                        // spanText_style = 'font-size: 11.5px; color: #262728; margin-top: -5px; justify-self: center;'
                        // add_text_breaks(texts_array, spanText_style, label_color_picker)

                        function add_text_breaks(texts_array, style, container) {
                            texts_array.forEach(t=> {
                                var spanText = document.createElement('span');
                                spanText.style = style;
                                spanText.innerText = t;
                                container.append(spanText)
                            })
                        }
                        //label_color_picker.innerHTML = 'Couleur du <br/> repère';
                        

                        // var color_picker = document.createElement('input');
                        // color_picker.id = `color_picker_${params_map.droplist_ID}_${params_map.id}`;
                        // color_picker.name = 'color_picker';
                        // color_picker.type = 'color';
                        // color_picker.value = '#E70D0D';
                        // color_picker.style = 'width: 27px; height: 20px; padding: 0px; justify-self: center;'

                        var button_color_picker = document.createElement('button');
                        button_color_picker.id = `button_color_picker_${params_map.droplist_ID}_${params_map.id}`;
                        Object.assign(button_color_picker.style, {
                            width: '27px',
                            height: '20px',
                            backgroundColor: '#CB2B3E',
                            justifySelf: 'center'
                        })

                        button_color_picker.dataset.droplist_ID = params_map.droplist_ID;
                    
                        button_color_picker.addEventListener('click', (e)=> {
                            let droplist_ID = e.target.dataset.droplist_ID
                            let color_picker = document.getElementById(`color_picker_${droplist_ID}_${params_map.id}`);
                            if (color_picker.style.display === 'none') {
                                color_picker.style.display = 'grid'
                                color_picker.style.opacity = '1';
                                color_picker.style.zIndex = '10'
                            }
                            else {
                                color_picker.style.display = 'none';
                                color_picker.style.opacity = '0';
                                color_picker.style.zIndex = '0'
                            }
                        })

                        var color_picker = document.createElement('div');
                        color_picker.id = `color_picker_${params_map.droplist_ID}_${params_map.id}`;
                        Object.assign(color_picker.style, {
                            display: 'none',
                            opacity: 0,
                            transition: 'all 1s',
                            gridTemplateColumns: 'auto auto auto',
                            width: 'max-content',
                            height: 'max-content',
                            padding: '5px', 
                            'justify-self': 'center',
                            gap: '4px',
                            backgroundColor: 'white',
                            boxShadow: 'rgb(142 137 137 / 70%) 0px 0px 5px',
                            border: '0.1px solid #aaa7a7',
                            borderRadius: '5px',
                            position: 'absolute',
                            transform: 'translate(10px, 40px)'
                        })

                        let arrColors = [
                            {color: 'red', code:'#CB2B3E', idx: 0},
                            {color: 'blue', code:'#2A81CB', idx: 1},
                            {color: 'gold', code:'#FFD326', idx: 2},
                            {color: 'green', code:'#2AAD27', idx: 3},
                            {color: 'orange', code:'#CB8427', idx: 4},
                            {color: 'yellow', code:'#CAC428', idx: 5},
                            {color: 'violet', code:'#9C2BCB', idx: 6},
                            {color: 'grey', code:'#7B7B7B', idx: 7},
                            {color: 'black', code:'#3D3D3D', idx: 8}
                        ]

                        arrColors.forEach(c=> {
                            let colorRect = document.createElement('div');
                            colorRect.dataset.droplist_ID = params_map.droplist_ID
                            Object.assign(colorRect.style, {
                                width: '25px',
                                height: '25px',
                                backgroundColor: c.code,
                                boxShadow: 'rgb(142 137 137 / 70%) 0px 0px 5px'
                            });
                            colorRect.dataset.color_idx = c.idx

                            colorRect.addEventListener('click', (e)=> {									
                                let droplist_ID = e.target.dataset.droplist_ID
                                let color_picker = document.getElementById(`color_picker_${droplist_ID}_${params_map.id}`);
                                let idxCodePicked = parseInt(e.target.dataset.color_idx);									
                                let colorLabel = arrColors.find(e=> e.idx === idxCodePicked)?.color;
                                let colorCode = arrColors.find(e=> e.idx === idxCodePicked)?.code;
                                var POI_container_droplist = document.getElementById(`dropdownContainer_${droplist_ID}_${params_map.id}`);
                                //update associated marker
                                let markerID = POI_container_droplist.querySelector(`#input_text_${droplist_ID}_${params_map.id}`).dataset.markerID;
                                let icon = new LeafletCustomMarker().createIcon(colorLabel);
                                if (markerID) params_map.map_instance._layers[parseInt(markerID)]?.setIcon(icon);
                                
                                //change the color of the button_color_picker
                                let button_color_picker = document.getElementById(`button_color_picker_${droplist_ID}_${params_map.id}`);
                                button_color_picker.style.backgroundColor = colorCode;

                                //close the colors container									
                                color_picker.style.opacity = '0';
                                setTimeout(() => {
                                    color_picker.style.display = 'none';
                                    color_picker.style.zIndex = '0'
                                }, 1000);

                                
                            });

                            colorRect.addEventListener('mouseover', (e)=> {e.target.style.cursor = 'pointer'});
                            colorRect.addEventListener('mouseout', (e)=> {e.target.style.cursor = ''})
                            color_picker.append(colorRect)
                        })

                        container_color_picker.append(label_color_picker, button_color_picker, color_picker);

                    //label marker
                    var container_label_marker = document.createElement('div');
                        container_label_marker.style = 'display: grid; width: max-content;';

                        var label_marker = document.createElement('label'); 
                        label_marker.for = `label_marker_input_${params_map.droplist_ID}_${params_map.id}`;
                        label_marker.style = 'font-size: 11.5px; color: #262728; margin-top: -5px; justify-self: center;'
                        label_marker.innerText = 'Nom'
                        

                        var label_marker_input = document.createElement('input');
                        label_marker_input.id = `label_marker_input_${params_map.droplist_ID}_${params_map.id}`;
                        label_marker_input.name = 'label_marker_input';
                        label_marker_input.type = 'text';
                        label_marker_input.placeholder = 'Saisir un nom';
                        label_marker_input.style = 'width: 75px; height: 20px; padding: 0px; justify-self: center; font-size: 11.5px; color: #262728;'
                        label_marker_input.dataset.droplist_ID = params_map.droplist_ID;
                        label_marker_input.value = ''
                        label_marker_input.autocomplete="off"

                        label_marker_input.addEventListener('change', (e)=> {
                            let label = e.target.value;
                            let markerID = document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.markerID;
                            //adresse process
                                let adress= document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.adress;
                                let adress_split = adress.split(', ')
                                let rue = adress_split[0];
                                let commune_pays = adress_split[1] + ' '+ (adress_split[2] || '');
                                
                            //latLng process
                                let latlng= document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.latLng;
                                latlng=(JSON.parse(`[${latlng}]`).map(e=> e.toPrecision(6))).join(', ');

                            let markerExist = params_map.map_instance._layers[parseInt(markerID)] || false
                            if (markerID && markerID !== 'undefined' && markerID) {
                                let categorie = params_map.map_instance._layers[parseInt(markerID)].options.categorie || "";
                                let _hr='<hr style="margin: 5px 0; border: 0; border-top: 0.5px solid #ddd3d3">'
                                let tooltip = `Adresse: ${rue}<br/> ${commune_pays} <br/> Nom: ${label}<br/> Catégorie: ${categorie}<br/> Latitude et longitude: ${latlng} ${_hr}Cliquer pour interagir`
                                params_map.map_instance._layers[parseInt(markerID)].bindTooltip(tooltip).openTooltip();
                                
                                //save the label in the marker's options
                                params_map.map_instance._layers[parseInt(markerID)].options.nom = label;
                            }
                        })

                        container_label_marker.append(label_marker, label_marker_input);
                        
                    
                    //category
                    var container_category_marker = document.createElement('div');
                        container_category_marker.style = 'display: grid; width: max-content;';

                        var label_category_marker = document.createElement('label'); 
                        label_category_marker.for = `category_marker_list_${params_map.droplist_ID}_${params_map.id}`;
                        Object.assign(label_category_marker.style, {
                            'font-size': '11.5px',
                            color: '#262728',
                            'margin-top': '-5px',
                            'justify-self': 'center',
                        });


                        label_category_marker.innerText = 'Catégorie'


                        var category_marker_list = document.createElement('select');
                        category_marker_list.id = `category_marker_list_${params_map.droplist_ID}_${params_map.id}`;
                        Object.assign(category_marker_list.style, {
                            width: '75px',
                            height: '20px',
                            padding: '2px 2px',
                            'justify-self': 'center',
                            'font-size': '11.5px',
                            color: '#262728'
                        });
                        category_marker_list.dataset.droplist_ID = params_map.droplist_ID;

                        let options_arr = ['Choisir une cat...', 'Santé', 'Alimentaire', 'Transport', ];
                        options_arr.forEach(o=> {
                            var category_marker_input = document.createElement('option');
                            category_marker_input.value = o;
                            category_marker_input.innerText = o;								
                            category_marker_list.append(category_marker_input);
                        })
                        category_marker_list.addEventListener('change', (e)=> {
                            let categorie= e.target.value;
                            let markerID = document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.markerID;
                            //adresse process
                            let adress= document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.adress;
                                let adress_split = adress.split(', ')
                                let rue = adress_split[0];
                                let commune_pays = adress_split[1] + ' '+ (adress_split[2] || '');
                                
                            //latLng process
                                let latlng= document.getElementById(`input_text_${e.target.dataset.droplist_ID}_${params_map.id}`).dataset.latLng;
                                latlng=(JSON.parse(`[${latlng}]`).map(e=> e.toPrecision(6))).join(', ');


                            let markerExist = params_map.map_instance._layers[parseInt(markerID)] || false
                            if (markerID && markerID !== 'undefined' && markerID) {
                                let label = params_map.map_instance._layers[parseInt(markerID)].options.nom || "";
                                let _hr='<hr style="margin: 5px 0; border: 0; border-top: 0.5px solid #ddd3d3">';
                                let tooltip = `Adresse: ${rue}<br/> ${commune_pays} <br/> Nom: ${label}<br/> Catégorie: ${categorie}<br/> Latitude et longitude: ${latlng} ${_hr} Cliquer pour interagir`
                                params_map.map_instance._layers[parseInt(markerID)].bindTooltip(tooltip).openTooltip();
                                
                                //save the label in the marker's options
                                params_map.map_instance._layers[parseInt(markerID)].options.categorie = categorie;
                            }
                        })

                        container_category_marker.append(label_category_marker, category_marker_list);		

                //create delete icon for the POI container			
                    var button_delete_container_POI = document.createElement('img'); 
                    Object.assign(button_delete_container_POI, {
                        //className: 'w3-button w3-teal', 
                        id: `button_delete_POI_${params_map.droplist_ID}_${params_map.id}`, 
                        src: 'css/font-awesome-svg/close-times-circle-regular.svg',
                        title: 'Supprimer ce repère'
                    })
                    button_delete_container_POI.dataset.droplist_ID = params_map.droplist_ID

                    Object.assign(button_delete_container_POI.style, {
                        width: "14px",
                        boxShadow: '0 0 5px rgb(142 137 137 / 70%)',
                        borderRadius: '2px',
                        "align-self": 'center',
                        position: 'absolute',
                        opacity: '0'
                    });

                    //position the button after the dom rendering
                        //setTimeout(()=> {
                        //let watch_POI_container_droplist_display = setInterval
                            // var droplist_ID = params_map.droplist_ID-1
                            // var POI_container_droplist = document.getElementById(`dropdownContainer_${droplist_ID}_${params_map.id}`);
                            // let top = POI_container_droplist.getBoundingClientRect().top-7+'px';
                            // let left = POI_container_droplist.getBoundingClientRect().right-7+'px';
                            // Object.assign(button_delete_container_POI.style, {
                            // 	top: top,
                            // 	left: left,
                            // 	opacity: '1'
                            // })

                        // 	let x = POI_container_droplist.getBoundingClientRect().width-button_delete_container_POI.clientWidth+'px';
                        // 	let y = (POI_container_droplist.getBoundingClientRect().height/2+button_delete_container_POI.clientWidth/2)*-1+'px';
                        // 	Object.assign(button_delete_container_POI.style, {
                        // 		transform: `translate(${x}, ${y})`,
                        // 		opacity: '1'
                        // 	})							
                        // }, 1000)

                        
                    let POI_container_droplist_MutationObserver = new MutationObserver(function (e) {
                        //var droplist_ID = params_map.droplist_ID-1
                        //var POI_container_droplist = document.getElementById(`dropdownContainer_${droplist_ID}_${params_map.id}`);
                        
                        //if (e[0].addedNodes && e[0].addedNodes[0] == POI_container_droplist) {
                        // if (e.find(m=> m.addedNodes[0] == POI_container_droplist)) {
                        //     setTimeout(()=> {
                        //         let cs_POI_container_droplist = getComputedStyle(POI_container_droplist);
                        //         let cs_padding = parseFloat(cs_POI_container_droplist.padding.replace('px', ''))*2
                        //         let x = POI_container_droplist.getBoundingClientRect().width-button_delete_container_POI.clientWidth+'px';
                        //         //let y = (POI_container_droplist.getBoundingClientRect().height/2+button_delete_container_POI.clientWidth/2)*-1+'px';
                        //         let y = (POI_container_droplist.getBoundingClientRect().height - button_delete_container_POI.clientHeight-cs_padding);
                        //         if (params_map.navigator === 'firefox') {y = (y-10)*-1+'px'};
                        //         if (params_map.navigator === 'chrome') {y = (y)*-1+'px'};
                                
                        //         Object.assign(button_delete_container_POI.style, {
                        //             transform: `translate(${x}, ${y})`,
                        //             opacity: '1'
                        //         });
                        //     },500);
                        //     POI_container_droplist_MutationObserver.disconnect();
                        // };
                    });

                    //let parent = container_POI;
                    //POI_container_droplist_MutationObserver.observe(parent, { childList: true, subtree: true });

                    let check_chart_rendering = setInterval(()=>{
					
                        var parent_container_display = check_parent_display(params_map)
                        if (parent_container_display.chart_display_on) {      
                            setTimeout(() => {
                                let cs_POI_container_droplist = getComputedStyle(POI_container_droplist);
                                let cs_padding = parseFloat(cs_POI_container_droplist.padding.replace('px', ''))*2
                                let x = POI_container_droplist.getBoundingClientRect().width-button_delete_container_POI.clientWidth+'px';                             
                                let y = POI_container_droplist.getBoundingClientRect().height - button_delete_container_POI.clientHeight-cs_padding;
                                if (params_map.navigator === 'firefox') {y = (y-10)+'px'};
                                if (params_map.navigator === 'chrome') {y = y+'px'};


                                Object.assign(button_delete_container_POI.style, {
                                    transform: `translate(${x}, -${y})`,
                                    opacity: '1'
                                });                                
                            }, 500);

                            clearInterval(check_chart_rendering)
                        }
                    }, 1000)

                    button_delete_container_POI.addEventListener('mouseover', (e)=> {
                        e.target.style.filter = 'invert(79%) sepia(50%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)';
                        e.target.style.cursor = 'pointer'
                    })
                    button_delete_container_POI.addEventListener('mouseout', (e)=> {
                        e.target.style.filter = 'invert(0%) sepia(72%) saturate(0%) hue-rotate(328deg) brightness(95%) contrast(106%)';
                        e.target.style.cursor = ''
                    });

                    button_delete_container_POI.addEventListener('click', (e)=> {
                        var droplist_ID = e.target.dataset.droplist_ID
                        var POI_container_droplist = document.getElementById(`dropdownContainer_${droplist_ID}_${params_map.id}`);
                        //delete associated marker
                        let markerID = POI_container_droplist.querySelector(`#input_text_${droplist_ID}_${params_map.id}`).dataset.markerID;
                        if (markerID) params_map.map_instance._layers[parseInt(markerID)]?.remove()
                        POI_container_droplist.style.transition = 'opacity 1s'
                        POI_container_droplist.style.opacity = '0'
                        if (POI_container_droplist) {
                            e.target.remove();								
                            setTimeout(()=> {POI_container_droplist.remove()}, 1000)
                        }
                    })




                container_settings_controls.append(container_color_picker, container_label_marker, container_category_marker);
                outerContainer_settings_controls.append(container_settings_controls);
                
        
                
                button_clear_search.addEventListener('click', (e)=> {
                    var input_searchBar = document.getElementById(e.target.dataset.input_searchBar_id);
                    
                    //delete the marker
                    if (input_searchBar.dataset.markerID) {
                        let markerID = parseInt(input_searchBar.dataset.markerID);
                        params_map.map_instance._layers[markerID]?.remove();
                    }

                    //reset the waitForNewMarker status
                    input_searchBar.dataset.waitForNewMarker = true
                    input_searchBar.dataset.isFilledWithAdress = false
                    input_searchBar.click();

                    //style the cursor on map hover			
                    params_map.map_instance._container.addEventListener('mouseover', (e)=> {e.target.style.cursor = 'pointer'})


                })

                

                POI_container_droplist.append(outerContainer_settings_controls, button_delete_container_POI)

                POI_input_text_zone.addEventListener('click', (e)=> {
                    if (e.target.dataset.isFilledWithAdress === 'true') return

                    //create a styled tooltip to detail the possible actions
                    if (!params_map.tooltip_addPOIs) createTooltipElement(params_map)
                    let posX = e.target.getBoundingClientRect().x;
                    let posY = e.target.getBoundingClientRect().y+10
                    Object.assign(params_map.tooltip_addPOIs.style, {
                        opacity: '1',
                        display: 'block',
                        transform: `translate(${posX}px, ${posY}px)`,

                    })

                    e.target.dataset["waitForNewMarker"] = true

                    //style the cursor on map hover
                    params_map.cursor_style_onPoiAdd = params_map.map_instance._container.addEventListener('mouseover', (e)=> {e.target.style.cursor = 'pointer'})
                })



                POI_input_text_zone.addEventListener('keydown', (e)=> {		
                        if ((e.key== 'Backspace' || e.key== 'Delete') && (e.target.dataset.markerID && e.target.dataset.markerID !== 'undefined')) {
                            //delete the marker
                            let markerID = parseInt(e.target.dataset.markerID)
                            params_map.map_instance._layers[markerID]?.remove()
                            
                            e.target.dataset["waitForNewMarker"] = true
                            e.target.dataset.isFilledWithAdress = false

                            //remove the adress_object attached to the input
                            e.target.dataset.adress_object = undefined
                            e.target.dataset.markerID = undefined
                            
                            //update the content of the popup
                            let tooltip_text_zone = document.getElementById(params_map.id + 'tooltip_addPOIs_text');
                            if (tooltip_text_zone)	tooltip_text_zone.innerHTML = 'Cliquer sur un endroit de la carte <br/> ou saisissez une adresse';

                            //style the cursor on map hover
                            if (params_map.cursor_style_onPoiAdd) removeEventListener('mouseover', params_map.cursor_style_onPoiAdd)
                            params_map.cursor_style_onPoiAdd = params_map.map_instance._container.addEventListener('mouseover', (e)=> {e.target.style.cursor = 'pointer'})

                            //clean the droplist content
                                //locate the ul droplist container
                                let droplist_body = document.getElementById(e.target.dataset.droplist_path);
                                //delete previous li tags
                                let ul_container = droplist_body.getElementsByTagName('ul')[0]
                                if (ul_container.hasChildNodes('li')) {
                                    Object.values(ul_container.childNodes).forEach(child=> child.remove());							
                                }


                        }

                        
                    })

                POI_input_text_zone.addEventListener('keypress', (e)=> {
                    let input = e.target;

                    //fire the adress autocompletion when the input has more than 3 characters
                    if (input.value.length> 10) {
                        params_map.instanciator.geocoding_ign(params_map, input.value, input)
                    }
                })

                POI_input_text_zone.addEventListener('mouseout', (e)=> {
                    if (!params_map.tooltip_addPOIs) return
                    if (params_map.circleAdressInfo) return
                    Object.assign(params_map.tooltip_addPOIs.style, {
                        opacity: '0',
                        display: 'none',
                    })
                })

                function createTooltipElement(params_map) {
                    let tooltip_container = document.createElement('div'); tooltip_container.id = params_map.id+ "tooltip_addPOIs_container"
                            
                    Object.assign(tooltip_container.style, {'font-size': '12px', 
                        width: 'max-content', 
                        height: 'max-content', 
                        color: 'white', 
                        'background-color': '#ff5f22',
                        margin: '4px',
                        'padding-left': '3px',
                        'padding-right': '3px',
                        position: 'absolute',
                        'border-radius': '4px',
                        opacity: 0,
                        transition: 'opacity 1s, transform 2s'
                    })
                
                    let tooltip_content = document.createElement('div'); tooltip_content.id = params_map.id+ '_tooltip_addPOIs_content'; 
                    
                    Object.assign(tooltip_content.style, {
                        visibility: 'visible',
                        width: `max-width`,
                        //width: '160px',
                        'background-color': '#555',
                        color: '#fff',
                        'text-align': 'center',
                        'border-radius': '6px',
                        padding: '8px 0',
                        position: 'absolute',
                        'z-index': 1,
                        bottom: '-95px',
                        left: '50%',
                        'margin-left': '-10px',
                        display: 'grid',
                        rowGap: '3px',
                        'word-break': 'break-word',
                        opacity: 0.95
                    })


                    var tooltip_node = document.createElement('p'); //tootlip_node.id = `node_${_k}_crossfilterContainer_` + params_map.id;
                        tooltip_node.id = params_map.id + 'tooltip_addPOIs_text'
                        tooltip_node.style = 'font-size: 12px; color: white; margin: 4px; padding-left: 3px; padding-right: 3px; opacity: 1; text-align: left; width: max-content';
                        //tootlip_node.id = `tooltipText_${k}_${params_map.id}`
                        tooltip_node.innerHTML = 'Cliquer sur un endroit de la carte <br/> ou saisissez une adresse';
                        tooltip_content.appendChild(tooltip_node)

                    tooltip_container.style.display = 'none'

                    let parent_chart_container = document.getElementById(params_map.id+'_generalContainer');

                    tooltip_content.append(tooltip_node);
                    tooltip_container.append(tooltip_content)
                    parent_chart_container.append(tooltip_container);

                    params_map.tooltip_addPOIs = tooltip_container;

                }

                //set the height in px iot achieve the transition
                //let outerContainer_POI = document.getElementById(params_map.id+'title_container_POI');
                let cs = getComputedStyle(outerContainer_POI);
                outerContainer_POI.style.transition = ''
                outerContainer_POI.dataset.previous_height = cs.height

                //close floating windows of the previous containers
                    //settings panel
                    let prev_button_display_settings_panel = document.getElementById(`button_display_settings_panel_${params_map.droplist_ID-1}_${params_map.id}`)
                    if (prev_button_display_settings_panel) {
                        if (prev_button_display_settings_panel.style.display !== 'none' && ['', '1'].includes(prev_button_display_settings_panel.style.opacity) ) {
                            prev_button_display_settings_panel.click()
                        }
                    };
                    //color picker panel
                    let prev_color_picker_btn = document.getElementById(`button_color_picker_${params_map.droplist_ID-1}_${params_map.id}`)
                    if (prev_color_picker_btn) {
                        if (prev_color_picker_btn.style.display !== 'none' && ['', '1'].includes(prev_color_picker_btn.style.opacity) ) {
                            prev_color_picker_btn.click()
                        }
                    };

                container_POI.append(POI_container_droplist);

                params_map.droplist_ID++;

                return POI_container_droplist
            },
            addUserInfo: function(e, params_map){
                let x_y_mouse = e.containerPoint;
                if (params_map.keydown === 'Control') {			
                    params_map.keydown_xy = e.containerPoint;
                    let active_input = undefined;
                    let _action = 'display_adress_on_map'
                    params_map.instanciator.reverseGeocoding_open_route_service(params_map, e.latlng.lng, e.latlng.lat, active_input, _action, x_y_mouse)
                    params_map.keydown = undefined
                }
                else {
                    let input_pois = document.getElementsByClassName(params_map.id+'_input_poi');
                    let active_input = Object.values(input_pois).find(e=> e.dataset.waitForNewMarker === 'true')
        
                    if (!active_input) return
                    // Add marker to map at click location; add popup window
                    var newMarker = new L.marker(e.latlng).addTo(params_map.map_instance);
        
                    //get the adress from the latLng
                    let _action = 'addMarker';
                    let markerID = newMarker._leaflet_id;
                    active_input.dataset.markerID = markerID;
                    params_map.instanciator.reverseGeocoding_open_route_service(params_map, e.latlng.lng, e.latlng.lat, active_input, _action, x_y_mouse, markerID, newMarker)
                    
        
                    //restore the cursor style on map hover
                    if (params_map.cursor_style_onPoiAdd) removeEventListener('mouseover', params_map.cursor_style_onPoiAdd)
                    params_map.cursor_style_onPoiAdd = params_map.map_instance._container.addEventListener('mouseover', (e)=> {e.target.style.cursor = 'auto'})
        
                }		
        
            },    
            createTooltipElement: function(params_map) {
                let tooltip_container = document.createElement('div'); tooltip_container.id = params_map.id+ "tooltip_addPOIs_container"
                        
                Object.assign(tooltip_container.style, {'font-size': '12px', 
                    width: 'max-content', 
                    height: 'max-content', 
                    color: 'white', 
                    'background-color': '#ff5f22',
                    margin: '4px',
                    'padding-left': '3px',
                    'padding-right': '3px',
                    position: 'absolute',
                    'border-radius': '4px',
                    opacity: 0,
                    transition: 'opacity 1s, transform 2s'
                })
            
                let tooltip_content = document.createElement('div'); tooltip_content.id = params_map.id+ '_tooltip_addPOIs_content'; 
                
                Object.assign(tooltip_content.style, {
                    visibility: 'visible',
                    width: `max-width`,
                    //width: '160px',
                    'background-color': '#555',
                    color: '#fff',
                    'text-align': 'center',
                    'border-radius': '6px',
                    padding: '8px 0',
                    position: 'absolute',
                    'z-index': 1,
                    bottom: '-95px',
                    left: '50%',
                    'margin-left': '-10px',
                    display: 'grid',
                    rowGap: '3px',
                    'word-break': 'break-word',
                    opacity: 0.95
                })


                var tooltip_node = document.createElement('p'); //tootlip_node.id = `node_${_k}_crossfilterContainer_` + params_map.id;
                    tooltip_node.id = params_map.id + 'tooltip_addPOIs_text'
                    tooltip_node.style = 'font-size: 12px; color: white; margin: 4px; padding-left: 3px; padding-right: 3px; opacity: 1; text-align: left; width: max-content';
                    //tootlip_node.id = `tooltipText_${k}_${params_map.id}`
                    tooltip_node.innerHTML = 'Cliquer sur un endroit de la carte <br/> ou saisissez une adresse';
                    tooltip_content.appendChild(tooltip_node)

                tooltip_container.style.display = 'none'

                let parent_chart_container = document.getElementById(params_map.id+'_generalContainer');

                tooltip_content.append(tooltip_node);
                tooltip_container.append(tooltip_content)
                parent_chart_container.append(tooltip_container);

                params_map.tooltip_addPOIs = tooltip_container;

            }        
            				

        }

        this.funcLib.generate_color_scheme(this)
    }
}
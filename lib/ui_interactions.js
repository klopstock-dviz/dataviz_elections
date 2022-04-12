function openPage(evt, pageName) {
    var i, pages, pagesButtons;
    pages = document.getElementsByClassName("page");
    pagesButtons = Object.values(document.getElementById('pagesButtons').children)
    //hide pages
    for (i = 0; i < pages.length; i++) {
      pages[i].style.display = "none";
    }

    //reset buttons colors
    pagesButtons.forEach(pb=> {
      pb.classList.remove('w3-red');
    })

    //display target page
    document.getElementById(pageName).style.display = "grid";

    //display red color for active button
    evt.currentTarget.classList.add('w3-red');
    
  }


  function openRubrique(evt, rubriqueName) {
    var i, sections, vTablinks;
    sections = document.getElementsByClassName("sections");
    for (i = 0; i < sections.length; i++) {
      sections[i].style.display = "none";
      sections[i].classList.remove("active_section")
    }
    vTablinks = document.getElementsByClassName("vTablink");
    for (i = 0; i < vTablinks.length; i++) {
      vTablinks[i].className = vTablinks[i].className.replace(" w3-red", ""); 
      vTablinks[i].classList.remove('active_section')
    }
    document.getElementById(rubriqueName).style.display = "grid";
    document.getElementById(rubriqueName).classList.add("active_section")
    evt.currentTarget.classList.add("w3-red");
    evt.currentTarget.classList.add('active_section')

    if (rubriqueName === "apercu_communes") {
      openView(undefined,'com_aprecu_overwiew', undefined, "button_com_aprecu_overwiew")
    }
    else if (rubriqueName==="immobilier_communes") {
      openView(undefined,'com_immobilier_structure_prix1', 'maps_immo', 'button_com_immobilier_structure_prix1')
      openView(undefined,'com_immobilier_prix_quartiers', 'charts_immo', 'button_com_immobilier_prix_quartiers')
    }
  }      



  function openView(evt, viewName, excluded_views, button_id) {
    var i, x, tablinks;    

    //update css for views
    //get the list of all views
    x = document.getElementsByClassName("graphics");
    if (excluded_views) {
      let filter_views=Object.values(x)
      x = [];
      filter_views.forEach(n=> {
        if (!n.classList.contains(excluded_views)) {x.push(n)}
      })
    }

    
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
      //trace last active view
      x[i].classList.remove("last_active_view")
      if (x[i].classList.contains("active_view")) {
        x[i].classList.replace("active_view", "last_active_view")
      }
      x[i].classList.remove("active_view")
    }

    //

    //update css for views buttons
    tablinks = document.getElementsByClassName("tablink");

    if (excluded_views) {
      let filter_views=Object.values(tablinks)
      tablinks = [];
      filter_views.forEach(n=> {
        if (!n.classList.contains(excluded_views)) {tablinks.push(n)}
      })
    }    
    for (i = 0; i < tablinks.length; i++) {
      //trace last active view
      tablinks[i].classList.remove("last_active_view")
      if (tablinks[i].classList.contains("active_view")) {
        tablinks[i].classList.replace("active_view", "last_active_view");        
      }      
    }
    //delete color class for the tab buttons

    Object.values(tablinks).forEach(t=> t.classList.remove('w3-blue'))

    let viewNode = document.getElementById(viewName)
    if (viewNode.dataset.hasOwnProperty('display')) {
      document.getElementById(viewName).style.display = viewNode.dataset.display;
    }
    else {document.getElementById(viewName).style.display = "grid";}
    
    //document.getElementById(viewName).classList.add("active_view");
    viewNode.classList.add("active_view");

    //if the func is triggered by the tab button
    if (evt) {
      evt.currentTarget.classList.add("w3-blue");
      evt.currentTarget.classList.add('active_view');
    }
    //if the func is triggered by the rubrique button
    else if (button_id) {
      document.getElementById(button_id).classList.add("w3-blue");
      document.getElementById(button_id).classList.add('active_view');      
    }

    setTimeout(()=> {restore_map_view(sharedParams_array)}, 2000)
    restore_mapLegend_state(sharedParams_array)
  }

  function toggle_horizontal_panel(evt, panel_name) {
    if (panel_name.constructor == String) toggle_panel(evt, panel_name)
    if (panel_name.constructor == Array) {
      panel_name.forEach(p=> {
        toggle_panel(evt,p)
      });
    }
    
    function toggle_panel (evt, panel_name) {
      var panel_name = document.getElementById(panel_name);
      panel_name.style.overflow = 'hidden'  
      //case when hide panel
      //if (evt.currentTarget.textContent === 'Réduire') {
      if (panel_name.style.visibility === 'visible') {
        evt.currentTarget.textContent = 'Agrandir'
        //get & save init height
        var initial_height = panel_name.offsetHeight
        panel_name.dataset['initial_height'] = initial_height+"px"
        panel_name.dataset['initial_padding'] = panel_name.style.padding
        //replace max content heght by px height
        panel_name.style.height = initial_height+"px"
        //resize to 0px height to trigger the transit°
        setTimeout(()=> {
          panel_name.style.height = '0px';
          setTimeout(()=> {
            panel_name.style.visibility = "hidden";
            panel_name.style.padding = '0px';
          }, 600)
        }, 50)
      }
      else if (panel_name.style.visibility === 'hidden') {
          evt.currentTarget.textContent = 'Réduire'
          panel_name.style.height = panel_name.dataset.initial_height; setTimeout(()=> panel_name.style.height = "max-content", 600)
          panel_name.style.padding = panel_name.dataset.initial_padding;
          panel_name.style.visibility = "visible"
      } 
  
    }
    
  }

  let params_size = {};
  params_size['screen_original_width_size'] = window.innerWidth
  params_size['map_original_width_size'] = 800

  window.addEventListener('resize', ()=> {
    params_size["screen_current_width_size"] = window.innerWidth
    params_size['screen_gap_width_size'] = params_size.screen_original_width_size - params_size.screen_current_width_size
    var el = document.getElementById('com_immobilier_carte_prix_m2_quartiers')
    var el_original_width = el.offsetWidth
    //update width
    //el.style.width = params_size.map_original_width_size - params_size.screen_gap_width_size
  })

  function restore_map_view(sharedParams_array) {
    let root_node= document.querySelectorAll(".maps_immo.active_view");
    if (root_node.length ===0) {return}
    root_node = Object.values(root_node).find(t=> t.nodeName === "DIV")
    let leaflet_node = root_node.getElementsByClassName('leaflet-container');
    if (leaflet_node.length>0) {
      var leaflet_id= leaflet_node[0].id
      //find the params_chart of the map
      sharedParams_array.forEach(shp=> {
        var params_chart = shp.params_charts.find(c=> c.id === leaflet_id)
        if (params_chart) {
          //test if the map has layers
          var nb_polys = Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).length
          var map_size = d3.sum(Object.values(params_chart.map_instance._size))
          //case of choroplete
          if (params_chart.chart_sub_type === "choroplete_map" && map_size === 0) {
            //restore map view
            restore_view(params_chart, "borders")
          }

          //case of circles map
          if (params_chart.chart_sub_type === "map" && map_size === 0) {
            //restore map view
            restore_view(params_chart, "x_y")
          }          
        function restore_view(params_chart, borders_array) {
          params_chart.map_instance.invalidateSize()
          params_chart.map_instance.fitBounds(params_chart.data[1][borders_array])
          if (nb_polys === 0) {
            try {
              params_chart.instanciator.inject_metadata(params_chart.map_instance, params_chart, "data", "update")              
            }
            catch (err) {
              console.error(err)
            }
          }
        }
        }
      })
    }
  }
  
  
  function restore_mapLegend_state(sharedParams_array) {
    let root_node= document.querySelectorAll(".maps_immo.last_active_view");
    if (root_node.length ===0) {return}
    root_node = Object.values(root_node).find(t=> t.nodeName === "DIV")
    let leaflet_node = root_node.getElementsByClassName('leaflet-container');
    if (leaflet_node.length>0) {
      var leaflet_id= leaflet_node[0].id
      //find the params_chart of the map
      sharedParams_array.forEach(shp=> {
        var params_chart = shp.params_charts.find(c=> c.id === leaflet_id)
        if (params_chart) {            
            if (params_chart.selected_legends.length > 0) {
              console.log({'map found': params_chart.id})
              let nb_cells = params_chart.legend_dataset_binned.length
              restore_legend(params_chart, nb_cells)
              if (params_chart.chart_sub_type === "map") {console.warn({defect_circles: "restore_legend"})}
            }

            clean_click_stores(params_chart)
            if (params_chart.chart_sub_type === "choroplete_mapmap") {
              generateLegends_funcLib.restore_hidden_polygons(params_chart)
            }
        }
    })
    }

    function clean_click_stores(params_chart) {
      params_chart.list_final_labels_uniq_selected = []; params_chart.list_idx_segment_single_selected = []; params_chart.list_idx_segments_multiples_selected = [];
      params_chart.list_idx_segments_multiples_selected = []; params_chart.list_keys_values_segment_single_selected = []; params_chart.list_keys_values_segments_multiples_selected = []
      params_chart.list_labels_segment_single_selected = []; params_chart.list_labels_segments_multiples_selected = []; 
      params_chart.brush_keys_values= {}; params_chart.brush_values = {};      
    }

    function restore_legend(params_chart, nb_cells) {
      params_chart.selected_legends = []
      params_chart.active_polygons = []      
      
      //deactivate non selected legends
      try {
        generateLegends_funcLib.legends_color_management(params_chart, nb_cells)
      }
      catch (err) {
        console.error(err)
      }

      //trigger the crossfiltering process
      params_chart.legend_clicked = true
    }
  }
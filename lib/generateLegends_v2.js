//legends_setup = [{color: "red", label: 1}, {color: "green", label: 2}, {color: "blue", label: 3}, {color: "yellow", label: 4}, {color: "purple", label: 5}]
//legends_params = {htmlNode: "body", chart_id: "map_1", nb_cells: 5, legends_setup: legends_setup, legend_title: legend_title}
generateLegends_funcLib = {}
function generateLegends(legends_params, params_chart, sharedParams) {
    
    var chart_id
    if (params_chart.chart_type === "leaflet") {
        chart_id = params_chart.htmlNode
    }
    else if (params_chart.chart_type === "chartJS") {
        chart_id = document.getElementById(params_chart.ctx.id)
    }

    const nb_cells = legends_params.max_cells
    let legends_setup = legends_params.legends_colors_setup
    let legend_title
    if (!params_chart.params_legends.hue_legend && !params_chart.params_legends.color_legend) {
        legend_title = params_chart.params_legends.title
    }
    else if (params_chart.params_legends.hue_legend) {
        legend_title = params_chart.params_legends.hue_legend.title
    }
    else if (params_chart.params_legends.color_legend) {
        legend_title = params_chart.params_legends.color_legend.title
    }    
        


    
    var chart = document.getElementById(chart_id)
    //chart.style.width = '100%' 
    var grid_map_legend = chart.parentElement.parentElement
    //var parentNode = chart.parentElement

    


    //create the legend container
    let gridTemplateRows
    if (params_chart.params_fields.color_params && params_chart.params_fields.size_params) {
        gridTemplateRows = "100px 45px auto auto 100px 45px auto auto"
    }
    else {gridTemplateRows = "100px 45px auto auto"}

    var grid_legend = document.createElement('div'); grid_legend.id = 'grid_legend_' + chart_id; grid_legend.style = `display: grid; grid-template-rows: ${gridTemplateRows}; height: max-content; row-gap: 15px; row-gap: 5px`// grid-template-columns: auto auto; justify-items: center`

    var title = document.createElement('p'); 
    Object.assign(title, {className: 'legend_title', id: "legend_title_" + chart_id, style: 'font-family: "helvetica neue"; font-size: 14px; justify-self: left; height: max-content; text-align: center; align-self; end; margin-left: 25px', innerHTML: legend_title})
    
    var droplist_fields
    if (params_chart.droplist_fields && !params_chart.droplist_fields_clone) {
        droplist_fields = create_droplist_fields(params_chart);
        //grid_legend.style.gridTemplateRows = '25% 10% 75%'
        grid_legend.appendChild(droplist_fields)
    }
    else if (params_chart.droplist_fields_clone) {
        grid_legend.appendChild(params_chart.droplist_fields_clone)
        params_chart.droplist_fields_clone=undefined
    }
    //else create a phantom grid for droplist
    else {        
        droplist_fields = document.createElement('div'); 
        Object.assign(droplist_fields, {className: 'w3-dropdown-click', style: 'height: max-content; opacity: 0', innerText: 'change the field'})
        grid_legend.appendChild(droplist_fields)
    }
    
    grid_legend.appendChild(title)
    grid_map_legend.appendChild(grid_legend)
    document.getElementById("legend_title_" + chart_id).style.alignSelf = 'end'



    var grid_legend_cells = document.createElement('div')
    Object.assign(grid_legend_cells, {className: 'grid-container_legends', id: "grid-container_legends_" + chart_id, style: 'display: inline-grid; grid-template-row: auto; padding: 2.5px; grid-row-gap: 5px; justify-self: left; height: max-content; width: max-content; align-self: baseline; margin-left:25px;'})
    grid_legend.appendChild(grid_legend_cells)
        



    
    if (params_chart.params_fields.hue_params?.colorsOrder === "reverse") {
        var colors_legends =[]
        legends_setup.forEach(o=> colors_legends.push(o.color))
        colors_legends = colors_legends.reverse()
        for (let index = 0; index < legends_setup.length; index++) {
            legends_setup[index].color = colors_legends[index];  
        }
    }

    params_chart.legendColors = [];
    var label
    for (var i = 0; i < nb_cells; i++) {
      
        //1.create a grid line that holds the color cell & the text
        var legend_cell = document.createElement('div');
        Object.assign(legend_cell, {className: 'legend_cell', id: 'legend_cell_' + i, style: 'display: grid; grid-template-columns: auto auto; height: max-content; width: max-content; grid-column-gap: 2px'})

        //add color
        var color = legends_setup[i].color; 
        label = legends_setup[i].label

        var legendColor = document.createElement('div')
        Object.assign(legendColor, {className: 'grid-item', id: params_chart.id + "_legendColor_" + i, style: `background-color: ${color}; padding: 2.5px; border-radius: 15%; color: ${color}; width: 30px`})
        legendColor["data-label"] = label; legendColor["data-rank"] = i;
        legendColor["data-originalColor"] = color

        legendColor.addEventListener("click", (evt)=>{                 
            //console.log("click on: " + evt.target)
            legend_selections(evt, params_chart, nb_cells)
        } )

        //legendColor.addEventListener("click", legend_selections.bind(evt, params_chart, nb_cells) )

        legendColor.addEventListener("mouseover", function(evt){                 
            evt.target.style.cursor = "pointer"
        } )

        legend_cell.appendChild(legendColor)




        var legend_label = document.createElement('div')
        Object.assign(legend_label, {className: "grid-item", id: params_chart.id + "_legendLabel_" + i, style: "padding: 2.5px; font-size: 12px; font-family: helvetica neue;", innerHTML: label})

        legend_cell.appendChild(legend_label)


        //append the legend cell to the legend container
        grid_legend_cells.appendChild(legend_cell)

        var val_min = label.substring(0, label.indexOf(" -")); 
        var val_max = label.substring(label.indexOf(" - ")+3);
        params_chart.legendColors.push({text: label, color: color, x0: +val_min, x1: +val_max})


    }
    //save the legends container
    params_chart.grid_legend_cells = grid_legend_cells



    //specific for maps
    //add red circle to highlight data points
    if (params_chart.chart_sub_type === 'map' && params_chart.params_fields.hue_params) {
        var circle_cell = document.createElement('div');
        Object.assign(circle_cell, {id: 'circle_cell_' + params_chart.id, style: 'display: grid; grid-template-columns: auto auto; height: max-content; width: max-content; grid-column-gap: 5px'})

        var circle = document.createElement('div')
        Object.assign(circle, {id: 'circle_' + params_chart.id, style: 'width: 25px; height: 25px; border-radius: 50%; border: solid 2px; border-color: red; padding: 6px;'})

        circle.addEventListener("mouseover", function(evt){                         
            evt.target.style.cursor = "pointer"
        } )

        circle.addEventListener("click", function(evt){
             //filter the data & pass parameter for red circling the data points
             if (params_chart.params_datapoints.circling_datapoints === false) {
                 params_chart.params_datapoints.circleColor = "red"
                 generateLegends_funcLib.filter_map(params_chart); params_chart.params_datapoints.circling_datapoints = true
             }
             else {
                 params_chart.params_datapoints.circleColor = ""
                 generateLegends_funcLib.filter_map(params_chart); params_chart.params_datapoints.circling_datapoints = false
             }
                    
        })

        var circle_label = document.createElement('div')
        
        label = (sharedParams.language === "fr" ?  'Surligner' : 'Highlight')
        Object.assign(circle_label, {id: "circle_label_" + params_chart.id, style: "padding: 2.5px; font-size: 12px; font-family: helvetica neue;", innerHTML: label})

        circle_cell.appendChild(circle); circle_cell.appendChild(circle_label)
        grid_legend_cells.appendChild(circle_cell)
    }

    //add labels
    if (params_chart.chart_sub_type === 'map' && params_chart.label_fields)  {
        if (params_chart.label_fields.constructor !== Array || params_chart.label_fields.length <1) {
            console.warn(`${params_chart.id}: labels creation impossible, label_fields must be an array with proper arguments`)
            return
        }
        else {
            //retrieve the dataset of the map
            let dataset
            if (params_chart.transformations?.dataset) {dataset = params_chart.transformations.dataset}
            else {dataset = params_chart.sharedParams.data_main}
            
            params_chart.label_fields.forEach(_arg=> {
                //check the existence of the provided field in the map dataset
                if (dataset.find(r=> r[_arg.field])) {
                    if (params_chart.label_fields_instances?.length) {
                        params_chart.label_fields_instances.forEach(l=> l={})
                    }
            
                    params_chart.label_fields_instances = []; params_label.label_fields_nodes_id = []

                    //create an html node
                    var label_node  = document.createElement('div'); 
                    label_node.id = `label_node_${_arg.field}_${_arg.agg_type}_${params_chart.htmlNode}`
                    //if (params_label.label_fields_nodes_id.includes(label_node.id)) {label_node.id = '_'+ label_node.id}
                    grid_legend.appendChild(label_node)
                    

                    //create a standard label visual
                    var _params_label = new params_label()
                    _params_label.htmlNode = label_node.id
                    _params_label.title = _arg.title || ""
                    _params_label.unit = _arg.unit || ""                    
                    _params_label.numerical_field_params = {fieldName: _arg.field, agg_type: _arg.agg_type}//use 'selection' instead of 'agg_type' for categorical values
                    //_params_label.data_params = {join_field_source: "IRIS", dataset_target: data_stats_insee_com, join_field_target: "IRIS", value_field_target: "Un parking ou +", selection: "sum"}
                    _params_label.id = label_node.id
                    _params_label.transformations = {dataset: dataset, }//filter: [{field: 'equip_voiture', operation: 'include', values: ['Un parking ou +']}]
                
                    //flag to identify that the label visual is part of map visual
                    _params_label.map_label = true
                                    
                    var instantiateur_label1 = new Label(_params_label)
                    instantiateur_label1.createLabel(_params_label, params_chart.sharedParams)

                    params_chart.label_fields_instances.push(_params_label)
                    params_label.label_fields_nodes_id.push(label_node.id)


                
                }
                else {
                    console.warn(`${params_chart.id}: label creation impossible, the field ${_arg.field} do not exist in the map dataset`)
                }

            })
        }
    }

    
    //parentNode.appendChild(grid_map_legend)

    


    function legend_selections(evt, params_chart, nb_cells) {
                //multiple selection
                let legend_label_selected, legend_rank_selected, pos_active_legend
                if (evt.ctrlKey) {   
                    
                    legend_label_selected = evt.target["data-label"]
                    legend_rank_selected = evt.target["data-rank"]
                    

                    //check if the legend selected is already in the list of active legends
                    pos_active_legend = params_chart.selected_legends.indexOf(legend_label_selected) 
                    //if absent, add it & filter the chart
                    if (pos_active_legend === -1) {
                        //add the value of the legend in the list ofactive legends
                        params_chart.sharedParams.filter_order_origin = 'map_legend_filter'
                        params_chart.selected_legends.push(legend_label_selected)

                        //filter the map
                        if (params_chart.chart_sub_type === 'choroplete_map') {
                            generateLegends_funcLib.filter_map_choroplete(params_chart)
                        }
                        else if (params_chart.chart_sub_type === 'map') {
                            generateLegends_funcLib.filter_map(params_chart)
                        }

                        //deactivate non selected legends
                        generateLegends_funcLib.legends_color_management(params_chart, nb_cells)

                        //trigger the crossfiltering process
                        params_chart.legend_clicked = true


                    }
                    //if present, delete it from  the list of active legends
                    else {
                        params_chart.selected_legends.splice(pos_active_legend)

                        //filter the map
                        if (params_chart.chart_sub_type === 'choroplete_map') {
                            generateLegends_funcLib.filter_map_choroplete(params_chart)
                        }
                        else if (params_chart.chart_sub_type === 'map') {
                            generateLegends_funcLib.filter_map(params_chart)
                        }


                        generateLegends_funcLib.legends_color_management(params_chart, nb_cells)

                        //trigger the crossfiltering process
                        params_chart.legend_clicked = true

                    }
                }

                //single selection
                else if (evt.ctrlKey === undefined || evt.ctrlKey === false){
                    legend_label_selected = evt.target["data-label"]

                    //register the color of the legend, iot reuse it for the circles
                    params_chart.color_legend_clicked = {} 
                    params_chart.color_legend_clicked = {[legend_label_selected]: params_chart.legendColors.find(l=> l.text === legend_label_selected).color}

                    //if the legend selected is already active, delete it from the list of active legend, in order to restore all active legends
                    pos_active_legend = params_chart.selected_legends.indexOf(legend_label_selected)
                    if (pos_active_legend > -1) {
                        params_chart.selected_legends = []
                        params_chart.active_polygons = []
                    }


                    //else
                    else {
                        params_chart.selected_legends = []    
                        params_chart.active_polygons = []
                        params_chart.sharedParams.filter_order_origin = 'map_legend_filter'
                        params_chart.selected_legends.push(legend_label_selected)

                        if (params_chart.chart_sub_type === 'choroplete_map') {
                            generateLegends_funcLib.filter_map_choroplete(params_chart)
                        }
                        else if (params_chart.chart_sub_type === 'map') {
                            generateLegends_funcLib.filter_map(params_chart)
                        }

                    }


                    //deactivate non selected legends
                    generateLegends_funcLib.legends_color_management(params_chart, nb_cells)

                    //trigger the crossfiltering process
                    params_chart.legend_clicked = true

                }        
    }



    generateLegends_funcLib.filter_map = function(params_chart) {
        //format the value of the selected legend text
        let filter_field
        if (params_chart.params_fields.hue_params) {
            filter_field = params_chart.params_fields.hue_params.hue_field + "_binned";
        }
        else if (params_chart.params_fields.color_params) {
            filter_field = params_chart.params_fields.color_params.color_field;
        }
        else {
            console.warn(`for ${params_chart.id}, you must provide either a hue field or a color_field`)
            return
        }

        //build the data_input based on the legend(s) selected
        var data_input = []
        //if legends are active, filter the data source
        if (params_chart.selected_legends.length > 0) {
            let filter_value
            params_chart.selected_legends.map(l=> {
                if (params_chart.params_fields.hue_params) {
                    filter_value = l.replace(" ", "").replace(" ", "")
                }
                else {filter_value = l}
                
                params_chart.transformations.crossfilter = {[filter_field]: [filter_value]}

                //if the map is filtred, transfert all the values to the crossfilter object
                if (params_chart.filtered_by.axis !== undefined && Object.keys(params_chart.filtered_by.axis).length > 0) 
                    {Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)}

                //var data_filtred = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
                var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, params_chart.sharedParams)
                
                if (promise_data_input.constructor === Array && promise_data_input.map(e=> e.constructor === Promise).filter(e=> !e).length > 0) {
                    updateChart(params_chart, promise_data_input)
                }
                else {
                    promise_data_input.then(result=> {
                        updateChart(params_chart, result)
                    })
                }
            })
        }
        else {
            //if the map is filtred, transfert all the values to the crossfilter object
            if (params_chart.filtered_by.axis !== undefined && Object.keys(params_chart.filtered_by.axis).length > 0) 
                {Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)}

            //old code
            //data_input = params_chart.instanciator.prepare_data_p1(params_chart, sharedParams)
            var promise_data_input = params_chart.instanciator.prepare_data_p1(params_chart, params_chart.sharedParams)

            if (promise_data_input.constructor === Array && promise_data_input.map(e=> e.constructor === Promise).filter(e=> !e).length > 0) {
                updateChart(params_chart, promise_data_input)
            }
            else {
                promise_data_input.then(result=> {
                    updateChart(params_chart, result)
                })
            }
        }

        




       

        function updateChart(params_chart, result) {
            params_chart.interaction_type = "legends"

            var time_delay = 100

            if (params_chart.chart_sub_type === "map") {
                result = data_decimation(params_chart, result);
                params_chart.params_datapoints.circles_color_mode = (params_chart.selected_legends.length > 0 ? "discrecte_color" : "continuous_color")
                params_chart.instanciator.prepare_data_p2(result, params_chart, sharedParams)
    
                var dataset_lenght = params_chart.data[1].datasets.length
                params_chart.dataset_timeDelay_param.forEach(p=> {
                    if (dataset_lenght>= p.dataset_length.min && dataset_lenght<= p.dataset_length.max) { time_delay = p.time_delay}
                })
                
                setTimeout(() => {
                    params_chart.instanciator.inject_metadata(params_chart.map_instance, params_chart)
                    params_chart.interaction_type = ""                                                          
                }, time_delay);
            }

            else {
                params_chart.instanciator.prepare_data_p2(result, params_chart, sharedParams)
                params_chart.instanciator.inject_metadata(params_chart.map_instance, params_chart)
                params_chart.interaction_type = "";
            }
        }

    }



    generateLegends_funcLib.filter_map_choroplete = function(params_chart, legend_label_selected) {
        params_chart.legend_label_selected = legend_label_selected


        params_chart.inject_type = "legends_binding"



        //filter the poly according to the selected legend
        var legend_labels = []
        //in case when hue_field is numerical, handle the domain extent and domain scope params
        if (params_chart.params_fields.hue_params) {

            params_chart.selected_legends.map(o=> {
                //determine the kind of legend value picked: categorical value of binned value
                //check if the value is a numerical class, and contains a " - " separator split the value
                if (o.match(/\b\d{1,}\s\-\s\d{1,}\b/g) !== null) {           
                    //extract useful values
                    var pos_sep = o.indexOf("-"); legend_labels.push({valueMin: parseFloat(o.substring(0, pos_sep)), valueMax: parseFloat(o.substring(pos_sep+1, 20))});
                }
            })
            //params_chart.legends_binding_params = {valueMin: d3.min(legend_labels), valueMax: d3.max(legend_labels)}
            params_chart.legends_binding_params = [...legend_labels]
        }
        //else categorical value
        else if (params_chart.params_fields.color_params) {
            params_chart.legends_binding_params = [...params_chart.selected_legends]    
        }

        //prepare & filter datasets
        var data_filtred = {dataset: params_chart.data[1].datasets, geojson_data: params_chart.data[1].geojson}
        params_chart.instanciator.prepare_data_p2(data_filtred, params_chart, sharedParams)



        //remove existing polygons from the map
        //specific for choropletes
        Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).map(l=> {
            params_chart.map_instance.removeLayer(l)
        })



        //load the filtred polygons to the map
        //specific for choropletes
        params_chart.map_instance.on('zoomend', function() {
            inject_polygons(params_chart)

        })


        //collect active polygons
        //specific for choropletes        
        if (params_chart.inject_type === "legends_binding") {
            //params_chart.active_polygons = []; params_chart.data[1].borders = []
            var layer_field = params_chart.geographic_priority_layers[0]
            params_chart.data[1].polygons_subset_legends.forEach(p=> {
                //detect active polygons
                if (p.options.style.fillOpacity === params_chart.tileLayers_opacity) {
                    params_chart.active_polygons.push(p.options.propreties[layer_field])
                    var border = [[Object.values(p._layers)[0].getBounds()._northEast.lat, Object.values(p._layers)[0].getBounds()._northEast.lng], [Object.values(p._layers)[0].getBounds()._southWest.lat, Object.values(p._layers)[0].getBounds()._southWest.lng]]
                    params_chart.data[1].borders.push(border)
                }
            })
        }


        //center the map
        //specific for maps
        var borders
        if (params_chart.chart_sub_type === "map") {borders = "x_y"}
        else {borders = "borders"}

        //enable zoom on active poly
        if (params_chart.params_legends?.filter_params.flyToBounds) {
            if (params_chart.data[1][borders].length > 0) {
                params_chart.map_instance.flyToBounds(params_chart.data[1][borders]);
            }            
        }
        else {inject_polygons(params_chart)}

        // if (params_chart.data[1][borders].length > 2) {
        //     params_chart.map_instance.flyToBounds(params_chart.data[1][borders]);
        // }
        // else {
        //     params_chart.adjustZoom = true
        //     params_chart.map_instance.fitBounds(params_chart.data[1][borders]);
        //     setTimeout(() => {
        //         var CurrentZoom = params_chart.map_instance.getZoom()
        //         console.log("CurrentZoom: " + CurrentZoom)
        //         //params_chart.map_instance.setZoom(CurrentZoom-1, false)
        //         //console.log("zoom adjusted: " + params_chart.map_instance.getZoom())
        //     }, 260)
            
        // }            

        
        params_chart.interaction_type = ""


        function inject_polygons(params_chart) {
            if (params_chart.inject_type === "legends_binding") {
                params_chart.data[1].polygons_subset_legends.forEach(p=> {
                    //fill color of filtred polygons with grey
                    if (p.options.style.fillOpacity === 0.2) {
                        p.setStyle({fillOpacity: params_chart.tileLayers_opacity, fillColor: "rgb(220, 222, 220)"})
                    }

                    p.addTo(params_chart.map_instance)
                })
            }

            params_chart.instanciator.add_tooltips(params_chart)            
        }
    }



    generateLegends_funcLib.legends_color_management = function(params_chart, legends_length) {
        //if there is not active legends, restore all the legends
        if (params_chart.selected_legends.length === 0) {
     
            for (var a = 0; a < legends_length; a++) {
                var legend_cell = document.querySelector("#" + params_chart.id + "_legendColor_" +  a)
                if (legend_cell.style && params_chart.legendColors[a]) {
                    legend_cell.style.backgroundColor = params_chart.legendColors[a].color;
                    legend_cell.style.color = params_chart.legendColors[a].color    
                }                
            }
            params_chart.inject_type = "init";
            //
            //restore all faded/hidden polygons
            //specific for choropletes
            if (params_chart.chart_sub_type === 'choroplete_map') {            
                generateLegends_funcLib.restore_hidden_polygons(params_chart)
            }
            else if (params_chart.chart_sub_type === 'map') {
                generateLegends_funcLib.filter_map(params_chart)
            }
        }

        else {
            for (var i = 0; i < legends_length; i++) {
                var ii = i//+1              
                var text = document.querySelector("#" + params_chart.id + "_legendColor_" +  ii)["data-label"]


                //if the text value assessed is not an active legend, turn it into grey
                if (params_chart.selected_legends.indexOf(text) === -1) {
                    document.querySelector("#" + params_chart.id + "_legendColor_" +  ii).style.backgroundColor = "rgb(220, 222, 220)"
                    document.querySelector("#" + params_chart.id + "_legendColor_" +  ii).style.color = "rgb(220, 222, 220)"
                }
                //else set it's original color
                else {
                    var color_seek = params_chart.legendColors.map((l)=> {
                        if (text === l.text) {
                            var col = l.color
                            return l.color  
                        }
                        //text === l.text ? color = l.color : {} 
                    }).filter(c=> c !== undefined)[0]
                    document.querySelector("#" + params_chart.id + "_legendColor_" +  ii).style.backgroundColor = color_seek
                    document.querySelector("#" + params_chart.id + "_legendColor_" +  ii).style.color = color_seek
                    
                }


            }
        }
    }

    //specific for choropletes
    generateLegends_funcLib.restore_hidden_polygons = function(params_chart) {

        //data_input = params_chart.instanciator.prepare_data_p1(params_chart)
        //if (params_chart.legends_status === "restored") {
            //if the map is filtred by another chart, transfert all the filter values to the crossfilter object
            params_chart.inject_type = "restore_polygons"
            if (params_chart.filtered_by.axis !== undefined && Object.keys(params_chart.filtered_by.axis).length > 0) 
                {Object.assign(params_chart.transformations.crossfilter, params_chart.filtered_by.axis)}

            var result_data_filtred = params_chart.instanciator.prepare_data_p1(params_chart, params_chart.sharedParams)
            
            if (result_data_filtred.constructor == Object) {
                exec_restore_hidden_polygons(params_chart, result_data_filtred)
            }
            else if (result_data_filtred.constructor == Promise) {
                result_data_filtred.then(data_filtred=> {
                    exec_restore_hidden_polygons(params_chart, data_filtred)                
                })
            }
            
            function exec_restore_hidden_polygons(params_chart, data_filtred) {
                params_chart.instanciator.prepare_data_p2(data_filtred, params_chart, sharedParams)

                console.log("restore legends all")
                params_chart.legends_status = "restored"

                //remove all layers from the map, except the map tile layer it self
                Object.values(params_chart.map_instance._layers).filter(l=> l.hasOwnProperty("_tiles") === false && l.hasOwnProperty("_url") === false).map(l=> {
                    params_chart.map_instance.removeLayer(l)
                })



                //load the restored polygons to the map
                params_chart.map_instance.on('zoomend', function() {
                    if (params_chart.inject_type === "restore_polygons") {
                        params_chart.data[1].polygons.forEach(p=> {
                           if (p.hasOwnProperty("_layers")) {
                                var layer = Object.values(p._layers);
                                layer[0].feature.properties.show_tooltip = true
                            }




                            p.addTo(params_chart.map_instance)
                            params_chart.inject_type = ""
                        })

                        //save new copy of the layers injected to the map
                        params_chart.data[1].polygons_injected = [...Object.values(params_chart.map_instance._layers).filter(l=> l._bounds && l.defaultOptions && l.feature)]

                        params_chart.instanciator.add_tooltips(params_chart)
                    }
                })


                //center the map
                var borders
                if (params_chart.chart_sub_type === "map") {borders = "x_y"}
                else {borders = "borders"}
        
                if (params_chart.data[1][borders].length > 2) {
                    params_chart.map_instance.flyToBounds(params_chart.data[1][borders]);
                }
                else {
                    params_chart.map_instance.fitBounds(params_chart.data[1][borders]);
                    var CurrentZoom = params_chart.map_instance.getZoom()
                    //params_chart.map_instance.setZoom = CurrentZoom-1
                }                


                

                //set delay time for rendrering the scatters
                params_chart.sharedParams.delay_time_scatter = 200

                console.log("restore_hidden_polygons")


            }




    }





    function update_geoson_fields(params_chart) { 
        //1.form filter list with selected legends        
        var filterList = params_chart.selected_legends.map(v=> {
            var pos_sep = v.indexOf("-");
            var valueMin = parseFloat(v.substring(0, pos_sep));
            var valueMax = parseFloat(v.substring(pos_sep+1));

            return {field:params_chart.legends_field, operation: "between_binMode", valueMin: valueMin, valueMax: valueMax}
        })        

        //2.filter operatinal dataset
        //params_chart.data[1].dataset_filtred = CrossFilterDataSource(params_chart.data[1].datasets, filterList)
        params_chart.data[1].dataset_filtred = params_chart.data[1].datasets

        //3.form list of tooltip fields
        var numerical_tooltips = Object.values(params_chart.tooltip_fields).filter(f=> f.agg_type).map(f=> {return {field: f.alias, selection: f.agg_type} })

        //update values of tooltip fields from geojson dataset side
        var layer_field = params_chart.geographic_priority_layers[0]
        params_chart.data[1].geojson_legend_bound = []
        params_chart.data[1].geojson.forEach(r=> {row = {...r}; params_chart.data[1].geojson_legend_bound.push(row)})
        join_aggregate_multiple_fields(params_chart.data[1].geojson_legend_bound, params_chart.data[1].dataset_filtred, layer_field, layer_field, numerical_tooltips)
    }


    function create_droplist_fields(params_chart) {
        //create droplist for fields permutation
        //1.general container for the droplist
        var generalContainer_droplist = document.createElement('div'); Object.assign(generalContainer_droplist, {className: 'w3-dropdown-click', id: 'droplist_'+params_chart.id, 
            style: 'height: max-content; width: max-content'})
        //2.create button
        var buttonText
        if (!sharedParams.language && sharedParams.language === 'en') {buttonText = 'Change the field'}
        else if (sharedParams.language === 'fr') {buttonText = "Changer l'indicateur"}
        var button_droplist = document.createElement('button'); Object.assign(button_droplist, {className: 'w3-button w3-teal', id: 'button_'+params_chart.id, innerText: buttonText})
        button_droplist.style.fontSize = "13px"; button_droplist.style.padding = "8px"
        button_droplist.addEventListener('click', ()=> {
            var droplist = document.getElementById("droplistBody_"+params_chart.id);
            if (!droplist.className.includes("w3-show")) {
            droplist.classList.add("w3-show");
            } else { 
            droplist.classList.remove("w3-show");
            }
        })

        button_droplist.addEventListener("keydown", function(e) {
            if (e.code == "Escape") {
                var droplist = document.getElementById("droplistBody_"+params_chart.id);
                droplist.classList.remove("w3-show");
            }
        })        

        //buggy code, fix later
        // document.addEventListener('click', (e)=> {            
        //     var droplist = document.getElementById("droplistBody_"+params_chart.id);
        //     if (e.target.id === button_droplist.id) {
        //         if (droplist.classList.contains("w3-show")) {
        //             droplist.classList.remove("w3-show");    
        //         }
        //         else {
        //             droplist.classList.add("w3-show");
        //         }
        //     }
        //     else if (e.target.id !== droplist.id) {
        //         droplist.classList.remove("w3-show");
        //     }

        // })
        
        //create droplist body
        var droplist_body = document.createElement('div'); Object.assign(droplist_body, {className: "w3-dropdown-content w3-bar-block w3-card-4 w3-animate-zoom", id: 'droplistBody_'+params_chart.id, 
            style: 'width:max-content; padding: 10px'})

        //create ul node
        var ul_container = document.createElement('ul'); Object.assign(ul_container, {className: 'dropdown-menu', id: 'droplist_fields'+params_chart.id, style: "list-style-type: none;padding: 0; margin: 0;"})

        //add the fields listed in the params
        var chart_dataset;
        if (params_chart.transformations.dataset) chart_dataset = params_chart.transformations.dataset
        else {chart_dataset = params_chart.sharedParams.data_main}
        params_chart.droplist_fields_searchBar = false
        
        params_chart.droplist_fields.forEach(element => {
            //create a search bar
            let nb_of_fields=0
            params_chart.droplist_fields.forEach(e=> nb_of_fields = nb_of_fields+e.fields?.length)
            if (!params_chart.droplist_fields_searchBar && nb_of_fields>=params_chart.droplist_fields_threshold) {
                let input_ind_searchBar = document.createElement('input'), placeholder;
                if (params_chart.sharedParams.language === 'en' || !params_chart.sharedParams.language) {placeholder = 'Search for fields'}
                else if (params_chart.sharedParams.language === 'fr') {placeholder = 'Search for fields'}

                Object.assign(input_ind_searchBar, {type: 'text', id: 'input_ind_searchBar_'+params_chart.id, placeholder: placeholder, title: 'Type a field name'})
                
                let style = {
                    "background-image": "url('/css/searchicon.png')",
                    "background-position": "10px 12px",
                    "background-repeat": "no-repeat",
                    "width": "100%",
                    "font-size": "16px",
                    "padding": "12px 20px 12px 40px",
                    border: "1px solid #ddd",
                    "margin-bottom": "12px",
                }

                Object.assign(input_ind_searchBar, {style: style})

                input_ind_searchBar.addEventListener('keyup', ()=> {
                    var input, filter, ul, li, span, i, txtValue;
                    input = document.getElementById("input_ind_searchBar_"+params_chart.id);
                    filter = input.value.toUpperCase();
                    //ul = document.getElementById("myUL");
                    var droplist = document.getElementById("droplistBody_"+params_chart.id);
                    li = droplist.getElementsByTagName("li");
                    for (i = 0; i < li.length; i++) {
                        txtValue = undefined
                        span = li[i].getElementsByTagName("span")[0];
                        if (span) {txtValue = span.textContent || span.innerText}
                        if (txtValue?.toUpperCase().indexOf(filter) > -1) {
                            li[i].style.display = "";
                        } else {
                            li[i].style.display = "none";
                        }
                    }                    
                })

                ul_container.appendChild(input_ind_searchBar)

                params_chart.droplist_fields_searchBar = true
            }
            if (element.title === undefined) {console.warn(`for ${params_chart.id}, a title is requiered in order to create the fields droplist`)}
            else {
                var title = document.createElement('li'); Object.assign(title, {className: 'dropdown-header', style: 'font-weight: bold; color: grey', innerText: element.title});
                ul_container.append(title)
                if (!element.fields || element.fields.length===0) {console.warn(`for ${params_chart.id}, a fields array is requiered in order to create the fields droplist`)}
                else {
                    element.fields.forEach(f => {
                        var field_li;
                        if (!chart_dataset.find(o=> o[f.field])) {console.warn(`for ${params_chart.id}, the field ${f.field} does not exist in the dataset of the chart`)}
                        else {
                            field_li = document.createElement('li');
                            if (f.alias) label = f.alias
                            else {label = f.field}
                            var field = document.createElement('span'); Object.assign(field, {href:'', className: "w3-bar-item w3-button droplist_field", innerText: label})
                            field.addEventListener('click', (e)=> {
                                //remove 'enabled' status from all droplist_fields
                                var dropdown_menu = document.getElementById('droplist_fields'+params_chart.id)
                                dropdown_menu.childNodes.forEach(el=> {
                                    if (el.classList.contains('enabled')) {
                                        el.classList.remove('enabled')
                                        //restore color
                                        if (el.hasChildNodes()) {el.firstChild.style.backgroundColor = ''}
                                    }
                                })
                                //add enabled status to the current target
                                e.target.parentElement.classList.add('enabled')
                                e.target.style.backgroundColor = 'orange'

                                //
                                params_chart.droplist_fields.forEach(el=> {
                                    el.fields.find(o=> {
                                        if (o.field === e.target.dataset.field) {
                                            o.enabled = true 
                                        } 
                                        else {o.enabled = false} 
                                    } )
                                })

                                //transfer the params values from the html node to the params_chart object
                                params_chart.params_fields.hue_params.hue_field = e.target.dataset.field
                                if (e.target.dataset.agg_type) {
                                    params_chart.params_fields.hue_params.agg_type = e.target.dataset.agg_type;
                                }
                                else {params_chart.params_fields.hue_params.agg_type = _.cloneDeep(params_chart._params_fields.hue_params.agg_type);}
                                if (e.target.dataset.hue_color) {
                                    params_chart.params_fields.hue_params.hue_color = e.target.dataset.hue_color
                                }
                                else {params_chart.params_fields.hue_params.hue_color = _.cloneDeep(params_chart._params_fields.hue_params.hue_color);}
                                if (e.target.dataset.colorsOrder) {
                                    params_chart.params_fields.hue_params.colorsOrder = e.target.dataset.colorsOrder
                                }
                                else {params_chart.params_fields.hue_params.colorsOrder = _.cloneDeep(params_chart._params_fields.hue_params.colorsOrder);}

                                if (e.target.dataset.domain) {
                                    params_chart.params_fields.hue_params.domain = e.target.dataset.domain.split(',')
                                }
                                else {params_chart.params_fields.hue_params.domain = _.cloneDeep(params_chart._params_fields.hue_params.domain);}
                                if (e.target.dataset.domain_scope) {
                                    params_chart.params_fields.hue_params.domain_scope = e.target.dataset.domain_scope
                                }
                                else {params_chart.params_fields.hue_params.domain_scope = _.cloneDeep(params_chart._params_fields.hue_params.domain_scope);}


                                let title_chart_node = document.getElementById(params_chart.htmlNode + '_title')
                                if (e.target.dataset.title_chart) {
                                    title_chart_node.innerText = e.target.dataset.title_chart
                                }
                                else {title_chart_node.innerText = 'title not specified for the current field'}
                                //update legends title
                                params_chart.params_legends.title = e.target.innerText
                                setTimeout(()=> {document.getElementById("legend_title_"+params_chart.htmlNode).innerText = e.target.innerText}, 500)
                                //patch side effect
                                setTimeout(() => {
                                    document.getElementById('droplist_'+params_chart.id).classList.add("w3-show");}, 610);
                                //document.querySelector("#legend_title_com_immobilier_carte_tx_hlm")

                                params_chart.inject_type = 'change_hue_field'
                                params_chart.enable_transition = true;
                                var origin_order ='change_hue_field';
                                params_chart.params_datapoints.circles_color_mode = "continuous_color";
                                
                                params_chart.instanciator.updateChart(params_chart, sharedParams, {}, origin_order)
                                params_chart.droplist_fields_searchBar = false
                            })

                            field.addEventListener('mouseover', ()=> {
                                field.style.cursor = 'pointer'
                            })
                            


                            field.dataset.field= f.field
                            field.dataset.agg_type = (f.agg_type ? f.agg_type : "")
                            field.dataset.hue_color= (f.hue_color ? f.hue_color: "")
                            field.dataset.colorsOrder= (f.colorsOrder ? f.colorsOrder: "")                            
                            field.dataset.domain = (f.domain ? f.domain: "")
                            field.dataset.domain_scope = (f.domain_scope ? f.domain_scope: "")
                            field.dataset.title_chart = (f.title_chart ? f.title_chart: "")

                            //fields for the tooltips display                            
                            field.dataset.unit = (f.unit ? f.unit: "")
                            field.dataset.slice = (f.slice ? f.slice: "")
                            field.dataset.toPrecision = (f.toPrecision ? f.toPrecision: "")

                            field_li.append(field)
                        }
                        if (field_li) ul_container.append(field_li)
                    });
                }
                //add a separator between the titles
                if (ul_container.hasChildNodes()) {
                    var sep = document.createElement('hr'); Object.assign(sep, {style: 'margin: 5px'});
                    ul_container.append(sep)
                }
            }
        });
        //remove the last node, which is a separator
        if (ul_container.hasChildNodes() && ul_container.lastElementChild.tagName === 'HR') {
            ul_container.lastElementChild.remove()
        }

        droplist_body.append(ul_container);
        generalContainer_droplist.append(button_droplist);
        generalContainer_droplist.append(droplist_body)

        return generalContainer_droplist
    }

}    



function generate_legend_size(params_chart) {
    

    var monitor_chart_display = setInterval(() => {
        var chart_node = document.getElementById(params_chart.id) || document.getElementById("grid_title_controls_map_legend_"+ params_chart.htmlNode) || params_chart.chart_instance.canvas
        var general_container_node = document.getElementById("general_container_"+params_chart.id) || document.getElementById("grid_title_controls_map_legend_"+ params_chart.htmlNode)

        var parent_container_display = check_parent_display(params_chart)				
        if (parent_container_display.chart_display_on && chart_node.getBoundingClientRect().width> general_container_node.clientWidth/2) {	//params_chart.style.chart_width
    
            if (params_chart.chart_type === "chartJS") {
                wrapper_scatterChart_legends(params_chart)
            }
            else if (params_chart.chart_type === 'leaflet') {
                //var monitor_circles_display = setInterval(() => {
                    //var circles_parent_element = document.querySelector(`#${params_chart.htmlNode} > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g`)
                    
                    //if (circles_parent_element) {
                    let current_zoom
                    params_chart.map_instance.on('zoomstart', function() {
                        let monitor_circles_display = setInterval(() => {
                            var nb_circles_added = Object.values(params_chart.map_instance._layers).filter(l=> l.circle_layer).length
                            current_zoom = params_chart.map_instance.getZoom()
                            if (nb_circles_added>0 && current_zoom <= 18) {
                                if (params_chart.params_fields.size_params.resize_on_zoom) {
                                    params_chart.funcLib.adaptSizePropCercles(params_chart)
                                }
                                //wrapper_mapCircles_legends(params_chart)
                                clearInterval(monitor_circles_display)
                            }
                            //if the current zoom is >= 15, do not resize the circles & deactivate the legends
                            else {
                                //deactivate_legends(params_chart)
                                clearInterval(monitor_circles_display)
                            }
                        },100)                                                        
                    })


                    params_chart.map_instance.on('zoomstart', function() {
                        let grid_legend = document.getElementById('grid_legend_' + params_chart.htmlNode)
                        //if (grid_legend) grid_legend.style.opacity = '0'
                    })
        

                    params_chart.map_instance.on('zoomend', function() {
                        let monitor_circles_display = setInterval(() => {
                            //setTimeout(() => {
                                var nb_circles_added = Object.values(params_chart.map_instance._layers).filter(l=> l.circle_layer).length
                                current_zoom = params_chart.map_instance.getZoom()
                                if (nb_circles_added>0 && current_zoom <= 18) {
                                    if (params_chart.params_fields.size_params.resize_on_zoom && !params_chart.zoomend_fired_one) {
                                        params_chart.funcLib.adaptSizePropCercles(params_chart)
                                    }
                                    wrapper_mapCircles_legends(params_chart)
                                    clearInterval(monitor_circles_display)
                                    params_chart.zoomend_fired_one = true
                                }
                                //if the current zoom is >= 15, do not resize the circles & deactivate the legends
                                else {
                                    deactivate_legends(params_chart)
                                    clearInterval(monitor_circles_display)
                                }                                
                            //}, 500);

                        },500)                                                        
                    })

                    
                    params_chart.map_instance.on('dragend', function() {
                        let monitor_circles_display = setInterval(() => {
                            var nb_circles_added = Object.values(params_chart.map_instance._layers).filter(l=> l.circle_layer).length;
                            current_zoom = params_chart.map_instance.getZoom()
                            if (nb_circles_added>0 && current_zoom <= 18) {
                                params_chart.funcLib.adaptSizePropCercles(params_chart)
                                wrapper_mapCircles_legends(params_chart)
                                clearInterval(monitor_circles_display)
                            }
                            //if the current zoom is >= 15, do not resize the circles & deactivate the legends
                            else {
                                deactivate_legends(params_chart)
                            }
                        },100)                                                        
                    })
                        

                    //}
                //},1000)
            }

            clearInterval(monitor_chart_display)
        }


        function wrapper_scatterChart_legends(params_chart) {
            var x_legend = chart_node.getBoundingClientRect().right-chart_node.getBoundingClientRect().x
            var y_legend = chart_node.getBoundingClientRect().top - general_container_node.getBoundingClientRect().top// + chart_node.getBoundingClientRect().height/2
            
            //PREPARE DATA bins
            var datasets = bin_dataset(params_chart)

            let x_axis_margin = d3.max(datasets, r=> r.size)+5
            let y_margin = 25
            let height = datasets.map(o=> o.size).reduce((previousValue, currentValue) => previousValue + currentValue) + y_margin*datasets.length
            
            Object.assign(params_chart.legend_size, {x_axis_margin: x_axis_margin, transition_time: 700, delay_time: 200})
            let title = params_chart.legend_size.title || 'legends title'
            let container_chart_legend = d3.select("#general_container_"+params_chart.id) || d3.select(`#${params_chart.chart_instance.canvas.id}`)
            if (container_chart_legend.empty()) container_chart_legend = d3.select("#general_container_"+params_chart.htmlNode)

            container_chart_legend
                .append("svg:svg")    
                .attr("width", 100)
                .attr("height", chart_node.getBoundingClientRect().height)//
                .attr('id', 'svg_legends_size_'+params_chart.id)
                .attr('style', 'position: absolute; opacity: 0.7')
                .attr("transform", `translate(${x_legend+10}, ${y_legend})`)						
                .append('text').text(title)
                .attr("transform", `translate(${6}, ${y_legend})`);

            container_chart_legend = d3.select("#svg_legends_size_"+params_chart.id)
                .append("g")
                .attr("id", 'g_svg_legends_size_'+params_chart.id)
                .attr('transform', `translate(${params_chart.legend_size.x_axis_margin}, ${params_chart.legend_size.x_axis_margin})`)
                .attr("width", 100)
                .attr("height", chart_node.getBoundingClientRect().height);
                

            init_legends(params_chart, datasets)

            //rescale parent container
            setTimeout(() => {
                let parent_container = document.getElementById('parent_container_'+params_chart.id)
                let legends_size_width = +document.querySelector("#svg_legends_size_"+params_chart.id).getAttribute('width')
                let parent_container_width = parent_container.clientWidth+legends_size_width
                if (parent_container.clientWidth < 100) {
                    parent_container_width = 'max-width'
                    setTimeout(()=> {
                        parent_container_width = parent_container.clientWidth+legends_size_width
                        parent_container.style.width = `${parent_container_width}`
                    }, 1000)
                }
                else {
                    parent_container_width = parent_container_width+"px"
                }
                
                parent_container.style.width = `${parent_container_width}`
                //document.getElementById('general_container_'+params_chart.id).style.justifySelf = 'start'
                parent_container.style.opacity = '1'
                chart_node.style.opacity = '1'
                
                

                params_chart.ind_generate_legend_size = true

                //reposition brush
                params_chart.sharedParams.position_brush_transformer(params_chart)
                    
            }, params_chart.legend_size.transition_time+200);

        }



        function wrapper_mapCircles_legends(params_chart) {
            var x_legend = chart_node.getBoundingClientRect().right-chart_node.getBoundingClientRect().x
            var y_legend = chart_node.getBoundingClientRect().top - general_container_node.getBoundingClientRect().top// + chart_node.getBoundingClientRect().height/2
            
            //PREPARE DATA bins
            var datasets = bin_dataset(params_chart)

            //if the gratest circle diam is > 80px or user given value, deactivate the legends
            let max_d_circles = params_chart.params_fields.size_params.max_d_circles || 85
            if (d3.max(datasets, r=> r.size)*2 > max_d_circles) {
                // deactivate_legends(params_chart);
                // return
            }

            let x_axis_margin = d3.max(datasets, r=> r.size)+5
            let legend_svg_width = d3.max(datasets, r=> r.size)*2+45 //width of greatest circle * 2, + 45px allocated to the labels
            let y_margin = 25
            let height = datasets.map(o=> o.size).reduce((previousValue, currentValue) => previousValue + currentValue) + y_margin*datasets.length
            params_chart.legend_size = {};
            
            Object.assign(params_chart.legend_size, {x_axis_margin: x_axis_margin, transition_time: 700, delay_time: 20, max_d_circles: max_d_circles})

            //create the legend container if absent
            let grid_legend = document.getElementById('grid_legend_' + params_chart.htmlNode)
            if (!grid_legend) {
                grid_legend = document.createElement('div'); 
                grid_legend.id = 'grid_legend_' + params_chart.htmlNode; 
                grid_legend.style = 'display: grid; grid-template-rows: 100px 45px auto auto; height: max-content; row-gap: 15px'// grid-template-columns: auto auto; justify-items: center'
                const parent_chart = document.getElementById('grid_title_controls_map_legend_'+params_chart.htmlNode);
                parent_chart.append(grid_legend)
            }
            //grid_legend.style.opacity='0'


            let title
            if (params_chart.params_legends.size_legend) {
                title = params_chart.params_legends.size_legend.title
            }
            else {
                title = params_chart.params_legends.title || 'legends title'
            }

            let d3_grid_legend = d3.select("#grid_legend_"+ params_chart.htmlNode)
            //if (!d3_grid_legend.empty()) d3_grid_legend.remove()

            //remove any previous legend container
            let container_chart_legend = d3.select('#svg_legends_size_'+params_chart.htmlNode)
            container_chart_legend?.remove()

            //create the title structure
            let legend_title_container = document.getElementById('legend_title_container_'+params_chart.htmlNode)
            //legend_title_container?.remove()

            if (!legend_title_container) {
                legend_title_container = document.createElement('div'); legend_title_container.id = 'legend_title_container_'+params_chart.htmlNode;
                legend_title_container.style = 'display: flex; place-self: end, transform: translate(1px, 25px)'

                legend_title = document.createElement('p'); legend_title.id = 'legend_size_title_'+params_chart.htmlNode
                legend_title.innerText = title;
                Object.assign(legend_title.style, {"place-self": 'end'})            
                legend_title_container.append(legend_title)
                grid_legend.append(legend_title_container)
            }

            d3_grid_legend
                .append("svg:svg")    
                .attr("width", legend_svg_width)
                .attr("height", chart_node.getBoundingClientRect().height)//
                .attr('id', 'svg_legends_size_'+params_chart.htmlNode)
                .attr('style', 'position: relative; opacity: 0.7')
                //.attr("transform", `translate(${x_legend+10}, ${y_legend})`)						
                // .append('text').text(title)
                // .attr("transform", `translate(${6}, ${10})`);
                //container_chart_legend = d3.select("#svg_legends_size_"+params_chart.id)
                .append("g")
                .attr("id", 'g_svg_legends_size_'+params_chart.htmlNode)
                .attr('transform', `translate(${params_chart.legend_size.x_axis_margin}, ${0})`)
                .attr("width", legend_svg_width)
                .attr("height", chart_node.getBoundingClientRect().height);
            
            container_chart_legend = document.getElementById('svg_legends_size_'+params_chart.htmlNode)
            grid_legend.append(container_chart_legend)
            

            init_legends(params_chart, datasets)

        }        

        function init_legends(params_chart, datasets) {
            var x_pos = 0, y_pos = 0, prev_circle_size = 0; 
            let d_max_circle = d3.min(datasets, e=> e.size)*2
            let y_margin
            if (params_chart.legend_size?.y_margin) {
                y_margin = params_chart.legend_size.y_margin;
            }
            else if (!params_chart.legend_size?.y_margin && d_max_circle<35) {
                y_margin = 20
            }
            else if (!params_chart.legend_size?.y_margin && d_max_circle>=35) {
                y_margin = 30
            }
            
            let circle_max_size = d3.max(datasets,r=> r.size)
            
            let g_svg_legends_size = d3.select('#g_svg_legends_size_'+params_chart.id)
            
            let labels_positions = {}
            let max_d_circles = params_chart.legend_size.max_d_circles || 85
            if (circle_max_size*2> max_d_circles) circle_max_size = max_d_circles/2

            datasets.forEach(dataset=> {
                    var circle_size = dataset.size
                    y_pos = y_pos + circle_size/2 + y_margin + prev_circle_size
                    
                    //do not draw circles larger than ...                    
                    if (+dataset.size*2 <= max_d_circles) {
                        g_svg_legends_size
                            .append("circle")
                            .attr("class", "legend_size_circles_"+params_chart.id)
                            .attr("cx", x_pos)							
                            .attr("cy", y_pos)//+params_chart.margin.bottom- 0
                            .attr('r', 0)
                            .transition().delay(params_chart.legend_size.delay_time).duration(params_chart.legend_size.transition_time)      
                            .attr('r', +dataset.size)
                            .attr("fill", "red");
                        
                        prev_circle_size = circle_size
                        labels_positions[circle_size] = y_pos

                        g_svg_legends_size
                            .append("text")									
                            .attr("x", x_pos+circle_max_size+20)
                            .attr("y", y_pos+4)//+params_chart.margin.bottom- 0
                            .text(dataset.value)
                            .attr('opacity', 0)
                            .transition().delay(params_chart.legend_size.delay_time).duration(params_chart.legend_size.transition_time)      
                            //.attr("x", x_pos+circle_max_size+20)
                            .attr('opacity', 1)
                    }

            })

            //resize svg parent
            setTimeout(() => {
                let width = +document.getElementById('g_svg_legends_size_'+params_chart.id).getAttribute('width')*1.25
                document.querySelector("#svg_legends_size_"+params_chart.id).setAttribute('width', width);
                //document.querySelector("#svg_legends_size_"+params_chart.id).setAttribute('opacity', 1)
                //Object.assign(document.querySelector("#grid_legend_" + params_chart.htmlNode).style,  {width: width})

            }, params_chart.legend_size.transition_time+100);
        }
        
        
        function deactivate_legends(params_chart) {
            let legend_container=document.getElementById('svg_legends_size_'+params_chart.htmlNode)
            if (legend_container) {
                legend_container.firstElementChild.childNodes.forEach(ch=> {
                    ch.setAttribute('fill', 'grey');
                    ch.setAttribute('r', 10);
                    ch.textContent='-'
                })
            }
            let legend_title = document.getElementById('legend_size_title_'+params_chart.htmlNode)
            if (legend_title) {
                if (params_chart.sharedParams.language === 'en') legend_title.innerText = 'Legends disabled';
                if (params_chart.sharedParams.language === 'fr') legend_title.innerText = 'Legendes désactivées'
            }
        }

        //PREPARE DATA bins
        function bin_dataset(params_chart) {
            let r_field=params_chart.r_field || params_chart.params_fields.size_params.size_field
            let r_field_arr
            /* ---------------------scatter chart case -------------------||---------------lealfet case----------------------*/
            let max_thresholds = params_chart.legend_size?.thresholds_max || params_chart.params_legends?.thresholds_max || 6
            let min_thresholds = params_chart.legend_size?.thresholds_min || params_chart.params_legends?.thresholds_min || 4
            
            //get the min/max radius of the circles in px
            const chart_type = params_chart.chart_type
            let min_radius, max_radius
            switch (chart_type) {
                case 'chartJS':
                    r_field_arr=params_chart.data_input?.map(r=> r[r_field])
                    min_radius = params_chart.radius_params?.min_radius;
                    max_radius = params_chart.radius_params?.max_radius;
                    break;
                case 'leaflet':
                    //v1: get the radius in px by searching the dom )
                        // let circles_parent_element = document.querySelector(`#${params_chart.htmlNode} > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g`)
                        // let circles_radius=[]; 
                        // circles_parent_element.childNodes.forEach(c=> {circles_radius.push(c.getBBox().width) })
                        // min_radius = d3.min(circles_radius);
                        // max_radius = d3.max(circles_radius);
                    
                    //v2: get the radius in px by searching map instance layers                    
                    let map_bounds=params_chart.map_instance.getBounds()                    
                    let list_circles=Object.values(params_chart.featureGroup["_layers"]);
                    let circles_in_bounds=[];
                    list_circles.forEach(c=> {if (map_bounds.contains(c._latlng)) circles_in_bounds.push(c) })
                    let list_radius_in_px=circles_in_bounds.map(c=> c._radius || c._radiusY);
                    min_radius = d3.min(list_radius_in_px);
                    max_radius = d3.max(list_radius_in_px);

                    r_field_arr = circles_in_bounds.map(c=> c.options.dataset[r_field]);
                    break;
            }

            params_chart.bin_min = d3.min(r_field_arr);
            params_chart.bin_max = d3.max(r_field_arr);

            let arr_binned = binGenerator(params_chart, min_thresholds, max_thresholds, r_field_arr)                    
            let sizes_values = arr_binned.map(o=> (o.x0 + o.x1)/2)
            let scale_method = params_chart?.radius_params?.scale_method || params_chart.params_fields?.size_params?.scale_method || "scaleSqrt"
            let scale_func = d3[scale_method]().range([min_radius, max_radius])
                .domain([d3.min(r_field_arr), d3.max(r_field_arr)]);
            let sizes_radius = []
            sizes_values.forEach(o=> {sizes_radius.push({value: o, size: scale_func(o)}) })

            return sizes_radius
        }			        
        
    }, 1000);

}

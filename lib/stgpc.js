let sharedParams_array=[], params_choroplethe_map_com_elect;

function vedhu(operational_dataset, polygons) {
    let sharedParams_com_apercu = new sharedParams()
    
    //sharedParams_com_apercu.transformations = {geoRadius_filter:  list_geoRadius_filter}
    
    sharedParams_com_apercu.language = "fr"
    sharedParams_com_apercu.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons,
        join_fields: {'CodeInsee': 'codgeo'}//, 'codgeo': 'CODGEO'}
    })

    //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
    sharedParams_array.push(sharedParams_com_apercu)
    sharedParams_com_apercu['sharedParams_array'] = sharedParams_array

    
    params_choroplethe_map_com_elect = new params_map()

    params_choroplethe_map_com_elect.htmlNode = 'map-elections';
    params_choroplethe_map_com_elect.id = "map-elections";
    //list of the geographic layers we want to display. THe values are those from the operational_data
    params_choroplethe_map_com_elect.geographic_priority_layers = {0: "CodeInsee"}
    params_choroplethe_map_com_elect.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    
    params_choroplethe_map_com_elect.params_fields = {hue_params: {hue_field: "Abstentions_ins", agg_type: 'median', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset"}}
    
    params_choroplethe_map_com_elect.tooltip_fields = [{field: "Commune", slice:[0, 25], selection: 'first'},
                                            {field: "Abstentions_ins" ,alias: "Tx absention", agg_type: "median", toPrecision: 4},]
    params_choroplethe_map_com_elect.title = "Tx d'absention par commune"        
    params_choroplethe_map_com_elect.params_legends = {show: true, title: "Tx d'absention", position: "", shape: "", max_cells: 8, toPrecision: 1, filter_params: {mode: "fade", flyToBounds: true,showTooltips: false}}

    //params_choroplethe_map_com_elect.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: true}] 

    params_choroplethe_map_com_elect.load_on = undefined
    params_choroplethe_map_com_elect.user_input = undefined

    var instantiateur_choroplethe_map1 = new Map_choroplethe(params_choroplethe_map_com_elect);

    //evo
    instantiateur_choroplethe_map1.createChart(params_choroplethe_map_com_elect, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams

}


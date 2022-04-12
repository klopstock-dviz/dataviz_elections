let sharedParams_com_apercu, sharedParams_com_immobilier, sharedParams_com_immobilier_logements, sharedParams_adress_, sharedParams3, sharedParams_array = []
let params_communesSearch, params_adressSearch, params_adressSearch_pin

let params_global = {}
params_global['data_loaded'] = {}
let ref_communes = []
let communes_selected = []
let data_annonces_details_ventes = [], data_stats_insee_com = [], data_stats_communes_lite = [], ref_insee = [], data_stats_communes = [], data_poi=[], polygons=[], ref_type_equip=[], qpv_polys=[], 
activite_residents_iris = [], logements_iris = [], couples_familles_menages_iris = [], diplomes_formation_iris = [], population_iris = [], revenus_disponibles_iris = [], sitadel_logements_=[];





function init_search_bar(ref_communes, params_global) {
  params_communesSearch = new params_textSearch()
  params_communesSearch.title_params = {label: 'Chercher une commune', fontSize: '15px', fontWeight: 'normal', fontFamily: 'Gill Sans Extrabold, sans-serif;'}
  params_communesSearch.htmlNode = 'textSearch1'
  params_communesSearch.category_field = 'INSEE_COM' //set the value iot filter the fact table
  params_communesSearch.placeholder = 'INSEE_COM'
  params_communesSearch.width = '370px'
  params_communesSearch.fontSize = '13px'
  //params_communesSearch.arrow_nav_style = {backgroundColor: 'red', color: 'black'}
  params_communesSearch.search_list = deduplicate_dict(ref_communes, "INSEE_COM").sort()
  //params_communesSearch.search_list = deduplicate_dict(ref_communes, "LIBCOM")
  params_communesSearch.box_selected_items = {position: 'right'}
  
  //params_communesSearch.groupControls = params_groupControl1

  var instantiateur_textSearch1 = new textSearch()
  instantiateur_textSearch1.createChart(params_communesSearch)
  params_global['communesSearch'] = params_communesSearch

  const button_load_data_communes = document.getElementById('load_data_communes');
  container_autocomplete = document.getElementById(params_communesSearch.htmlNode + "_container")
  if (button_load_data_communes) container_autocomplete.appendChild(button_load_data_communes)

}

function init_adress_bar(params_global) {
  params_adressSearch = new params_textSearch()
  params_adressSearch.title_params = {label: 'Chercher une adresse', fontSize: '15px', fontWeight: 'normal', fontFamily: 'Gill Sans Extrabold, sans-serif;'}
  params_adressSearch.htmlNode = 'adressSearch'
  params_adressSearch.id = 'adressSearch'
  params_adressSearch.category_field = 'Adresse' //set the value iot filter the fact table
  params_adressSearch.placeholder = 'Adresse'
  params_adressSearch.width = '370px'
  params_adressSearch.fontSize = '13px'
  params_adressSearch.crossfilter = [{chart: "bar1", filter: true, collect_active_slices: false}, {chart: "bar3", filter: true, collect_active_slices: false}]
  params_adressSearch.params_filter_targets = [{target_chart_id: 'bar1', mode: "preserve_shape"}, {target_chart_id: 'bar3', mode: "preserve_shape"},
    {target_chart_id: 'map1', mode: "filter_shape"}]
  //params_adressSearch.arrow_nav_style = {backgroundColor: 'red', color: 'black'}
  params_adressSearch.search_list = []
  
  
  //params_adressSearch.groupControls = params_groupControl1
  
  var instantiateur_adressSearch = new adressSearch()
  instantiateur_adressSearch.createChart(params_adressSearch)
  params_global['adressSearch'] = params_adressSearch
}


//bar adresse qui sert à chercher des adresses pour la page de recherche par communes, puis les épingler sur les cartes
function init_adress_bar_pin(params_global) {
  params_adressSearch_pin = new params_textSearch()
  params_adressSearch_pin.title_params = {label: 'Chercher et épingler des adresses sur les cartes', fontSize: '14px', fontWeight: 'normal', fontFamily: 'Gill Sans Extrabold, sans-serif;'}
  params_adressSearch_pin.htmlNode = 'com_adressSearch'
  params_adressSearch_pin.id = 'com_adressSearch'  
  params_adressSearch_pin.btn_loader_node = 'load_data_adresses_pin'
  params_adressSearch_pin.placeholder = 'Adresse'
  params_adressSearch_pin.width = '370px'
  params_adressSearch_pin.fontSize = '13px'    
  params_adressSearch_pin.sliders = false  
  params_adressSearch_pin.pin_adress = true
  
  params_adressSearch_pin.search_list = []
  
  
  //params_adressSearch_pin.groupControls = params_groupControl1
  
  var instantiateur_adressSearch = new adressSearch()
  instantiateur_adressSearch.createChart(params_adressSearch_pin)
  params_global['pin_adressSearch'] = params_adressSearch_pin
}




function setup_graphics_com_apercu(communes_selected, operational_dataset, polygons, user_input) {

    //-----------------------------------------
    //--------------------------------------------
    //--------------------------------------------
    sharedParams_com_apercu = new sharedParams()
    sharedParams_com_apercu.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: communes_selected}, 
    {field: "nb_pieces", operation: "<", value: 7}, {field: "prix_m2_vente", operation: "<", value: 15000}, 
    {field: "taux_rendement_n6", operation: "<", value: 20}, {field: "surface", operation: "<", value: 300},
    {field: "typedebien", operation: "include", values: ["m", "a", "an"]}], 
    latLng_fields: {lat:"mapCoordonneesLatitude", lng: "mapCoordonneesLongitude" }}
    
    
    //sharedParams_com_apercu.transformations = {geoRadius_filter:  list_geoRadius_filter}
    
    sharedParams_com_apercu.language = "fr"
    sharedParams_com_apercu.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons})

    //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
    sharedParams_array.push(sharedParams_com_apercu)
    sharedParams_com_apercu['sharedParams_array'] = sharedParams_array
    
    //aliases to show instead of the original fields names
    sharedParams_com_apercu.aliases = [{field: 'CODE_IRIS', target_field: 'LIB_IRIS', alias: 'Quartier'}]

    //data transformations
    //build lib iris
    join_v2(sharedParams_com_apercu.data_main, ref_insee, 'CODE_IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])
    //build lib com
    join_v2(data_stats_communes, ref_insee, 'CODGEO', 'INSEE_COM', ['LIBCOM'])

    

    join_aggregate(data_stats_communes, sharedParams_com_apercu.data_main, 'CODGEO', 'INSEE_COM', 'taux_rendement_n6', 'mean')
    join_aggregate(logements_iris, sharedParams_com_apercu.data_main, 'IRIS', 'CODE_IRIS', 'prix_m2_vente', 'median')
    
    join_aggregate(data_stats_communes, data_poi, 'CODGEO', 'DEPCOM', 'TYPEQU', 'count')

    data_stats_communes.forEach(r=> {r["tx_equip"] = +((1000 * r.count_TYPEQU) / r.P17_POP).toFixed(2)})

    //fin data transformations
    
    
    //instancier nouveau graph 1
      params_barChart_com_aprecu_prix_m2 = new param_customSpec_BarChartsJS()

      params_barChart_com_aprecu_prix_m2.ctx = document.getElementById('com_aprecu_prix_m2')
      params_barChart_com_aprecu_prix_m2.id = 'com_aprecu_prix_m2'
      params_barChart_com_aprecu_prix_m2.category_field = "INSEE_COM"
      //params_barChart_com_aprecu_prix_m2.category_field_slice = [0, 18]
      params_barChart_com_aprecu_prix_m2.hierarchy_levels = {0: "INSEE_COM", 1: "CODE_IRIS", 2: "nb_pieces"}
      params_barChart_com_aprecu_prix_m2.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers", 2: "Nb de pièces"}
      params_barChart_com_aprecu_prix_m2.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median', alias: 'Prix de vente m²'}
      params_barChart_com_aprecu_prix_m2.sort = {fieldName: 'prix_m2_vente', order: 'desc'}
      params_barChart_com_aprecu_prix_m2.label_tooltip = "Prix m² median"
      params_barChart_com_aprecu_prix_m2.title = "Prix de vente median au m² par commune (depuis le 02/2019)"
      params_barChart_com_aprecu_prix_m2.title_x_axis = 'Communes'
      params_barChart_com_aprecu_prix_m2.title_y_axis = "€"  
      params_barChart_com_aprecu_prix_m2.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: 'Commune'}]
      params_barChart_com_aprecu_prix_m2.brush_mode = false
      params_barChart_com_aprecu_prix_m2.style.chart_width = 450  //a num value or 'inherit', iot fill all available space provided by the parent node

      var instantiateur_barChart1 = new simple_BarChart(params_barChart_com_aprecu_prix_m2);

      //evo
      instantiateur_barChart1.createChart(params_barChart_com_aprecu_prix_m2, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
      


  //répartit° nb log selon leur type
    params_pieChart_com_aprecu_repartition_type_logement = new param_customSpec_PieChartsJS()
    params_pieChart_com_aprecu_repartition_type_logement.type = "pie"
    params_pieChart_com_aprecu_repartition_type_logement.ctx = document.getElementById('com_aprecu_repartition_type_logement')
    params_pieChart_com_aprecu_repartition_type_logement.id = "com_aprecu_repartition_type_logement"
    params_pieChart_com_aprecu_repartition_type_logement.category_field = "typedebien"
    params_pieChart_com_aprecu_repartition_type_logement.numerical_field_params = {fieldName: 'typedebien', agg_type: 'count'}
    params_pieChart_com_aprecu_repartition_type_logement.label_tooltip = "Nb de logements"
    params_pieChart_com_aprecu_repartition_type_logement.title = ["Nombre d'annonces de vente selon le type", "de logement (depuis le 02/2019)"]
    params_pieChart_com_aprecu_repartition_type_logement.fields_to_decode = {lookupTable: encoded_fields, mainKey: "typedebien", lookupKey: "typedebien", fields: ['lib_typedebien'], alias: 'Type bien'}
    params_pieChart_com_aprecu_repartition_type_logement.style.chart_width = 305  //a num value or 'inherit', iot fill all available space provided by the parent node
    params_pieChart_com_aprecu_repartition_type_logement.build_on = {params_chart_id: 'com_aprecu_prix_m2', messageWait: "Sélectionnez une commune sur le graphique xxx", event: "click"}
    params_pieChart_com_aprecu_repartition_type_logement.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: true},
                                                                        {chart: "com_aprecu_prix_m2_type_logement", filter: false, collect_active_slices: false}]
    params_pieChart_com_aprecu_repartition_type_logement.datalabels = true                                                                        
    


    //préparer la var data à injecter dans le chart
    var instantiateur_pieChart1 = new PieChart(params_pieChart_com_aprecu_repartition_type_logement);
    instantiateur_pieChart1.createChart(params_pieChart_com_aprecu_repartition_type_logement, sharedParams_com_apercu)
    
    
    
    
  //instancier prix m2 type de logement
    params_barChart_com_aprecu_prix_m2_type_logement = new param_customSpec_BarChartsJS()
    params_barChart_com_aprecu_prix_m2_type_logement.ctx = document.getElementById('com_aprecu_prix_m2_type_logement')
    params_barChart_com_aprecu_prix_m2_type_logement.id = 'com_aprecu_prix_m2_type_logement'
    params_barChart_com_aprecu_prix_m2_type_logement.category_field = "typedebien"
    params_barChart_com_aprecu_prix_m2_type_logement.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    //params_barChart_com_aprecu_prix_m2_type_logement.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_prix_m2_type_logement.label_tooltip = "Prix m²"
    params_barChart_com_aprecu_prix_m2_type_logement.title = ["Prix de vente au m² median selon le type de logement", "(depuis le 02/2021)"]
    params_barChart_com_aprecu_prix_m2_type_logement.title_x_axis = 'Prix de vente m²'
    params_barChart_com_aprecu_prix_m2_type_logement.title_y_axis = "Type de logement"
    params_barChart_com_aprecu_prix_m2_type_logement.transformations = {filter: [{field: "typedebien", operation: "exclude", values: ['l']}]}
    params_barChart_com_aprecu_prix_m2_type_logement.fields_to_decode = {lookupTable: encoded_fields, mainKey: "typedebien", lookupKey: "typedebien", fields: ['lib_typedebien'], alias: 'Type bien'}
    params_barChart_com_aprecu_prix_m2_type_logement.brush_mode = false
    //params_barChart_com_aprecu_prix_m2_type_logement.filter = false
    //params_barChart_com_aprecu_prix_m2_type_logement.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_aprecu_prix_m2_type_logement.type = "bar"
    params_barChart_com_aprecu_prix_m2_type_logement.horizontalBar = true
    params_barChart_com_aprecu_prix_m2_type_logement.style.chart_width = 390  //a num value or 'inherit', iot fill all available space provided by the parent node
    params_barChart_com_aprecu_prix_m2_type_logement.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: true},
                                                                    {chart: "com_aprecu_repartition_type_logement", filter: false, collect_active_slices: false}
    ]
    params_barChart_com_aprecu_prix_m2_type_logement.build_on = {params_chart_id: 'com_aprecu_prix_m2', messageWait: "Sélectionnez une commune sur le graphique xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", event: "click"}
    params_barChart_com_aprecu_prix_m2_type_logement.datalabels = true

    var instantiateur_barChart = new simple_BarChart(params_barChart_com_aprecu_prix_m2_type_logement);
    //evo
    instantiateur_barChart.createChart(params_barChart_com_aprecu_prix_m2_type_logement, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
      
  

  //instancier nb habitants
    params_barChart_com_aprecu_nb_habitants = new param_customSpec_BarChartsJS()
    params_barChart_com_aprecu_nb_habitants.ctx = document.getElementById('com_aprecu_nb_habitants')
    params_barChart_com_aprecu_nb_habitants.id = 'com_aprecu_nb_habitants'
    params_barChart_com_aprecu_nb_habitants.category_field = "CODGEO"    
    params_barChart_com_aprecu_nb_habitants.numerical_field_params = {fieldName: 'P17_POP', agg_type: 'sum', alias: "Nb d'habitants"}
    params_barChart_com_aprecu_nb_habitants.transformations = {filter: [{field: "CODGEO", operation: "include", values: communes_selected}], dataset: data_stats_communes}
    params_barChart_com_aprecu_nb_habitants.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_nb_habitants.label_tooltip = "Nombre d'habitants"
    params_barChart_com_aprecu_nb_habitants.title = "Nombre d'habitants par commune"
    params_barChart_com_aprecu_nb_habitants.title_x_axis = 'Communes'
    params_barChart_com_aprecu_nb_habitants.title_y_axis = "Nb habitants"  
    params_barChart_com_aprecu_nb_habitants.fields_to_decode = [{lookupTable: ref_insee, mainKey: "CODGEO", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_nb_habitants.brush_mode = false
    params_barChart_com_aprecu_nb_habitants.filter = false
    params_barChart_com_aprecu_nb_habitants.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_nb_habitants.style.chart_width= 550
    

    //params_barChart_com_aprecu_nb_habitants.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart2 = new simple_BarChart(params_barChart_com_aprecu_nb_habitants);

    //evo
    instantiateur_barChart2.createChart(params_barChart_com_aprecu_nb_habitants, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
    


  //instancier densité habitants
    params_barChart_com_aprecu_densite_habitants = new param_customSpec_BarChartsJS()

    params_barChart_com_aprecu_densite_habitants.ctx = document.getElementById('com_aprecu_densite_habitants')
    params_barChart_com_aprecu_densite_habitants.id = 'com_aprecu_densite_habitants'
    params_barChart_com_aprecu_densite_habitants.category_field = "CODGEO"
    params_barChart_com_aprecu_densite_habitants.numerical_field_params = {fieldName: 'densite_hab', agg_type: 'sum', alias: 'Nb habitants au km²'}
    params_barChart_com_aprecu_densite_habitants.transformations = {filter: [{field: "CODGEO", operation: "include", values: communes_selected}], dataset: data_stats_communes}
    params_barChart_com_aprecu_densite_habitants.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_densite_habitants.label_tooltip = "Densité population"
    params_barChart_com_aprecu_densite_habitants.title = "Densité de la population au km² par commune"
    params_barChart_com_aprecu_densite_habitants.title_x_axis = 'Communes'
    params_barChart_com_aprecu_densite_habitants.title_y_axis = "Hab / km²"  
    params_barChart_com_aprecu_densite_habitants.fields_to_decode = [{lookupTable: ref_insee, mainKey: "CODGEO", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_densite_habitants.brush_mode = false
    params_barChart_com_aprecu_densite_habitants.filter = false
    params_barChart_com_aprecu_densite_habitants.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_densite_habitants.style.chart_width= 500 
    //params_barChart_com_aprecu_densite_habitants.style.aspectRation= 0.5
    //params_barChart_com_aprecu_densite_habitants.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart3 = new simple_BarChart(params_barChart_com_aprecu_densite_habitants);

    //evo
    instantiateur_barChart3.createChart(params_barChart_com_aprecu_densite_habitants, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
    


  //instancier part des cadres
    //prepare data
    var agg_params = [{field: 'P17_ACT1564', operation: 'sum'}, {field: 'C17_ACT1564_CS3', operation: 'sum'}]
    var activite_residents_com = groupBy_aggregate(activite_residents_iris, 'COM', agg_params)
    activite_residents_com.forEach(r=> {
      r['part_cadres'] = +((r.sum_C17_ACT1564_CS3/r.sum_P17_ACT1564).toFixed(4))*100
    })
    join_v2(activite_residents_com, ref_insee, 'COM', 'INSEE_COM', ['LIBCOM'])

    params_barChart_com_aprecu_part_cadres = new param_customSpec_BarChartsJS()

    params_barChart_com_aprecu_part_cadres.ctx = document.getElementById('com_aprecu_part_cadres')
    params_barChart_com_aprecu_part_cadres.id = 'com_aprecu_part_cadres'
    params_barChart_com_aprecu_part_cadres.category_field = "COM"
    params_barChart_com_aprecu_part_cadres.numerical_field_params = {fieldName: 'part_cadres', agg_type: 'sum'}
    params_barChart_com_aprecu_part_cadres.transformations = {filter: [{field: "COM", operation: "include", values: communes_selected}], dataset: activite_residents_com}
    params_barChart_com_aprecu_part_cadres.sort = {fieldName: 'COM', order: 'asc'}
    params_barChart_com_aprecu_part_cadres.label_tooltip = "% cadres et prof. intellectuelles sup."
    params_barChart_com_aprecu_part_cadres.title = "% de cadres et professions intellectuelles supérieures"
    params_barChart_com_aprecu_part_cadres.title_x_axis = 'Communes'
    params_barChart_com_aprecu_part_cadres.title_y_axis = "%"  
    params_barChart_com_aprecu_part_cadres.fields_to_decode = [{lookupTable: ref_insee, mainKey: "COM", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_part_cadres.brush_mode = false
    params_barChart_com_aprecu_part_cadres.filter = false
    params_barChart_com_aprecu_part_cadres.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_part_cadres.style.chart_width= 500 
    //params_barChart_com_aprecu_part_cadres.style.aspectRation= 0.5
    //params_barChart_com_aprecu_part_cadres.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_aprecu_part_cadres);

    //evo
    instantiateur_barChart.createChart(params_barChart_com_aprecu_part_cadres, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams

    

  let pop_qpv = check_qpv(sharedParams_com_apercu.transformations.filter[0].values, qpv_polys, data_stats_communes, ref_insee)
  var agg_params = [{field: 'part_pop_qpv', operation: 'first'}]
  pop_qpv = groupBy_aggregate(pop_qpv, 'lib_commune', agg_params)
  pop_qpv.forEach(r=> r["first_part_pop_qpv"] = r["first_part_pop_qpv"]*100)
  
  //instancier tx qpv
    params_barChart_com_aprecu_tx_pop_qpv = new param_customSpec_BarChartsJS()

    params_barChart_com_aprecu_tx_pop_qpv.ctx = document.getElementById('com_aprecu_part_pop_qpv')
    params_barChart_com_aprecu_tx_pop_qpv.id = 'com_aprecu_part_pop_qpv'
    params_barChart_com_aprecu_tx_pop_qpv.category_field = "lib_commune"
    params_barChart_com_aprecu_tx_pop_qpv.numerical_field_params = {fieldName: 'first_part_pop_qpv', agg_type: 'sum', alias: 'Taux de population en QPV'}
    params_barChart_com_aprecu_tx_pop_qpv.transformations = {dataset: pop_qpv}
    params_barChart_com_aprecu_tx_pop_qpv.sort = {fieldName: 'lib_commune', order: 'asc'}
    params_barChart_com_aprecu_tx_pop_qpv.label_tooltip = "Tx population en QPV"
    params_barChart_com_aprecu_tx_pop_qpv.title = "Taux de population vivant en Quartier Prioritaire de la Ville (QPV, ex ZUS)"
    params_barChart_com_aprecu_tx_pop_qpv.title_x_axis = 'Communes'
    params_barChart_com_aprecu_tx_pop_qpv.title_y_axis = "%"    
    params_barChart_com_aprecu_tx_pop_qpv.brush_mode = false
    params_barChart_com_aprecu_tx_pop_qpv.filter = false
    params_barChart_com_aprecu_tx_pop_qpv.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_tx_pop_qpv.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_aprecu_tx_pop_qpv);

    //evo
    if (pop_qpv.length>0) {
      instantiateur_barChart.createChart(params_barChart_com_aprecu_tx_pop_qpv, sharedParams_com_apercu)
    }


  //instancier rev médian
    params_barChart_com_aprecu_revenu_med = new param_customSpec_BarChartsJS()
    params_barChart_com_aprecu_revenu_med.ctx = document.getElementById('com_aprecu_revenu_med')
    params_barChart_com_aprecu_revenu_med.id = 'com_aprecu_revenu_med'
    params_barChart_com_aprecu_revenu_med.category_field = "CODGEO"
    params_barChart_com_aprecu_revenu_med.numerical_field_params = {fieldName: 'MED17', agg_type: 'sum', alias: 'Niveau de vie médian (€)'}
    params_barChart_com_aprecu_revenu_med.transformations = {filter: [{field: "CODGEO", operation: "include", values: communes_selected}], dataset: data_stats_communes}
    params_barChart_com_aprecu_revenu_med.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_revenu_med.label_tooltip = "Médiane"
    params_barChart_com_aprecu_revenu_med.title = "Médiane du niveau vie par commune"
    params_barChart_com_aprecu_revenu_med.title_x_axis = 'Communes'
    params_barChart_com_aprecu_revenu_med.title_y_axis = "€"  
    params_barChart_com_aprecu_revenu_med.fields_to_decode = [{lookupTable: ref_insee, mainKey: "CODGEO", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_revenu_med.brush_mode = false
    params_barChart_com_aprecu_revenu_med.filter = false
    params_barChart_com_aprecu_revenu_med.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_aprecu_revenu_med.style.aspectRation= 0.375
    //params_barChart_com_aprecu_revenu_med.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart4 = new simple_BarChart(params_barChart_com_aprecu_revenu_med);

    //evo
    instantiateur_barChart4.createChart(params_barChart_com_aprecu_revenu_med, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
      


  //instancier tx chômage
    params_barChart_com_aprecu_tx_chomage = new param_customSpec_BarChartsJS()
    params_barChart_com_aprecu_tx_chomage.ctx = document.getElementById('com_aprecu_tx_chomage')
    params_barChart_com_aprecu_tx_chomage.id = 'com_aprecu_tx_chomage'
    params_barChart_com_aprecu_tx_chomage.category_field = "CODGEO"
    params_barChart_com_aprecu_tx_chomage.numerical_field_params = {fieldName: 'tx_chomage', agg_type: 'sum', alias: 'Taux de chômage'}
    params_barChart_com_aprecu_tx_chomage.transformations = {filter: [{field: "CODGEO", operation: "include", values: communes_selected}], dataset: data_stats_communes}
    params_barChart_com_aprecu_tx_chomage.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_tx_chomage.label_tooltip = "Tx chômage"
    params_barChart_com_aprecu_tx_chomage.title = "Taux de chômage"
    params_barChart_com_aprecu_tx_chomage.title_x_axis = 'Communes'
    params_barChart_com_aprecu_tx_chomage.title_y_axis = "%"  
    params_barChart_com_aprecu_tx_chomage.fields_to_decode = [{lookupTable: ref_insee, mainKey: "CODGEO", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_tx_chomage.brush_mode = false
    params_barChart_com_aprecu_tx_chomage.filter = false
    params_barChart_com_aprecu_tx_chomage.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_tx_chomage.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart5 = new simple_BarChart(params_barChart_com_aprecu_tx_chomage);

    //evo
    instantiateur_barChart5.createChart(params_barChart_com_aprecu_tx_chomage, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
    


  //instancier tx pauvreté
    params_barChart_com_aprecu_tx_pauvrete = new param_customSpec_BarChartsJS()
    params_barChart_com_aprecu_tx_pauvrete.ctx = document.getElementById('com_aprecu_tx_pauvrete')
    params_barChart_com_aprecu_tx_pauvrete.id = 'com_aprecu_tx_pauvrete'
    params_barChart_com_aprecu_tx_pauvrete.category_field = "CODGEO"
    params_barChart_com_aprecu_tx_pauvrete.numerical_field_params = {fieldName: 'TP6017', agg_type: 'sum', alias: 'Taux de pauvreté'}
    params_barChart_com_aprecu_tx_pauvrete.transformations = {filter: [{field: "CODGEO", operation: "include", values: communes_selected}], dataset: data_stats_communes}
    params_barChart_com_aprecu_tx_pauvrete.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_aprecu_tx_pauvrete.label_tooltip = "Tx pauvreté"
    params_barChart_com_aprecu_tx_pauvrete.title = "Taux de pauvreté par commune"
    params_barChart_com_aprecu_tx_pauvrete.title_x_axis = 'Communes'
    params_barChart_com_aprecu_tx_pauvrete.title_y_axis = "%"  
    params_barChart_com_aprecu_tx_pauvrete.fields_to_decode = [{lookupTable: ref_insee, mainKey: "CODGEO", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_aprecu_tx_pauvrete.brush_mode = false
    params_barChart_com_aprecu_tx_pauvrete.filter = false
    params_barChart_com_aprecu_tx_pauvrete.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_barChart_com_aprecu_tx_pauvrete.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart6 = new simple_BarChart(params_barChart_com_aprecu_tx_pauvrete);


    instantiateur_barChart6.createChart(params_barChart_com_aprecu_tx_pauvrete, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
    


  //instancier nb équipements
    params_barChart_com_apercu_nb_equipements = new param_customSpec_BarChartsJS()
    params_barChart_com_apercu_nb_equipements.ctx = document.getElementById('com_aprecu_nb_equipements')
    params_barChart_com_apercu_nb_equipements.id = 'com_aprecu_nb_equipements'
    params_barChart_com_apercu_nb_equipements.category_field = "niv_1"
    params_barChart_com_apercu_nb_equipements.numerical_field_params = {fieldName: 'TYPEQU', agg_type: 'count', alias: "Nb'équipements"}
    params_barChart_com_apercu_nb_equipements.hierarchy_levels = {0: "niv_1", 1: "niv_2", 2: "libelle_equipement"}
    params_barChart_com_apercu_nb_equipements.sort = {fieldName: 'TYPEQU', order: 'desc'}
    params_barChart_com_apercu_nb_equipements.label_tooltip = "Nb d'équipements"
    params_barChart_com_apercu_nb_equipements.title = "Nombre d'équipements par commune"
    params_barChart_com_apercu_nb_equipements.title_x_axis = 'Communes'
    params_barChart_com_apercu_nb_equipements.title_y_axis = "Nombre"  
    //params_barChart_com_apercu_nb_equipements.fields_to_decode = [{lookupTable: ref_insee, mainKey: "DEPCOM", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_apercu_nb_equipements.brush_mode = true
    params_barChart_com_apercu_nb_equipements.filter = false
    params_barChart_com_apercu_nb_equipements.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: false}]
    params_barChart_com_apercu_nb_equipements.transformations = {filter: [{field: "DEPCOM", operation: "include", values: communes_selected}], dataset: data_poi}
    params_barChart_com_apercu_nb_equipements.style.chart_width = 550  //a num value or 'inherit', iot fill all available space provided by the parent node
    
    //params_barChart_com_apercu_nb_equipements.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_barChart6 = new simple_BarChart(params_barChart_com_apercu_nb_equipements);

    //evo
    //instantiateur_barChart6.createChart(params_barChart_com_apercu_nb_equipements, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
  


  


  params_barChart_com_apercu_tx_equipement = new param_customSpec_BarChartsJS()

    params_barChart_com_apercu_tx_equipement.ctx = document.getElementById('com_aprecu_tx_equipement')
    params_barChart_com_apercu_tx_equipement.id = 'com_aprecu_tx_equipement'
    params_barChart_com_apercu_tx_equipement.category_field = "DEPCOM"
    params_barChart_com_apercu_tx_equipement.numerical_field_params = {fieldName: 'TYPEQU', agg_type: 'count', alias: "Taux d'équipement pour 1000 habitants",
    custom_function: function(arguments) {return +((1000 * arguments.field1)/arguments.field2 ).toFixed(2) }, arguments:{ field1: "TYPEQU", field2: "P17_POP"}, computed_field_name: 'tx_equip' }
    params_barChart_com_apercu_tx_equipement.hierarchy_levels = {0: "DEPCOM", 1: "niv_1", 2: "niv_2", 3: "libelle_equipement"}
    params_barChart_com_apercu_tx_equipement.sort = {fieldName: 'TYPEQU', order: 'desc'}
    params_barChart_com_apercu_tx_equipement.label_tooltip = "Tx d'équipement"
    params_barChart_com_apercu_tx_equipement.title = "Taux d'équipement par commune pour 1000 habitants"
    params_barChart_com_apercu_tx_equipement.title_x_axis = 'Communes'
    params_barChart_com_apercu_tx_equipement.title_y_axis = "%"
    params_barChart_com_apercu_tx_equipement.fields_to_decode = [{lookupTable: ref_insee, mainKey: "DEPCOM", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart_com_apercu_tx_equipement.brush_mode = true
    params_barChart_com_apercu_tx_equipement.filter = false
    params_barChart_com_apercu_tx_equipement.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: false}]
    params_barChart_com_apercu_tx_equipement.transformations = {filter: [{field: "DEPCOM", operation: "include", values: communes_selected}], dataset: data_poi}
    
    
    //params_barChart_com_apercu_tx_equipement.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


  var instantiateur_barChart6 = new simple_BarChart(params_barChart_com_apercu_tx_equipement);

  //evo
  instantiateur_barChart6.createChart(params_barChart_com_apercu_tx_equipement, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
  


  // params_bubblemap_com_aprecu_synthese = new params_bubblemap()
    // params_bubblemap_com_aprecu_synthese.htmlNode= "com_apercu_synthese_bubblemap"
    // params_bubblemap_com_aprecu_synthese.id= "bubbleMap1"
    // params_bubblemap_com_aprecu_synthese.title= "Résumé"
    // params_bubblemap_com_aprecu_synthese.subtitle= "Synthèse et classement des meilleures communes"    
    // //params_bubblemap_com_aprecu_synthese.height = 250
    // params_bubblemap_com_aprecu_synthese.margin = {top: 80, right: 25, bottom: 30, left: 30}
    // params_bubblemap_com_aprecu_synthese.data= [{source: sharedParams_com_apercu.data_main, group: "LIBCOM", variable: "prix_m2_vente", alias: "Prix de vente au m²", agg_type: "median", relation_type: "ng", filter: {key: "INSEE_COM", values: communes_selected}, symbol: "€"},
    //   {source: data_stats_communes, group: "LIBCOM", variable: "densite_hab", alias: "Nb d'habitants au km²", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}},
    //   {source: data_stats_communes, group: "LIBCOM", variable: "MED17", alias: "Médianne du Niveau de vie", agg_type: "sum", relation_type: "po", filter: {key: "CODGEO", values: communes_selected}, symbol: "€"},
    //   {source: data_stats_communes, group: "LIBCOM", variable: "TP6017", alias: "Tx de pauvreté", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}, symbol: "%"},
    //   {source: data_stats_communes, group: "LIBCOM", variable: "tx_chomage", alias: "Tx de chômage", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}, symbol: "%"},
    //   {source: data_stats_communes, group: "LIBCOM", variable: "tx_equip", alias: "Tx d'équipement / 1000 habitants", agg_type: "sum", relation_type: "po", filter: {key: "CODGEO", values: communes_selected}}
    //   ]
    // params_bubblemap_com_aprecu_synthese.build_on = {el_id: 'com_aprecu_synthese', display: true, classValue: 'active_view'}
    // var instanciator_bubblemap_com_aprecu_synthese = new bubblemap(params_bubblemap_com_aprecu_synthese)
    // instanciator_bubblemap_com_aprecu_synthese.createChart(params_bubblemap_com_aprecu_synthese, sharedParams_com_apercu)

  //synthese heatmap
    params_heatmap_com_aprecu_synthese = new params_bubblemap()
    params_heatmap_com_aprecu_synthese.htmlNode= "com_apercu_synthese_heatmap"
    params_heatmap_com_aprecu_synthese.id= "heatmap1"
    params_heatmap_com_aprecu_synthese.title= "Résumé"
    params_heatmap_com_aprecu_synthese.subtitle= "Synthèse et classement des meilleures communes"    
    //params_heatmap_com_aprecu_synthese.height = 250
    params_heatmap_com_aprecu_synthese.margin = {top: 80, right: 25, bottom: 30, left: 30}
    params_heatmap_com_aprecu_synthese.data= [{source: sharedParams_com_apercu.data_main, group: "LIBCOM", variable: "prix_m2_vente", alias: "Prix de vente au m²", agg_type: "median", relation_type: "ng", filter: {key: "INSEE_COM", values: communes_selected}, symbol: "€"},
      {source: data_stats_communes, group: "LIBCOM", variable: "densite_hab", alias: "Nb d'habitants au km²", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}},
      {source: data_stats_communes, group: "LIBCOM", variable: "MED17", alias: "Médianne du Niveau de vie", agg_type: "sum", relation_type: "po", filter: {key: "CODGEO", values: communes_selected}, symbol: "€"},
      {source: data_stats_communes, group: "LIBCOM", variable: "TP6017", alias: "Tx de pauvreté", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}, symbol: "%"},
      {source: data_stats_communes, group: "LIBCOM", variable: "tx_chomage", alias: "Tx de chômage", agg_type: "sum", relation_type: "ng", filter: {key: "CODGEO", values: communes_selected}, symbol: "%"},
      {source: data_stats_communes, group: "LIBCOM", variable: "tx_equip", alias: "Tx d'équipement / 1000 habitants", agg_type: "sum", relation_type: "po", filter: {key: "CODGEO", values: communes_selected}},
      {source: pop_qpv, group: "lib_commune", variable: "first_part_pop_qpv", alias: "Tx de population en QPV", agg_type: "sum", relation_type: "ng"},
      {source: activite_residents_com, group: "LIBCOM", variable: "part_cadres", alias: "Tx de cadres & prof. intellectuelles sup.", agg_type: "sum", relation_type: "po", filter: {key: "COM", values: communes_selected}}
      ]
    params_heatmap_com_aprecu_synthese.build_on = {el_id: 'com_aprecu_synthese', display: true, classValue: 'active_view'}
    params_heatmap_com_aprecu_synthese.panel_param_score.elements_toHide_onPanelDisplay = ['com_aprecu_carte_prix_m2']
    var instanciator_heatmap_com_aprecu_synthese = new heatmap(params_heatmap_com_aprecu_synthese)
    instanciator_heatmap_com_aprecu_synthese.createChart(params_heatmap_com_aprecu_synthese, sharedParams_com_apercu)
    

  //choroplethe map
    //instancier nouvelle map
    params_choroplethe_map_com_apercu_prix_vente_m2 = new params_map()

    params_choroplethe_map_com_apercu_prix_vente_m2.htmlNode = 'com_aprecu_carte_prix_m2';
    params_choroplethe_map_com_apercu_prix_vente_m2.id = "com_aprecu_carte_prix_m2"
    params_choroplethe_map_com_apercu_prix_vente_m2.geographic_priority_layers = {0: "CODE_IRIS", 1: "INSEE_COM"}
    params_choroplethe_map_com_apercu_prix_vente_m2.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    //params_choroplethe_map_com_apercu_prix_vente_m2.geographic_articulation_layers = {0: {levelName: "IRIS", field: "CODE_IRIS"}} 

    params_choroplethe_map_com_apercu_prix_vente_m2.params_fields = {hue_params: {hue_field: "prix_m2_vente", agg_type: 'median', hue_color: "interpolateReds", domain: ["p0.05", "p0.98"], domain_scope: "filtred_dataset"}}
    //params_choroplethe_map_com_apercu_prix_vente_m2.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"


    params_choroplethe_map_com_apercu_prix_vente_m2.tooltip_fields = [{field: "LIB_IRIS", slice:[0, 15] ,alias: "Quartier", selection: "first"},
                                            {field: "prix_m2_vente" ,alias: "Prix m²", agg_type: "median", toPrecision: 4},
                                            {field: "nb_pieces" ,alias: "Nb d'annonces", agg_type: "count"},//round: true/false
                                            {field: "TYP_IRIS" ,alias: "Type IRIS", selection: "first"},
                                            {field: "CODE_IRIS", slice:[0, 15] ,alias: "Code Quartier", selection: "first"}]
    params_choroplethe_map_com_apercu_prix_vente_m2.title = "Quartiers selon leur prix de vente au m²"
    //params_map1.bounds_adjustment = {adjustment: true, domain: ["p0.05", "p0.95"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
    //here you can declare a set of transformations that will be applied to this particular chart
    params_choroplethe_map_com_apercu_prix_vente_m2.transformations = {filter: [{field: "prix_m2_vente", operation: ">", value: 0}]}
    params_choroplethe_map_com_apercu_prix_vente_m2.params_legends = {show: true, title: "Prix de vente m²", position: "", shape: "", max_cells: 8, toPrecision: 1, filter_params: {mode: "fade", flyToBounds: true,showTooltips: false}}

    params_choroplethe_map_com_apercu_prix_vente_m2.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: true}]
    //params_barChart2.filter = false

    params_choroplethe_map_com_apercu_prix_vente_m2.load_on = undefined
    params_choroplethe_map_com_apercu_prix_vente_m2.user_input = user_input

    var instantiateur_choroplethe_map1 = new Map_choroplethe(params_choroplethe_map_com_apercu_prix_vente_m2);

    //evo
    instantiateur_choroplethe_map1.createChart(params_choroplethe_map_com_apercu_prix_vente_m2, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams

  


    // params_map1 = new params_map()
      // params_map1.category_field = "INSEE_COM" //used to sync with other charts sharing same cat field, especially in rm crossfilter process
      // params_map1.htmlNode = 'com_aprecu_carte_prix_m2'
      // params_map1.id = "com_aprecu_carte_prix_m2"
      // params_map1.title = "Annonces selon leur taux de rendement"
      // params_map1.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
      // params_map1.params_fields = {lat: "mapCoordonneesLatitude", lng: "mapCoordonneesLongitude", hue_params: {hue_field: "taux_rendement_n6", hue_color: "interpolateRdYlGn", 
      //                             domain: ["auto", "p0.98"], domain_scope: "whole_dataset"}}
      // //params_map1.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"                                
      // params_map1.tooltip_fields = {0:{fieldName: "LIBCOM", slice:[0, 20] ,alias: "Commune"}, 1:{fieldName: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"}, 2: {fieldName: "prix_bien", alias: "Prix du bien", unit: " €"},
      // 3: {fieldName: "prix_m2_vente", alias: "Prix vente au m²", unit: " €"}, 4: {fieldName: "nb_pieces", alias: "Nb de pièces"},
      // 5: {fieldName: "surface", alias: "Surface", unit: " m²"}, 6: {fieldName: "dpeL", alias: "DPE"}, 7:{fieldName: "taux_rendement_n6" ,alias: "Taux de rendement", unit: " %"}}
      // params_map1.title.text = "title of the chart"
      // params_map1.bounds_adjustment = {adjustment: false, domain: ["p0.05", "p0.95"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
      // //here you can declare a set of transformations that will be applied to this particular chart
      // //params_map1.transformations = {filter: [{field: "taux_rendement_n7", operation: ">", value: 0}]}
      // params_map1.params_legends = {show: true, position: "", shape: "", max_cells: 8, title: "Taux de Rendement"}
      // params_map1.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]

      // var instantiateur_map1 = new Map_circles(params_map1);

      // //evo
      // instantiateur_map1.createChart(params_map1, sharedParams_com_apercu) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams




  sharedParams_com_apercu.setup_crossfilter(sharedParams_com_apercu)

  //list the graphics wanted for synchronisation
  params_barChart_com_aprecu_prix_m2.graphics_to_synchronise = [{id: 'com_immobilier_structure_prix_m2_global', delay_time: 500, on_display: "immobilier_communes"},
  {id: 'com_immobilier_structure_logements_nb_logements', join_fields: {INSEE_COM: 'COM'}, delay_time: undefined, on_display: "com_immobilier_structure_logements1"}]

  params_barChart_com_aprecu_prix_m2.graphics_to_filter = [{id: "com_immobilier_carte_struct_logements", delay_time: undefined, on_display: undefined, join_fields: {INSEE_COM: 'COM'}}];

  return true

}





function setup_graphics_com_immobilier(communes_selected, operational_dataset, polygons,user_input) {

  //-----------------------------------------
  //--------------------------------------------
  //--------------------------------------------
  sharedParams_com_immobilier = new sharedParams()
  sharedParams_com_immobilier.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: communes_selected}, 
  {field: "nb_pieces", operation: "<", value: 7}, {field: "prix_m2_vente", operation: "<", value: 15000}, 
  {field: "taux_rendement_n6", operation: "<", value: 20}, {field: "surface", operation: "<", value: 300}]}
  
  
  //sharedParams_com_immobilier.transformations = {geoRadius_filter:  list_geoRadius_filter}
  
  sharedParams_com_immobilier.language = "fr"
  sharedParams_com_immobilier.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons})

  //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
  sharedParams_array.push(sharedParams_com_immobilier)
  sharedParams_com_immobilier['sharedParams_array'] = sharedParams_array
  
  //aliases to show instead of the original fields names
  sharedParams_com_immobilier.aliases = [{field: "prix_m2_vente", alias: "Prix m²"}, {field: "nb_pieces", alias: "Nb de pièces"}, {field: 'CODE_IRIS', target_field: 'LIB_IRIS', alias: 'Quartier'}]

  //data transformations
  //build lib iris
  // join_v2(sharedParams_com_immobilier.data_main, ref_insee, 'CODE_IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])

  
  
  //instancier struct prix m2 global
    params_barChart_com_immobilier_prix_m2 = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_prix_m2.ctx = document.getElementById('com_immobilier_structure_prix_m2_global')
    params_barChart_com_immobilier_prix_m2.id = 'com_immobilier_structure_prix_m2_global'
    params_barChart_com_immobilier_prix_m2.category_field = "INSEE_COM"
    params_barChart_com_immobilier_prix_m2.hierarchy_levels = {0: "INSEE_COM", 1: "LIB_IRIS"}
    params_barChart_com_immobilier_prix_m2.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers"}
    params_barChart_com_immobilier_prix_m2.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median', alias: 'Prix de vente m²'}
    params_barChart_com_immobilier_prix_m2.sort = {fieldName: 'prix_m2_vente', order: 'desc'}
    params_barChart_com_immobilier_prix_m2.label_tooltip = "Prix m² median"
    params_barChart_com_immobilier_prix_m2.title = "Prix de vente median au m² par commune (depuis le 02/2019)"
    params_barChart_com_immobilier_prix_m2.title_x_axis = 'Communes'
    params_barChart_com_immobilier_prix_m2.title_y_axis = "€"  
    params_barChart_com_immobilier_prix_m2.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "Commune"}]
    params_barChart_com_immobilier_prix_m2.crossfilter = [{chart: "com_immobilier_structure_prix_m2_type_bien", filter: true, collect_active_slices: true, level_collect_active_slices: 1}] 
    params_barChart_com_immobilier_prix_m2.crossfilter_reset_charts = ["com_immobilier_structure_prix_m2_nb_pieces", "com_immobilier_structure_prix_m2_type_bien",
                                            "com_immobilier_structure_prix_m2_ancien_neuf", "com_immobilier_carte_prix_m2_quartiers", "com_immobilier_carte_prix_m2_logements",
                                          "com_immobilier_carte_tx_rendement_logements", "com_immobilier_carte_tx_rendement_quartiers"]
    //level_collect_active_slices enable the collect of the 1st data level (0, ie category field) or 2nd data level (1, ie sub category field)
    params_barChart_com_immobilier_prix_m2.brush_mode = true
    params_barChart_com_immobilier_prix_m2.style.chart_width = 350  //a num value or 'inherit', iot fill all available space provided by the parent node
    
    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_prix_m2);
    
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_prix_m2, sharedParams_com_immobilier) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  //instancier struct prix m2 par type de bien
    params_barChart_com_immobilier_prix_type_bien = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_prix_type_bien.id = "com_immobilier_structure_prix_m2_type_bien"
    params_barChart_com_immobilier_prix_type_bien.ctx = document.getElementById('com_immobilier_structure_prix_m2_type_bien')
    params_barChart_com_immobilier_prix_type_bien.category_field = "INSEE_COM"
    params_barChart_com_immobilier_prix_type_bien.sub_category_field = "typedebien"
    params_barChart_com_immobilier_prix_type_bien.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_barChart_com_immobilier_prix_type_bien.label_tooltip = "Prix m² median"
    params_barChart_com_immobilier_prix_type_bien.title = "Prix de vente median au m² selon le type de bien"
    params_barChart_com_immobilier_prix_type_bien.title_x_axis = 'Communes'
    params_barChart_com_immobilier_prix_type_bien.title_y_axis = "Prix m² median"
    params_barChart_com_immobilier_prix_type_bien.legend_title = "Nb pieces"
    params_barChart_com_immobilier_prix_type_bien.colorsConfig = {scheme: "interpolateRainbow", colorsOrder: "randomize"}
    params_barChart_com_immobilier_prix_type_bien.decode = true    
    params_barChart_com_immobilier_prix_type_bien.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true}]
    params_barChart_com_immobilier_prix_type_bien.transformations = {filter: [{field: "typedebien", operation: "include", values: ["a", "m"]}]} 
    params_barChart_com_immobilier_prix_type_bien.fields_to_decode = {category_field: {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", target_field: 'LIBCOM', alias: "Commune"}, 
                                                                    sub_category_field: {lookupTable: encoded_fields, mainKey: "typedebien", lookupKey: "typedebien", target_field: 'lib_typedebien', alias: "Type bien"}}
    params_barChart_com_immobilier_prix_type_bien.style.chart_width = 400  //a num value or 'inherit', iot fill all available space provided by the parent node
    params_barChart_com_immobilier_prix_type_bien.legend.reverse = true    
    params_barChart_com_immobilier_prix_type_bien.datalabels = true
    var instantiateur_groupedBar1 = new grouped_barChart(params_barChart_com_immobilier_prix_type_bien);

    //préparer la var data à injecter dans le chart
    instantiateur_groupedBar1.createChart(params_barChart_com_immobilier_prix_type_bien, sharedParams_com_immobilier)


    


  //instancier struct prix m2 par nb de pieces
    params_barChart_com_immobilier_prix_nb_pieces = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_prix_nb_pieces.id = "com_immobilier_structure_prix_m2_nb_pieces"
    params_barChart_com_immobilier_prix_nb_pieces.ctx = document.getElementById('com_immobilier_structure_prix_m2_nb_pieces')
    params_barChart_com_immobilier_prix_nb_pieces.category_field = "INSEE_COM"
    params_barChart_com_immobilier_prix_nb_pieces.sub_category_field = "nb_pieces"
    //params_barChart_com_immobilier_prix_nb_pieces.sub_category_field_alias = "Nb de pièces"
    params_barChart_com_immobilier_prix_nb_pieces.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_barChart_com_immobilier_prix_nb_pieces.label_tooltip = "Prix m² median"
    params_barChart_com_immobilier_prix_nb_pieces.title = "Prix de vente median au m² selon le nombre de pieces du bien"
    params_barChart_com_immobilier_prix_nb_pieces.title_x_axis = 'Communes'
    params_barChart_com_immobilier_prix_nb_pieces.title_y_axis = "Prix m² median"
    params_barChart_com_immobilier_prix_nb_pieces.legend_title = "Nb pieces"
    params_barChart_com_immobilier_prix_nb_pieces.colorsConfig = {scheme: "interpolateRainbow", colorsOrder: "randomize"}
    params_barChart_com_immobilier_prix_nb_pieces.decode = true    
    params_barChart_com_immobilier_prix_nb_pieces.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true},
                                                                {chart: "com_immobilier_structure_prix_m2_type_bien", filter: false, collect_active_slices: true}]
    params_barChart_com_immobilier_prix_nb_pieces.fields_to_decode = {category_field: {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", target_field: 'LIBCOM', alias: "Commune"}}
    params_barChart_com_immobilier_prix_nb_pieces.style.chart_width = 380  //a num value or 'inherit', iot fill all available space provided by the parent node
    params_barChart_com_immobilier_prix_nb_pieces.legend.reverse = true
    var instantiateur_groupedBar = new grouped_barChart(params_barChart_com_immobilier_prix_nb_pieces);

    //préparer la var data à injecter dans le chart
    instantiateur_groupedBar.createChart(params_barChart_com_immobilier_prix_nb_pieces, sharedParams_com_immobilier)



  //instancier struct prix m2 par ancienneté
    params_barChart_com_immobilier_prix_ancien_neuf = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_prix_ancien_neuf.id = "com_immobilier_structure_prix_m2_ancien_neuf"
    params_barChart_com_immobilier_prix_ancien_neuf.ctx = document.getElementById('com_immobilier_structure_prix_m2_ancien_neuf')
    params_barChart_com_immobilier_prix_ancien_neuf.category_field = "INSEE_COM"
    params_barChart_com_immobilier_prix_ancien_neuf.sub_category_field = "logement_neuf"
    params_barChart_com_immobilier_prix_ancien_neuf.sub_category_field_alias = "Ancienneté"
    params_barChart_com_immobilier_prix_ancien_neuf.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_barChart_com_immobilier_prix_ancien_neuf.label_tooltip = "Prix m² median"
    params_barChart_com_immobilier_prix_ancien_neuf.title = "Prix de vente median au m² du neuf / ancien"
    params_barChart_com_immobilier_prix_ancien_neuf.title_x_axis = 'Communes'
    params_barChart_com_immobilier_prix_ancien_neuf.title_y_axis = "Prix m² median"
    params_barChart_com_immobilier_prix_ancien_neuf.legend_title = "Nb pieces"
    params_barChart_com_immobilier_prix_ancien_neuf.colorsConfig = {scheme: "interpolateRainbow", colorsOrder: "randomize"}
    params_barChart_com_immobilier_prix_ancien_neuf.decode = true    
    params_barChart_com_immobilier_prix_ancien_neuf.transformations = {filter: [{field: "logement_neuf", operation: "include", values: ["o", "n"]}]} 
    params_barChart_com_immobilier_prix_ancien_neuf.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true},
                                                                {chart: "com_immobilier_structure_prix_m2_type_bien", filter: false, collect_active_slices: true}]
    params_barChart_com_immobilier_prix_ancien_neuf.fields_to_decode = {category_field: {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", target_field: 'LIBCOM', alias: "Commune"},
                                                                          sub_category_field: {lookupTable: encoded_fields, mainKey: "logement_neuf", lookupKey: "logement_neuf", target_field: "lib_logement_neuf", alias: "Ancienneté"}}
    params_barChart_com_immobilier_prix_ancien_neuf.style.chart_width = 380
    params_barChart_com_immobilier_prix_ancien_neuf.legend.reverse = true
    var instantiateur_groupedBar = new grouped_barChart(params_barChart_com_immobilier_prix_ancien_neuf);

    //préparer la var data à injecter dans le chart
    instantiateur_groupedBar.createChart(params_barChart_com_immobilier_prix_ancien_neuf, sharedParams_com_immobilier)



  //instancier histo prix m2
    params_curve_com_immobilier_prix_historique = new param_customSpec_CurveChartsJS()
    params_curve_com_immobilier_prix_historique.id = "com_immobilier_structure_prix_m2_historique"      
    params_curve_com_immobilier_prix_historique.ctx = document.getElementById('com_immobilier_structure_prix_m2_historique')
    params_curve_com_immobilier_prix_historique.category_field = "date"
    //params_curve_com_immobilier_prix_historique.category_field_alias = "Date"
    params_curve_com_immobilier_prix_historique.sub_category_field = "INSEE_COM"
    params_curve_com_immobilier_prix_historique.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_curve_com_immobilier_prix_historique.stackedChart = false
    params_curve_com_immobilier_prix_historique.shape = {type: 'line', fill: false} // for area set options: {'area', fill: 'origin'}. you can set the following fill options: '+2' to fill to upper dataset, 
    params_curve_com_immobilier_prix_historique.label_tooltip = "Prix m² median"
    params_curve_com_immobilier_prix_historique.title = "Evolution du prix au m² médian"
    params_curve_com_immobilier_prix_historique.title_x_axis = 'Temps'
    params_curve_com_immobilier_prix_historique.title_y_axis = "Prix m² median"
    params_curve_com_immobilier_prix_historique.legend.position = "top"
    params_curve_com_immobilier_prix_historique.colorsConfig = {scheme: "interpolateRainbow", colorsOrder: ""}
    params_curve_com_immobilier_prix_historique.selection_params.brush.mode = 'endEvent'
    params_curve_com_immobilier_prix_historique.fields_to_decode = {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "commune"}
    params_curve_com_immobilier_prix_historique.style.chart_width = 750  //a num value or 'inherit', iot fill all available space provided by the parent node
    params_curve_com_immobilier_prix_historique.style.aspectRatio=0.35
    params_curve_com_immobilier_prix_historique.style.marginTop=30


    var instantiateur_lineChart = new curveChart(params_curve_com_immobilier_prix_historique);

    //préparer la var data à injecter dans le chart
    instantiateur_lineChart.createChart(params_curve_com_immobilier_prix_historique, sharedParams_com_immobilier)



  //scatter prix * surface
    params_scatterChart_com_immobilier_prix_surface = new params_scatterChart()
    params_scatterChart_com_immobilier_prix_surface.chart_sub_type = 'scatter'    
    params_scatterChart_com_immobilier_prix_surface.id = "com_immobilier_structure_prix_m2_surface"
    params_scatterChart_com_immobilier_prix_surface.ctx = document.getElementById('com_immobilier_structure_prix_m2_surface')    
    params_scatterChart_com_immobilier_prix_surface.x_field = "surface"
    params_scatterChart_com_immobilier_prix_surface.y_field = "prix_m2_vente"
    //params_scatterChart_com_immobilier_prix_surface.r_field = "prix_bien"
    params_scatterChart_com_immobilier_prix_surface.category_field = 'LIBCOM'
    // params_scatterChart_com_immobilier_prix_surface.transformations = {filter: [{field: "taux_rendement_n7", operation: ">", value: 0}, {field: "taux_rendement_n7", operation: "<", value: 20}, 
    // {field: "dpeL", operation: "include", values: ["0", "A", "B", "C", "D", "E", "F", "G"]}, {field: "surface", operation: "<", value: 300}
    // ]}
    
    params_scatterChart_com_immobilier_prix_surface.shape = {type: 'scatter'} // for area set options: {'area', fill: 'origin'}. you can set the following fill options: '+2' to fill to upper dataset, 
    params_scatterChart_com_immobilier_prix_surface.label_tooltip = [{field_title: "LIBCOM", as: "Commune"}, {field_detail: "surface", as: "Surface"}, {field_detail: "prix_m2_vente", as: "Prix de vente au m²"},
                                          {field_detail: "prix_bien", as: "Prix de vente du bien"}, {field_detail: "dpeL", as: "DPE"}, {field_detail: "etage", as: "Etage"},
                                          , {field_detail: "charges_copro", as: "Charges copro"}, , {field_detail: "chauffage_systeme", as: "Chauffage"}]
    params_scatterChart_com_immobilier_prix_surface.title = "Annonces selon le prix de vente au m² médian, la surface et les quartiers"
    params_scatterChart_com_immobilier_prix_surface.title_x_axis = 'Surface'
    params_scatterChart_com_immobilier_prix_surface.title_y_axis = "Prix vente m²"
    params_scatterChart_com_immobilier_prix_surface.legend_title = ""
    params_scatterChart_com_immobilier_prix_surface.colorsConfig = {scheme: "interpolateRdYlGn", colorsOrder: "reverse"}
    params_scatterChart_com_immobilier_prix_surface.selection_params.brush.mode = 'endEvent'
    params_scatterChart_com_immobilier_prix_surface.style.chart_width = 500
    params_scatterChart_com_immobilier_prix_surface.updateTime = 0
    //params_scatterChart_com_immobilier_prix_surface.sort = {fieldName: 'dpeL', order: 'asc'}
    //params_scatterChart_com_immobilier_prix_surface.brush_htmlNode = "brush1"

    var instantiateur_scatterChart1 = new scatterChart(params_scatterChart_com_immobilier_prix_surface);

    //préparer la var data à injecter dans le chart
    instantiateur_scatterChart1.createChart(params_scatterChart_com_immobilier_prix_surface, sharedParams_com_immobilier)


  //instancier map prix_m2_quartiers
    params_map_com_immobilier_carte_prix_m2_quartiers = new params_map()

    params_map_com_immobilier_carte_prix_m2_quartiers.htmlNode = 'com_immobilier_carte_prix_m2_quartiers';
    params_map_com_immobilier_carte_prix_m2_quartiers.id = "com_immobilier_carte_prix_m2_quartiers"
    params_map_com_immobilier_carte_prix_m2_quartiers.geographic_priority_layers = {0: "CODE_IRIS", 1: "INSEE_COM"}
    params_map_com_immobilier_carte_prix_m2_quartiers.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    //params_map_com_immobilier_carte_prix_m2_quartiers.geographic_articulation_layers = {0: {levelName: "IRIS", field: "CODE_IRIS"}} 

    params_map_com_immobilier_carte_prix_m2_quartiers.params_fields = {hue_params: {hue_field: "prix_m2_vente", agg_type: 'median', hue_color: "interpolateReds", domain: ["p0.05", "p0.98"], domain_scope: "filtred_dataset"}}
    //params_map_com_immobilier_carte_prix_m2_quartiers.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"


    params_map_com_immobilier_carte_prix_m2_quartiers.tooltip_fields = [{field: "LIB_IRIS", slice:[0, 15] ,alias: "Quartier", selection: "first"},
                                            {field: "prix_m2_vente" ,alias: "Prix m²", agg_type: "median", toPrecision: 4},
                                            {field: "nb_pieces" ,alias: "Nb d'annonces", agg_type: "count"},//round: true/false
                                            {field: "TYP_IRIS" ,alias: "Type IRIS", selection: "first"},
                                            {field: "CODE_IRIS", slice:[0, 15] ,alias: "Code Quartier", selection: "first"}]
    params_map_com_immobilier_carte_prix_m2_quartiers.title = "Quartiers selon leur prix de vente au m²"
    //params_map1.bounds_adjustment = {adjustment: true, domain: ["p0.05", "p0.95"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
    //here you can declare a set of transformations that will be applied to this particular chart
    //params_map_com_immobilier_carte_prix_m2_quartiers.transformations = {filter: [{field: "prix_m2_vente", operation: ">", value: 0}]}
    params_map_com_immobilier_carte_prix_m2_quartiers.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_carte_prix_m2_logements", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_carte_tx_rendement_quartiers", filter: false, collect_active_slices: false},
    {chart: "com_immobilier_carte_tx_rendement_logements", filter: false, collect_active_slices: false}]
    params_map_com_immobilier_carte_prix_m2_quartiers.params_legends = {show: true, title: "Prix de vente m²", position: "", shape: "", max_cells: 8, toPrecision: 1, filter_params: {mode: "fade", flyToBounds: true,showTooltips: false}}
    params_map_com_immobilier_carte_prix_m2_quartiers.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_immobilier_carte_prix_m2_quartiers.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true}]
    params_map_com_immobilier_carte_prix_m2_quartiers.droplist_fields = [{title: '', 
    fields: [
      {field: "prix_m2_vente", alias: 'Prix au m² médian', agg_type: 'median', hue_color: "interpolateReds", domain: ["p0.05", "p0.99"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le prix de vente au m² médian des annonces', 
        unit: '€', toPrecision: 0},
      {field: "taux_rendement_n6", alias: 'Tx de rendement médian', hue_color: "interpolateRdYlGn", domain: ["p0.10", "p0.95"], agg_type: 'median', title_chart: 'Quartiers selon le taux de rendement médian des annonces', toPrecision: 2},
      {field: "dpeC", alias: 'DPE médian', hue_color: "interpolateRdYlGn", colorsOrder: "reverse", domain: ["p0.01", "max"], agg_type: 'median', title_chart: 'Quartiers selon le dignostic de performance énergétique médian des annonces'},
      {field: "surface", alias: 'Surface médiane', hue_color: "interpolateReds", domain: ["p0.02", "max"], agg_type: 'median', title_chart: 'Quartiers selon la surface médiane des annonces', unit: "m²"},
    ]},    
    ]

    params_map_com_immobilier_carte_prix_m2_quartiers.load_on = undefined
    var instantiateur_choroplethe_map = new Map_choroplethe(params_map_com_immobilier_carte_prix_m2_quartiers);

    //evo
    instantiateur_choroplethe_map.createChart(params_map_com_immobilier_carte_prix_m2_quartiers, sharedParams_com_immobilier) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams





  //instancier map prix_m2 logements
    params_map_com_immobilier_carte_prix_m2_logements = new params_map()
    //params_map_com_immobilier_carte_prix_m2_logements.category_field = "INSEE_COM" //used to sync with other charts sharing same cat field, especially in rm crossfilter process
    params_map_com_immobilier_carte_prix_m2_logements.htmlNode = 'com_immobilier_carte_prix_m2_logements'
    params_map_com_immobilier_carte_prix_m2_logements.id = "com_immobilier_carte_prix_m2_logements"
    params_map_com_immobilier_carte_prix_m2_logements.title = "Logements selon leur prix de vente au m² median"
    params_map_com_immobilier_carte_prix_m2_logements.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_immobilier_carte_prix_m2_logements.params_fields = {lat: "mapCoordonneesLatitude", lng: "mapCoordonneesLongitude", hue_params: {hue_field: "prix_m2_vente", hue_color: "interpolateReds", 
                                domain: ["auto", "p0.98"], domain_scope: "filtred_dataset"}}
    //params_map_com_immobilier_carte_prix_m2_logements.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"                                
    params_map_com_immobilier_carte_prix_m2_logements.tooltip_fields = [{field: "LIBCOM", slice:[0, 20] ,alias: "Commune"}, 
                                                                {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"}, 
                                                                {field: "prix_bien", alias: "Prix du bien", unit: "€"},
                                                                {field: "prix_m2_vente", alias: "Prix vente au m²", unit: "€"}, 
                                                                {field: "nb_pieces", alias: "Nb de pièces"},
                                                                {field: "surface", alias: "Surface", unit: "m²"}, 
                                                                {field: "dpeL", alias: "DPE"}, 
                                                                {field: "taux_rendement_n6" ,alias: "Taux de rendement", unit: "%", toPrecision: 2},                                                              
                                                                {field: 'date', alias: 'Date de publication'}
                                                              ]
    //params_map_com_immobilier_carte_prix_m2_logements.title.text = "title of the chart"
    params_map_com_immobilier_carte_prix_m2_logements.bounds_adjustment = {adjustment: false, domain: ["p0.05", "p0.95"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
    //here you can declare a set of transformations that will be applied to this particular chart
    //params_map_com_immobilier_carte_prix_m2_logements.transformations = {filter: [{field: "taux_rendement_n7", operation: ">", value: 0}]}
    params_map_com_immobilier_carte_prix_m2_logements.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_carte_prix_m2_quartiers", filter: false, collect_active_slices: false},
    {chart: "com_immobilier_carte_tx_rendement_quartiers", filter: false, collect_active_slices: false},
    {chart: "com_immobilier_carte_tx_rendement_logements", filter: false, collect_active_slices: false}]
    params_map_com_immobilier_carte_prix_m2_logements.params_legends = {show: true, position: "", shape: "", max_cells: 8, title: "Prix vente m² median"}
    params_map_com_immobilier_carte_prix_m2_logements.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_immobilier_carte_prix_m2_logements.droplist_fields = [{title: '', 
      fields: [
        {field: "prix_m2_vente", alias: 'Prix au m²', agg_type: 'median', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Annonces selon le prix de vente au m²', 
          unit: '€', toPrecision: 0},
        {field: "taux_rendement_n6", alias: 'Taux de rendement du bien', hue_color: "interpolateRdYlGn", domain: ["p0.05", "p0.99"], agg_type: 'median', title_chart: 'Annonces selon leur taux de rendement'},
      ]},    
    ]
    params_map_com_immobilier_carte_prix_m2_logements.label_fields = [{field: 'prix_m2_vente', agg_type: 'count', title: "", unit: 'Annonces'},
                                                                      {field: 'prix_m2_vente', agg_type: 'median', title: "Prix vente médian", unit: '€/m²'}
    ]


    var instantiateur_map1 = new Map_circles(params_map_com_immobilier_carte_prix_m2_logements);

    //evo
    instantiateur_map1.createChart(params_map_com_immobilier_carte_prix_m2_logements, sharedParams_com_immobilier) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams




  
        
    
  sharedParams_com_immobilier.setup_crossfilter(sharedParams_com_immobilier)
  
  //list the graphics wanted for synchronisation (to replicate the state of a source chart on the target chart, ex: propagate the selected slice)
  params_barChart_com_immobilier_prix_m2.graphics_to_synchronise = [{id: 'com_aprecu_prix_m2', delay_time: undefined, on_display: "apercu_communes"},
  {id: 'com_immobilier_structure_logements_nb_logements', join_fields: {INSEE_COM: 'COM'}, delay_time: undefined, on_display: "com_immobilier_structure_logements1"}]

  //list the graphics wanted to be filtred (useful for filtering a target chart in a different domain, hosted by a different sharedParams object)
  params_barChart_com_immobilier_prix_m2.graphics_to_filter = [{id: "com_immobilier_carte_struct_logements", delay_time: undefined, on_display: undefined, join_fields: {INSEE_COM: 'COM'}}]
    
}



function setup_graphics_com_immobilier_logement(communes_selected, operational_dataset, polygons,user_input) {

  //-----------------------------------------
  //--------------------------------------------
  //--------------------------------------------
  sharedParams_com_immobilier_logements = new sharedParams()
  sharedParams_com_immobilier_logements.transformations = {filter: [{field: "COM", operation: "include", values: communes_selected}, 
  ]}
  
  
  //sharedParams_com_immobilier.transformations = {geoRadius_filter:  list_geoRadius_filter}
  
  sharedParams_com_immobilier_logements.language = "fr"
  sharedParams_com_immobilier_logements.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons, 
                                                            join_fields: {'COM': 'INSEE_COM', 'IRIS': 'CODE_IRIS'}})

  //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
  sharedParams_array.push(sharedParams_com_immobilier_logements)
  sharedParams_com_immobilier_logements['sharedParams_array'] = sharedParams_array
  sharedParams_com_immobilier_logements.aliases = [{field: 'IRIS', target_field: 'LIB_IRIS', alias: 'Quartier'}]
  
  //aliases to show instead of the original fields names
  //sharedParams_com_immobilier_logements.aliases = [{field: "prix_m2_vente", alias: "Prix m²"}, {field: "nb_pieces", alias: "Nb de pièces"}]

  //data transformations
  //build lib iris
  join_v2(sharedParams_com_immobilier_logements.data_main, ref_insee, 'IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])



  /*-----------------------------------------------------structure logements 1------------------------------*/
  //instancier nb logements
    params_barChart_com_immobilier_nb_logements = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_nb_logements.ctx = document.getElementById('com_immobilier_structure_logements_nb_logements')
    params_barChart_com_immobilier_nb_logements.id = 'com_immobilier_structure_logements_nb_logements'
    params_barChart_com_immobilier_nb_logements.category_field = "COM"
    params_barChart_com_immobilier_nb_logements.hierarchy_levels = {0: "COM", 1: "LIBIRIS"}
    params_barChart_com_immobilier_nb_logements.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers"}
    params_barChart_com_immobilier_nb_logements.numerical_field_params = {fieldName: 'P17_LOG', agg_type: 'sum', alias: 'Nb de logements'}
    params_barChart_com_immobilier_nb_logements.sort = {fieldName: 'P17_LOG', order: 'desc'}
    params_barChart_com_immobilier_nb_logements.label_tooltip = "Nb de logements"
    params_barChart_com_immobilier_nb_logements.title = "Nombre de logements par commune"
    params_barChart_com_immobilier_nb_logements.title_x_axis = 'Communes'
    params_barChart_com_immobilier_nb_logements.title_y_axis = "Nombre"  
    params_barChart_com_immobilier_nb_logements.fields_to_decode = [{lookupTable: ref_insee, mainKey: "COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "Commune"}]
    // params_barChart_com_immobilier_nb_logements.crossfilter = [{chart: "com_immobilier_structure_prix_m2_type_bien", filter: true, collect_active_slices: true, level_collect_active_slices: 1}] 
    // params_barChart_com_immobilier_nb_logements.crossfilter_reset_charts = ["com_immobilier_structure_prix_m2_nb_pieces", "com_immobilier_structure_prix_m2_type_bien",
    //                                         "com_immobilier_structure_prix_m2_ancien_neuf", "com_immobilier_carte_prix_m2_quartiers", "com_immobilier_carte_prix_m2_logements",
    //                                       "com_immobilier_carte_tx_rendement_logements", "com_immobilier_carte_tx_rendement_quartiers"]
    //level_collect_active_slices enable the collect of the 1st data level (0, ie category field) or 2nd data level (1, ie sub category field)
    params_barChart_com_immobilier_nb_logements.brush_mode = true
    params_barChart_com_immobilier_nb_logements.style.chart_width = 380

    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_nb_logements);

    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_nb_logements, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams


  //instancier répartition maisons/apparts
    //prepare the dataset
    var columns_to_transpose = [{field: 'P17_MAISON', alias: 'Maisons'}, {field: 'P17_APPART', alias: 'Appartements'}]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'typedebien', agg_column_name: 'sum_typedebien', columns_to_preserve: columns_to_preserve, 
      columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_pieChart_com_immobilier_logements_maisons_apparts = new param_customSpec_PieChartsJS()
    params_pieChart_com_immobilier_logements_maisons_apparts.type = "pie"
    params_pieChart_com_immobilier_logements_maisons_apparts.ctx = document.getElementById('com_immobilier_structure_logements_repartition_maisons_appart')
    params_pieChart_com_immobilier_logements_maisons_apparts.id = "com_immobilier_structure_logements_repartition_maisons_appart"
    params_pieChart_com_immobilier_logements_maisons_apparts.category_field = "typedebien"
    params_pieChart_com_immobilier_logements_maisons_apparts.numerical_field_params = {fieldName: 'sum_typedebien', agg_type: 'sum', alias: 'Nb de logements'}
    params_pieChart_com_immobilier_logements_maisons_apparts.label_tooltip = "Nb de logements"
    params_pieChart_com_immobilier_logements_maisons_apparts.title = ["Nombre de maisons et d'appartements", "jusqu'en 2017 (INSEE)"]
    params_pieChart_com_immobilier_logements_maisons_apparts.transformations = {dataset: dataset_transposed}
    //params_pieChart_com_immobilier_logements_maisons_apparts.fields_to_decode = {lookupTable: encoded_fields, mainKey: "typedebien", lookupKey: "typedebien", fields: ['lib_typedebien'], alias: 'Type bien'}
    params_pieChart_com_immobilier_logements_maisons_apparts.style.chart_width = 200
    params_pieChart_com_immobilier_logements_maisons_apparts.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}
    params_pieChart_com_immobilier_logements_maisons_apparts.datalabels = true
    params_pieChart_com_immobilier_logements_maisons_apparts.crossfilter = [{chart: "com_immobilier_structure_logements_repartition_annee_emmenagement", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_nb_pieces", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_surface", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_type_residence", filter: false, collect_active_slices: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_type_occupation", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_type_chauffage", filter: false},
                                                                            {chart: "com_immobilier_carte_struct_logements", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_equip_parking_voitures", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_equip_parking", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_equip_1_voiture", filter: false},
                                                                            {chart: "com_immobilier_structure_logements_repartition_equip_2_voitures_ou_plus", filter: false},
                                                                          ] 
    //params_pieChart_com_immobilier_logements_maisons_apparts.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    
    //préparer la var data à injecter dans le chart
    var instantiateur_pieChart1 = new PieChart(params_pieChart_com_immobilier_logements_maisons_apparts);
    instantiateur_pieChart1.createChart(params_pieChart_com_immobilier_logements_maisons_apparts, sharedParams_com_immobilier_logements)
   

  //instancier repart date construction
    //prepare the dataset
    var columns_to_transpose = [{parent_field: 'Maisons', field: 'P17_RPMAISON_ACH19', alias: '- 1919'}, {parent_field: 'Maisons', field: 'P17_RPMAISON_ACH45', alias: '1919 à 1945'},
    {parent_field: 'Maisons', field: 'P17_RPMAISON_ACH70', alias: '1946 à 1970'},{parent_field: 'Maisons', field: 'P17_RPMAISON_ACH90', alias: '1971 à 1990'},
    {parent_field: 'Maisons', field: 'P17_RPMAISON_ACH05', alias: '1991 à 2005'}, {parent_field: 'Maisons', field: 'P17_RPMAISON_ACH14', alias: '2006 à 2014'},
    {parent_field: 'Appartements', field: 'P17_RPAPPART_ACH19', alias: '- 1919'}, {parent_field: 'Appartements', field: 'P17_RPAPPART_ACH45', alias: '1919 à 1945'},
    {parent_field: 'Appartements', field: 'P17_RPAPPART_ACH70', alias: '1946 à 1970'},{parent_field: 'Appartements', field: 'P17_RPAPPART_ACH90', alias: '1971 à 1990'},
    {parent_field: 'Appartements', field: 'P17_RPAPPART_ACH05', alias: '1991 à 2005'}, {parent_field: 'Appartements', field: 'P17_RPAPPART_ACH14', alias: '2006 à 2014'}
    ]
    
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, parent_column_name: 'typedebien', trans_column_name: 'annee_construction', agg_column_name: 'sum_annee_construction', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)
    


    params_barChart_com_immobilier_logements_annee_construction = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_annee_construction.ctx = document.getElementById('com_immobilier_structure_logements_repartition_annee_construction')
    params_barChart_com_immobilier_logements_annee_construction.id = 'com_immobilier_structure_logements_repartition_annee_construction'
    params_barChart_com_immobilier_logements_annee_construction.category_field = "annee_construction"        
    params_barChart_com_immobilier_logements_annee_construction.numerical_field_params = {fieldName: 'sum_annee_construction', agg_type: 'sum', alias: 'Nb de logements'}
    params_barChart_com_immobilier_logements_annee_construction.sort = {fieldName: 'annee_construction', order: 'asc'}
    params_barChart_com_immobilier_logements_annee_construction.label_tooltip = "Nb de logements"
    params_barChart_com_immobilier_logements_annee_construction.title = "Nombre de logements selon l'année de construction"
    params_barChart_com_immobilier_logements_annee_construction.title_x_axis = 'Année de construction'
    params_barChart_com_immobilier_logements_annee_construction.title_y_axis = "Nombre de logements"  
    //params_barChart_com_immobilier_logements_annee_construction.fields_to_decode = [{lookupTable: ref_insee, mainKey: "COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "Commune"}]
    // params_barChart_com_immobilier_logements_annee_construction.crossfilter = [{chart: "com_immobilier_structure_prix_m2_type_bien", filter: true, collect_active_slices: true, level_collect_active_slices: 1}] 
    // params_barChart_com_immobilier_logements_annee_construction.crossfilter_reset_charts = ["com_immobilier_structure_prix_m2_annee_construction", "com_immobilier_structure_prix_m2_type_bien",
    //                                         "com_immobilier_structure_prix_m2_ancien_neuf", "com_immobilier_carte_prix_m2_quartiers", "com_immobilier_carte_prix_m2_logements",
    //                                       "com_immobilier_carte_tx_rendement_logements", "com_immobilier_carte_tx_rendement_quartiers"]
    //level_collect_active_slices enable the collect of the 1st data level (0, ie category field) or 2nd data level (1, ie sub category field)
    //params_barChart_com_immobilier_logements_annee_construction.crossfilter = false
    params_barChart_com_immobilier_logements_annee_construction.style.chart_width = 380
    params_barChart_com_immobilier_logements_annee_construction.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}
    params_barChart_com_immobilier_logements_annee_construction.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_annee_construction.datalabels = false
    params_barChart_com_immobilier_logements_annee_construction.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_immobilier_logements_annee_construction.brush_mode = false

    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_annee_construction);
    
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_annee_construction, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams


  //instancier ancienneté emménagement des ménages
    //prepare the dataset    
    var columns_to_transpose = [{field: 'P17_MEN_ANEM0002', alias: 'Moins de 2 ans'}, {field: 'P17_MEN_ANEM0204', alias: '2 à 4 ans'}, {field: 'P17_MEN_ANEM0509', alias: '5 à 9 ans'}, 
        {field: 'P17_MEN_ANEM10P', alias: '10 ans et plus'}]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'nb_annees_emmenagement', agg_column_name: 'sum_nb_annees_emmenagement', columns_to_preserve: columns_to_preserve, 
      columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_barChart_com_immobilier_logements_annees_emmenagement = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_annees_emmenagement.ctx = document.getElementById('com_immobilier_structure_logements_repartition_annee_emmenagement')
    params_barChart_com_immobilier_logements_annees_emmenagement.id = 'com_immobilier_structure_logements_repartition_annee_emmenagement'
    params_barChart_com_immobilier_logements_annees_emmenagement.category_field = "nb_annees_emmenagement"
    params_barChart_com_immobilier_logements_annees_emmenagement.numerical_field_params = {fieldName: 'sum_nb_annees_emmenagement', agg_type: 'sum', alias: "Nb ménages"}
    //params_barChart_com_immobilier_logements_annees_emmenagement.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_immobilier_logements_annees_emmenagement.label_tooltip = "Nb ménages"
    params_barChart_com_immobilier_logements_annees_emmenagement.title = ["Nombre de ménages selon l'ancienneté d'emménagement", "(INSEE - 2017)"]
    params_barChart_com_immobilier_logements_annees_emmenagement.title_x_axis = 'Nombre de ménages'
    params_barChart_com_immobilier_logements_annees_emmenagement.title_y_axis = "Ancienneté d'emménagement"
    params_barChart_com_immobilier_logements_annees_emmenagement.sort = {fieldName: 'nb_annees_emmenagement', order: 'asc', custom_sort: [
      {key: 1,field: 'Moins de 2 ans'}, {key: 2,field: '2 à 4 ans'},{key: 3, field: '5 à 9 ans'},{key: 4, field: '10 ans et plus'},
    ]}
    params_barChart_com_immobilier_logements_annees_emmenagement.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_annees_emmenagement.brush_mode = false
    params_barChart_com_immobilier_logements_annees_emmenagement.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_immobilier_logements_annees_emmenagement.type = "bar"
    params_barChart_com_immobilier_logements_annees_emmenagement.horizontalBar = true
    params_barChart_com_immobilier_logements_annees_emmenagement.datalabels = false
    params_barChart_com_immobilier_logements_annees_emmenagement.style.chart_width = 380
    params_barChart_com_immobilier_logements_annees_emmenagement.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_annees_emmenagement);
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_annees_emmenagement, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  /*-----------------------------------------------------structure logements 2------------------------------*/
  //instancier repart nb pièces
    //prepare the dataset
    var columns_to_transpose = [{field: 'P17_RP_1P', alias: '1 pièce'}, {field: 'P17_RP_2P', alias: '2 pièces'},{field: 'P17_RP_3P', alias: '3 pièces'},{field: 'P17_RP_4P', alias: '4 pièces'},
    {field: 'P17_RP_5PP', alias: '5 pièces ou +'},]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'nb_pieces', agg_column_name: 'sum_nb_pieces', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)
    

    params_barChart_com_immobilier_logements_nb_pieces = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_nb_pieces.ctx = document.getElementById('com_immobilier_structure_logements_repartition_nb_pieces')
    params_barChart_com_immobilier_logements_nb_pieces.id = 'com_immobilier_structure_logements_repartition_nb_pieces'
    params_barChart_com_immobilier_logements_nb_pieces.category_field = "nb_pieces"        
    params_barChart_com_immobilier_logements_nb_pieces.numerical_field_params = {fieldName: 'sum_nb_pieces', agg_type: 'sum', alias: 'Nb de logements'}
    //params_barChart_com_immobilier_logements_nb_pieces.sort = {fieldName: 'P17_LOG', order: 'desc'}
    params_barChart_com_immobilier_logements_nb_pieces.label_tooltip = "Nb de logements"
    params_barChart_com_immobilier_logements_nb_pieces.title = "Logements selon le nombre de pièces par commune (INSEE - 2017)"
    params_barChart_com_immobilier_logements_nb_pieces.title_x_axis = 'Communes'
    params_barChart_com_immobilier_logements_nb_pieces.title_y_axis = "Nombre"  
    //params_barChart_com_immobilier_logements_nb_pieces.fields_to_decode = [{lookupTable: ref_insee, mainKey: "COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "Commune"}]
    // params_barChart_com_immobilier_logements_nb_pieces.crossfilter = [{chart: "com_immobilier_structure_prix_m2_type_bien", filter: true, collect_active_slices: true, level_collect_active_slices: 1}] 
    // params_barChart_com_immobilier_logements_nb_pieces.crossfilter_reset_charts = ["com_immobilier_structure_prix_m2_nb_pieces", "com_immobilier_structure_prix_m2_type_bien",
    //                                         "com_immobilier_structure_prix_m2_ancien_neuf", "com_immobilier_carte_prix_m2_quartiers", "com_immobilier_carte_prix_m2_logements",
    //                                       "com_immobilier_carte_tx_rendement_logements", "com_immobilier_carte_tx_rendement_quartiers"]
    //level_collect_active_slices enable the collect of the 1st data level (0, ie category field) or 2nd data level (1, ie sub category field)
    //params_barChart_com_immobilier_logements_nb_pieces.crossfilter = false
    params_barChart_com_immobilier_logements_nb_pieces.style.chart_width = 400
    params_barChart_com_immobilier_logements_nb_pieces.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}
    params_barChart_com_immobilier_logements_nb_pieces.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_nb_pieces.datalabels = false
    params_barChart_com_immobilier_logements_nb_pieces.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_immobilier_logements_nb_pieces.brush_mode = false
    
    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_nb_pieces);
    
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_nb_pieces, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
  

  //instancier repart surface
    //prepare the dataset
    var columns_to_transpose = [{field: 'P17_RP_M30M2', alias: '30 m² ou -'}, {field: 'P17_RP_3040M2', alias: '30 - 39 m²'},{field: 'P17_RP_4060M2', alias: '40 - 59 m²'},{field: 'P17_RP_6080M2', alias: '60 - 79 m²'},
    {field: 'P17_RP_80100M2', alias: '80 - 99 m²'}, {field: 'P17_RP_100120M2', alias: '100 - 119 m²'}, {field: 'P17_RP_120M2P', alias: '120 m² ou +'}]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'surface', agg_column_name: 'sum_surface', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)
    

    params_barChart_com_immobilier_logements_surface = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_surface.ctx = document.getElementById('com_immobilier_structure_logements_repartition_surface')
    params_barChart_com_immobilier_logements_surface.id = 'com_immobilier_structure_logements_repartition_surface'
    params_barChart_com_immobilier_logements_surface.category_field = "surface"        
    params_barChart_com_immobilier_logements_surface.numerical_field_params = {fieldName: 'sum_surface', agg_type: 'sum', alias: 'Nb de logements'}
    params_barChart_com_immobilier_logements_surface.sort = {fieldName: 'surface', order: 'asc', custom_sort: [
      {key: 1,field: '30 m² ou -'}, {key: 2,field: '30 - 39 m²'},{key: 3, field: '40 - 59 m²'},{key: 4, field: '60 - 79 m²'},
      {key: 5, field: '80 - 99 m²'}, {key: 6, field: '100 - 119 m²'}, {key: 7, field: '120 m² ou +'}]}
    params_barChart_com_immobilier_logements_surface.label_tooltip = "Nb de logements"
    params_barChart_com_immobilier_logements_surface.title = "Nombre de logements selon la surface"
    params_barChart_com_immobilier_logements_surface.title_x_axis = 'Classes de surface'
    params_barChart_com_immobilier_logements_surface.title_y_axis = "Nombre de logements"  
    //params_barChart_com_immobilier_logements_surface.fields_to_decode = [{lookupTable: ref_insee, mainKey: "COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: "Commune"}]
    // params_barChart_com_immobilier_logements_surface.crossfilter = [{chart: "com_immobilier_structure_prix_m2_type_bien", filter: true, collect_active_slices: true, level_collect_active_slices: 1}] 
    // params_barChart_com_immobilier_logements_surface.crossfilter_reset_charts = ["com_immobilier_structure_prix_m2_surface", "com_immobilier_structure_prix_m2_type_bien",
    //                                         "com_immobilier_structure_prix_m2_ancien_neuf", "com_immobilier_carte_prix_m2_quartiers", "com_immobilier_carte_prix_m2_logements",
    //                                       "com_immobilier_carte_tx_rendement_logements", "com_immobilier_carte_tx_rendement_quartiers"]
    //level_collect_active_slices enable the collect of the 1st data level (0, ie category field) or 2nd data level (1, ie sub category field)
    //params_barChart_com_immobilier_logements_surface.crossfilter = false
    params_barChart_com_immobilier_logements_surface.style.chart_width = 385
    params_barChart_com_immobilier_logements_surface.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}
    params_barChart_com_immobilier_logements_surface.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_surface.datalabels = false
    params_barChart_com_immobilier_logements_surface.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_immobilier_logements_surface.brush_mode = false

    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_surface);
    
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_surface, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams


  //instancier répartition type de résidence
    //prepare the dataset
    var columns_to_transpose = [{field: 'P17_RP', alias: 'Résid. princip.'}, {field: 'P17_RSECOCC', alias: 'Résid. second.'}, {field:'P17_LOGVAC', alias: 'Log. vacants'}]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'typederesidence', agg_column_name: 'sum_typederesidence', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_pieChart_com_immobilier_logements_type_residence = new param_customSpec_PieChartsJS()
    params_pieChart_com_immobilier_logements_type_residence.type = "pie"
    params_pieChart_com_immobilier_logements_type_residence.ctx = document.getElementById('com_immobilier_structure_logements_repartition_type_residence')
    params_pieChart_com_immobilier_logements_type_residence.id = "com_immobilier_structure_logements_repartition_type_residence"
    params_pieChart_com_immobilier_logements_type_residence.category_field = "typederesidence"
    params_pieChart_com_immobilier_logements_type_residence.numerical_field_params = {fieldName: 'sum_typederesidence', agg_type: 'sum', alias: 'Nb de logements'}
    params_pieChart_com_immobilier_logements_type_residence.label_tooltip = "Nb de logements"
    params_pieChart_com_immobilier_logements_type_residence.title = ["Répartition des types de résidence", "jusqu'en 2017 (INSEE)"]
    params_pieChart_com_immobilier_logements_type_residence.transformations = {dataset: dataset_transposed}
    params_pieChart_com_immobilier_logements_type_residence.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    //params_pieChart_com_immobilier_logements_type_residence.fields_to_decode = {lookupTable: encoded_fields, mainKey: "typedebien", lookupKey: "typedebien", fields: ['lib_typedebien'], alias: 'Type bien'}
    params_pieChart_com_immobilier_logements_type_residence.style.chart_width = 250
    params_pieChart_com_immobilier_logements_type_residence.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}
    params_pieChart_com_immobilier_logements_type_residence.datalabels = false
    
    
    //préparer la var data à injecter dans le chart
    var instantiateur_pieChart1 = new PieChart(params_pieChart_com_immobilier_logements_type_residence);
    instantiateur_pieChart1.createChart(params_pieChart_com_immobilier_logements_type_residence, sharedParams_com_immobilier_logements)
  

  //instancier répartition type d'occupation
    //prepare the dataset
    var columns_to_transpose = [{field: 'P17_RP_PROP', alias: 'Propriétaires'}, {field: 'P17_RP_LOC', alias: 'Locataires'}, {field: 'P17_RP_LOCHLMV', alias: 'Locataires HLM'}, 
        {field: 'P17_RP_GRAT', alias: 'Logés gratuitement'}]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'type_occupation', agg_column_name: 'sum_type_occupation', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_barChart_com_immobilier_logements_type_occupation = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_type_occupation.ctx = document.getElementById('com_immobilier_structure_logements_repartition_type_occupation')
    params_barChart_com_immobilier_logements_type_occupation.id = 'com_immobilier_structure_logements_repartition_type_occupation'
    params_barChart_com_immobilier_logements_type_occupation.category_field = "type_occupation"
    params_barChart_com_immobilier_logements_type_occupation.numerical_field_params = {fieldName: 'sum_type_occupation', agg_type: 'sum', alias: "Nb logements"}
    //params_barChart_com_immobilier_logements_type_occupation.sort = {fieldName: 'CODGEO', order: 'asc'}
    params_barChart_com_immobilier_logements_type_occupation.label_tooltip = "Nb logements"
    params_barChart_com_immobilier_logements_type_occupation.title = ["Nombre de logement selon le type d'occupation", "(INSEE - 2017)"]
    params_barChart_com_immobilier_logements_type_occupation.title_x_axis = 'Nombre de logements'
    params_barChart_com_immobilier_logements_type_occupation.title_y_axis = "Type d'occupation"
    //params_barChart_com_immobilier_logements_type_occupation.transformations = {filter: [{field: "type_occupation", operation: "exclude", values: ['l']}]
    params_barChart_com_immobilier_logements_type_occupation.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_type_occupation.sort = {fieldName: 'type_chauffage', order: 'asc', custom_sort: [
      {key: 1,field: 'Propriétaires'}, {key: 2,field: 'Locataires'},{key: 3, field: 'Locataires HLM'},{key: 4, field: 'Logés gratuitement'},
    ]}
    params_barChart_com_immobilier_logements_type_occupation.brush_mode = false
    params_barChart_com_immobilier_logements_type_occupation.interactions_chart_options = {hoverOptions: false, selectionOptions: false}
    params_barChart_com_immobilier_logements_type_occupation.type = "bar"
    params_barChart_com_immobilier_logements_type_occupation.horizontalBar = true
    params_barChart_com_immobilier_logements_type_occupation.datalabels = false
    params_barChart_com_immobilier_logements_type_occupation.style.chart_width = 350
    params_barChart_com_immobilier_logements_type_occupation.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_type_occupation);
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_type_occupation, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams





  /*-----------------------------------------------------structure logements 3------------------------------*/
  //instancier répart type chauffage
    //prepare the dataset    
    var columns_to_transpose = [{field: 'P17_RP_CCCOLL', alias: 'Chauff. central collectif'}, {field: 'P17_RP_CCIND', alias: 'Chauff. central individuel'}, 
    {field: 'P17_RP_CINDELEC', alias: 'Chauff. individuel électrique'},]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'type_chauffage', agg_column_name: 'sum_type_chauffage', columns_to_preserve: columns_to_preserve, 
      columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_barChart_com_immobilier_logements_type_chauffage = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_type_chauffage.ctx = document.getElementById('com_immobilier_structure_logements_repartition_type_chauffage')
    params_barChart_com_immobilier_logements_type_chauffage.id = 'com_immobilier_structure_logements_repartition_type_chauffage'
    params_barChart_com_immobilier_logements_type_chauffage.category_field = "type_chauffage"
    params_barChart_com_immobilier_logements_type_chauffage.numerical_field_params = {fieldName: 'sum_type_chauffage', agg_type: 'sum', alias: "Nb logements"}    
    params_barChart_com_immobilier_logements_type_chauffage.label_tooltip = "Nb logements"
    params_barChart_com_immobilier_logements_type_chauffage.title = ["Nombre de logements selon le type d'occupation", "(INSEE - 2017)"]
    params_barChart_com_immobilier_logements_type_chauffage.title_x_axis = "Nombre de logements"
    params_barChart_com_immobilier_logements_type_chauffage.title_y_axis = "Type de chauffage"
    // params_barChart_com_immobilier_logements_type_chauffage.sort = {fieldName: 'type_chauffage', order: 'asc', custom_sort: [
    //   {key: 1,field: 'Propriétaires'}, {key: 2,field: 'Locataires'},{key: 3, field: 'Locataires HLM'},{key: 4, field: 'Logés gratuitement'},
    // ]}
    params_barChart_com_immobilier_logements_type_chauffage.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_type_chauffage.brush_mode = false
    params_barChart_com_immobilier_logements_type_chauffage.interactions_chart_options = {hoverOptions: false, selectionOptions: false}    
    params_barChart_com_immobilier_logements_type_chauffage.datalabels = false
    params_barChart_com_immobilier_logements_type_chauffage.type = "bar"
    params_barChart_com_immobilier_logements_type_chauffage.horizontalBar = true
    params_barChart_com_immobilier_logements_type_chauffage.style.chart_width = 350
    params_barChart_com_immobilier_logements_type_chauffage.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_type_chauffage);
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_type_chauffage, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams






  //instancier equip voitures & parking
    //prepare the dataset    
    var columns_to_transpose = [{field: 'P17_MEN', alias: 'Total ménages'}, {field: 'P17_RP_GARL', alias: 'Un parking ou +'}, {field: 'P17_RP_VOIT1', alias: 'Une voiture'}, 
    {field: 'P17_RP_VOIT2P', alias: 'Deux voitures ou +'},]
    var columns_to_preserve = ['COM', 'IRIS']
    var _args = {data: logements_iris, trans_column_name: 'equip_voiture', agg_column_name: 'sum_equip_voiture', columns_to_preserve: columns_to_preserve, 
      columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)

    params_barChart_com_immobilier_logements_equip_voitures = new param_customSpec_BarChartsJS()
    params_barChart_com_immobilier_logements_equip_voitures.ctx = document.getElementById('com_immobilier_structure_logements_repartition_equip_parking_voitures')
    params_barChart_com_immobilier_logements_equip_voitures.id = 'com_immobilier_structure_logements_repartition_equip_parking_voitures'
    params_barChart_com_immobilier_logements_equip_voitures.category_field = "equip_voiture"
    params_barChart_com_immobilier_logements_equip_voitures.numerical_field_params = {fieldName: 'sum_equip_voiture', agg_type: 'sum', alias: "Nb ménages"}    
    params_barChart_com_immobilier_logements_equip_voitures.label_tooltip = "Nb ménages"
    params_barChart_com_immobilier_logements_equip_voitures.title = ["Equipement des ménages en voitures", "et places de parking (INSEE - 2017)"]
    params_barChart_com_immobilier_logements_equip_voitures.title_x_axis = "Equipement"
    params_barChart_com_immobilier_logements_equip_voitures.title_y_axis = "Nb de ménages"
    params_barChart_com_immobilier_logements_equip_voitures.sort = {fieldName: 'equip_voiture', order: 'asc', custom_sort: [
      {key: 1,field: 'Total ménages'}, {key: 2,field: 'Un parking ou +'},{key: 3, field: 'Une voiture'},{key: 4, field: 'Deux voitures ou +'},
    ]}
    params_barChart_com_immobilier_logements_equip_voitures.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_logements_equip_voitures.brush_mode = false
    params_barChart_com_immobilier_logements_equip_voitures.interactions_chart_options = {hoverOptions: false, selectionOptions: false}    
    params_barChart_com_immobilier_logements_equip_voitures.datalabels = false
    params_barChart_com_immobilier_logements_equip_voitures.type = "bar"
    params_barChart_com_immobilier_logements_equip_voitures.horizontalBar = true
    params_barChart_com_immobilier_logements_equip_voitures.style.chart_width = 350
    params_barChart_com_immobilier_logements_equip_voitures.build_on = {params_chart_id: 'com_immobilier_structure_logements_nb_logements', messageWait: "Sélectionnez une commune sur le graphique guide", event: "click"}


    var instantiateur_barChart = new simple_BarChart(params_barChart_com_immobilier_logements_equip_voitures);
    //evo
    instantiateur_barChart.createChart(params_barChart_com_immobilier_logements_equip_voitures, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  //label nb parking / ménage
    params_label_com_immobilier_logements_equip_parking = new params_label()
    params_label_com_immobilier_logements_equip_parking.htmlNode = 'com_immobilier_structure_logements_repartition_equip_parking'
    params_label_com_immobilier_logements_equip_parking.title = ["Nb ménages ayant 1", "parking ou +"]
    params_label_com_immobilier_logements_equip_parking.unit = 'Ménages'
    params_label_com_immobilier_logements_equip_parking.category_field = 'equip_voiture'
    params_label_com_immobilier_logements_equip_parking.numerical_field_params = {fieldName: 'sum_equip_voiture', agg_type: 'sum', alias: undefined}//use 'selection' instead of 'agg_type' for categorical values
    //params_label_com_immobilier_logements_equip_parking.data_params = {join_field_source: "IRIS", dataset_target: data_stats_insee_com, join_field_target: "IRIS", value_field_target: "Un parking ou +", selection: "sum"}
    params_label_com_immobilier_logements_equip_parking.id = 'label_nb_menages_parking'
    params_label_com_immobilier_logements_equip_parking.transformations = {dataset: dataset_transposed, filter: [{field: 'equip_voiture', operation: 'include', values: ['Un parking ou +']}]}


    var instantiateur_label1 = new Label(params_label_com_immobilier_logements_equip_parking)
    instantiateur_label1.createLabel(params_label_com_immobilier_logements_equip_parking, sharedParams_com_immobilier_logements)


  //label nb ménages ayant 1 voiture
    params_label_com_immobilier_logements_equip_1voiture = new params_label()
    params_label_com_immobilier_logements_equip_1voiture.htmlNode = 'com_immobilier_structure_logements_repartition_equip_1_voiture'
    params_label_com_immobilier_logements_equip_1voiture.title = ["Nb ménages ayant", "1 voiture"]
    params_label_com_immobilier_logements_equip_1voiture.unit = 'Ménages'
    params_label_com_immobilier_logements_equip_1voiture.category_field = 'equip_voiture'
    params_label_com_immobilier_logements_equip_1voiture.numerical_field_params = {fieldName: 'sum_equip_voiture', agg_type: 'sum', alias: undefined}//use 'selection' instead of 'agg_type' for categorical values
    //params_label_com_immobilier_logements_equip_1voiture.data_params = {join_field_source: "IRIS", dataset_target: data_stats_insee_com, join_field_target: "IRIS", value_field_target: "Un parking ou +", selection: "sum"}
    params_label_com_immobilier_logements_equip_1voiture.id = 'label_nb_menages_1voiture'
    params_label_com_immobilier_logements_equip_1voiture.transformations = {dataset: dataset_transposed, filter: [{field: 'equip_voiture', operation: 'include', values: ['Une voiture']}]}


    var instantiateur_label1 = new Label(params_label_com_immobilier_logements_equip_1voiture)
    instantiateur_label1.createLabel(params_label_com_immobilier_logements_equip_1voiture, sharedParams_com_immobilier_logements)
    



  //label nb parking / ménage
    params_label_com_immobilier_logements_equip_2voitures_ou_plus = new params_label()
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.htmlNode = 'com_immobilier_structure_logements_repartition_equip_2_voitures_ou_plus'
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.title = ["Nb ménages ayant", "2 voitures ou +"]
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.unit = 'Ménages'
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.category_field = 'equip_voiture'
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.numerical_field_params = {fieldName: 'sum_equip_voiture', agg_type: 'sum', alias: undefined}//use 'selection' instead of 'agg_type' for categorical values
    //params_label_com_immobilier_logements_equip_2voitures_ou_plus.data_params = {join_field_source: "IRIS", dataset_target: data_stats_insee_com, join_field_target: "IRIS", value_field_target: "Un parking ou +", selection: "sum"}
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.id = 'label_nb_menages_2voitures'
    params_label_com_immobilier_logements_equip_2voitures_ou_plus.transformations = {dataset: dataset_transposed, filter: [{field: 'equip_voiture', operation: 'include', values: ['Deux voitures ou +']}]}


    var instantiateur_label1 = new Label(params_label_com_immobilier_logements_equip_2voitures_ou_plus)
    instantiateur_label1.createLabel(params_label_com_immobilier_logements_equip_2voitures_ou_plus, sharedParams_com_immobilier_logements)





  //label tx suroccupation
    params_label_com_immobilier_logements_suroccupation = new params_label()
    params_label_com_immobilier_logements_suroccupation.htmlNode = 'com_immobilier_structure_logements_suroccupation'
    params_label_com_immobilier_logements_suroccupation.title = ["Taux de sur-occupation", "des logements"]
    params_label_com_immobilier_logements_suroccupation.unit = '%'
    //params_label_com_immobilier_logements_suroccupation.category_field = 'equip_voiture'
    //params_label_com_immobilier_logements_suroccupation.numerical_field_params = {fieldName: 'sum_equip_voiture', agg_type: 'sum', alias: undefined}//use 'selection' instead of 'agg_type' for categorical values
    //params_label_com_immobilier_logements_suroccupation.data_params = {join_field_source: "IRIS", dataset_target: data_stats_insee_com, join_field_target: "IRIS", value_field_target: "Un parking ou +", selection: "sum"}
    params_label_com_immobilier_logements_suroccupation.id = 'label_tx_surroccupation_logements'
    params_label_com_immobilier_logements_suroccupation.transformations = {
        custom_function: `return +((d3.sum(dataset, r=> r.C17_RP_HSTU1P_SUROCC)/d3.sum(dataset, r=> r.C17_RP_HSTU1P))*100).toFixed(2)`}


    var instantiateur_label1 = new Label(params_label_com_immobilier_logements_suroccupation)
    instantiateur_label1.createLabel(params_label_com_immobilier_logements_suroccupation, sharedParams_com_immobilier_logements)




  
  
  /*-----------------------------------------------------divers------------------------------*/
  //scatter prix m² * tx hlm
    params_scatterChart_com_immobilier_logements_prix_txHlm = new params_scatterChart()
    params_scatterChart_com_immobilier_logements_prix_txHlm.chart_sub_type = 'bubble'
    params_scatterChart_com_immobilier_logements_prix_txHlm.radius_params = {max_radius: 30, min_radius:0, scale_method: 'scaleSqrt'}//scale_method= scaleSqrt || scaleLinear
    params_scatterChart_com_immobilier_logements_prix_txHlm.id = "com_immobilier_structure_logements_scatter_prix_m2_tx_hlm"
    params_scatterChart_com_immobilier_logements_prix_txHlm.ctx = document.getElementById('com_immobilier_structure_logements_scatter_prix_m2_tx_hlm')    
    params_scatterChart_com_immobilier_logements_prix_txHlm.x_field = "median_prix_m2_vente"
    params_scatterChart_com_immobilier_logements_prix_txHlm.y_field = "tx_logements_hlm"
    params_scatterChart_com_immobilier_logements_prix_txHlm.r_field = "P17_MEN"
    params_scatterChart_com_immobilier_logements_prix_txHlm.category_field = 'LIBCOM'
    // params_scatterChart_com_immobilier_logements_prix_txHlm.transformations = {filter: [{field: "taux_rendement_n7", operation: ">", value: 0}, {field: "taux_rendement_n7", operation: "<", value: 20}, 
    // {field: "dpeL", operation: "include", values: ["0", "A", "B", "C", "D", "E", "F", "G"]}, {field: "surface", operation: "<", value: 300}
    // ]}
    
    params_scatterChart_com_immobilier_logements_prix_txHlm.shape = {type: 'scatter'} // for area set options: {'area', fill: 'origin'}. you can set the following fill options: '+2' to fill to upper dataset, 
    params_scatterChart_com_immobilier_logements_prix_txHlm.label_tooltip = [{field_title: "LIBCOM", as: "Commune"}, {field_detail: "LIB_IRIS", as: "Quartier"}, {field_detail: "median_prix_m2_vente", as: "Prix de vente au m²"},                                        
                                          , {field_detail: "tx_logements_hlm", as: "Tx HLM"}, {field_detail: "P17_MEN", as: "Nb ménages"}]
    params_scatterChart_com_immobilier_logements_prix_txHlm.title = "Quartiers selon le prix de vente au m² médian, le taux de logements HLM et le nombre de ménages"
    params_scatterChart_com_immobilier_logements_prix_txHlm.title_x_axis = 'Prix vente m²'
    params_scatterChart_com_immobilier_logements_prix_txHlm.title_y_axis = "Tx HLM"
    params_scatterChart_com_immobilier_logements_prix_txHlm.legend_size = {display: true, title: 'Nb de ménages', thresholds_max: 6, thresholds_min: 4, y_margin: 20}
    params_scatterChart_com_immobilier_logements_prix_txHlm.colorsConfig = {scheme: "interpolateInferno", colorsOrder: "reverse"}
    params_scatterChart_com_immobilier_logements_prix_txHlm.selection_params.brush.mode = 'highlight'
    params_scatterChart_com_immobilier_logements_prix_txHlm.highlight_charts = [{chart: 'com_immobilier_structure_logements_scatter_prix_m2_tx_suroccup', highlight: true},
      {chart: 'com_immobilier_carte_struct_logements', highlight: true}
    ]
    params_scatterChart_com_immobilier_logements_prix_txHlm.style.chart_width = 600
    //params_scatterChart_com_immobilier_logements_prix_txHlm.sort = {fieldName: 'dpeL', order: 'asc'}
    //params_scatterChart_com_immobilier_logements_prix_txHlm.brush_htmlNode = "brush1"

    var instantiateur_scatterChart1 = new scatterChart(params_scatterChart_com_immobilier_logements_prix_txHlm);

    //préparer la var data à injecter dans le chart
    instantiateur_scatterChart1.createChart(params_scatterChart_com_immobilier_logements_prix_txHlm, sharedParams_com_immobilier_logements)




  //scatter prix m² * tx logements sur occupés
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation = new params_scatterChart()
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.chart_sub_type = 'bubble'
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.radius_params = {max_radius: 30, min_radius:0, scale_method: 'scaleSqrt'}//scale_method= scaleSqrt || scaleLinear
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.id = "com_immobilier_structure_logements_scatter_prix_m2_tx_suroccup"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.ctx = document.getElementById('com_immobilier_structure_logements_scatter_prix_m2_tx_suroccup')    
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.x_field = "median_prix_m2_vente"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.y_field = "tx_log_suroccupes"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.r_field = "P17_MEN"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.category_field = 'LIBCOM'
    // params_scatterChart_com_immobilier_logements_prix_txSuroccupation.transformations = {filter: [{field: "taux_rendement_n7", operation: ">", value: 0}, {field: "taux_rendement_n7", operation: "<", value: 20}, 
    // {field: "dpeL", operation: "include", values: ["0", "A", "B", "C", "D", "E", "F", "G"]}, {field: "surface", operation: "<", value: 300}
    // ]}
    
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.shape = {type: 'scatter'} // for area set options: {'area', fill: 'origin'}. you can set the following fill options: '+2' to fill to upper dataset, 
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.label_tooltip = [{field_title: "LIBCOM", as: "Commune"},{field_detail: "LIB_IRIS", as: "Quartier"}, {field_detail: "median_prix_m2_vente", as: "Prix de vente au m²"},                                        
                                          ,{field_detail: "tx_log_suroccupes", as: "Tx logements sur-occupés"}, {field_detail: "tx_logements_hlm", as: "Tx HLM"}, {field_detail: "P17_MEN", as: "Nb ménages"}]
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.title = "Quartiers selon le prix de vente au m² médian, le taux de logements en sur-occupation et le nombre de ménages"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.title_x_axis = 'Prix vente m²'
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.title_y_axis = "Tx logements sur-occupés"
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.legend_size = {display: true, title: 'Nb de ménages', thresholds: 5}
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.colorsConfig = {scheme: "interpolateInferno", colorsOrder: "reverse"}
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.selection_params.brush.mode = 'endEvent'
    params_scatterChart_com_immobilier_logements_prix_txSuroccupation.style.chart_width = 600
    //params_scatterChart_com_immobilier_logements_prix_txSuroccupation.sort = {fieldName: 'dpeL', order: 'asc'}
    //params_scatterChart_com_immobilier_logements_prix_txSuroccupation.brush_htmlNode = "brush1"

    var instantiateur_scatterChart1 = new scatterChart(params_scatterChart_com_immobilier_logements_prix_txSuroccupation);

    //préparer la var data à injecter dans le chart
    instantiateur_scatterChart1.createChart(params_scatterChart_com_immobilier_logements_prix_txSuroccupation, sharedParams_com_immobilier_logements)




  //instancier map struc des logements
    params_map_com_immobilier_carte_struct_logements = new params_map()

    params_map_com_immobilier_carte_struct_logements.htmlNode = 'com_immobilier_carte_struct_logements';
    params_map_com_immobilier_carte_struct_logements.id = "com_immobilier_carte_struct_logements"
    params_map_com_immobilier_carte_struct_logements.geographic_priority_layers = {0: "IRIS", 1: "COM"}
    params_map_com_immobilier_carte_struct_logements.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    //params_map_com_immobilier_carte_struct_logements.geographic_articulation_layers = {0: {levelName: "IRIS", field: "CODE_IRIS"}} 

    params_map_com_immobilier_carte_struct_logements.params_fields = {hue_params: {hue_field: "tx_logements_hlm", agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset"}}
    //params_map_com_immobilier_carte_struct_logements.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"


    params_map_com_immobilier_carte_struct_logements.tooltip_fields = [{field: "LIBCOM", slice:[0, 18] ,alias: "Commune", selection: "first"},
                                              {field: "LIB_IRIS", slice:[0, 20] ,alias: "Quartier", selection: "first"},
                                              {field: "tx_logements_hlm" ,alias: "Part de logements en HLM", agg_type: "sum", toPrecision: 4, unit: '%'},
                                              {field: "P17_RP_LOCHLMV" ,alias: "Nb de logements en HLM", agg_type: "sum", toPrecision: 4},//round: true/false
                                              {field: "P17_LOG" ,alias: "Nd total de logements", agg_type: "sum"},
                                              {field: "TYP_IRIS" ,alias: "Type IRIS", selection: "first"},
                                              {field: "IRIS", slice:[0, 15] ,alias: "Code Quartier", selection: "first"},
                                              {field: "median_prix_m2_vente", toPrecision: 2, alias: "Prix de vente median au m²", selection: "median"}]
    params_map_com_immobilier_carte_struct_logements.title = "Quartiers selon la part de logements HLM"
    params_map_com_immobilier_carte_struct_logements.highlight_field = ['median_prix_m2_vente']

    //here you can declare a set of transformations that will be applied to this particular chart
    params_map_com_immobilier_carte_struct_logements.transformations = {filter: [{field: "P17_LOG", operation: ">", value: 0}]}
    params_map_com_immobilier_carte_struct_logements.crossfilter = [
      {chart: "com_immobilier_structure_logements_nb_logements", filter: false, collect_active_slices: true},
      {chart: "com_immobilier_structure_logements_repartition_maisons_appart", filter: true, collect_active_slices: false},
      
    ]

    params_map_com_immobilier_carte_struct_logements.legends_crossfilter = false
    // legends_crossfilter = [
      //   {chart: "com_immobilier_structure_logements_nb_logements", filter: false, collect_active_slices: false},
      //   {chart: "com_immobilier_structure_logements_repartition_annee_construction", filter: false, collect_active_slices: false},
      //   {chart: "com_immobilier_structure_logements_repartition_annee_emmenagement", filter: false, collect_active_slices: false},
      //   {chart: "com_immobilier_structure_logements_repartition_maisons_appart", filter: false, collect_active_slices: false},
    // ]    
    params_map_com_immobilier_carte_struct_logements.params_legends = {show: true, title: "Part HLM", position: "", shape: "", max_cells: 8, toPrecision: 1, filter_params: {mode: "fade", flyToBounds: false,showTooltips: false}}
    params_map_com_immobilier_carte_struct_logements.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_immobilier_carte_struct_logements.droplist_fields = [{title: "HLM & tx d'occupation", 
      fields: [
        {field: "tx_logements_hlm", alias: 'Tx HLM', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon la part de logements HLM', 
          unit: '%', toPrecision: 2},
        {field: "P17_RP_LOCHLMV", alias: 'Nb logements HLM', agg_type: 'sum', title_chart: 'Quartiers selon la nombre de logements HLM'},
        {field: "tx_log_suroccupes", alias: 'Tx sur-occupation log', agg_type: 'sum', title_chart: 'Taux de sur-occupation des logements (hors studios)', unit: '%'}
      ]},
      {title: "Type de logement", 
      fields: [
        {field: "P17_MAISON", alias: 'Nb de maisons', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de maisons', 
          unit: 'Maisons', toPrecision: 2},
        {field: "P17_APPART", alias: "Nb d'appartements", agg_type: 'sum', title_chart: "Quartiers selon la nombre d'appartements"},    
      ]},
      {title: "Type de résidence", 
      fields: [
        {field: "P17_RP", alias: 'Résid. principales', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de résidences principales', 
          unit: 'logements', toPrecision: 2},
        {field: "P17_RSECOCC", alias: "Résid. secondaires", agg_type: 'sum', title_chart: "Quartiers selon la nombre de résidences secondaires", unit: 'logements'},
        {field: "P17_LOGVAC", alias: 'Logements vacants', agg_type: 'sum', title_chart: "Quartiers selon la nombre de logements vacants", unit: 'logements'},
      ]},
      {title: "Type d'occupation", 
      fields: [
        {field: "P17_RP_PROP", alias: 'Propriétaires', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de logements occupés par des propriétaires', 
          unit: 'logements'},
          {field: "P17_RP_LOC", alias: 'Locataires', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de logements occupés par des locataires', 
          unit: 'logements'},
          {field: "P17_RP_LOCHLMV", alias: 'Locataires HLM', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de logements occupés par des locataires HLM', 
          unit: 'logements'},
          {field: "P17_RP_GRAT", alias: 'Logés gratuitement', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de logements occupés gratuitement', 
          unit: 'logements'},          
      ]},      
      {title: "Ancienneté d'emménagement", 
      fields: [
        {field: "P17_MEN_ANEM0002", alias: '< 2 ans', agg_type: 'sum', hue_color: "interpolateReds", domain: ["auto", "auto"], domain_scope: "filtred_dataset", title_chart: 'Quartiers selon le nombre de ménages ayant emménagés depuis < 2 ans', 
          unit: 'ménages'},
        {field: "P17_MEN_ANEM0204", alias: "2 - 4 ans", agg_type: 'sum', title_chart: "Quartiers selon la nombre de résidences secondaires", title_chart: 'Quartiers selon le nombre de ménages ayant emménagés entre 2 et 4 ans', 
        unit: 'ménages'},
        {field: "P17_MEN_ANEM0509", alias: '5 - 9 ans', agg_type: 'sum', title_chart: 'Quartiers selon le nombre de ménages ayant emménagés entre 5 et 9 ans', unit: 'ménages'},
        {field: "P17_MEN_ANEM10P", alias: '10 ans et +', agg_type: 'sum', title_chart: 'Quartiers selon le nombre de ménages ayant emménagés depuis 10 ans et +', unit: 'ménages'},
      ]},            
      {title: "Type de chauffage", 
      fields: [
        {field: "P17_RP_CCCOLL", alias: 'Chauff. central collectif', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de logements équipés en chauffage central collectif', unit: 'logements'},
        {field: "P17_RP_CCIND", alias: 'Chauff. central individuel', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de logements équipés en chauffage central individuel', unit: 'logements'},
        {field: "P17_RP_CINDELEC", alias: 'Chauff. individuel électrique', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de logements équipés en chauffage individuel électrique', unit: 'logements'},
      ]},            
      {title: "Equip. parking & auto", 
      fields: [
        {field: "P17_RP_GARL", alias: 'Un parking ou +', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de ménages ayant un parking ou +', unit: 'ménages'},
        {field: "P17_RP_VOIT1", alias: 'Une voiture', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de ménages ayant une voiture', unit: 'ménages'},
        {field: "P17_RP_VOIT2P", alias: 'Deux voitures ou +', agg_type: 'sum', hue_color: "interpolateReds", title_chart: 'Quartiers selon le nombre de ménages ayant deux voitures ou +', unit: 'ménages'},        	
      ]},            

      {title: 'Nb de pièces', 
      fields: [
        {field: "P17_RP_1P", alias: 'Nb logements 1p', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements 1 pièce',
          unit: 'logements'},
        {field: "P17_RP_2P", alias: 'Nb logements 2p', agg_type: 'sum', title_chart: 'Quartiers selon nb de de logements 2 pièces',unit: 'logements'},
        {field: "P17_RP_3P", alias: 'Nb logements 3p', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements 3 pièces',unit: 'logements'},
        {field: "P17_RP_4P", alias: 'Nb logements 4p', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements 4 pièces',unit: 'logements'},
        {field: "P17_RP_5PP", alias: 'Nb logements 5p et +', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements 5 pièces et plus',unit: 'logements'}
      ]},
      {title: 'Surface', 
      fields: [
        {field: "P17_RP_M30M2", alias: 'Nb Logements <30m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de moins de 30m²',unit: 'logements'},
        {field: "P17_RP_3040M2", alias: 'Nb logements de 30-39m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 30 à 39m²',unit: 'logements'},
        {field: "P17_RP_4060M2", alias: 'Nb logements de 40-59m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 40 à 59m²',unit: 'logements'},
        {field: "P17_RP_6080M2", alias: 'Nb logements de 60-79m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 60 à 79m²',unit: 'logements'},
        {field: "P17_RP_80100M2", alias: 'Nb logements de 80-99m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 80 à 99m²',unit: 'logements'},
        {field: "P17_RP_100120M2", alias: 'Nb logements de 100-119m²', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 100 à 119m²',unit: 'logements'},
        {field: "P17_RP_120M2P", alias: 'Nb logements de 120m² et +', agg_type: 'sum', title_chart: 'Quartiers selon le nb de logements de 120m² et +',unit: 'logements'}        	
      ]}
    ]
    //params_map_com_immobilier_carte_struct_logements.crossfilter = [{chart: "com_immobilier_structure_prix_m2_global", filter: false, collect_active_slices: true}]
    //params_map_com_immobilier_carte_struct_logements.transformations = {dataset: logements_iris}

    params_map_com_immobilier_carte_struct_logements.load_on = undefined
    var instantiateur_choroplethe_map = new Map_choroplethe(params_map_com_immobilier_carte_struct_logements);

    //evo
    instantiateur_choroplethe_map.createChart(params_map_com_immobilier_carte_struct_logements, sharedParams_com_immobilier_logements) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  sharedParams_com_immobilier_logements.setup_crossfilter(sharedParams_com_immobilier_logements)

  //list the graphics wanted for synchronisation
  params_barChart_com_immobilier_nb_logements.graphics_to_synchronise = [{id: 'com_immobilier_structure_prix_m2_global', delay_time: undefined, on_display: "com_immobilier_structure_prix1", join_fields: {COM: 'INSEE_COM'}}]
  params_barChart_com_immobilier_nb_logements.graphics_to_filter = [{id: "com_immobilier_carte_prix_m2_quartiers", delay_time: undefined, on_display: undefined, join_fields: {INSEE_COM: 'COM'}},
    {id: "com_immobilier_carte_prix_m2_logements", delay_time: undefined, on_display: undefined, join_fields: {INSEE_COM: 'COM'}},
    //{id: "com_immobilier_carte_prix_m2_logements", delay_time: undefined, on_display: undefined, join_fields: {INSEE_COM: 'COM'}}  
  ]
    
      
  }



function setup_graphics_com_immobilier_sitadel(communes_selected, operational_dataset, polygons,user_input) {

  //-----------------------------------------
  //--------------------------------------------
  //--------------------------------------------
  sharedParams_com_immobilier_sitadel = new sharedParams()
  sharedParams_com_immobilier_sitadel.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: communes_selected},], 
    latLng_fields: {lat:"lat", lng: "lng" }
  }
  
  join_v2(operational_dataset, ref_insee, 'CODE_IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])
  // join_v2(sharedParams_com_immobilier_sitadel.data_main, logements_iris, 'CODE_IRIS', 'IRIS', ['P17_LOG'])
  join_v2(operational_dataset, encoded_fields, 'CAT_MOA', 'CAT_MOA', ['lib_CAT_MOA'])
  join_v2(operational_dataset, encoded_fields, 'TYPE_EVT', 'TYPE_EVT', ['lib_TYPE_EVT'])
  join_v2(operational_dataset, encoded_fields, 'NATURE_PROJET', 'NATURE_PROJET', ['lib_NATURE_PROJET'])
  join_v2(operational_dataset, encoded_fields, 'TYPE_OPERATION_CONSTR', 'TYPE_OPERATION_CONSTR', ['lib_TYPE_OPERATION_CONSTR'])
  
  //sharedParams_com_immobilier.transformations = {geoRadius_filter:  list_geoRadius_filter}
  
  sharedParams_com_immobilier_sitadel.language = "fr"
  sharedParams_com_immobilier_sitadel.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons,})

  //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
  sharedParams_array.push(sharedParams_com_immobilier_sitadel)
  sharedParams_com_immobilier_sitadel['sharedParams_array'] = sharedParams_array
  sharedParams_com_immobilier_sitadel.aliases = [{field: 'IRIS', target_field: 'LIB_IRIS', alias: 'Quartier'}]
  
  //aliases to show instead of the original fields names
  //sharedParams_com_immobilier_logements.aliases = [{field: "prix_m2_vente", alias: "Prix m²"}, {field: "nb_pieces", alias: "Nb de pièces"}]

  //data transformations
  //build lib iris
  


  //--------------------------------------------------- Nouveaux logements 1----------------------------->

  //create the local dataset
  let local_dataset = groupBy_aggregate(sharedParams_com_immobilier_sitadel.data_main.filter(r=> r.ANNEE_DEPOT > 2016), 'INSEE_COM', [{field: 'NB_LGT_TOT_CREES', operation: 'sum'}])
  let logements_com = groupBy_aggregate(logements_iris, 'COM', [{field: 'P17_LOG', operation: 'sum'}])
  join_v2(local_dataset, logements_com, 'INSEE_COM', 'COM', ['sum_P17_LOG'])

  //transpose dataset
    var columns_to_transpose = [{field: 'sum_NB_LGT_TOT_CREES', alias: 'Nb logements à construire'}, {field: 'sum_P17_LOG', alias: 'Nb logements existants'}]
    var columns_to_preserve = ['INSEE_COM']
    var _args = {data: local_dataset, trans_column_name: 'type_logements', agg_column_name: 'nb_logements', columns_to_preserve: columns_to_preserve, 
      columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)


  //nb logements existants vs nb nouveaux logements

    params_barChart_com_immobilier_sitadel_nb_permis = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_sitadel_nb_permis.id = "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux"
    params_barChart_com_immobilier_sitadel_nb_permis.ctx = document.getElementById('com_immobilier_sitadel_nb_log_anciens_vs_nouveaux')
    params_barChart_com_immobilier_sitadel_nb_permis.category_field = "INSEE_COM"
    params_barChart_com_immobilier_sitadel_nb_permis.sub_category_field = "type_logements"
    params_barChart_com_immobilier_sitadel_nb_permis.numerical_field_params = {fieldName: 'nb_logements', agg_type: 'sum'}
    params_barChart_com_immobilier_sitadel_nb_permis.label_tooltip = "Nb de logements"
    params_barChart_com_immobilier_sitadel_nb_permis.title = "Nb logements existants vs logements à construire (depuis l'an 2017)"
    params_barChart_com_immobilier_sitadel_nb_permis.title_x_axis = 'Communes'
    params_barChart_com_immobilier_sitadel_nb_permis.title_y_axis = "Nb de logements"
    params_barChart_com_immobilier_sitadel_nb_permis.legend_title = "Type de logement"
    //params_barChart_com_immobilier_sitadel_nb_permis.colorsConfig = {scheme: "interpolateRainbow", colorsOrder: "randomize"}
    params_barChart_com_immobilier_sitadel_nb_permis.decode = true    
    params_barChart_com_immobilier_sitadel_nb_permis.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: false},
      {chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: false},]
    params_barChart_com_immobilier_sitadel_nb_permis.transformations = {dataset: dataset_transposed} 
    params_barChart_com_immobilier_sitadel_nb_permis.fields_to_decode = {category_field: {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", target_field: 'LIBCOM', alias: "Commune"}}
    params_barChart_com_immobilier_sitadel_nb_permis.style.chart_width = 400
    params_barChart_com_immobilier_sitadel_nb_permis.legend.reverse = true    
    params_barChart_com_immobilier_sitadel_nb_permis.datalabels = true
    var instantiateur_groupedBar1 = new grouped_barChart(params_barChart_com_immobilier_sitadel_nb_permis);

    //préparer la var data à injecter dans le chart
    instantiateur_groupedBar1.createChart(params_barChart_com_immobilier_sitadel_nb_permis, sharedParams_com_immobilier_sitadel)

  


  //nb nouveaux logements
    params_pieChart_com_sitadel_nb_log_a_construire = new param_customSpec_PieChartsJS()
    params_pieChart_com_sitadel_nb_log_a_construire.type = "pie"
    params_pieChart_com_sitadel_nb_log_a_construire.ctx = document.getElementById('com_immobilier_sitadel_nb_log_nouveaux')
    params_pieChart_com_sitadel_nb_log_a_construire.id = "com_immobilier_sitadel_nb_log_nouveaux"
    params_pieChart_com_sitadel_nb_log_a_construire.category_field = "INSEE_COM"
    params_pieChart_com_sitadel_nb_log_a_construire.numerical_field_params = {fieldName: 'NB_LGT_TOT_CREES', agg_type: 'sum'}
    params_pieChart_com_sitadel_nb_log_a_construire.label_tooltip = "Nb de logements"
    params_pieChart_com_sitadel_nb_log_a_construire.title = ["Nombre de logements à construire (depuis l'an 2017)"]
    params_pieChart_com_sitadel_nb_log_a_construire.fields_to_decode = {lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: 'Commune'}
    params_pieChart_com_sitadel_nb_log_a_construire.transformations = {dataset: sharedParams_com_immobilier_sitadel.data_main, filter: [{field: 'ANNEE_DEPOT', operation: ">", value: 2016}]}
    params_pieChart_com_sitadel_nb_log_a_construire.crossfilter = [{chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: false},]
    params_pieChart_com_sitadel_nb_log_a_construire.style.chart_width = 280
    //params_pieChart_com_sitadel_nb_log_a_construire.build_on = {params_chart_id: 'com_aprecu_prix_m2', messageWait: "Sélectionnez une commune sur le graphique xxx", event: "click"}
    //   params_pieChart_com_sitadel_nb_log_a_construire.crossfilter = [{chart: "com_aprecu_prix_m2", filter: false, collect_active_slices: true},
    //                                                                       {chart: "com_aprecu_prix_m2_type_logement", filter: false, collect_active_slices: false}]
    params_pieChart_com_sitadel_nb_log_a_construire.datalabels = true;
    //params_pieChart_com_sitadel_nb_log_a_construire.crossfilter = [{chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: false},]
    


    //préparer la var data à injecter dans le chart
    var instantiateur_pieChart1 = new PieChart(params_pieChart_com_sitadel_nb_log_a_construire);
    instantiateur_pieChart1.createChart(params_pieChart_com_sitadel_nb_log_a_construire, sharedParams_com_immobilier_sitadel)
    


  //part logements neufs / logs anciens
    //create local dataset
    local_dataset.forEach(r=> {
      r.part_nouveaux_logements = +(((r.sum_NB_LGT_TOT_CREES/r.sum_P17_LOG)*100).toPrecision(2))//+" %"
    })

    //instancier nouveau graph 1
    params_barChart_com_immobilier_sitadel_part_log_nouveaux = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_sitadel_part_log_nouveaux.ctx = document.getElementById('com_immobilier_sitadel_part_log_nouveaux')
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.id = 'com_immobilier_sitadel_part_log_nouveaux'
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.category_field = "INSEE_COM"
    //params_barChart_com_immobilier_sitadel_part_log_nouveaux.category_field_slice = [0, 18]
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.hierarchy_levels = {0: "INSEE_COM", 1: "CODE_IRIS"}
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers"}
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.numerical_field_params = {fieldName: 'part_nouveaux_logements', agg_type: 'sum', alias: 'Part des logements à construire'}
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.sort = {fieldName: 'part_nouveaux_logements', order: 'desc'}
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.label_tooltip = "Part des nouveaux logements à construire"
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.title = ["Part des nouveaux logements à construire par rapport ", "aux logements existants (depuis l'an 2017)"]
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.title_x_axis = 'Communes'
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.title_y_axis = "Part des logements à construire"  
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: 'Commune'},]
                                                                                //{lookupTable: ref_insee, mainKey: "CODE_IRIS", lookupKey: "CODE_IRIS", fields: ['LIB_IRIS'], alias: 'Quartier'}]
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.transformations = {dataset: local_dataset}
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},]
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.brush_mode = true
    params_barChart_com_immobilier_sitadel_part_log_nouveaux.style.chart_width = 400

    var instantiateur_barChart1 = new simple_BarChart(params_barChart_com_immobilier_sitadel_part_log_nouveaux);

    //evo
    instantiateur_barChart1.createChart(params_barChart_com_immobilier_sitadel_part_log_nouveaux, sharedParams_com_immobilier_sitadel) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
    


  //nb new log selon le nb de pièces
    var columns_to_transpose = [{field: 'NB_LGT_1P', alias: 'Nb logements 1 pièce'}, {field: 'NB_LGT_2P', alias: 'Nb logements 2 pièces'}, {field: 'NB_LGT_3P', alias: 'Nb logements 3 pièces'},
                                {field: 'NB_LGT_4P', alias: 'Nb logements 4 pièces'}, {field: 'NB_LGT_5P', alias: 'Nb logements 5 pièces'}, {field: 'NB_LGT_6P', alias: 'Nb logements 6 pièces'}
                            ]
    var columns_to_preserve = ['lat','lng','INSEE_COM','IRIS','CODE_IRIS']
    var _args = {data: sharedParams_com_immobilier_sitadel.data_main.filter(r=> r.ANNEE_DEPOT > 2016), trans_column_name: 'nb_pieces_logements', agg_column_name: 'nb_logements', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    var dataset_transposed=transpose_table(_args)



    //instancier nouveau graph 1
    params_barChart_com_immobilier_sitadel_nb_pieces = new param_customSpec_BarChartsJS()

    params_barChart_com_immobilier_sitadel_nb_pieces.ctx = document.getElementById('com_immobilier_sitadel_nb_pieces')
    params_barChart_com_immobilier_sitadel_nb_pieces.id = 'com_immobilier_sitadel_nb_pieces'
    params_barChart_com_immobilier_sitadel_nb_pieces.category_field = "nb_pieces_logements"
    params_barChart_com_immobilier_sitadel_nb_pieces.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers"}
    params_barChart_com_immobilier_sitadel_nb_pieces.numerical_field_params = {fieldName: 'nb_logements', agg_type: 'sum', alias: 'Nb de logements'}
    params_barChart_com_immobilier_sitadel_nb_pieces.sort = {fieldName: 'nb_logements', order: 'desc'}
    params_barChart_com_immobilier_sitadel_nb_pieces.label_tooltip = "Part des nouveaux logements à construire"
    params_barChart_com_immobilier_sitadel_nb_pieces.title = ["Nb des nouveaux logements à construire selon ", "le nb de pièces (depuis l'an 2017)"]
    params_barChart_com_immobilier_sitadel_nb_pieces.title_x_axis = 'Communes'
    params_barChart_com_immobilier_sitadel_nb_pieces.title_y_axis = "Nb de logements à construire"  
    params_barChart_com_immobilier_sitadel_nb_pieces.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: 'Commune'},]
                                                                                //{lookupTable: ref_insee, mainKey: "CODE_IRIS", lookupKey: "CODE_IRIS", fields: ['LIB_IRIS'], alias: 'Quartier'}]
    params_barChart_com_immobilier_sitadel_nb_pieces.transformations = {dataset: dataset_transposed}
    params_barChart_com_immobilier_sitadel_nb_pieces.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: true},
    {chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: true, level_collect_active_slices: 1},]
    // params_barChart_com_immobilier_sitadel_nb_pieces.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: true},
    // {chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},]
    params_barChart_com_immobilier_sitadel_nb_pieces.brush_mode = false
    params_barChart_com_immobilier_sitadel_nb_pieces.interactions_chart_options = {hoverOptions: false, selectionOptions: false}    
    params_barChart_com_immobilier_sitadel_nb_pieces.style.chart_width = 400

    var instantiateur_barChart1 = new simple_BarChart(params_barChart_com_immobilier_sitadel_nb_pieces);

    //evo
    instantiateur_barChart1.createChart(params_barChart_com_immobilier_sitadel_nb_pieces, sharedParams_com_immobilier_sitadel) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams




  //nb new log selon cat MOA
   params_barChart_com_immobilier_sitadel_cat_moa = new param_customSpec_BarChartsJS()

   params_barChart_com_immobilier_sitadel_cat_moa.ctx = document.getElementById('com_immobilier_sitadel_cat_moa')
   params_barChart_com_immobilier_sitadel_cat_moa.id = 'com_immobilier_sitadel_cat_moa'
   params_barChart_com_immobilier_sitadel_cat_moa.category_field = "lib_CAT_MOA"   
   params_barChart_com_immobilier_sitadel_cat_moa.numerical_field_params = {fieldName: 'NB_LGT_TOT_CREES', agg_type: 'sum', alias: 'Nb de logements'}
   params_barChart_com_immobilier_sitadel_cat_moa.sort = {fieldName: 'NB_LGT_TOT_CREES', order: 'desc'}
   params_barChart_com_immobilier_sitadel_cat_moa.label_tooltip = "Nb MOA"
   params_barChart_com_immobilier_sitadel_cat_moa.title = ["Répartition des logements à construire selon ", "la type de MOA (depuis l'an 2017)"]
   params_barChart_com_immobilier_sitadel_cat_moa.title_x_axis = "Type de maîtrise d'ouvrage"
   params_barChart_com_immobilier_sitadel_cat_moa.title_y_axis = "Nb de logements à construire"  
   //params_barChart_com_immobilier_sitadel_cat_moa.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM'], alias: 'Commune'},]
																			   //{lookupTable: ref_insee, mainKey: "CODE_IRIS", lookupKey: "CODE_IRIS", fields: ['LIB_IRIS'], alias: 'Quartier'}]
   //params_barChart_com_immobilier_sitadel_cat_moa.transformations = {dataset: dataset_transposed}
       params_barChart_com_immobilier_sitadel_cat_moa.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},
       {chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: true},
       {chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: true, level_collect_active_slices: 1},
       {chart: "com_immobilier_sitadel_nb_pieces", filter: false, collect_active_slices: true},
      ]

   params_barChart_com_immobilier_sitadel_cat_moa.brush_mode = true
   params_barChart_com_immobilier_sitadel_cat_moa.style.chart_width = 400

   var instantiateur_barChart1 = new simple_BarChart(params_barChart_com_immobilier_sitadel_cat_moa);

   //evo
   instantiateur_barChart1.createChart(params_barChart_com_immobilier_sitadel_cat_moa, sharedParams_com_immobilier_sitadel) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  //instancier map nouveaux logements
    params_map_com_immobilier_carte_nouveaux_logements = new params_map()
    //params_map_com_immobilier_carte_nouveaux_logements.category_field = "INSEE_COM" //used to sync with other charts sharing same cat field, especially in rm crossfilter process
    params_map_com_immobilier_carte_nouveaux_logements.htmlNode = 'com_immobilier_map_nouveaux_logements_sitadel'
    params_map_com_immobilier_carte_nouveaux_logements.id = "com_immobilier_map_nouveaux_logements_sitadel"
    params_map_com_immobilier_carte_nouveaux_logements.title = "Les nouveaux logements issus des dépôts de permis de construire"
    params_map_com_immobilier_carte_nouveaux_logements.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_immobilier_carte_nouveaux_logements.params_fields = {lat: "lat", lng: "lng", color_params: {color_field: "lib_CAT_MOA", selection: 'first'}, 
                                size_params: {size_field: "NB_LGT_TOT_CREES", min_radius: 5, max_radius: 75, color: "red", 
                                domain: ["auto", "p0.99"], scale_method: 'scaleSqrt', resize_on_zoom: true, animation: true, animation_speed: 0.5, ease_function: 'easeInOutBack'}}//scale_method= scaleSqrt || scaleLinear, animation_speed in meters
    //params_map_com_immobilier_carte_nouveaux_logements.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"                                
    params_map_com_immobilier_carte_nouveaux_logements.tooltip_fields = [{field: "LIBCOM", slice:[0, 20] ,alias: "Commune"}, 
                                                                {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"}, 
                                                                {field: "NB_LGT_TOT_CREES", alias: "Nb total de logements crées"},
                                                                {field: "NB_LGT_IND_CREES", alias: "Nb de logements individuels crées"}, 
                                                                {field: "NB_LGT_COL_CREES", alias: "Nb de logements collectifs crées"}, 
                                                                {field: "SUPERFICIE_T", alias: "Surface totale", unit: "m²"}, 
                                                                {field: "NB_NIV_MAX", alias: "Nb d'étages max"},
                                                                {field: "date_collecte", alias: "Date de diffusion du permis de construire"},
                                                                {field: "lib_CAT_MOA", alias: "Type de promoteur"},
                                                                {field: "lib_TYPE_OPERATION_CONSTR", alias: "Type d'opération"}
                                                              ]
    params_map_com_immobilier_carte_nouveaux_logements.bounds_adjustment = {adjustment: false, domain: ["p0.01", "p0.99"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
    //here you can declare a set of transformations that will be applied to this particular chart
    params_map_com_immobilier_carte_nouveaux_logements.transformations = {filter: [{field: "ANNEE_DEPOT", operation: ">", value: 2016}]}

    params_map_com_immobilier_carte_nouveaux_logements.params_legends = {show: true, position: "", shape: "", max_cells: 8, title: "Type de promoteur", thresholds_min: 3, thresholds_max: 8,
                                                                        size_legend: {show: true, max_cells: 8, title: "Nb total de logements", thresholds_min: 3, thresholds_max: 8}
    }
    params_map_com_immobilier_carte_nouveaux_logements.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]    
    params_map_com_immobilier_carte_nouveaux_logements.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},
      {chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: true},
      {chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: false},]
    params_map_com_immobilier_carte_nouveaux_logements.style = {chart_width: 770} //a num value or 'inherit', iot fill all available space provided by the parent node
    params_map_com_immobilier_carte_nouveaux_logements.associated_charts = [{chart_type: 'tick', title: 'Nb de logements par permis de construire', fieldName: 'NB_LGT_TOT_CREES', 
                                                                            title_x_axis: "Nb de logements", tooltip_fields: [{field: 'lib_CAT_MOA', alias: 'Type de promoteur'}, {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"},
                                                                            {field: "date_collecte", alias: "Date de collecte"}, {field: "lib_NATURE_PROJET", alias: "Nature du projet"},
                                                                            ]
    }]


    var instantiateur_map1 = new Map_circles(params_map_com_immobilier_carte_nouveaux_logements);

    //evo
    instantiateur_map1.createChart(params_map_com_immobilier_carte_nouveaux_logements, sharedParams_com_immobilier_sitadel) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams

  //tick distribution permis selon nb de log
    //   params_tickChart_nb_nouveaux_logements = new params_tick()
    //   params_tickChart_nb_nouveaux_logements.htmlNode = 'com_immobilier_sitadel_tickChart_nb_logements'
    //   params_tickChart_nb_nouveaux_logements.id ="com_immobilier_sitadel_tickChart_nb_logements"
    //   params_tickChart_nb_nouveaux_logements.numerical_field_params = {fieldName: 'NB_LGT_TOT_CREES', alias: 'Nb de logements'}
    //   params_tickChart_nb_nouveaux_logements.label_tooltip = 'Nb de logements'
    //   params_tickChart_nb_nouveaux_logements.title = ['Répartition des permis de construire selon', 'le nombre de logements']
    //   params_tickChart_nb_nouveaux_logements.title_x_axis = ["Nb de logements par permis de construire", "(1 trait = 1 permis)"]
    //   //params_tickChart_nb_nouveaux_logements.title_x_axis = "Nb de logements par permis de construire"
    //   //params_tickChart_nb_nouveaux_logements.crossfilter
    //   params_tickChart_nb_nouveaux_logements.tooltip_fields = [{field: 'lib_CAT_MOA', alias: 'Type de promoteur'}, {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"},
    //                                                           {field: "date_collecte", alias: "Date de collecte"}, {field: "lib_NATURE_PROJET", alias: "Nature du projet"},
    //                                                           ]
    //   //params_tickChart_nb_nouveaux_logements.animation_params = {ease_function: "easeInOutBack", speed: 2}
    //   params_tickChart_nb_nouveaux_logements.brush_mode = true
    //   params_tickChart_nb_nouveaux_logements.style.chart_width = 500
    //   params_tickChart_nb_nouveaux_logements.selection_params.brush.mode = 'highlightEvent'//brushEvent & highlightEvent for continious refresh, brushEndEvent & highlightEndEvent for a refresh at the end of brush move/sizing
    //   params_tickChart_nb_nouveaux_logements.highlight_charts = [
    //   {chart: 'com_immobilier_map_nouveaux_logements_sitadel', highlight: true}
    // ]

    //   var instantiateur_tickChart = new Tick_chart(params_tickChart_nb_nouveaux_logements)
    //   instantiateur_tickChart.createChart(params_tickChart_nb_nouveaux_logements, sharedParams_com_immobilier_sitadel)


  sharedParams_com_immobilier_sitadel.setup_crossfilter(sharedParams_com_immobilier_sitadel)

}  
  



function setup_graphics_com_services(communes_selected, operational_dataset,user_input) {
  let _this = setup_graphics_com_services
  _this.prototype.data_poi_osm = [];
  _this.prototype.poi_osm_load = false;
  _this.prototype.check_poi_osm_load = setInterval(() => {
    if (_this.prototype.poi_osm_load) {
      clearInterval(_this.prototype.check_poi_osm_load);
      sharedParams_com_services.data_main = sharedParams_com_services.data_main.concat(_this.prototype.data_poi_osm);
      sharedParams_com_services.data_source = sharedParams_com_services.data_source.concat(_this.prototype.data_poi_osm);
      //update the data_main of for the following components
      params_control_btn_adresses.update_data_main = true;
      params_control_btn_adresses.instanciator?.prepare_data_p1(params_control_btn_adresses, sharedParams_com_services);

      params_map_com_services.update_data_main = true;
      params_map_com_services.instanciator?.prepare_data_p1(params_control_btn_adresses, sharedParams_com_services);      
    }
  }, 1000);
  //-----------------------------------------
  //--------------------------------------------
  //--------------------------------------------
  sharedParams_com_services = new sharedParams()
  sharedParams_com_services.transformations = {
    //filter: [{field: "DEPCOM", operation: "include", values: communes_selected},], 
    latLng_fields: {lat:"lat", lng: "lng" },
  };

  sharedParams_com_services.prepare_data_source({operational_data: operational_dataset})
  
  sharedParams_com_services.language = "fr"

  //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
  sharedParams_array.push(sharedParams_com_services)
  sharedParams_com_services['sharedParams_array'] = sharedParams_array
  //sharedParams_com_services.aliases = [{field: 'IRIS', target_field: 'LIB_IRIS', alias: 'Quartier'}]

  
  //instancier group boutons adresses
    params_control_btn_adresses = new params_groupButtons()
    params_control_btn_adresses.htmlNode = 'com_control_btn_adresses'
    params_control_btn_adresses.data_driver = params_adressSearch_pin
    params_control_btn_adresses.style = {orientation: 'grid'}
    params_control_btn_adresses.title = 'Choisir une adresse'

    let instantiateur_groupBtn = new Button_group()
    instantiateur_groupBtn.createControl(params_control_btn_adresses, sharedParams_com_services)

    

  //instancier group boutons adresses
    params_control_btn_poi_category = new params_groupButtons()
    params_control_btn_poi_category.htmlNode = 'com_control_btn_poi_category'
    params_control_btn_poi_category.category_field = 'niv_2'
    params_control_btn_poi_category.numerical_field_params = {agg_type: 'sum'}
    params_control_btn_poi_category.style = {orientation: 'grid', justifyItems: 'start', margin: "20px 0 0 0"}
    params_control_btn_poi_category.title = 'Choisir un type de POI'
    params_control_btn_poi_category.selection_params.highlight = true
    params_control_btn_poi_category.selection_params.restore = true
    params_control_btn_poi_category.highlight_charts = [{chart: 'isochrone_services', highlight: true},]

    instantiateur_groupBtn = new Button_group()
    instantiateur_groupBtn.createControl(params_control_btn_poi_category, sharedParams_com_services)

  //instancier map isochrone
    params_map_com_services = new params_map_isochrone()
    //params_map_com_services.category_field = "INSEE_COM" //used to sync with other charts sharing same cat field, especially in rm crossfilter process
    params_map_com_services.htmlNode = 'isochrone_services'
    params_map_com_services.id = "isochrone_services"
    params_map_com_services.title = "Les services et commerces à x minutes de marche"
    params_map_com_services.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map_com_services.transformations = {
      //dataset: data_poi, 
      //filter: [{field: "", operation: ">", value: 2016}]
    }
    params_map_com_services.crossfilter = [
      {chart: "com_control_btn_adresses", filter: false, collect_active_slices: false}
    ]
          
    //   params_map_com_services.crossfilter = [{chart: "com_immobilier_sitadel_nb_log_nouveaux", filter: false, collect_active_slices: true},
    //     {chart: "com_immobilier_sitadel_part_log_nouveaux", filter: false, collect_active_slices: true},
    //     {chart: "com_immobilier_sitadel_nb_log_anciens_vs_nouveaux", filter: false, collect_active_slices: false},]
    params_map_com_services.style = {chart_height: 0.6, chart_width: 0.37} //a num value or 'inherit', iot fill all available space provided by the parent node
    

    var instantiateur_map1 = new Map_isochrone(params_map_com_services);

    //evo
    instantiateur_map1.createChart(params_map_com_services, sharedParams_com_services) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  sharedParams_com_services.setup_crossfilter(sharedParams_com_services)

}  



  


function setup_graphics_adress_1(communes_selected, operational_dataset, polygons) {

  //-----------------------------------------
  if (params_adressSearch.adresses) {
    var list_geoRadius_filter = [];
    Object.values(params_adressSearch.adresses).forEach(r=> {
      list_geoRadius_filter.push({center: r.leaflet_lat_lng, radius: r.radius, adress: r.adress, lat_lng: r.lat_lng})
    })
  }

  //--------------------------------------------
  //--------------------------------------------
  sharedParams_adress_ = new sharedParams()
  sharedParams_adress_.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: communes_selected}, 
  {field: "nb_pieces", operation: "<", value: 7}, {field: "prix_m2_vente", operation: "<", value: 15000}, 
  {field: "taux_rendement_n6", operation: "<", value: 20}, {field: "surface", operation: "<", value: 300}],
  geoRadius_filter:  list_geoRadius_filter, latLng_fields: {lat:"mapCoordonneesLatitude", lng: "mapCoordonneesLongitude" }}
  
  
  //sharedParams_com_apercu.transformations = {geoRadius_filter:  list_geoRadius_filter}
  
  sharedParams_adress_.language = "fr"
  sharedParams_adress_.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons})

  //iot to articulate several groups of graphics, create an array of sharedParams, & register this array in each sharedParams instance
  sharedParams_array.push(sharedParams_adress_)
  sharedParams_adress_['sharedParams_array'] = sharedParams_array
  

  //build lib iris
  join_v2(sharedParams_adress_.data_main, ref_insee, 'CODE_IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])


  join_aggregate(data_stats_insee_com, sharedParams_adress_.data_main, 'CODGEO', 'INSEE_COM', 'taux_rendement_n6', 'mean')


  //send data source to webworkers
  //init_webWorkers_data(sharedParams_adress_.data_source)
  /*init_webWorker1_data(sharedParams_adress_.data_source)
  init_webWorker2_data(sharedParams_adress_.data_source)*/


  //instancier nouveau graph 1
    params_barChart1 = new param_customSpec_BarChartsJS()

    params_barChart1.ctx = ctx_1
    params_barChart1.id = "bar1"
    params_barChart1.category_field = "INSEE_COM"
    params_barChart1.geoRadius = list_geoRadius_filter
    params_barChart1.hierarchy_levels = {0: "INSEE_COM", 1: "CODE_IRIS", 2: "nb_pieces"}
    params_barChart1.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers", 2: "Nb de pièces"}
    params_barChart1.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_barChart1.sort = {fieldName: 'prix_m2_vente', order: 'desc'}
    params_barChart1.label_tooltip = "Prix m² median"
    params_barChart1.title = "Prix de vente au m²"
    params_barChart1.title_x_axis = 'Communes'
    params_barChart1.title_y_axis = "Prix m² median"
    params_barChart1.fields_to_decode = [{lookupTable: Object.values(params_adressSearch.adresses), mainKey: "INSEE_COM", lookupKey: "citycode", fields: ['adress']}]
    //params_barChart1.fields_to_decode = [{lookupTable: ref_insee, mainKey: "INSEE_COM", lookupKey: "INSEE_COM", fields: ['LIBCOM']}]
    params_barChart1.brush_mode = false
    params_barChart1.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]

    //here you can deactivate the hover & selection effects applied to the chart, by default these effects are activated
    /*params_barChart1.interactions_chart_options = {hoverOptions: false, selectionOptions: false}*/
    //here you can declare a set of transformations that will be applied to this particular chart
    /*params_barChart1.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: ["33281","87085","17306"]},
                        {field: "nb_pieces", operation: "<", value: 9}]}*/

    var instantiateur_barChart1 = new simple_BarChart(params_barChart1);

    //evo
    instantiateur_barChart1.createChart(params_barChart1, sharedParams_adress_) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams



  //map
    params_map1 = new params_map()
    params_map1.category_field = "INSEE_COM" //used to sync with other charts sharing same cat field, especially in rm crossfilter process
    params_map1.htmlNode = 'adresse_aprecu_carte_prix_m2_logements'
    params_map1.id = "adresse_aprecu_carte_prix_m2_logements"
    params_map1.title = "Annonces selon leur taux de rendement"
    params_map1.initial_view = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map1.params_fields = {lat: "mapCoordonneesLatitude", lng: "mapCoordonneesLongitude", hue_params: {hue_field: "taux_rendement_n6", hue_color: "interpolateRdYlGn", 
                                domain: ["p0.04", "p0.95"], domain_scope: "whole_dataset"}}
    //params_map1.params_fields = {color_params: {color_field: "TYP_IRIS", selection: 'first'}}//, color: "interpolateRdYlGn"                                
    params_map1.tooltip_fields = [{field: "LIBCOM", slice:[0, 20] ,alias: "Commune"}, {field: "LIB_IRIS", slice:[0, 25] ,alias: "Quartier"}, 
      {field: "prix_bien", alias: "Prix du bien", unit: " €"},
      {field: "prix_m2_vente", alias: "Prix vente au m²", unit: " €"}, {field: "nb_pieces", alias: "Nb de pièces"},
      {field: "surface", alias: "Surface", unit: " m²"}, {field: "dpeL", alias: "DPE"}, 
      {field: "taux_rendement_n6" ,alias: "Taux de rendement", unit: " %"}]
    params_map1.title.text = "title of the chart"
    params_map1.bounds_adjustment = {adjustment: false, domain: ["p0.05", "p0.95"]} //-> bounds_adjustment param help to exclude the coordinates that are out of the given domain
    //here you can declare a set of transformations that will be applied to this particular chart
    //params_map1.transformations = {filter: [{field: "taux_rendement_n6", operation: ">", value: 0}]}
    params_map1.params_legends = {show: true, position: "", shape: "", max_cells: 8, title: "Taux de Rendement"}
    params_map1.bbox = [[51.072228, 2.528016], [42.442288, 3.159714]]
    params_map1.geoRadius = list_geoRadius_filter
    //params_map1.params_filter_targets = [{target_chart_id: 'bar1', mode: "preserve_shape"}, {target_chart_id: 'bar3', mode: "filter_shape"}] //obsolete
    //params_map1.crossfilter = [{chart: "bar3", filter: false, collect_active_slices: false}]


    var instantiateur_map1 = new Map_circles(params_map1);

    //evo
    instantiateur_map1.createChart(params_map1, sharedParams_adress_) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams






    //instancier nouveau graph 1
      params_barChart3 = new param_customSpec_BarChartsJS()

      params_barChart3.ctx = ctx_3
      params_barChart3.id = "bar3"
      params_barChart3.category_field = "DEPCOM"
      params_barChart3.geoRadius = list_geoRadius_filter
      params_barChart3.hierarchy_levels = {0: "DEPCOM", 1: "TYPEQU"}
      //params_barChart3.labels_hierarchy_levels = {0: "Communes", 1: "Quartiers", 2: "Nb de pièces"}
      params_barChart3.numerical_field_params = {fieldName: 'TYPEQU', agg_type: 'count'}
      params_barChart3.latLng_fields_params = {lat_fieldName: "lat", lng_fieldName: "lng"}
      params_barChart3.join = {join_fields: {"mapCoordonneesLatitude": "lat", "mapCoordonneesLongitude": "lng"}, join_dataset: ""}
      params_barChart3.sort = {fieldName: 'TYPEQU', order: 'desc'}
      params_barChart3.label_tooltip = "Nb d'équipements"
      params_barChart3.title = "Nb d'équipements"
      params_barChart3.title_x_axis = 'Emplacements'
      params_barChart3.title_y_axis = "Nb d'équipements"
      params_barChart3.fields_to_decode = [{lookupTable: Object.values(params_adressSearch.adresses), mainKey: "DEPCOM", lookupKey: "citycode", fields: ['adress']}]
      params_barChart3.brush_mode = false
      //params_barChart3.filter = false
      params_barChart3.crossfilter = [{chart: "map1", filter: false, collect_active_slices: false}, {chart: "bar1", filter: false, collect_active_slices: false}]
      //here you can deactivate the hover & selection effects applied to the chart, by default these effects are activated
      /*params_barChart3.interactions_chart_options = {hoverOptions: false, selectionOptions: false}*/
      //here you can declare a set of transformations that will be applied to this particular chart
      params_barChart3.transformations = {filter: [{field: "DEPCOM", operation: "include", values: communes_selected}], dataset: data_poi}

      var instantiateur_barChart3 = new simple_BarChart(params_barChart3);

      //evo
      instantiateur_barChart3.createChart(params_barChart3, sharedParams_adress_) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams




      
  //add the adress bar to the current shared params
  params_global.adressSearch.instanciator.add_to_sharedParams(params_global.adressSearch, sharedParams_adress_)


    
  sharedParams_adress_.setup_crossfilter(sharedParams_adress_)


  //list the graphics wanted for synchronisation
  params_barChart1.graphics_to_synchronise = [{id: 'bar2', delay_time: undefined, on_display: "immobilier_adress"}]



}


function setup_graphics_adress_2(communes_selected, operational_dataset, polygons) {

  //-----------------------------------------
  if (params_adressSearch.adresses) {
    var list_geoRadius_filter = [];
    Object.values(params_adressSearch.adresses).forEach(r=> {
      list_geoRadius_filter.push({center: r.leaflet_lat_lng, radius: r.radius, adress: r.adress, lat_lng: r.lat_lng})
    })
  }

  //--------------------------------------------
  //--------------------------------------------
  sharedParams3 = new sharedParams()
  sharedParams3.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: communes_selected}, 
  {field: "nb_pieces", operation: "<", value: 7}, {field: "prix_m2_vente", operation: "<", value: 15000}, 
  {field: "taux_rendement_n6", operation: "<", value: 20}, {field: "surface", operation: "<", value: 300}],
  geoRadius_filter:  list_geoRadius_filter, latLng_fields: {lat:"mapCoordonneesLatitude", lng: "mapCoordonneesLongitude" }}
  
  
  //sharedParams3.transformations = {geoRadius_filter:  list_geoRadius_filter}
  
  sharedParams3.language = "fr"
  sharedParams3.prepare_data_source({operational_data: operational_dataset, geojson_data: polygons})
  
  sharedParams_array.push(sharedParams3)
  sharedParams3['sharedParams_array'] = sharedParams_array
  
  
  //build lib iris
  join_v2(sharedParams3.data_main, ref_insee, 'CODE_IRIS', 'CODE_IRIS', ['LIB_IRIS', 'LIBCOM'])
  
  
  join_aggregate(data_stats_insee_com, sharedParams3.data_main, 'CODGEO', 'INSEE_COM', 'taux_rendement_n6', 'mean')
  
  
  
    //instancier nouveau graph 1
    params_barChart2 = new param_customSpec_BarChartsJS()
    params_barChart2.ctx = ctx_2
    params_barChart2.id = "bar2"
    params_barChart2.category_field = "INSEE_COM"
    params_barChart2.geoRadius = list_geoRadius_filter
    params_barChart2.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
    params_barChart2.sort = {fieldName: 'prix_m2_vente', order: 'desc'}
    params_barChart2.label_tooltip = "Prix m² median"
    params_barChart2.title = "Prix de vente au m²"
    params_barChart2.title_x_axis = 'Communes'
    params_barChart2.title_y_axis = "Prix m² median"
    params_barChart2.fields_to_decode = [{lookupTable: Object.values(params_adressSearch.adresses), mainKey: "INSEE_COM", lookupKey: "citycode", fields: ['adress']}]

    params_barChart2.brush_mode = false                                          
  
    //here you can deactivate the hover & selection effects applied to the chart, by default these effects are activated
    /*params_barChart2.interactions_chart_options = {hoverOptions: false, selectionOptions: false}*/
    //here you can declare a set of transformations that will be applied to this particular chart
    /*params_barChart2.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: ["33281","87085","17306"]},
                        {field: "nb_pieces", operation: "<", value: 9}]}*/
  
    var instantiateur_barChart2 = new simple_BarChart(params_barChart2);
  
    //evo
    instantiateur_barChart2.createChart(params_barChart2, sharedParams3) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams
  
  
  
    //instancier nouveau graph 1
  params_barChart4 = new param_customSpec_BarChartsJS()
  
  params_barChart4.ctx = ctx_4
  params_barChart4.id = "bar4"
  params_barChart4.category_field = "nb_pieces"
  params_barChart4.numerical_field_params = {fieldName: 'prix_m2_vente', agg_type: 'median'}
  params_barChart4.sort = {fieldName: 'prix_m2_vente', order: 'desc'}
  params_barChart4.label_tooltip = "Prix m² median"
  params_barChart4.title = "Prix de vente au m²"
  params_barChart4.title_x_axis = 'nb_pieces'
  params_barChart4.title_y_axis = "Prix m² median"
  
  params_barChart4.brush_mode = false                                          
  
  //here you can deactivate the hover & selection effects applied to the chart, by default these effects are activated
  /*params_barChart4.interactions_chart_options = {hoverOptions: false, selectionOptions: false}*/
  //here you can declare a set of transformations that will be applied to this particular chart
  /*params_barChart4.transformations = {filter: [{field: "INSEE_COM", operation: "include", values: ["33281","87085","17306"]},
                      {field: "nb_pieces", operation: "<", value: 9}]}*/
  
  var instantiateur_barChart4 = new simple_BarChart(params_barChart4);
  
  //evo
  instantiateur_barChart4.createChart(params_barChart4, sharedParams3) //here you can pass a dataset as 2nd parameter, this will override the main dataset of the sharedParams

  
  //add the adress bar to the current shared params
  params_global.adressSearch.instanciator.add_to_sharedParams(params_global.adressSearch, sharedParams3)
  sharedParams3.setup_crossfilter(sharedParams3)

  //list the graphics wanted for synchronisation
  params_barChart2.graphics_to_synchronise = [{id: 'bar1', delay_time: undefined, on_display: "apercu_adress"}]


}
  

function load_master_data() {
  let polys = {}, poly_dep = {}, poly_com = {}
  let dep_Loaded_data_details = ["init"];
  let departements = []

  var d1 = new Date();
  async function fetchData_refLiteCommunes() {
    //let data1 = await d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/df_reference_communes_lite.csv");
    let data1 = d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/df_reference_communes_lite.csv");
    data1.then(res=> {
      for (row in res) {
        ref_communes.push(res[row]);
      };
      console.log((new Date() - d1)/1000)
  
      init_search_bar(ref_communes, params_global)
      //init_adress_bar(params_global)      
  
      //data transform
      ref_communes.forEach(r=> {
        if (r.LIBCOM?.includes('Arrondissement')) {
          r.LIBCOM = r.LIBCOM.replace('Arrondissement', 'Arr...')
        }
        if (r.LIBCOM?.length > 20 && !r.LIBCOM?.includes(' Arr...')) {
          r.LIBCOM = r.LIBCOM.slice(0,20) + "..."
        }
        if (r.LIB_IRIS?.length > 25) {
          r.LIB_IRIS = r.LIB_IRIS.slice(0,25) + "..."
        }
      })          
    });

    init_adress_bar_pin(params_global)
    
    // for (row in data1) {
    //   ref_communes.push(data1[row]);
    // };
    // console.log((new Date() - d1)/1000)

    // init_search_bar(ref_communes, params_global)
    // //init_adress_bar(params_global)
    // init_adress_bar_pin(params_global)

    // //data transform
    // ref_communes.forEach(r=> {
    //   if (r.LIBCOM?.includes('Arrondissement')) {
    //     r.LIBCOM = r.LIBCOM.replace('Arrondissement', 'Arr...')
    //   }
    //   if (r.LIBCOM?.length > 20 && !r.LIBCOM?.includes(' Arr...')) {
    //     r.LIBCOM = r.LIBCOM.slice(0,20) + "..."
    //   }
    //   if (r.LIB_IRIS?.length > 25) {
    //     r.LIB_IRIS = r.LIB_IRIS.slice(0,25) + "..."
    //   }
    // })    
  }
  fetchData_refLiteCommunes()

  async function fetchData_refCommunesIris() {
    //load data ref insee
    //let rInsee = await d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/df_reference_communes_iris.csv");
    let f = d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/df_reference_communes_iris.csv");
    f.then(rInsee=> {
        for (row in rInsee) {
          ref_insee.push(rInsee[row]);
        };

      //data transform
      ref_insee.forEach(r=> {
        if (r.LIBCOM?.includes('Arrondissement')) {
          r.LIBCOM = r.LIBCOM.replace('Arrondissement', 'Arr...')
        }
        if (r.LIBCOM?.length > 20 && !r.LIBCOM?.includes(' Arr...')) {
          r.LIBCOM = r.LIBCOM.slice(0,20) + "..."
        }
        if (r.LIB_IRIS?.length > 25) {
          r.LIB_IRIS = r.LIB_IRIS.slice(0,25) + "..."
        }
      })     
    })

  }
  
  fetchData_refCommunesIris()

  d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/ref/ref_type_equip.csv").then(r=> ref_type_equip = r);
  d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/qpv_pop.csv").then(r=> qpv_polys = r);  





  
}

async function load_operationnal_data(params_global, origin) {
  //display spinner
  let msg_loading_data_communes = document.getElementById('msg_loading_data_communes');
  let spinner_load_data_communes = document.getElementById('spinner_load_data_communes')
  let apercu_communes_page = document.getElementById('apercu_communes');
  apercu_communes_page.style.display='none';
  spinner_load_data_communes.style.animation = '1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0s infinite normal none running fa-spin'
  msg_loading_data_communes.style.display='grid';


  switch_on_backends()

  let promises_load_data = [], communes_selected;
  if (origin === 'load_data_communes') {
    communes_selected = [...params_global.communesSearch.list_idx_segments_multiples_selected]
  }
  else if (origin === 'load_data_adresses') {
    communes_selected = Object.values(params_global.adressSearch.adresses).map(o=> o.citycode) 
  }
  else if (origin === 'load_data_adresses_pin') {
      communes_selected = Object.values(params_adressSearch_pin.adresses).map(e=> e.citycode)
  }
 
  for (let value of communes_selected) {
    //extract dep value
    //value = ref_communes.find(o=> o.LIBCOM === value).DEP
    var dep = value.substring(0,2)
    //check if the data is already present
    if (!params_global.data_loaded.hasOwnProperty(dep)) {
      //load data
      let data_ventes_dep = d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/annonces_git/df_annonces_gps_iris_ventes_" + dep + ".csv");
      let data_poi_dep = d3.dsv(";", "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/poi/poi_" + dep + ".csv");
      let stats_communes_dep = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/communes/base_cc_comparateur/base_cc_comparateur_" + dep + ".csv");
      let poly = d3.json("https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/ref/polygons/polygones_" + dep + ".json");
      let stats_iris_cat_sociopro = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/activite_residents_" + dep + ".csv");
      let stats_iris_logements = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/logement_" + dep + ".csv");
      let stats_iris_couples_familles_menages = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/couples_familles_menages_" + dep + ".csv");
      let stats_iris_diplomes_formation = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/diplomes_formation_" + dep + ".csv");      
      let stats_iris_population = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/pop_" + dep + ".csv");
      let stats_iris_revenus_disponibles = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/insee/base_ic/revenus_disponibles_" + dep + ".csv");
      
      let sitadel  = d3.dsv(';', "https://raw.githubusercontent.com/klopstock-dviz/immo_vis/master/data/sitadel/sitadel_logements_" + dep + ".csv");
      
      //access promises results
      data_ventes_dep.then(res=> data_annonces_details_ventes = data_annonces_details_ventes.concat(res))
      data_ventes_dep.catch(res=> console.warn('load data_ventes ko'))
      
      data_poi_dep.then(res=> data_poi = data_poi.concat(res));
      data_poi_dep.catch(res=> console.warn('load data_poi ko'))

      stats_communes_dep.then(res=> data_stats_communes = data_stats_communes.concat(res));
      stats_communes_dep.catch(res=> console.warn('load data_stats_communes ko'))

      poly.then(res=> {
        polygons = polygons.concat(Object.values(res))
      });
      poly.catch(res=> console.warn('load data_stats_communes ko'))

      stats_iris_cat_sociopro.then(res=> activite_residents_iris = activite_residents_iris.concat(res));
      stats_iris_cat_sociopro.catch(res=> console.warn('load activite_residents ko'))

      stats_iris_logements.then(res=> logements_iris = logements_iris.concat(res));
      stats_iris_logements.catch(res=> console.warn('load activite_residents ko'))

      stats_iris_couples_familles_menages.then(res=> couples_familles_menages_iris = couples_familles_menages_iris.concat(res));
      stats_iris_couples_familles_menages.catch(res=> console.warn('load activite_residents ko'))

      stats_iris_diplomes_formation.then(res=> diplomes_formation_iris = diplomes_formation_iris.concat(res));
      stats_iris_diplomes_formation.catch(res=> console.warn('load activite_residents ko'))

      stats_iris_population.then(res=> population_iris = population_iris.concat(res));
      stats_iris_population.catch(res=> console.warn('load activite_residents ko'))
      
      stats_iris_revenus_disponibles.then(res=> revenus_disponibles_iris = revenus_disponibles_iris.concat(res));
      stats_iris_revenus_disponibles.catch(res=> console.warn('load activite_residents ko'))

      sitadel.then(res=> sitadel_logements_ = sitadel_logements_.concat(res) )

      //params_global.data_loaded = {['poi_'+dep]: true, ['annonces_ventes_'+dep]: true}
      params_global.data_loaded = {[dep]: true}
      promises_load_data.push(
        data_ventes_dep, 
        poly, 
        data_poi_dep, 
        stats_communes_dep, 
        stats_iris_cat_sociopro,
        stats_iris_couples_familles_menages,
        stats_iris_diplomes_formation, 
        stats_iris_logements,
        stats_iris_population,
        stats_iris_revenus_disponibles,
        sitadel)
    }
  }

  
  var fields_to_num_annonces_ventes = ['surface', 'prix_m2_vente', 'prix_bien', 'dpeC', 'mapCoordonneesLatitude', 'mapCoordonneesLongitude', 'taux_rendement_n6', 'taux_rendement_n6', 'flag_ligne']
  var fields_to_num_stats_insee_com = ['P17_POP', 'P12_POP', 'SUPERF', 'NAIS1217', 'DECE1217', 'P17_MEN', 'NAISD19', 'DECESD19', 'P17_LOG', 'P17_RP', 'P17_RSECOCC', 'P17_LOGVAC', 'P17_RP_PROP', 'NBMENFISC17', 'PIMP17', 'MED17', 'TP6017', 'P17_EMPLT', 'P17_EMPLT_SAL', 'P12_EMPLT', 'P17_POP1564', 'P17_CHOM1564', 'P17_ACT1564', 'ETTOT15', 'ETAZ15', 'ETBE15', 'ETFZ15', 'ETGU15', 'ETGZ15', 'ETOQ15', 'ETTEF115', 'ETTEFP1015']
  let fields_to_num_activite_residents_iris = ['P17_ACT1564',  'P17_ACTOCC1564',  'P17_CHOM1564',  'P17_INACT1564',  'P17_ETUD1564',  'P17_RETR1564',  'P17_AINACT1564',  'C17_ACT1564_CS1',  'C17_ACT1564_CS2',  'C17_ACT1564_CS3',  'C17_ACT1564_CS4',  'C17_ACT1564_CS5',  'C17_ACT1564_CS6',  'P17_ACTOCC15P_TP',  'P17_SAL15P_TP',  'P17_SAL15P_CDI',  'P17_SAL15P_CDD',  'P17_SAL15P_INTERIM',  'P17_SAL15P_EMPAID',  'P17_SAL15P_APPR',  'P17_NSAL15P_INDEP',  'P17_NSAL15P_EMPLOY',  'P17_NSAL15P_AIDFAM',  'P17_ACTOCC15P_ILT1',  'P17_ACTOCC15P_ILT2P',  'P17_ACTOCC15P_ILT2',  'P17_ACTOCC15P_ILT3',  'P17_ACTOCC15P_ILT4',  'P17_ACTOCC15P_ILT5',  'C17_ACTOCC15P',  'C17_ACTOCC15P_PAS',  'C17_ACTOCC15P_MAR',  'C17_ACTOCC15P_VELO',  'C17_ACTOCC15P_2ROUESMOT',  'C17_ACTOCC15P_VOIT',  'C17_ACTOCC15P_TCOM']
  let fields_to_num_logements_iris = ['P17_LOG', 'P17_RP', 'P17_RSECOCC', 'P17_LOGVAC', 'P17_MAISON', 'P17_APPART', 'P17_RP_1P', 'P17_RP_2P', 'P17_RP_3P', 'P17_RP_4P', 'P17_RP_5PP', 'P17_RP_M30M2', 'P17_RP_3040M2', 'P17_RP_4060M2', 'P17_RP_6080M2', 'P17_RP_80100M2', 'P17_RP_100120M2', 'P17_RP_120M2P', 'P17_RP_ACHTOT', 'P17_RP_ACH19', 'P17_RP_ACH45', 'P17_RP_ACH70', 'P17_RP_ACH90', 'P17_RP_ACH05', 'P17_RP_ACH14', 'P17_RPMAISON_ACHTOT', 'P17_RPMAISON_ACH19', 'P17_RPMAISON_ACH45', 'P17_RPMAISON_ACH70', 'P17_RPMAISON_ACH90', 'P17_RPMAISON_ACH05', 'P17_RPMAISON_ACH14', 'P17_RPAPPART_ACHTOT', 'P17_RPAPPART_ACH19', 'P17_RPAPPART_ACH45', 'P17_RPAPPART_ACH70', 'P17_RPAPPART_ACH90', 'P17_RPAPPART_ACH05', 'P17_RPAPPART_ACH14', 'P17_MEN', 'P17_MEN_ANEM0002', 'P17_MEN_ANEM0204', 'P17_MEN_ANEM0509', 'P17_MEN_ANEM10P', 'P17_RP_PROP', 'P17_RP_LOC', 'P17_RP_LOCHLMV', 'P17_RP_GRAT', 'P17_RP_CCCOLL', 'P17_RP_CCIND', 'P17_RP_CINDELEC', 'P17_RP_GARL', 'P17_RP_VOIT1', 'P17_RP_VOIT2P', 'C17_RP_HSTU1P', 'C17_RP_HSTU1P_SUROCC', 'P17_NPER_RP_PROP',	'P17_NPER_RP_LOC',	'P17_NPER_RP_LOCHLMV',	'P17_NPER_RP_GRAT', 'P17_RP_CCCOLL','P17_RP_CCIND',	'P17_RP_CINDELEC', 'P17_RP_GARL',	'P17_RP_VOIT1P',	'P17_RP_VOIT1',	'P17_RP_VOIT2P', 'C17_RP_HSTU1P',"C17_RP_HSTU1P_SUROCC"]
                                    //% cadres et prof. intellectuelles sup.
  let fields_to_num_sitadel = ["ANNEE_DEPOT","TYPE_EVT","SUPERFICIE_T","NB_LGT_1P","NB_LGT_2P","NB_LGT_3P","NB_LGT_4P","NB_LGT_5P","NB_LGT_6P","NB_LGT_DEMOLIS","NB_LGT_IND_CREES","NB_LGT_COL_CREES","NB_LGT_TOT_CREES","NB_NIV_MAX","NATURE_PROJET","I_PERSONNELLE","I_VENTE","I_LOCATION","I_LGTR_SENIORS","I_LGTR_ETUDIANTS","I_LGTR_TOURISME","I_LGTR_HOTELIERESOC","I_LGTR_SOCIAL","I_LGTR_HANDICAPES","I_LGTR_AUTRE","SDP_A1","SDP_B1","SDP_D1","SDP_ E1","SDP_F1","TYPE_OPERATION_CONSTR","SDP_E1","lat","lng"];
  let fields_to_num_poi = ["lat","lng"];

  //transformations
  Promise.all(promises_load_data).then(r=> {

    data_annonces_details_ventes.forEach((d)=> { 
      fields_to_num_annonces_ventes.map(field=> { d[field] = +d[field] })
    });

    data_annonces_details_ventes.forEach(r=> {r.taux_rendement_n6 = r.taux_rendement_n6 * 100})

    let i = 0;
    data_stats_communes.forEach((d)=> { 
      fields_to_num_stats_insee_com.forEach(field=> {
         d[field] = +d[field] 
      })
    });

    i=0;
    data_stats_communes.forEach(r=> {
      r['densite_hab'] = +(r.P17_POP/r.SUPERF).toFixed(2);
      r['tx_chomage'] = (r.P17_CHOM1564/r.P17_ACT1564)*100;
    })

    qpv_polys.forEach(r=> r.Pop_2013 = +r.Pop_2013)

    activite_residents_iris.forEach((d)=> { 
      fields_to_num_activite_residents_iris.map(field=> { d[field] = +d[field] })
    });

    logements_iris.forEach((d)=> { 
      fields_to_num_logements_iris.forEach(field=> { 
        d[field] = +d[field] 
      })
    });
    
    
    let tx_logements_hlm, tx_log_suroccupes
    logements_iris.forEach(r=> {
      tx_logements_hlm = (r.P17_RP_LOCHLMV / r.P17_LOG)*100
      if (isNaN(tx_logements_hlm)) tx_logements_hlm = 0
      r.tx_logements_hlm = +tx_logements_hlm.toFixed(2)

      tx_log_suroccupes = (r.C17_RP_HSTU1P_SUROCC/ r.C17_RP_HSTU1P)*100
      if (isNaN(tx_log_suroccupes)) tx_log_suroccupes = 0
      r.tx_log_suroccupes = +tx_log_suroccupes.toFixed(2)
 
    })

    sitadel_logements_.forEach(r=> {
      fields_to_num_sitadel.forEach(field=> {
        r[field] = +r[field]
      })
    })

    data_poi.forEach(r=> {
      fields_to_num_poi.forEach(field=> {
        r[field] = +r[field]
      })
    })
 
    //build lib type & regroupement equipement
    join_v2(data_poi, ref_type_equip, 'TYPEQU', 'type', ['libelle_equipement', 'Regroup1', 'niv_1', 'niv_2', 'category_iconMarker', 'colorMarker', 'colorIcon', 'colorHEX'])

    //build population
    join_v2(data_poi, data_stats_communes, 'DEPCOM', 'CODGEO', ["P17_POP"])
    
     
  })
  
  if (['load_data_communes', 'load_data_adresses_pin'].includes(origin)) {
    var promises_result = await Promise.all(promises_load_data).then((results)=> {        
      let check_backend_loaders_state = setInterval(() => {
        if (switch_on_backends.prototype.backend_loaders_online) {
          clearInterval(check_backend_loaders_state)
          load_poi_osm(communes_selected, data_poi);          
        }        
      }, 500); 

      setup_graphics_com_services(communes_selected, data_poi, origin);
      let state = setup_graphics_com_apercu(communes_selected, data_annonces_details_ventes, polygons, origin);
      setup_graphics_com_immobilier(communes_selected, sharedParams_com_apercu.data_main, polygons, origin);
      setup_graphics_com_immobilier_logement(communes_selected, logements_iris, polygons, origin);
      setup_graphics_com_immobilier_sitadel(communes_selected, sitadel_logements_, polygons, origin);   
      
      let supervisor_state_setup_graphics_com_apercu = setInterval(() => {
        if (state) {
          clearInterval(supervisor_state_setup_graphics_com_apercu);
          msg_loading_data_communes.style.display='none';
          apercu_communes_page.style.display='grid';
        }
      }, 500);
    })
  }
  else if (origin === 'load_data_adresses') {
    var promises_result = await Promise.all(promises_load_data).then((results)=> {        
      setup_graphics_adress_1(communes_selected, data_annonces_details_ventes, polygons); 
      setup_graphics_adress_2(communes_selected, data_annonces_details_ventes, polygons); 
    })
  }

  function load_poi_osm(communes_selected, data_poi) {
    let communes = [...communes_selected];
    let communes_process_state = communes_selected.map(e=> {return {commune: e, in_progress: false, loaded: false}});
    let data_poi_filtred = data_poi.filter(e=> arr_poi_to_display.includes(e.TYPEQU) && communes_selected.includes(e.DEPCOM) );
    let backend_loaders = [
      {u:'https://cqk8fj.sse.codesandbox.io/', free: true},
      {u: 'https://overpassapi.klopstock-dviz.repl.co', free: true},
      {u:'https://lgep8i.sse.codesandbox.io/', free: true},
      {u: 'https://overpassapi2.klopstock-dviz.repl.co', free: true},            
      {u:'https://jnww12.sse.codesandbox.io/', free: true},      
      {u:'https://ifq8te.sse.codesandbox.io/', free: true},
      {u: 'https://overpassapi3.klopstock-dviz.repl.co', free: true},
      {u: 'https://overpassapi4.klopstock-dviz.repl.co', free: true}
    ];

    //check the status of the api to determine the next request window
    let t1=new Date()
    let loop_chech_api_state = setInterval(()=> {
      let f = fetch('https://overpass-api.de/api/status')
      f.then(r=> {
      let commune = communes_process_state.find(c=> !c.loaded && !c.process)?.commune;
      if (r.status === 200 && commune) {        
        // let latLngs = data_poi_filtred.filter(c=> c.DEPCOM === commune).map(e=> {return [e.lat, e.lng]})
        // let bbox = L.latLngBounds(latLngs);        
        // let bbox_str = bbox._southWest.lat+','+bbox._southWest.lng+','+bbox._northEast.lat+','+bbox._northEast.lng;
        //build a bbox based on circle with 10km radius
        let lngLat = Object.values(params_adressSearch_pin.adresses).find(a=> a.citycode === commune)?.lat_lng;
        let point = turf.helpers.point(lngLat);
        let circle = turf.circle.default(point, 10);
        let bbox=turf.bbox.default(circle);
        let bbox_str=bbox[1]+","+bbox[0]+","+bbox[3]+","+bbox[2]
                


        //console.log(r)
        let resp = r.text();
        resp.then(data=> {
            console.log('for commune: '+commune);
            console.log(data);
            //case when there are available slots now
            let regex_now='[0-999] slots available now';
            let regex_futur = 'Slot available after: 2022-[^]*, [^]* seconds.';
            let msg_regex
            if (data.match(regex_now)) {
                msg_regex='match regex_now'
                timeout = 2000;
                console.log({action:'call overpass_api', commune: commune, date: new Date()})
                communes_process_state.find(e=> e.commune === commune).in_progress = true
                orchestrate_call_overpass_api(bbox_str, commune, communes_process_state, setup_graphics_com_services)
            }
            else if (data.match(regex_futur)) {
              //let bridge = backend_loaders.find(e=> e.free)
              let rand_i= parseInt(Math.random()*backend_loaders.filter(b=> b.free).length);
              let bridge = backend_loaders.filter(b=> b.free)[rand_i]
              if (bridge) {
                bridge.free = false
                communes_process_state.find(e=> e.commune === commune).in_progress = true
                console.log({action:bridge.u, commune: commune, date: new Date()})
                orchestrate_call_overpass_api(bbox_str, commune, communes_process_state, setup_graphics_com_services, bridge)
              }
              
            }

        })
      }
      else if (communes_process_state.every(e=> e.loaded)) {
        clearInterval(loop_chech_api_state);
        let tf=new Date() - t1
        console.log('total time load osm poi: '+ tf)
        setup_graphics_com_services.prototype.poi_osm_load = true;
        setup_graphics_com_services.prototype.time_load =tf;
        
      }
      })

    }, 5500)

  }

  function orchestrate_call_overpass_api(bbox_str, commune, communes_process_state, setup_graphics_com_services, bridge) {
    let r
    if (bridge) {
      r= overpass_api_back(bbox_str, bridge.u)
    }
    else {
      r = overpass_api(bbox_str);
    }
    let t1 = new Date();
    r.then(r=> {
        let t2=new Date(); 
        // console.log({download_time: t2 - t1}); 			
        // console.log(r); 
        
        if (r.status === 200) {
            let _response=r.json(); 
            _response.then(res=> {
              //update the states
              communes_process_state.find(e=> e.commune === commune).loaded = true;
              communes_process_state.find(e=> e.commune === commune).in_progress = false;
              
              if (bridge) {
                bridge.free = true;                
              }

              if (!setup_graphics_com_services.prototype.data_poi_osm.find(e=> e.DEPCOM === commune)) {
                //concat the result of the pub transport poi with the rest
                res.elements.forEach(d=> {
                  let libelle_equipement, niv_1, niv_2, reseau, ligne, category_iconMarker, TYPEQU, colorMarker = 'darkblue', colorHEX='#00609b', stop_id;
                  let name = d.tags?.name || ''
                  if (d.tags?.bus === 'yes') {
                    libelle_equipement = 'Arrêt de bus ' + name; 
                    niv_2= 'Arrêt de bus'; 
                    niv_1='Transport public';
                    category_iconMarker = 'bus';
                    TYPEQU = "Transport public";
                    reseau = d.tags.network || d.tags.operator || '';
                    ligne = d.tags.route_ref || d.tags.ref || d.tags.line || ""
                    stop_id = d.id
                  }
                  else if (d.tags?.train === 'yes') {
                    libelle_equipement = 'Arrêt de train ' + name; 
                    niv_2= 'Arrêt de train';
                    niv_1='Transport public';
                    TYPEQU = "Transport public";
                    category_iconMarker = 'train'
                    reseau = d.tags.network || d.tags.operator || '';
                    ligne = d.tags.route_ref || d.tags.ref || d.tags.line || "";
                    stop_id = d.id
                  }
                  else if (d.tags?.tram === 'yes') {
                    libelle_equipement = 'Arrêt de tram ' + name;
                    niv_2= 'Arrêt de tram';
                    niv_1='Transport public';
                    TYPEQU = "Transport public";
                    category_iconMarker = 'tram';
                    reseau = d.tags.network || d.tags.operator || '';
                    ligne = d.tags.route_ref || d.tags.ref || d.tags.line || "";
                    stop_id = d.id
                  }
                  
                  let row = {DEPCOM: commune, lat: d.lat, lng: d.lon, libelle_equipement, niv_1, niv_2, TYPEQU, category_iconMarker, colorMarker, colorHEX, reseau, ligne, stop_id}
                  setup_graphics_com_services.prototype.data_poi_osm.push(row)
                });
                console.log({commune: commune, nb_elem: res.elements.length})
                if (bridge) console.log({bridge: bridge.u, commune: commune, nb_elem: res.elements.length})

              }

            })			
        }

    } );
  }


  function overpass_api(bbox) {
		//url compo:		
        //let u='https://overpass-api.de/api/interpreter?data='+encodeURI(`[out:json][timeout:25];(node["public_transport"="station"](48.9723,1.6863,49.0061,1.7378);node["public_transport"="stop_position"](48.9723,1.6863,49.0061,1.7378);node["public_transport"="platform"](48.9723,1.6863,49.0061,1.7378);node["public_transport"="stop_area"](48.9723,1.6863,49.0061,1.7378)(${bbox}););out body;>;out skel qt;`)
        let u='https://overpass-api.de/api/interpreter?data='+encodeURI(`[out:json][timeout:250];(node["public_transport"="station"](${bbox});node["public_transport"="stop_position"](${bbox});node["public_transport"="platform"](${bbox});node["public_transport"="stop_area"](${bbox})(${bbox}););out body;>;out skel qt;`)
        //let u='https://overpass-api.de/api/interpreter?data='+encodeURI(`[out:json][timeout:25];(node["public_transport"="stop_area"](${params_map.overpass_api_bbox})(${params_map.overpass_api_bbox}););out body;>;out skel qt;`)
        //https://overpass-api.de/api/interpreter?data=%5Bout:json%5D%5Btimeout:25%5D;(node%5B%22public_transport%22=%22stop_area%22%5D(43.58527770454444,-3.1692999972138205,48.91180115845996,7.321388868058918)(43.58527770454444,-3.1692999972138205,48.91180115845996,7.321388868058918););out%20body;%3E;out%20skel%20qt;

		//req compo
		let t1=new Date();
		let _response;
		return fetch(u)
	}

	function overpass_api_back(bbox, u) {
    //bbox = '48.8243382520578,2.22463757275969,48.85116998980736,2.2575997809455286'
    let options = {method: 'POST', headers:{'Content-Type': 'application/json', order: 'poi_osm', bbox}}

    let post = fetch(u, options)
    // .then(r=> {
    //   console.log(r)
    //   let resp1=r.json();
    //   resp1.then(r2=> console.log(r2))      
    // })

    return post
	}	

  function switch_on_backends() {
    let backend_loaders = [
      'https://cqk8fj.sse.codesandbox.io/',
      'https://overpassapi.klopstock-dviz.repl.co',
      'https://lgep8i.sse.codesandbox.io/',
      'https://overpassapi2.klopstock-dviz.repl.co',            
      'https://jnww12.sse.codesandbox.io/',      
      'https://ifq8te.sse.codesandbox.io/',
      'https://overpassapi3.klopstock-dviz.repl.co',
      'https://overpassapi4.klopstock-dviz.repl.co'
    ];
    
    backend_loaders=JSON.stringify(backend_loaders)
    
    let options = {method: 'POST', headers:{'Content-Type': 'application/text', backend_loaders}}
    let uList = [
      'https://wakeup-overpassapi-backends.herokuapp.com/',
      'https://wakeup-overpassapi-backendsreplit.klopstock-dviz.repl.co'], i=0;

    //bypass the call from the client, sent from local & distant servers instead
    switch_on_backends.prototype.backend_loaders_online = true
    //call();
    function call() {      
      let u = uList[parseInt(Math.random()*uList.length)]
    
      //wakeup central nodes
      let f=fetch(u);
      let f_r=f.then(r=> {return r});
      f_r.then(r=> {
        if (r.status === 200) {
          i_switch_on_backends(u, options)
        }
        else {
          setTimeout(()=> {
            call()
          }, 1000)
        }
      });
      f.catch(e=> {
        console.warn(e);
        console.warn('retry warming up the central nodes')
        setTimeout(() => {
          call()
        }, 1000);
      })

      function i_switch_on_backends(u, options) {
        let p = fetch(u, options);
        p.then(r=> {return r.text()}).then(r=> {
          console.log(r);
          switch_on_backends.prototype.backend_loaders_online = true;
        })
        p.catch(e=> {
          console.warn('wakeup-overpassapi-backends.herokuapp KO')
          console.log(e);
          setTimeout(() => {
            console.log('wakeup-overpassapi-backends.herokuapp RETRY '+i)
            i++
            call()
          }, 1000);
            
        })
      }

    }
    
    
  }



}

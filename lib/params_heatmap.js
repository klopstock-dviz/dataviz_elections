class params_bubblemap {
    constructor() {
      this.list_idx_segment_single_selected = [] //stock le segment selectionné suite à un clic simple (ex: 0-0 pour le 1er segment)
      this.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
      this.list_keys_values_segment_single_selected = [] //stock le vrai label du segment selectionné suite à un clic simple (ex: communes 13 et nb_pieces 1)
      this.list_keys_values_segments_multiples_selected = [] //stock les vrais labels des segments selectionnés suite à un clic multiple (ex: communes 13 et nb_pieces 1)
      this.list_idx_segments_multiples_selected = [] //stock les segments selectionnés suite à un clic + shift
      this.list_labels_segments_multiples_selected = [] //stock les labels des segments selectionnés suite à un clic + shift
      this.list_final_labels_uniq_selected = new Set() //stock les labels sans doublons des segments selectionnés suite à tous types de clics (simple ou clic + shift)    
      this.brush_values = {}
      this.brush_keys_values = {}
      this.id = ""
      this.filtered_by = {} //store the id of the third chart that filters the current one, and all the axis used in the successive filters
      this.scope_field = ""
      this.category_field = ''
      this.sub_category_field = ''
      this.list_of_axis = []
      this.nb_axis = 0
      this.numerical_field_params = {fieldName: '', agg_type: '', agg_fieldName: ''}
      this.label_tooltip = ''
      this.data = [  
                    {labels: []},
                    {
                      datasets: [
                        
                      ]
                    }
                  ]
      this.data_source = [  
                    {labels: []},
                    {
                      datasets: [
                        
                      ]
                    }
                  ]                
      this.data_source_raw = []
      this.prepare_data_type = ''
      this.nb_categories = 0                
      this.nb_sous_categories = 0
      this.status_chart = '' //records the status active (when after a clic the chart triggers an action of cross filtering) / target (when the chart is targetedby another chart)
      this.activ_categories_values = []
      this.activ_sub_categories_values = []
      this.ctx = ''
      this.type = 'bubblemap'
      this.responsive = true
      this.legend_position = [{position: 'top'}]
      this.legend_title = ""
      this.legend_clicked = false
      this.legends_field = ""
      this.title_x_axis = 'set a title in the params spec'
      this.title_y_axis = 'set a title in the params spec'
      this.list_idx_segments_existants = [] //stock tous les segments existant du graph                  
      this.border_activated = false
      this.interactions = [
                  {elements_to_filter: 
                    []
                  },
                  {filtered_by: 
                    []
                  }     
                ]
      this.instanciator = []
      this.chart_instance = []
      this.active_slices = []
      this.backgroundColorArray_source = {}
      this.colorsConfig = {scheme: "", colorsOrder: ""}      
      this.selection_params = {interaction_mode: "filter", selection_level: "all", selection_field: "", highlight_mode: "all", brush:{active: true, mode: "endEvent", axis: "x"}}
      this.transformations = {dataset: undefined, filter: undefined, crossfilter: {}}
      this.data_main = []
      this.interactions_chart_options = {hoverOptions: true, selectionOptions: true}
      this.active_legends = {}
      this.hidden_legends = {}
      this.id_previous_singleSelect = ""
      this.id_previous_multiSelect = ""    
      this.history_data_filtred = {}
      this.funcLib = {}
      this.brush_mode = true
      this.panel_param_score = {elements_toHide_onPanelDisplay:[]}
      this.transitions = [{injection_type: 'init', duration: 1000, delay: 0}, {injection_type: 'update', duration: 1600, delay: 500}]
    }
  
  

  }

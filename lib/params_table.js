class params_table {
	constructor() {
		this.title_params = {}
		this.htmlNode = ''		
		this.fields = []
		this.fontSize = ''				
	    this.list_idx_segment_single_selected = [] //stock le segment selectionné suite à un clic simple (ex: 0-0 pour le 1er segment)
	    this.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
	    this.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
	    this.list_keys_values_segment_single_selected = [] //stock le vrai label du segment selectionné suite à un clic simple (ex: communes 13 et nb_pieces 1)
	    this.list_keys_values_segments_multiples_selected = [] //stock les vrais labels des segments selectionnés suite à un clic multiple (ex: communes 13 et nb_pieces 1)
	    this.list_idx_segments_multiples_selected = [] //stock les segments selectionnés suite à un clic + shift
	    this.list_labels_segments_multiples_selected = [] //stock les labels des segments selectionnés suite à un clic + shift
	    this.selected_values = {}
	    this.limit = 50
	    this.fields_sorted = {}
	    this.id_previous_singleSelect = ""
	    this.id_previous_multiSelect = ""	    
	}
}
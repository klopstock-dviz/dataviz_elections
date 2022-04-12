class params_groupButtons {
    constructor() {
        this.list_idx_segment_single_selected = [] //stock le segment selectionné suite à un clic simple (ex: 0-0 pour le 1er segment)
        this.list_labels_segment_single_selected = [] //stock le label catégorie/sous cat du segment selectionné suite à un clic simple (ex: category 13 et sub_category 1)
        this.list_keys_values_segment_single_selected = [] //stock le vrai label du segment selectionné suite à un clic simple (ex: communes 13 et nb_pieces 1)
        this.list_keys_values_segments_multiples_selected = [] //stock les vrais labels des segments selectionnés suite à un clic multiple (ex: communes 13 et nb_pieces 1)
        this.list_idx_segments_multiples_selected = [] //stock les segments selectionnés suite à un clic + shift
        this.list_labels_segments_multiples_selected = [] //stock les labels des segments selectionnés suite à un clic + shift        
        this.brush_values = {}
        this.brush_keys_values = {}
        this.id = ""
        this.htmlNode = ""
        this.filtered_by = {} //store the id of the third chart that filters the current one, and all the axis used in the successive filters        
        this.category_field = ''
        this.buttons_list = []
        this.transformations= {crossfilter:{}}
        this.filtered_by = {}
        this.style = {orientation: 'grid', justifyItems: 'center', margin: '0px 0 0 0'}
        this.selection_params = {crossfilter: true, highlight: false, restore: false, radio: true}//radio means only one option is allowed /\ restore means a second click on the same btn will reactivate all the btns
        
    }
}

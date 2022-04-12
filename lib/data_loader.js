let contours_communes = [], p2022_resultats_communes_t1, base_cc_com=[], r_elec_transposed=[];
let f_contours_communes, f_p2022_resultats_communes_t1, f_base_cc_com;


function load_data() {
    let t1=new Date();
    f_contours_communes = d3.json('https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/data/a-com2022.json');
    f_contours_communes.then(r=> {
        contours_communes = r;
        console.log({'time load contours communes': new Date()-t1});        
    });
    f_p2022_resultats_communes_t1 = d3.dsv(",", 'https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/data/p2022-resultats-communes-t1.csv');
    f_p2022_resultats_communes_t1.then(r=> {
        p2022_resultats_communes_t1 = r;
        console.log({'time load resultats communes': new Date()-t1})   
    });
    f_base_cc_com = d3.dsv(";", 'https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/data/base_cc_comparateur.CSV');
    f_base_cc_com.then(r=> {
        base_cc_com = r;
        console.log({'time load base_cc_comparateur': new Date()-t1})   
    });
    
    return [f_contours_communes, f_p2022_resultats_communes_t1, f_base_cc_com]
}

function prepare_data() {
    let fields_to_num_election=["Inscrits","Abstentions","Abstentions_ins","Votants","Votants_ins","Blancs","Blancs_ins","Blancs_vot","Nuls","Nuls_ins","Nuls_vot","Exprimés","Exprimés_ins","Exprimés_vot", "ARTHAUD.ins","ROUSSEL.ins","MACRON.ins","LASSALLE.ins","LE PEN.ins","ZEMMOUR.ins","MÉLENCHON.ins","HIDALGO.ins","JADOT.ins","PÉCRESSE.ins","POUTOU.ins", "LE PEN","ZEMMOUR","MÉLENCHON","HIDALGO","JADOT","PÉCRESSE","POUTOU","DUPONT-AIGNAN"];

    fields_to_num_election.forEach(f=> {
        p2022_resultats_communes_t1.forEach(r=> {
            r[f] = +r[f]
        })
    });

    //reconstruire nb votes tronqués
    p2022_resultats_communes_t1.forEach(r=> {
        r['ARTHAUD'] = (r['ARTHAUD.ins']*100)/r['Inscrits'];
        r['ROUSSEL'] = (r['ROUSSEL.ins']*100)/r['Inscrits'];
        r['MACRON'] = (r['MACRON.ins']*100)/r['Inscrits'];
        r['LASSALLE'] = (r['LASSALLE.ins']*100)/r['Inscrits'];
    });

    //constuire table de faits 
    var columns_to_transpose = [{field: 'POUTOU'}, {field: 'LE PEN'}, {field: 'MACRON'}, {field: "ROUSSEL"},
        {field: "ARTHAUD"}, {field:"LASSALLE"}, {field: "ZEMMOUR"}, {field:"MÉLENCHON"}, 
        {field: "HIDALGO"}, {field: 'JADOT'}, {field: "PÉCRESSE"}, {field: "DUPONT-AIGNAN"}];
    var columns_to_preserve = ['Inscrits', 'Votants', 'CodeInsee', 'Commune', 'CodeDepartement', "Abstentions","Abstentions_ins","Votants_ins","Blancs","Blancs_ins","Blancs_vot","Nuls","Nuls_ins","Nuls_vot","Exprimés","Exprimés_ins","Exprimés_vot"]
    var _args = {data: p2022_resultats_communes_t1, trans_column_name: 'Candidats', agg_column_name: 'candidats_voix', columns_to_preserve: columns_to_preserve, 
    columns_to_transpose: columns_to_transpose};
    r_elec_transposed=transpose_table(_args)



}
let p_load_data = load_data();

Promise.all(p_load_data).then(r=> {
    prepare_data();
    vedhu(r_elec_transposed, contours_communes.features)
})

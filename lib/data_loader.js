let contours_communes = [], p2022_resultats_communes_t1;

function load_data() {
    let t1=new Date();
    let f_contours_communes = d3.json('https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/data/a-com2022.json');
    f_contours_communes.then(r=> {
        contours_communes = r;
        console.log({'time load contours communes': new Date()-t1})   
    });
    let f_p2022_resultats_communes_t1 = d3.dsv(",", 'https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/data/p2022-resultats-communes-t1.csv');
    f_p2022_resultats_communes_t1.then(r=> {
        p2022_resultats_communes_t1 = r;
        console.log({'time load resultats communes': new Date()-t1})   
    });

    
    
}

load_data();

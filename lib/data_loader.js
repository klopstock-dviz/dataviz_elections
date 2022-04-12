let contours_communes = [];

function load_data() {
    let t1=new Date();
    let f_contours_communes = d3.json('https://raw.githubusercontent.com/klopstock-dviz/dataviz_elections/main/a-com2022.json');
    f_contours_communes.then(r=> {
        contours_communes = r;
        console.log({'time load contours communes': new Date()-t1})   
    })
    
}

load_data();

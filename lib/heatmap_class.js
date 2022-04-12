class heatmap {

	constructor(params_chart) {
		this.id = params_chart.id
		this.htmlNode = params_chart.htmlNode
	    this.x_values = params_chart.x_values
	    this.y_values = params_chart.y_values
	    this.numerical_field = params_chart.numerical_field
	    this.agg_fieldName = params_chart.numerical_field_params.agg_fieldName
	    this.title_x_axis = params_chart.title_x_axis
	    this.title_y_axis = params_chart.title_y_axis
	    this.label_tooltip = params_chart.label_tooltip		
	    this.title = params_chart.title
	    this.list_segments_selected = []
	    this.nb_categories = 2


	}

	createChart(params_chart, sharedParams, data_to_transform) {
    params_chart.instanciator = this
		params_chart.sharedParams = sharedParams
		//this.setup_funcLib(params_chart)
		
    	var data_filtred = this.prepare_data_p1(params_chart, sharedParams, data_to_transform)        

		this.prepare_data_p2(data_filtred, params_chart, sharedParams)


    detect_page_display(params_chart, sharedParams)
		
    params_chart.funcLib["init_chart"] = function (params_chart, sharedParams) {
      var chart_instance = params_chart.instanciator.init_chart(params_chart, sharedParams)		
      
      params_chart.chart_type = "d3"

      //add params chart to shared params if no present
      if (sharedParams.params_charts.includes(params_chart) === false) {
        //sharedParams.params_charts.push(params_chart)
      }
    }

	}

    prepare_data_p1(params_chart, sharedParams, data_to_transform) {
        var data_grouped = [];
        params_chart.data.forEach(o=> {
          //filter
          if (o.filter) {var data_filtred = o.source.filter(r=> o.filter.values.includes(r[o.filter.key]))}
          else {var data_filtred = o.source}
          //group & agg
          d3.nest().key(k=> k[o.group]).rollup(r=> d3[o.agg_type](r, f=> f[o.variable])).entries(data_filtred).forEach(r=> {      
            data_grouped.push({group: r.key, variable: o.alias || o.variable, relation: o.relation_type, value: r.value, symbol: o.symbol});
          })
      
        })
        return data_grouped
    }


    prepare_data_p2(data_filtred, params_chart, sharedParams) {
        params_chart.data_grouped = [...data_filtred]
    }

    init_chart(params_chart, sharedParams) {	
        //init shape, scales & axis

        if (!params_chart.margin || !compare_arrays(Object.keys(params_chart.margin), ['top', 'left', 'bottom', 'right'])) {
            params_chart.margin = {top: 80, right: 25, bottom: 30, left: 40}
        }
        
        
        var myGroups = d3.map(params_chart.data_grouped, function(d){return d.group;}).keys()
        var myVars = d3.map(params_chart.data_grouped, function(d){return d.variable;}).keys()
        params_chart.width = myGroups.length * 140 - params_chart.margin.left - params_chart.margin.right;
        params_chart.height = myVars.length * 50 //- params_chart.margin.top - params_chart.margin.bottom
        
        set_titles(params_chart)
        add_tooltips(params_chart)
        

        
        // append the svg object to the body of the chart node
            //create grid container for chart & legend
            // const container_chart_and_legend = document.createElement('div'); container_chart_and_legend.id = params_chart.id+"_container_chart_legend";
            // Object.assign(container_chart_and_legend.style, {display: "grid", 'grid-template-columns': "auto auto", width: "max-content"})
        let svg = d3.select("#"+params_chart.htmlNode).append('div').attr("id", "container_chart_legend_"+params_chart.id)
          .attr("style", "display: grid; grid-template-columns: auto auto auto; width: max-content")
        let container_chart_legend = d3.select("#container_chart_legend_"+params_chart.id)
        .append("svg")
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .attr("width", params_chart.width + params_chart.margin.left + params_chart.margin.right)
          .attr("height", params_chart.height*1.4 + params_chart.margin.top + params_chart.margin.bottom + 20)//
          .attr('id', 'svg_' + params_chart.id)
          .append("g")
          .attr("id", 'g_heatmap_' + params_chart.id)
          .attr("transform", `translate(${params_chart.margin.left*5}, ${params_chart.margin.top})`);
        
        
        // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
        var data = params_chart.data_grouped;
        data.forEach(r=> r.relation === 'nt' ? r.relation = 'znt' : {})
        if (data.find(f=> f.relation)) {data.sort(trier('relation', 'asc'))}
        
    
        var xScale = d3.scaleBand();
        var yScale = d3.scaleBand()

        params_chart.xScale = xScale; params_chart.yScale = yScale;
    
        var xAxisCall = d3.axisBottom();
        var yAxisCall = d3.axisLeft()
    
        var _this = this
        setScale1(xScale, yScale, xAxisCall, yAxisCall, params_chart, _this)
        initAxis(params_chart, xAxisCall,  yAxisCall)
        
        function set_titles(params_chart) {
          var htmlNode = document.getElementById(params_chart.htmlNode); 
          Object.assign(htmlNode.style, {display: 'grid', "grid-template-columns": "auto", "column-gap": "10px", width: 'max-content', height: "max-content", padding: "10px"});
        
          const titles_container = document.createElement('div'); Object.assign(titles_container.style, {display: "grid", height: "max-content"});
          var title = document.createElement('h3'); title.innerText = params_chart.title; Object.assign(title.style, {'display': 'flex', 'justify-content': 'center', height: "max-content", margin: "0px"});  
          var subtitle = document.createElement('h4'); subtitle.innerText = params_chart.subtitle; 
          Object.assign(subtitle.style, {'display': 'flex', 'justify-content': 'center', color: 'grey', height: "max-content", "params_chart.margin-top": "10px"})
          titles_container.append(title); titles_container.append(subtitle)
          htmlNode.append(titles_container);
        
          
        }
        
        function setScale1(xScale, yScale, xAxisCall, yAxisCall, params_chart, _this) {
            var calc_type='init';
            var data = _this.calc_score(params_chart.data_grouped, params_chart, calc_type)
        
            //sort data from highest score group to lowest
            data.sort(trier('score_group', 'desc'))
            var myGroups = d3.map(data, function(d){return d.group;}).keys()
        
            //cut long strings
            myGroups.forEach(g=> {
              if (g.length>20) {
                g = g.slice(0,20)+"..."}
            })
        
            if (data.find(f=> f.relation)) {data.sort(trier('relation', 'asc'))}
            var myVars = d3.map(data, function(d){return d.variable;}).keys()    
        
            xScale.domain(myGroups).range([0, params_chart.width/2]).padding(0.05)
            yScale.domain(myVars).range([params_chart.height, 0]).padding(0.05)
        
            xAxisCall.scale(xScale)
            yAxisCall.scale(yScale)    
            params_chart.xAxisCall = xAxisCall; params_chart.yAxisCall = yAxisCall
        
            params_chart.myGroups = myGroups; params_chart.myVars = [...myVars]; //params_chart.myVars = params_chart.myVars.reverse()
        
        }
        
        function initAxis(params_chart, xAxisCall, yAxisCall) {
            var x_axis_height = params_chart.height+10
            d3.select('#g_heatmap_'+params_chart.id).append("g")
                .attr("class", "x-axis")
                .attr("id", "x-axis_" + params_chart.id)
                .style("font-size", 15)
                .attr("transform", "translate(0,-10)")
                .call(xAxisCall.tickSize(0))
              .selectAll('text')
                .attr("transform", "translate(0," + -5 + ") rotate(-45)")
                .style("text-anchor", "start")
            //svg.select(".domain").remove()
            d3.select(`#x-axis_${params_chart.id} > path.domain`).remove()
        
            
            d3.select('#g_heatmap_'+params_chart.id).append("g")
                .attr("class", "y-axis")
                .attr("id", "y-axis_"+params_chart.id)
                .style("font-size", 12)
                .style("text-anchor", "end")    
                .call(yAxisCall.tickSize(0))
                //.select(".domain").remove()
            d3.select(`#y-axis_${params_chart.id} > path.domain`).remove()
        }

        function add_legend(params_chart) {
            const container_chart_and_legend = document.getElementById("container_chart_legend_"+params_chart.id)
        
            let watch_grouping_lines_formation = setInterval(()=> {
              //var groupingrects = document.getElementById('svg_'+params_chart.id)
              var groupingrects = document.querySelector('.grouping-rects-text_'+params_chart.id)
              if (groupingrects && groupingrects.getBoundingClientRect().width>10) {
                var y_pos = container_legend.parentElement.getBoundingClientRect().height*0.33
                // var pos_legend = container_legend.getBoundingClientRect().x;
                // var pos_group_lines = groupingrects.getBoundingClientRect().right + groupingrects.getBoundingClientRect().width/2
                // var gap_x = pos_legend - pos_group_lines; 
                // gap_x = 20 - gap_x
                var x_pos = 10
                Object.assign(container_legend.style, {transform: `translate(${window.innerWidth}px, ${y_pos}px)`, opacity: "1"})
                d3.select("#legend_"+params_chart.id)
                  .style("transform", `translate(${1080}px, ${y_pos})px`)
                  .style("opacity", "1")
                  .transition().duration(750)
                  .style("transform", `translate(${x_pos}px, ${y_pos}px)`)
        
                clearInterval(watch_grouping_lines_formation)
              }
            }, 1500)
        
            
            const container_legend = document.createElement('div'); container_legend.id = "legend_"+params_chart.id;Object.assign(container_legend.style, {display: "grid", 'grid-template-columns': "auto auto auto", width: "max-content", height: "max-content", position: "relative"})
            const container_text_legend = document.createElement('div'); Object.assign(container_text_legend.style, {display: "grid", 'grid-template-rows': "auto auto auto", "align-content": "space-between",
            "grid-column-gap": "1.5px"})
        
            const container_icon_cursor = document.createElement('div'); Object.assign(container_icon_cursor, {id: "cursor_legend_"+params_chart.id, style: "display: grid; grid-template-columns: auto auto; width: max-content; position: absolute; left: -6px; top: -6px; opacity: 0"})
            const text_cursor = document.createElement('span'); Object.assign(text_cursor, {id: "cursor_text_legend_"+params_chart.id, innerText: "0",
              style: "width: max-content; background-color: rgba(0, 0, 0, 0.7); color: white; font-size: 14px; padding: 2px 4px 2px 4px; border-radius: 5px; position: absolute; left: -32px; top: -3px; text-align: center;"})
            let icon_width = "6px"
            const icon_cursor = document.createElement('img'); icon_cursor.src = "css/font-awesome-svg/caret-right-solid.svg"; icon_cursor.style.width = icon_width
                        

            const container_text_excellent = document.createElement('div'); Object.assign(container_text_excellent.style, {display: "grid", 'grid-template-columns': "auto auto", height: "min-content", transform: "translate(0px, -5px)"})
            const icon_excellent = document.createElement('img'); icon_excellent.src = "css/font-awesome-svg/caret-left-solid.svg"; icon_excellent.style.width = icon_width
            const text_excellent = document.createElement('span'); text_excellent.innerText = 'Excellent'; Object.assign(text_excellent.style, {"font-size": "14px", color: "grey", transform: "translate(0px, -2px)"})
            container_text_excellent.append(icon_excellent); container_text_excellent.append(text_excellent)
            container_text_legend.append(container_text_excellent)
        
            const container_text_moyen = document.createElement('div'); Object.assign(container_text_moyen.style, {display: "grid", 'grid-template-columns': "auto auto", height: "min-content"})
            const icon_moyen = document.createElement('img'); icon_moyen.src = "css/font-awesome-svg/caret-left-solid.svg"; icon_moyen.style.width = icon_width
            const text_moyen = document.createElement('span'); text_moyen.innerText = 'Moyen'; Object.assign(text_moyen.style, {"font-size": "14px", color: "grey", transform: "translate(-4px, -2px)"})
            container_text_moyen.append(icon_moyen); container_text_moyen.append(text_moyen)
            container_text_legend.append(container_text_moyen)    
        
            
            const container_text_mediocre = document.createElement('div'); Object.assign(container_text_mediocre.style, {display: "grid", 'grid-template-columns': "auto auto", height: "min-content", transform: "translate(0px, 10px)"})
            const icon_mediocre = document.createElement('img'); icon_mediocre.src = "css/font-awesome-svg/caret-left-solid.svg"; icon_mediocre.style.width = icon_width
            const text_mediocre = document.createElement('span'); text_mediocre.innerText = 'Médiocre'; Object.assign(text_mediocre.style, {"font-size": "14px", color: "grey", transform: "translate(1px, -2px)"})
            container_text_mediocre.append(icon_mediocre); container_text_mediocre.append(text_mediocre)
            container_text_legend.append(container_text_mediocre)
        
            const grid_legend = document.createElement('div'); Object.assign(grid_legend.style, {display: "grid", width: "20px", height: "100px"})
            const img_legend = document.createElement("img");
            let src = "./img/legend_RdYlGn.png"
            Object.assign(img_legend, {src: src, style: `width: 20px; height: 100px; opacity: 1;`})
            grid_legend.append(img_legend)
        
            container_legend.style.opacity = '0'
            
            container_icon_cursor.append(text_cursor); container_icon_cursor.append(icon_cursor)
            
            container_legend.append(container_icon_cursor)
            container_legend.append(grid_legend)
            container_legend.append(container_text_legend)
            
            //chart_node.style.display.gridT
            container_chart_and_legend.append(container_legend)
        
        }
        
        function add_tooltips(params_chart) {
          //add tooltip container to the page
          d3.select('body')
          .append('div')
          .attr('id', 'tooltip_' + params_chart.id)
          .attr('style', 'position: absolute; opacity: 0; background-color: #000000d1; padding: 4px; border-radius: 5px; display: none; height: 30px; font-size: 14px')
          .append('span').attr('style', 'color: white; font-size: 13px; font-weight: bold').attr("class", 'tooltip_text_'+params_chart.id).text("xxx")
          .append('span').attr('style', 'color: white; font-size: 13px; font-weight: bold').attr("class", 'tooltip_text_'+params_chart.id).text("xxx");
        }

        params_chart.funcLib.add_params_menu = function (params_chart, node_icon, node_panel, x, y) {


            d3.select('#g_heatmap_'+params_chart.id)
              .append("svg:foreignObject")
              .attr('id', "container_button_params_panel_"+params_chart.id)
              .attr("x", x)
              .attr("y", y-15)
              .attr("width", "100px").attr("height", "50px")
              .html(`<button id="parameters_score_${params_chart.id}" class="w3-button w3-ripple w3-red w3-round" style="border-radius: 5px; width: 85px; height: max-content; padding: 3px; white-space: normal; font-size: 14px; opacity: 0.65">Paramétrez le score</span>`) //style="position: absolute; top: $${y}; left
              .on('click', e=> {
                var x = document.getElementById("container_button_params_panel_"+params_chart.id).getBoundingClientRect().x+20
                var y = document.getElementById("container_button_params_panel_"+params_chart.id).getBoundingClientRect().y
                var width = document.getElementById("y-axis_"+params_chart.id).getBBox().width;
                var height = document.getElementById("y-axis_"+params_chart.id).getBBox().height
  
                if (document.getElementById("params_panel_"+params_chart.id).childElementCount === 1) {
                  add_param_items(params_chart, node_panel)
                }
  
                if (document.querySelector("#params_panel_"+params_chart.id).style.opacity === "0") {
                  expand_panel(params_chart, "1", "grid", x,y,height, 500)
                  //hide target html elements
                  display_adjacent_elements(params_chart, '0', 'none')
                }
                else {
                  expand_panel(params_chart, "0", "none", x,y,height, 500)
                  //display target html elements
                  display_adjacent_elements(params_chart, '1', 'grid')
                }
              })
              document.getElementById('parameters_score_'+params_chart.id).style.color = 'white'


          node_panel
          .append("div")          
          .attr("id", "params_panel_"+params_chart.id)
          .attr("class", "w3-card-2")
          .style("left", x).style("top", y+20).style("width", "40px").style("height", "40px").style("background-color", "white").style("opacity", "0").style("position", "absolute")
          .style("border-radius", "5px").style("display", "grid").style("padding", "6px")//.style("grid-template-column", "auto")
          .append('img').attr("src", "css/font-awesome-svg/window-close-solid.svg").style('width', '16px').style('transform', 'translate(1px, -2px)').style('justify-self', 'end')
          .on('click', e=> {
            var height = document.getElementById("y-axis_"+params_chart.id).getBBox().height
            document.getElementById('params_panel_'+params_chart.id).style.opacity = '0'
            //display target html elements
            params_chart.panel_param_score.elements_toHide_onPanelDisplay.forEach(e=> {
              //check if the target element is a leaflet map, is so include its context
              if (!d3.select('#'+e).empty() && (document.getElementById(e).hasOwnProperty('_leaflet_events') || document.getElementById(e).hasOwnProperty('_leaflet_id'))) {
                d3.select('#grid_title_controls_map_legend_'+e).transition().duration(400).style('opacity', '1').style('display', 'grid')
              }
              else if (!d3.select('#'+e).empty()) {d3.select('#'+e).transition().duration(400).style('opacity', '1').style('display', 'grid')}
            })
          })
          .on('mouseover', function(d) {
            d3.select(this).style("cursor", "pointer");  this.style.filter = 'invert(11%) sepia(98%) saturate(7075%) hue-rotate(0deg) brightness(105%) contrast(109%)'})
          .on('mouseout', function(d) {this.style.filter = ''})
          //add text definition

          window.addEventListener("keydown",(e)=> {
            if (e.code === "Escape" && document.getElementById("params_panel_"+params_chart.id).style.opacity==='1') {
              var x = document.getElementById("container_button_params_panel_"+params_chart.id).getBoundingClientRect().x+20
              var y = document.getElementById("container_button_params_panel_"+params_chart.id).getBoundingClientRect().y
              var width = document.getElementById("y-axis_"+params_chart.id).getBBox().width;
              var height = document.getElementById("y-axis_"+params_chart.id).getBBox().height

              expand_panel(params_chart, "0", "none", x,y,height, 500)
              display_adjacent_elements(params_chart, '1', 'grid')

            }
            });

          //add params
          function add_param_items(params_chart) {
            let node_panel_js = document.getElementById("params_panel_"+params_chart.id)
    
            //add the headers
            d3.select("#params_panel_"+params_chart.id)
            .append('div').attr('class', 'w3-container').attr('id', 'text_def_variables_'+params_chart.id)
            .style("background-color", "#f4f1f1")
              .style("display", "grid")
              .style('justify-content', 'center')
              .style("width", "90%")
              .style("justify-self", "center")
              .style("border-radius", "7px")
              .style("border", "solid 1.5px red")
              .style("transform", "translate(0px, -6px)")
            .append('p')
            .style('font-size', '13px').style("text-align", "center").style('width', "max-content").style('margin', '0px')
            .text("Pondérez l'importance des variables")
            .append('p').style('margin', '0px').text("avec le coefficient correspondant")
            //d3.select('#text_def_variables_'+params_chart.id)

            var param_container = document.createElement('div'); Object.assign(param_container.style, {"display": "flex", "column-gap": "20px", "align-items": "center", "justify-content": "space-between"})            
            var param_text = document.createElement('span'); Object.assign(param_text, {className: "", innerText: "Variables"}); Object.assign(param_text.style, {"font-size": "13px", "border-radius": "2px", padding: "4px", "font-weight": "bold"})
            var param_value = document.createElement('span'); Object.assign(param_value.style, {"font-size": "13px", width: "max-content", "font-weight": "bold"}); param_value.innerText = 'Coefficient'
            param_container.append(param_text, param_value); 
            node_panel_js.append(param_container)

            let myVars = [...params_chart.myVars]
            //myVars.reverse().forEach(v=> {
            
            for (var i = myVars.length - 1; i >= 0; i--) {
              var v = myVars[i]
            
              var param_container = document.createElement('div'); param_container.className="param_score_text"; Object.assign(param_container.style, {"display": "flex", "column-gap": "20px", "align-items": "center", 
              "justify-content": "flex-end"})
              
              var param_text = document.createElement('span'); Object.assign(param_text, {className: "w3-card", innerText: v+":"}); 
              Object.assign(param_text.style, {"font-size": "12px", "border-radius": "2px", padding: "4px"})

              var param_value = document.createElement('input'); Object.assign(param_value, {type: "number", value: "1", min: "0", max: "5", step: "0.1", id: "params_panel_input_"+v})
              Object.assign(param_value.style, {"font-size": "12px", width: "45px", "border-radius": "2px", "border-width": "1px"})

              param_container.append(param_text);
              param_container.append(param_value);
              node_panel_js.append(param_container)
            //})
            }
            //add validation button
            var param_validation_button = document.createElement('button'); Object.assign(param_validation_button,{className: "w3-button w3-ripple w3-red w3-round", innerText: 'Valider'});
            param_validation_button.style="width: max-content; height: max-content; font-size: 12px; align-self: end; justify-self: end;"
            
            param_validation_button.addEventListener('click', e=> {
              //collect values of the panel
              params_chart.id_previous_panel_param_score = Object.values(params_chart.panel_param_score).join()
              Object.values(node_panel_js.children).forEach(p=> {
                //if (params_chart.panel_param_score === {}) {trigger_update = true}
                if (p.classList.contains('param_score_text') && p.firstElementChild && p.firstElementChild.innerText !== 'Variables') {
                  //record param value
                  params_chart.panel_param_score[p.firstElementChild.innerText.replace(":","")] = p.firstElementChild.nextElementSibling.value
                }
              })

              params_chart.id_current_panel_param_score = Object.values(params_chart.panel_param_score).join()

              if (params_chart.id_previous_panel_param_score !== params_chart.id_current_panel_param_score) {
                params_chart.instanciator.updateAxis(params_chart, sharedParams)
                console.log('trigger chart update')
              }
            })
            
            node_panel_js.append(param_validation_button)

          }

          function expand_panel(params_chart, opacity, display, x, y, height, duration) {
            d3.select("#params_panel_"+params_chart.id)
            .style("left", x).style("top", y-height/2-20).style('width', 'max-content').style('height', height+85)
            .transition().duration(duration)
            .style("opacity", opacity).style("display", display)
          }

          function display_adjacent_elements(params_chart, opacity, display) {
            //display target html elements
            params_chart.panel_param_score.elements_toHide_onPanelDisplay?.forEach(e=> {
              //check if the target element is a leaflet map, is so include its context
              if (!d3.select('#'+e).empty() && (document.getElementById(e).hasOwnProperty('_leaflet_events') || document.getElementById(e).hasOwnProperty('_leaflet_id'))) {
                d3.select('#grid_title_controls_map_legend_'+e).transition().duration(400).style('opacity', opacity).style('display', display)
              }
              else if (!d3.select('#'+e).empty()) {d3.select('#'+e).transition().duration(400).style('opacity', opacity).style('display', display)}
            })            
          }
        }
    
        //draw rects
		var data_type = "data"; var injection_type = "init"; var updateTime = undefined
		this.inject_metadata(params_chart, injection_type, sharedParams)

    
    document.getElementById(params_chart.htmlNode).style.height = "max-content"
    add_legend(params_chart)



    }

    inject_metadata(params_chart, injection_type, sharedParams) {
        if (injection_type === 'init') {
          var data = params_chart.data_grouped
        }
        else if (injection_type === 'update'){
          var data = params_chart.data_grouped_update
        }
        
        data.forEach(r=> r.relation === 'nt' ? r.relation = 'znt' : {})
        if (data.find(f=> f.relation)) {data.sort(trier('relation', 'asc'))}
        var myGroups = d3.map(data, function(d){return d.group;}).keys()
        var myVars = d3.map(data, function(d){return d.variable;}).keys()
    
        
        let g_heatmap = d3.select('#g_heatmap_'+params_chart.id)
    
    
    
        
        
        let rects = g_heatmap.selectAll(".rects_"+params_chart.id)


        //ajust the pos of the heatmap container
        if (d3.select('#g-rects_'+params_chart.id).empty()) {
          let translateY = document.querySelectorAll('#x-axis_'+params_chart.id)[0].getBBox().height*1.05
          let translateX = document.querySelector('#y-axis_'+params_chart.id).getBBox().width
          d3.select("#g_heatmap_"+params_chart.id).attr('transform', `translate(${translateX}, ${translateY})`)
    
        }
        
        //draw or re-draw rects if the position of the groups of variables has changed
        if (injection_type === 'init' || (injection_type === 'update' && params_chart.redraw_rects)) {
          rects.remove()
          let countRows = 0
          let transition_duration = params_chart.transitions.find(e=> e.injection_type === injection_type).duration;
          let transition_delay = params_chart.transitions.find(e=> e.injection_type === injection_type).delay;
          myVars.forEach(v=> {
            var dataset = data.filter(r=> r.variable === v)

          // Build color scale
            var min = d3.min(dataset, r=> r.value); 
            var max = d3.max(dataset, r=> r.value)
            
      
            if (dataset.find(e=> e.relation)?.relation === "po") {
              var myColor = d3.scaleSequential()
                .interpolator(d3.interpolateRdYlGn)
                .domain([min,max])
            }
            else if (dataset.find(e=> e.relation)?.relation === "ng") {
              var myColor = d3.scaleSequential()
                .interpolator(d3.interpolateRdYlGn)
                .domain([max,min])
            }
            else {
                var myColor = d3.scaleSequential()
                .interpolator(d3.interpolateBlues)
                .domain([min,max])
              
            }
      
            // add the rects
            rects = g_heatmap.selectAll(".rects_"+params_chart.id)
              .data(dataset, function(d) {return d.group+':'+d.variable;})
      
            try {
              rects.enter()
                .append("rect")
                  .attr("class", "rects_"+params_chart.id)
                  .attr("data-row-id", countRows)
                  //.attr("x", 0)
                  //.transition().duration(400)
                  .attr("x", function(d) { return params_chart.xScale(d.group)})//  + params_chart.margin.right
                  .attr("y", function(d) { return params_chart.yScale(d.variable)})//+params_chart.margin.bottom- 0
                  .attr("rx", 4)
                  .attr("ry", 4)    
                  .attr("width", 0)
                  .attr("height", 0)
                  .style("fill", function(d) { return myColor(d.value)} )   
                  .attr("data-relation", d=> d.relation)                
                  /*.style("stroke-width", 4)
                  .style("stroke", "none")*/
                  .style("opacity", 0.7)
                  .on('mouseover', function(d) {
                    //remove previous text
                    d3.selectAll('.tooltip_text_'+params_chart.id).remove()

                    let title = d.group, subtitle = d.variable
                    //manage tooltip
                    title.length>17 ? title = title.slice(0, 10)+"..."+ title.slice(title.length-4, title.length) : {}
                    //subtitle.length>17 ? subtitle = subtitle.slice(0, 12)+"..."+ subtitle.slice(subtitle.length-4, subtitle.length) : {}
                    subtitle.length>17 ? subtitle = subtitle.slice(0, 12)+"..." : {}
                    let value; d.symbol ? value = d.value.toFixed(2) + " " + d.symbol : value = d.value.toFixed(2)
                    //d3.select('#tooltip_'+params_chart.id).transition().duration(400).style('opacity', 1).text(value)
                    d3.select('#tooltip_'+params_chart.id).transition().duration(transition_duration).style('opacity', '1').style('display', 'grid').style('height', 'unset')
                    d3.select('#tooltip_'+params_chart.id).append('span').attr('style', 'color: white; font-size: 13px; font-weight: bold').attr("class", 'tooltip_text_'+params_chart.id).text(title)
                    d3.select('#tooltip_'+params_chart.id).append('span').attr('style', 'color: white; font-size: 12px').attr("class", 'tooltip_text_'+params_chart.id).text(subtitle + ": " + value)
                    
                    manage_legend_arrow(params_chart, d, value, data)

                  })
                  .on('mouseout', function(e) {
                    d3.select('#tooltip_'+params_chart.id).style('opacity', '0').style('display', 'none')
                    d3.select("#cursor_text_legend_"+params_chart.id).style('opacity', '0')
                    d3.selectAll('.tooltip_text_'+params_chart.id).remove()
                  })
                  .on('mousemove', function(e) {
                    d3.select('#tooltip_'+params_chart.id)
                    .style('left', (d3.event.pageX+10) + 'px')
                    .style('top', (d3.event.pageY+10) + 'px')                
                  }) 
            }
            catch(err) {
              console.error(err)
            }
          })
          countRows+=

          rects = g_heatmap.selectAll(".rects_"+params_chart.id)
          if (injection_type === "init") {
            var width = params_chart.xScale.bandwidth()
            params_chart.xScale_bandwidth = width
          }
          else if (injection_type === "update") {
            var width = params_chart.xScale_bandwidth
          }
            
          rects.exit()      
            .merge(rects).transition()
            .duration(transition_duration).delay(transition_delay)
            //.delay(500)
            //.attr("y", (d)=> yScale(d.title))
            //.attr("width", (d)=> xScale(d.value) - params_chart.margin.left);
            .attr("width", width)
            .attr("height", params_chart.yScale.bandwidth() )
                
      
          let monitor_tooltip_state = setInterval(() => {
            let tooltip_text = d3.selectAll('.tooltip_text_'+params_chart.id)
            if (tooltip_text.empty()) {d3.select('#tooltip_'+params_chart.id).style('opacity', '0').style('display', 'none')}
          }, 10);
      
        }



        var synth={};
        data.forEach(o=> synth[o.group] = {com: o.group, score_group: o.score_group})

        if (injection_type === 'init') {
          var delay_score = 1200
        }
        else if (injection_type === 'update' && (params_chart.redraw_rects || params_chart.redraw_groupingrects)) {
          var delay_score = 750
        }
        setTimeout(()=> {
            this.build_score_structure(params_chart, synth)
        }, delay_score)

        if (injection_type === 'init' || (injection_type === 'update' && params_chart.redraw_groupingrects)) {
          setTimeout(()=> this.build_lineGroups(params_chart), 750)
        }

        function manage_legend_arrow(params_chart, d, value, data) {
          var dataset = data.filter(o=> o.variable === d.variable)
          var min = d3.min(dataset, r=> r.value);               
          var max = d3.max(dataset, r=> r.value)
          if (dataset.find(o=> o.relation).relation === 'po') {
            var scale = d3.scaleLinear().range([0, 100]).domain([min, max]);
          }
          else if (dataset.find(o=> o.relation).relation === 'ng') {                
            var scale = d3.scaleLinear().range([100, 0]).domain([min, max])
          }
          if (scale(d.value) > 95) {var arrow_pos = 100 - scale(d.value) - 4}
          else {var arrow_pos = 100 - scale(d.value) - 10}                
          

          d3.select('#cursor_legend_'+params_chart.id).transition().duration(750).style('top', arrow_pos+"px").style('opacity', '1');
          d3.select("#cursor_text_legend_"+params_chart.id).style('opacity', '0').text(value)
          var width = (document.querySelector("#cursor_text_legend_"+params_chart.id).getBoundingClientRect().width + 2)*-1+"px"
          d3.select("#cursor_text_legend_"+params_chart.id).style('opacity', '0').transition().duration(750).style("left", width).style('opacity', '1')        
        }        
    }
    

    updateAxis(params_chart, sharedParams){
      //params_chart.xScale = xScale; params_chart.yScale = yScale;

      let transition_duration = params_chart.transitions.find(e=> e.injection_type === "update").duration;
      let transition_delay = params_chart.transitions.find(e=> e.injection_type === "update").delay;

      var t = d3.transition().duration(transition_duration)          
      
      var axisCall = updateScale(params_chart.xScale, params_chart.yScale, params_chart)
      
      //remove previous elements
      d3.selectAll('.score_'+params_chart.id).remove()
      params_chart.redraw_groupingrects = false
      params_chart.redraw_rects = false
      //delete previous grouping elements if the nb of variables has been changed
      if (params_chart.data_grouped_previous.length !== params_chart.data_grouped_current.length) {
        d3.selectAll('.grouping-rects_'+params_chart.id).remove()
        d3.selectAll('.grouping-rects-text_'+params_chart.id).remove()
        d3.selectAll('.foreignObject_question_icon_'+params_chart.id).remove()
        params_chart.redraw_groupingrects = true
        params_chart.redraw_rects = true
      }
      
      //re-draw the rects if the position of the groups has changed      
      var g1=_.groupBy(params_chart.data_grouped_previous, 'group'), g2=_.groupBy(params_chart.data_grouped_current, 'group')
      var scores_g1=[];Object.keys(g1).forEach(k=> scores_g1.push({group: k, score_group: g1[k][0].score_group}))
      var scores_g2=[];Object.keys(g2).forEach(k=> scores_g2.push({group: k, score_group: g2[k][0].score_group}))
      if (scores_g1.map(e=> e.group).join() !== scores_g2.map(e=> e.group).join()) {
        params_chart.redraw_rects = true
      }

      d3.select("#x-axis_"+params_chart.id)
          .transition(t).delay(transition_delay)
          .call(axisCall.xAxisCall)
        .selectAll('text')
          .attr("transform", "translate(0," + -5 + ") rotate(-45)")
          .style("text-anchor", "start")
  
      d3.select("#y-axis_"+params_chart.id)
          .transition(t).delay(transition_delay)
          .call(axisCall.yAxisCall)
      d3.select(`#x-axis_${params_chart.id} > path.domain`).remove(); d3.select(`#y-axis_${params_chart.id} > path.domain`).remove()
  
      
      var data_type = "data"; var injection_type = "update"; var updateTime = undefined
      this.inject_metadata(params_chart, injection_type, sharedParams)
          

      function updateScale(xScale, yScale, params_chart) {
        var myVars = []; 
        Object.keys(params_chart.panel_param_score).forEach(k=> {if (params_chart.panel_param_score[k] !== '0') {myVars.push(k)  } })
        //delete 'elements_toHide_onPanelDisplay' value
        let pos_p = myVars.findIndex(e=> e==="elements_toHide_onPanelDisplay")
        pos_p>-1 ? myVars.splice(pos_p, 1) : {}
        myVars.reverse()

        var data = params_chart.data_grouped.filter(o=> myVars.includes(o.variable))
        var calc_type='update';
        data = params_chart.instanciator.calc_score(data, params_chart, calc_type)
    
        //sort data from highest score group to lowest
        data.sort(trier('score_group', 'desc'))

        
        var myGroups = d3.map(data, function(d){return d.group;}).keys()
        myGroups.forEach(g=> {g = g.slice(0,25)})
    
        if (data.find(f=> f.relation)) {data.sort(trier('relation', 'asc'))}
        //var myVars = d3.map(data, function(d){return d.variable;}).keys()    
        
        params_chart.xScale.domain(myGroups).range([0, params_chart.width/2]).padding(0.2)
        params_chart.yScale.domain(myVars).range([params_chart.height, 0]).padding(0.05)
    
        params_chart.xAxisCall.scale(params_chart.xScale);
        params_chart.yAxisCall.scale(params_chart.yScale);
    
        //trace current & previous version of data object
        params_chart.data_grouped_update ? params_chart.data_grouped_previous = params_chart.data_grouped_update : params_chart.data_grouped_previous = params_chart.data_grouped
        params_chart.data_grouped_current = data
        params_chart.data_grouped_update = data

        return {xAxisCall: params_chart.xAxisCall, yAxisCall: params_chart.yAxisCall}
      }
    
  }    
  





    consolidation_charts_datasets(sharedParams, group) {
        var data=[];
        sharedParams.params_charts.forEach(p=> {
            if (p.data_input) {
                if (p.numerical_field_params.computed_field_name) {
                    var variable = p.numerical_field_params.computed_field_name
                }
                else if (p.numerical_field_params.agg_fieldName) {
                    var variable = p.numerical_field_params.agg_fieldName
                }
                p.data_input.forEach(r=> {
                    var row = {}
                    if (r[group]) {
                        row['group'] = r[group]
                        p.numerical_field_params.alias ? row['variable'] = p.numerical_field_params.alias : row['variable'] = p.numerical_field_params.fieldName
                        row['value'] = r[variable]
                    }
                    Object.keys(row).length>0 ? data.push(row) : {}
                })
            }
        })
        return data
    }


    get_rect_border_position(tag, axis, position) {
        let shapes = document.querySelectorAll(tag);
        if (position === "left" || position === "top") {
          position = "min"
        }
        if (position === "right" || position === "bottom") {
          position = "max"
        }

        if (shapes && Object.values(shapes) && Object.values(shapes)[0] && Object.values(shapes)[0].x) {
          var pos = d3[position](Object.values(shapes), r=> r[axis].animVal.value)
        }
        else if (shapes && Object.values(shapes) && Object.values(shapes)[0]) {
          var pos = "method unknow"
        }        
        
        return pos
    }
    
    calc_score(data, params_chart, calc_type) {
        //add prefix to neutral relations code (nt->)
        data.forEach(r=> r.relation === 'nt' ? r.relation = 'znt' : {})
      
        let myVars = d3.map(data, d=> d.variable).keys()
        //build score for variables
        myVars.forEach(v=> {
          var dataset = data.filter(r=> r.variable === v)

          dataset.forEach(r=> {        
            //calc score according to the relation type
            //check if there is a coeff for the score
            if (calc_type === 'init') {var coeff = 1} 
            else if (calc_type === 'update') {var coeff = +params_chart.panel_param_score[r.variable]}

            if (r.relation === "po") {
              //r['score_variable'] = (r.value*100) / d3.max(dataset, f=> f.value) 
              var max = d3.max(dataset, f=> f.value), min = d3.min(dataset, f=> f.value)  
              var scale = d3.scaleLinear().range([0, 100]).domain([min, max])
              r['score_variable'] = scale(r.value)*coeff;
              r['score_raw'] = scale(r.value)*coeff;
            }
            else if (r.relation === 'ng') {
              //r['score_variable'] = (d3.min(dataset, f=> f.value)*100) / r.value
              var max = d3.max(dataset, f=> f.value), min = d3.min(dataset, f=> f.value)  
              var scale = d3.scaleLinear().range([0, 100]).domain([max, min])
              r['score_variable'] = scale(r.value)* coeff;
              scale = d3.scaleLinear().range([0, 100]).domain([min, max])
              r['score_raw'] = scale(r.value)*coeff;
            }
      
          })
        })
      
        //build score for groups
        let myGroups = d3.map(data, function(d){return d.group;}).keys()
        var synth={}; 
        myGroups.forEach(g=> {
          var dataset = data.filter(r=> r.group === g); 
          synth[g] = {group: g, score_group: d3.mean(dataset, e=> e.score_variable) } 
        })
        data.forEach(r=> {r.score_group = synth[r.group].score_group})
        return data
    }

    

    build_lineGroups(params_chart) {
        let g_heatmap = d3.select('#g_heatmap_'+params_chart.id)
        // if (d3.select('#g-groupings_'+params_chart.id).empty()) {
             d3.select("#g_heatmap_"+params_chart.id).append("g").attr('id', "g-groupings_"+params_chart.id)
        // }
      
        //1.get pos of ng & po rects
        var _g_rects = document.querySelectorAll('.rects_'+params_chart.id)
        var arr_width_rects = Object.values(_g_rects).map(c=> c.x.animVal.value)
        var arr_height_rects_ng = Object.values(_g_rects).filter(c=> c.__data__.relation === 'ng').map(c=> c.y.animVal.value)
        var arr_height_rects_po = Object.values(_g_rects).filter(c=> c.__data__.relation === 'po').map(c=> c.y.animVal.value)
        var min_ng = d3.min(arr_height_rects_ng), max_ng = d3.max(arr_height_rects_ng);        
        var min_po = d3.min(arr_height_rects_po), max_po = d3.max(arr_height_rects_po);
        
    
        //3.add new groupings
        let g_grouping_lines = d3.select('#g-groupings_'+params_chart.id)
        //get the pos of x axis                  
        //1.get the x & width of all rects
        var rects=[]; Object.values(_g_rects).forEach(b=> rects.push({x: b.x.animVal.value, w:b.width.animVal.value}))
        //2.get the rects in the right side of the chart
        var x_pos_base = d3.max(rects,b=> b.x);
        var rects_right = rects.filter(r=> r.x===x_pos_base);
        //3.get the witdh of the largest rect
        var width_rect_max = d3.max(rects_right, r=> r.w)
        //4.calc the x position of the lines      
        let pos_x = (x_pos_base+width_rect_max)*1.1
        
        var type_rects = ['ng', 'po']
        let translate_x_line = this.get_rect_border_position(".rects_"+params_chart.id, "x", "max") + params_chart.xScale.bandwidth() + 20

        type_rects.forEach(type=> {
            var arr_height_rects = Object.values(_g_rects).filter(c=> c.__data__.relation === type).map(c=> c.y.animVal.value)
            var min_height = d3.min(arr_height_rects), max_height = d3.max(arr_height_rects);
    
            var height_max_rect = d3.max(Object.values(_g_rects).filter(c=> c.__data__.relation === type), c=> c.__data__.height)
            height_max_rect = 20
            g_heatmap.append('line')
            .attr('class', 'grouping-rects_'+params_chart.id)            
            .attr('id', 'grouping-rects-'+type+"_"+params_chart.id)
            .attr("transform", `translate(${0},${(0)})`)
            .attr('x1', translate_x_line).attr('y1', translate_x_line+3)
            .attr('x2', translate_x_line).attr('y2', translate_x_line-3)
            .transition().duration(500)
            .attr('x1', translate_x_line).attr('y1', min_height+3)// - height_max_rect)
            .attr('x2', translate_x_line).attr('y2', max_height + params_chart.yScale.bandwidth() -3)
            .attr("style" ,"stroke:rgba(82, 82, 82, 0.7);stroke-width:1.5")
    
            
            // Add title to the grouping
            setTimeout(()=> {
            var lineStart = document.querySelector('#grouping-rects-'+type+'_'+params_chart.id).getBBox().y;
            var lineHeight = lineStart + document.querySelector('#grouping-rects-'+type+'_'+params_chart.id).getBBox().height/2;
            type === 'po' ? type = 'positive' : type = 'négative';
            
            var texts = ["Relation ", type]    
            var p = 0
            texts.forEach(text=> {            
                g_heatmap.append("text")
                .attr("class", "grouping-rects-text_"+params_chart.id)
                .attr("x", translate_x_line*1.05)
                .attr("y", lineStart+p)
                .attr("transform", `translate(${0},${(0)})`)
                .transition().duration(750)
                .attr("x", translate_x_line*1.05)
                .attr("y", lineHeight+p)
                .attr("text-anchor", "left")
                .style("font-size", "14px").style("fill", "grey")
                //.style("max-width", 400)
                .text(text);  
                p = p+15
            })

            //add question tag            
            g_heatmap.append("svg:foreignObject")
              .attr("width", "16px").attr("height", "16px")
              .attr("class", 'foreignObject_question_icon_'+params_chart.id)
              .attr("x", translate_x_line*1.05)
              .attr("y", lineHeight+p)   
              .style("transform", "translate(10px, -5px)")
              .attr("id", "foreignObject"+type)
              .html('<img src="css/font-awesome-svg/question-circle-regular.svg" style="width: 16px;">')
              .on('mouseover', function(d) {
                //remove previous text
                d3.selectAll('.tooltip_text_'+params_chart.id).remove()
                //add text
                var text1 = "", text2=""
                type === 'positive' ? text1 = "Un chiffre plus grand correspond " : text1 = "Un chiffre plus petit correspond ";
                type === 'négative' ? text2 = "à une meilleure situation" : text2 = "à une meilleure situation";
                
                d3.select('#tooltip_'+params_chart.id).transition().duration(400).style('opacity', '0.8').style('display', 'grid').style('height', 'unset')
                d3.select('#tooltip_'+params_chart.id).append('span').attr('style', 'color: white; font-size: 12px; font-weight: normal').attr("class", 'tooltip_text_'+params_chart.id).text(text1) 
                d3.select('#tooltip_'+params_chart.id).append('span').attr('style', 'color: white; font-size: 12px; font-weight: normal').attr("class", 'tooltip_text_'+params_chart.id).text(text2) 
              })
              .on('mouseout', function(e) {
                d3.select('#tooltip_'+params_chart.id).style('opacity', '0').style('display', 'none')
                d3.select("#cursor_text_legend_"+params_chart.id).style('opacity', '0')
                d3.selectAll('.tooltip_text_'+params_chart.id).remove()
              })
              .on('mousemove', function(e) {
                d3.select('#tooltip_'+params_chart.id)
                .style('left', (d3.event.pageX+10) + 'px')
                .style('top', (d3.event.pageY+10) + 'px')                
              })              

    
            },550)
            
    
    
        })
    }
    
    build_score_structure(params_chart, score) {
        const mapNode = d3.select('#g_heatmap_'+params_chart.id)
        //let pos_rects = document.getElementById('g-rects_'+params_chart.id).getBoundingClientRect(), y_pos = pos_rects.bottom - pos_rects.y + 80
        let y_pos = this.get_rect_border_position(".rects_"+params_chart.id, "y", "max") + params_chart.yScale.bandwidth() + 20
        
    
        
        //add separation line
        let x2 = this.get_rect_border_position(".rects_"+params_chart.id, "x", "max") + params_chart.yScale.bandwidth()
        mapNode.append('line')
          .attr('class', 'score_'+params_chart.id)
          .attr('id', 'score-line-sep_'+params_chart.id)
          .attr("transform", `translate(0,${y_pos})`)
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', 0).attr('y2', 0)
          .transition().duration(500)
          .attr('x2', x2)
          .attr("style" ,"stroke:rgba(82, 82, 82, 0.7);stroke-width:1.5")
    
    
    
        // Build color scale        
        var min = d3.min(Object.values(score), v=> v.score_group), max = d3.max(Object.values(score), v=> v.score_group)
          var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateRdYlGn)
            .domain([0,100])    
    
        let x_pos=0;
        let rects = document.querySelectorAll(".rects_"+params_chart.id)
        Object.values(score).forEach(o=> {
          //get the item ref
          var ref = o.com
    
          //loop through the rects shapes
          let createElement = false
          Object.values(rects).forEach(rect=> {
            if (rect.__data__.group === ref && !createElement) {
              x_pos = params_chart.xScale(ref) + params_chart.xScale.bandwidth()/2
              //setup the color of the text
              if (o.score_group < 36 || o.score_group > 65) {var text_color = 'white'}
              else {var text_color = 'grey'}
              //create circle shape to display the result
              mapNode
                .append('circle').attr("cx", x_pos).attr("cy", y_pos+40).attr("class", "score_"+params_chart.id)
                .attr('r', 0)
                .transition().duration(1000)      
                .attr('r', 20)
                .attr("fill", myColor(o.score_group))
                mapNode
                .append("text").attr("class", "score_"+params_chart.id)
                .attr("x", x_pos).attr("y", y_pos + 47)
                .attr("text-anchor", "middle")
                .attr("style", "font-size", "0px").style("fill", "none")
                .transition().duration(1000)                        
                .attr("style", "font-size", "20px").style("fill", text_color).style("font-weight", "bold").text(Math.floor(o.score_group))
    
              createElement = true
            }
          })
        })

        //add params icon
        if (!document.querySelector('#container_button_params_panel_'+params_chart.id)) {
          let node_panel = d3.select("#"+params_chart.htmlNode)
          params_chart.funcLib.add_params_menu(params_chart, mapNode, node_panel, x_pos+params_chart.xScale.bandwidth(), y_pos+40-7)
        }
    
        
        //adjust pos of g-score shape
        // x_pos = pos_rects.left - document.getElementById('g-score_'+params_chart.id).getBoundingClientRect().left
        // mapNode.select('#g-score_'+params_chart.id).attr('transform', `translate(${0}, ${y_pos})`)
    
    
        mapNode.append('text')
            .attr("class", "score_"+params_chart.id).attr("x", -60).attr("y", y_pos+7).attr("style", "font-size: 18px").text('Score: ')
    
        let watch_grouping_lines_formation2 = setInterval(()=> {
          var legend_build = document.getElementById('legend_'+params_chart.id)
          if (!params_chart['height_adjusted'] && legend_build.getBoundingClientRect().width>10) {
            var container_h = document.getElementById('g_heatmap_'+params_chart.id).getBBox().height + params_chart.margin.bottom
            //var container_w = d3.map(params_chart.data_grouped, function(d){return d.group;}).keys().length * 155;
            var container_w = document.querySelector("#g_heatmap_"+params_chart.id).getBoundingClientRect().width//*1.1
            
            //redim parent svg container
            let parentSvgElement = document.getElementById('svg_'+params_chart.id);
            parentSvgElement.setAttribute('width', container_w);

            //redim parent html container
            setTimeout(()=> {
              let parentHtmlElement = document.getElementById('container_chart_legend_'+params_chart.id);
              parentHtmlElement.style.width = parentHtmlElement.clientWidth+20+'px'
            },110)
              

            params_chart['height_adjusted'] = true
            clearInterval(watch_grouping_lines_formation2)
          }
        }, 300)

    
    }    
      
}

  
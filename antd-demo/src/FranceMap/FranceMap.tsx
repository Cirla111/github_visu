import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3";
import { Col } from 'antd';



function FranceMap(props) {

    const { finalData, echelle, setSelectedDep } = props;
    console.log("echelle", echelle)
    const [globalExtent, setGlobalExtent] = useState([0, 1]); // Valeurs minimales et maximales

    /*useEffect(() => {
        if (finalData) {
            const allValues = finalData.features.flatMap(d => 
                Object.values(d.properties.all).map(entry => entry?.RR ?? 0)
            );
            setGlobalExtent(d3.extent(allValues)); // Min et Max globaux
        }
    }, [finalData]);*/

    useEffect(() => {
        if (!finalData) return;
    
        const valuesMois = [];
        const valuesAnnees = [];
    
        finalData.features.forEach(d => {
            Object.entries(d.properties.all).forEach(([key, entry]) => {
                if (key.length === 6) { // YYYYMM → Mois
                    valuesMois.push(entry?.RR ?? 0);
                } else if (key.length === 4) { // YYYY → Années
                    valuesAnnees.push(entry?.RR ?? 0);
                }
            });
        });
    
        // Calcul des min/max pour chaque mode
        const extentMois = valuesMois.length > 0 ? d3.extent(valuesMois) : [0, 1];
        const extentAnnees = valuesAnnees.length > 0 ? d3.extent(valuesAnnees) : [0, 1];
    
        // Déterminer l'échelle selon le mode actuel
        const isMois = echelle.length === 6; // YYYYMM = mois, YYYY = années
        setGlobalExtent(isMois ? extentMois : extentAnnees);
    }, [finalData, echelle]);
    


    /*useEffect(() => {
        if (finalData) {
            Path(finalData); 
        }
    }, [finalData, echelle]);*/

    useEffect(() => {
        // Si pas de données ou extent encore à [0,1], on saute
        if (!finalData) return;
        if (globalExtent[0] === 0 && globalExtent[1] === 1) return;
    
        Path(finalData); // Maintenant qu'on a le bon globalExtent, on dessine
      }, [finalData, echelle, globalExtent]);    
    

    const svgRef = useRef();
    const wrapperRef = useRef();

    const onDepClick = (event, d) => {
        const departmentCode = parseInt(d.properties.code);
    
        if (!isNaN(departmentCode)) {
            setSelectedDep(departmentCode);
        }
        window.scrollTo({
            top: document.body.scrollHeight, // Scroll to the bottom
            behavior: "smooth"               // Scroll behavior: smooth or instant
          });
    }

    const formatDate = (date) => {
        const parseMonth = d3.timeParse("%Y%m");
        const parseYear = d3.timeParse("%Y");
        const timeFormatMonth = d3.timeFormat("%B %Y");
        const timeFormatYear = d3.timeFormat("%Y");
        
        if (date.length === 6) {  // Cas où date est un mois (YYYYMM)
            return timeFormatMonth(parseMonth(date));
        } else if (date.length === 4) {  // Cas où date est une année (YYYY)
            return timeFormatYear(parseYear(date));
        }
            
        return date;  // Retourne la date inchangée si elle ne correspond pas aux formats attendus
    };

    const formatMonth = (date) => {
        const parseDate = d3.timeParse("%Y%m")
        const timeFormat = d3.timeFormat("%B %Y")
        return timeFormat(parseDate(date))
    }   

    const Path = (data) => {

        const { width: containerWidth, height: containerHeight } = wrapperRef.current.getBoundingClientRect();

        const projection = d3.geoConicConformal()
            .center([2.454071, 46.279229])
            .scale(containerWidth * 3.3) 
            .translate([containerWidth / 2, containerHeight / 2]); 

        const path = d3.geoPath(projection);

        const height="100%"
        const width ="100%"

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        
        // On rajoute un groupe englobant toute la visualisation pour plus tard
        let g = svg.select("g"); 
        if (g.empty()) {
            g = svg.append("g");
        }
        
        const values = data.features.map(d => d.properties.all[echelle]?.RR ?? 0)

        const [minValue, maxValue] = globalExtent; // Min et Max globaux

        const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([minValue, maxValue]);
        
        const x = d3.scaleLinear().domain([globalExtent[0], globalExtent[1]]).rangeRound([400, 700]);

        // Fixer les ticks avec des valeurs égales
        const tickValues = d3.range(globalExtent[0], globalExtent[1] + 1, (globalExtent[1] - globalExtent[0]) / 6);  // Ajuste le nombre de ticks
        const axis = d3.axisBottom(x)
            .tickValues(tickValues) // Ticks fixes
            .tickSize(8)
            .tickFormat(d3.format(".2f")); // Format des labels
                

        const gradient = g.append("defs")
            .append("linearGradient")
            .attr("id", "gradient-colors")
            .attr("x1", "0%")
            .attr("x2", "100%");

        const numStops = 20; // Nombre de segments pour approximer le dégradé

        
        gradient.selectAll("stop")
            .data(d3.range(numStops).map(i => {
                const t = i / (numStops - 1);
                return { offset: `${t * 100}%`, color: color(globalExtent[0] + t * (globalExtent[1] - globalExtent[0])) };
            }))
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
        


        g.append("rect")
            .attr("height", 8)
            .attr("x", x(globalExtent[0]))
            .attr("width", x(globalExtent[1]) - x(globalExtent[0]))
            .style("fill", "url(#gradient-colors)");
          


        // Ajouter un groupe pour l'axe si nécessaire
        let axisGroup = svg.select(".axis");
        if (axisGroup.empty()) {
            axisGroup = svg.append("g").attr("class", "axis");
        }

        // Mettre à jour l'axe au lieu d'en créer un nouveau
        axisGroup
            .attr("transform", `translate(0, 10)`) // Ajuster pour éviter le décalage
            .call(axis);


        
        // create a tooltip
        let Tooltip = d3.select(".tooltip");
        if (Tooltip.empty()) {
            Tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("opacity", 0)
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px");
        }
        
        // Three function that change the tooltip and the cells when user hover / move / leave a cell
        const mouseover = function(event, d) {
            Tooltip
            .style("opacity", 1)
            d3.selectAll("path")
            .style("opacity", 0.5)
            d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke", "black")
            
        }
        /*const mousemove = function(event, d) {
            Tooltip
            .html("Département: " + d.properties.nom + ", " + "Valeur: " + (d.properties.all[echelle]?.RR ?? "none") )
            .style("left", (event.pageX + 10) + "px")  
            .style("top", (event.pageY - 10) + "px");  
        }*/
        const mousemove = function(event, d) {
            const valeur = d.properties.all[echelle]?.RR;
            const valeurArrondie = valeur ? valeur.toFixed(2) : "none";  // Arrondi à 2 décimales
                
            Tooltip
            .html(`Département: ${d.properties.nom}, Valeur: ${valeurArrondie}`)
            .style("left", (event.pageX + 10) + "px")  
            .style("top", (event.pageY - 10) + "px");  
        }
            
            
        const mouseleave = function(event, d) {
            Tooltip
            .style("opacity", 0)
            d3.selectAll("path")
            .style("opacity", 0.8)
            d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .style("stroke", "transparent")
        }
        
        let yearLabel = svg.select(".year-label");
        if (yearLabel.empty()) {
            yearLabel = svg
                .append("text")
                .attr("class", "year-label")
                .attr("x", 200)
                .attr("y", containerHeight - 50)
                .attr("font-size", 50)
                .attr("fill", "lightgrey")
                .attr("text-anchor", "middle");
        }
        yearLabel.text(formatDate(echelle));
          
        g.selectAll("path")
            .data(data.features)
            .join("path")
            .attr("d", path)
            .style("stroke", "transparent")
            .on("click", (event, d) => onDepClick(event, d))
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .style("fill", function (d) {
                //on prend la valeur recupere plus haut
                const value = d.properties.all[echelle]?.RR
                return value? color(value) : "black"
            });
      }
  
      return (
        
        <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
            <svg ref={svgRef}></svg>
        </div>
    )
}

export default FranceMap
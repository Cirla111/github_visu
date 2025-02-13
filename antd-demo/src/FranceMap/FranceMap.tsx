import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3";
import { Col } from 'antd';



function FranceMap(props) {

    const { finalData, moisChoisi, setSelectedDep } = props;

    useEffect(() => {
        if (finalData) {
            Path(finalData); 
        }
    }, [finalData, moisChoisi]);
    

    const svgRef = useRef();
    const wrapperRef = useRef();

    const onDepClick = () => {
        window.scrollTo({
            top: document.body.scrollHeight, // Scroll to the bottom
            behavior: "smooth"               // Scroll behavior: smooth or instant
          });
    }

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
        
        const values = data.features.map(d => d.properties.all[moisChoisi]?.RR ?? 0)
        console.log("domain", values, d3.extent(values))


        const x = d3.scaleLinear().domain(d3.extent(values)).rangeRound([400, 700]);

        const color = d3.scaleSequential(d3.interpolatePurples).domain(d3.extent(values));


        const gradient = g.append("defs")
            .append("linearGradient")
            .attr("id", "gradient-colors")
            .attr("x1", "0%")
            .attr("x2", "100%");

        const numStops = 10; // Nombre de segments pour approximer le dégradé

        gradient.selectAll("stop")
            .data(d3.range(numStops).map(i => {
                const t = i / (numStops - 1);
                return { offset: `${t * 100}%`, color: color(d3.interpolate(...d3.extent(values))(t)) };
            }))
            .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        g.append("rect")
            .attr("height", 8)
            .attr("x", x(d3.extent(values)[0]))
            .attr("width", x(d3.extent(values)[1]) - x(d3.extent(values)[0]))
            .style("fill", "url(#gradient-colors)");

        // Ajout des tickmarks
        const axis = d3.axisBottom(x)
        .ticks(6) // Nombre de ticks, ajustable
        .tickSize(6) // Taille des ticks
        .tickFormat(d3.format(".2f")); // Format des labels

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
        const mousemove = function(event, d) {
            Tooltip
            .html("Département: " + d.properties.nom + ", " + "Valeur: " + (d.properties.all[moisChoisi]?.RR ?? "none") )
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
        yearLabel.text(formatMonth(moisChoisi));
          
        g.selectAll("path")
            .data(data.features)
            .join("path")
            .attr("d", path)
            .style("stroke", "transparent")
            .on("click", onDepClick)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .style("fill", function (d) {
                //on prend la valeur recupere plus haut
                const value = d.properties.all[moisChoisi]?.RR
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
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

        const color = d3.scaleSequential(d3.interpolatePurples).domain(d3.extent(values))


        
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
                .attr("font-size", 80)
                .attr("fill", "lightgrey")
                .attr("text-anchor", "middle");
        }
        yearLabel.text(moisChoisi);
          
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
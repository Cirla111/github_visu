import React, { useRef, useEffect, useState } from 'react'
import * as d3 from "d3";

function RainEvolution(props) {


    const { decadesDepRainData, dep } = props;

    const rainEvolutionRef = useRef();

    useEffect(() => {
        if (decadesDepRainData) {
            linechart(decadesDepRainData, 'Month', 'RR', 'Year'); 
        }
    }, [decadesDepRainData, dep]);

    const linechart = (data, xData, yData, group) => {
            if (!rainEvolutionRef.current) return;
    
    
            // Get the size of the parent container (Card)
            const container = rainEvolutionRef.current.parentElement;
            const width = container.clientWidth - 40;  // Adjust padding
            const height = 250;
    
            // Set margins
            const margin = { top: 50, right: 90, bottom: 60, left: 60 };
    
            // Clear previous SVG content
            d3.select(rainEvolutionRef.current).selectAll("*").remove();
    
            // Create an SVG canvas
            const svg = d3.select(rainEvolutionRef.current)
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${margin.left}, 0)`);
    
            // Parse date format
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
        
            // Parse data and convert xData (1-12) into corresponding month names
            const parsedData = data.map(d => ({
                ...d,
                [xData]: months[d[xData] - 1], 
            }));
    
            // Define scales
            const x = d3.scalePoint()
                .domain(months) 
                .range([0, width - margin.left - margin.right]);
    
            const y = d3.scaleLinear()
                .domain(d3.extent(parsedData, d => d[yData]))
                .range([height - margin.top - margin.bottom, 0]);
    
            // Define color scale
            const color = d3.scaleOrdinal(d3.schemeCategory10);
    
            // Create line generator
            const line = d3.line()
                .x(d => x(d[xData]))
                .y(d => y(d[yData]));
    
            // Group data by the specified key
            const groupedData = d3.group(parsedData, d => d[group]);
    
            // Draw the lines
            svg.selectAll(".line")
                .data(groupedData)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", d => line(d[1]))
                .attr("stroke", d => color(d[0]))
                .attr("fill", "none")
                .attr("stroke-width", 2);
    
            // Draw X-axis
            svg.append("g")
                .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(-30)")
                .style("text-anchor", "end");
    
            // Draw Y-axis
            svg.append("g").call(d3.axisLeft(y));
    
            // Y-axis label
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", -((height - margin.top - margin.bottom) / 2))
                .attr("y", -margin.left + 10)
                .text(yData);
    
            // Add Legend
            const legend = svg.selectAll(".legend")
            .data(groupedData.keys())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);
    
            // Legend color box
            legend.append("rect")
                .attr("x", width - margin.right + 6)
                .attr("y", 10)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", d => color(d));
    
            // Legend text
            legend.append("text")
                .attr("x", width - margin.right)
                .attr("y", 16)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(d => d);
        };




  return (
    <div style={{width: "100%"}}>
        <svg ref={rainEvolutionRef}></svg>
    </div>
  )
}

export default RainEvolution
import { Flex, Select } from 'antd'
import React, { useRef, useEffect, useState } from 'react'
import * as d3 from "d3";

function EachStationGraph(props) {

    const { rainDataDashboard, depFilteredData, dep } = props;


    const [ selectedStations, setSelectedStations ] = useState([]);

    const firstGraphRef = useRef();

    const stations = [...new Set(depFilteredData?.map(d => d['NOM_USUEL']))];


    const handleChange = (value: string) => {
        setSelectedStations(value)
    };

    useEffect(() => {
        setSelectedStations([])
    }, [dep])

    useEffect(() => {
        if (depFilteredData) {
            linechart(depFilteredData, 'AAAAMM', 'RR', 'NOM_USUEL', selectedStations); 
        }
    }, [depFilteredData, selectedStations, dep]);
    

    const linechart = (data, xData, yData, group, selectedGroups) => {
        if (!firstGraphRef.current) return;


        // Get the size of the parent container (Card)
        const container = firstGraphRef.current.parentElement;
        const width = container.clientWidth - 40;  // Adjust padding
        const height = 250;

        // Set margins
        const margin = { top: 50, right: 90, bottom: 60, left: 40 };

        // Clear previous SVG content
        d3.select(firstGraphRef.current).selectAll("*").remove();

        // Create an SVG canvas
        const svg = d3.select(firstGraphRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left}, 0)`);

        // Parse date format
        const parseDate = d3.timeParse("%Y%m");
        const parsedData = data.map(d => ({
             ...d,
             [xData]: parseDate(d[xData]) 
            }));

        // Define scales
        const x = d3.scaleTime()
            .domain(d3.extent(parsedData, d => d[xData]))
            .range([0, width - margin.left - margin.right]);

        const y = d3.scaleLinear()
            .domain(d3.extent(rainDataDashboard, d => d[yData]))
            .range([height - margin.top - margin.bottom, 0]);

        // Define color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create line generator
        const line = d3.line()
            .x(d => x(d[xData]))
            .y(d => y(d[yData]));

        // Group data by the specified key
        const groupedData = d3.group(parsedData, d => d[group]);

        const filteredData = new Map([...groupedData].filter(([key]) => selectedGroups.includes(key)));

        // Draw the lines
        svg.selectAll(".line")
            .data([...filteredData])
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
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %Y")))
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end");

        // Draw Y-axis
        svg.append("g").call(d3.axisLeft(y));

        // X-axis label
        // svg.append("text")
        //     .attr("text-anchor", "middle")
        //     .attr("x", (width - margin.left - margin.right) / 2)
        //     .attr("y", height - margin.bottom)
        //     .text(xData);

        // Y-axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -((height - margin.top - margin.bottom) / 2))
            .attr("y", -margin.left + 10)
            .text(yData);

        // Add Legend
        const legend = svg.selectAll(".legend")
        .data([...filteredData.keys()])
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        // Legend color box
        legend.append("rect")
            .attr("x", width - 54)
            .attr("y", 10)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", d => color(d));

        // Legend text
        legend.append("text")
            .attr("x", width - 60)
            .attr("y", 16)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(d => d);
    };
    




  return (
    <Flex gap="middle" >
        <div style={{width: "100%"}}>
            <svg ref={firstGraphRef}></svg>
        </div>
        <Select 
            mode="multiple"
            onChange={handleChange}
            style={{width: "25%", height: "30px"}}
            options={stations?.map(station => ({value: station}) )} 
            maxTagCount= 'responsive'
            allowClear
        />
    </Flex>
  )
}

export default EachStationGraph
import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3";
import { Button } from 'antd';
import Papa from 'papaparse';

function FranceMap() {
    const [ rainData, setRainData ] = useState();
    const [ geoData, setGeoData ] = useState();
    const [ finalData, setFinalData ] = useState();

    const [ selectedDep, setSelectedDep ] = useState({})
    const [ moisChoisi, setMoisChoisi ] = useState("200001")

    const svgRef = useRef(); // Reference to the SVG element
    const height = 580;
    const width = 1150

    useEffect(() => {
        
        fetch( "/data.csv" )
            .then( response => response.text() )
            .then((csvText) => {

                Papa.parse(csvText, {
                  complete: (result) => {
                    setRainData(result.data); 
                  },
                  header: true, 
                });
              })
            .catch((error) => console.error('Error fetching GeoJSON:', error));
        
    }, []);

    useEffect(() => {
            fetch('/departements.geojson')
                .then( response => response.json())
                .then(responseJson => {
                    setGeoData(responseJson)
                })
                .catch((error) => console.error('Error fetching GeoJSON:', error));
        
    }, []);

    useEffect(() => {
        if (rainData && geoData){
            formatData()
        }
    }, [rainData, geoData]);

    useEffect(() => {
        if (finalData) {
            Path(finalData); // Call Path function to render/transition the map
        }
    }, [finalData]);


    function fuseByDepAndAAAAMM(data) {
        return Object.values(data.reduce((acc, curr) => {
          const key = `${curr.DEPARTEMENT}_${curr.AAAAMM}`;
          
          if (!acc[key]) {
            acc[key] = { DEPARTEMENT: curr.DEPARTEMENT, AAAAMM: curr.AAAAMM, RR: 0 };
          }
          
          acc[key].RR += parseInt(curr.RR);
          
          return acc;
        }, {}));
      }
    
    function transformToDictionary(data) {
    return data.reduce((acc, curr) => {
        // Use AAAAMM value as the key and assign the current object as its value
        acc[curr.AAAAMM] = curr;
        return acc;
    }, {});
    }

    const formatData = () => {
        const finalDataTemp = geoData
        const aggregatedRainData = fuseByDepAndAAAAMM(rainData)
        for (var j = 0; j < geoData.features.length; j++) {
            const departement = +geoData.features[j].properties.code
        
            const DepChoisi = aggregatedRainData.filter((row) => parseInt(row.DEPARTEMENT) === departement)
            finalDataTemp.features[j].properties.all = transformToDictionary(DepChoisi);
        }
        console.log("final data", finalDataTemp)
        setFinalData(finalDataTemp)
    }

    const Path = (data) => {
  
        console.log("entered");
        const projection = d3.geoConicConformal().center([2.454071, 46.279229]).scale(2800);
        const path = d3.geoPath(projection);

        const svg = d3.select(svgRef.current)

        .attr("width", width)
        .attr("height", height);
        
        // On rajoute un groupe englobant toute la visualisation pour plus tard
        let g = svg.select("g"); // Select the group without removing it, or append if it doesn't exist
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
        
        // Append the legend.
        // svg.append("g")
        //     .attr("transform", "translate(20,0)")
        //     .append(() => Legend(color, {title: "Nombre d'hosptalisations", width: 260}));
        
        let yearLabel = svg.select(".year-label");
        if (yearLabel.empty()) {
            yearLabel = svg
                .append("text")
                .attr("class", "year-label")
                .attr("x", 200)
                .attr("y", height - 100)
                .attr("font-size", 80)
                .attr("fill", "lightgrey")
                .attr("text-anchor", "middle");
        }
        yearLabel.text(moisChoisi);
          
          //const depLabel = svg
              //.append("text")
              //.attr("x", width - 350)
              //.attr("y", 100)
              //.attr("font-size", 112)
              //.attr("fill", "lightgrey")
              //.attr("text-anchor", "middle")
              //.text(selectedDep.nom);
          
        g.selectAll("path")
            .data(data.features)
            .join("path")
            .attr("d", path)
            .style("stroke", "transparent")
            .style("opacity", 0.8)
            .on("click", setSelectedDep)
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
          <div>
              <svg ref={svgRef} ></svg>
          </div>
      )
}

export default FranceMap
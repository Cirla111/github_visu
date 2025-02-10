import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3";
import Papa from 'papaparse';

function TPMap() {

    const [covidData, setCovidData] = useState();
    const [geoData, setGeoData] = useState();

    const [ selectedDep, setSelectedDep ] = useState({})
    const [ jourChoisi, setJourChoisi ] = useState("2021-06-01")

    const svgRef = useRef(); // Reference to the SVG element
    const height = 580;
    const width = 1150

    useEffect(() => {
        const covidfetch = async () => {
            try {
                const response = await fetch("/covid-06-11-2021.csv");
                const responseText = await response.text();
        
                return new Promise((resolve, reject) => {
                Papa.parse(responseText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                    const clean_covid_data = result.data.filter(d => d.sexe == 0);
                    setCovidData(clean_covid_data);
                    resolve(clean_covid_data);
                    },
                    error: (error) => {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                    },
                });
                });
            } catch (err) {
                console.error("Error fetching CSV:", err);
            }
            };

        const geofetch = async () => {
            try {
            const response = await fetch('/departements.geojson');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const geojson = await response.json();
            return geojson;  // Return GeoJSON data
            } catch (err) {
            console.error("Error fetching GeoJSON:", err);
            }
        };

        const afterFetch = async () => {
            try {
            const covidResult = await covidfetch();
            const geoResult = await geofetch();

            if (covidResult && geoResult) {
                console.log("Data formatted successfully.");
                formatData(geoResult, covidResult)
            } else {
                console.warn("One or both datasets are missing.");
            }
            } catch (error) {
            console.error("Error in afterFetch:", error);
            }
        };

        afterFetch(); 

        
    }, []);

    useEffect(() => {
        if (geoData) {
            Path(geoData); // Call Path function to render/transition the map
        }
    }, [geoData, jourChoisi]);

    const formatData = (geoResult, covidResult) => {
        const geoDataTemp = geoResult;

        for (var j = 0; j < geoResult.features.length; j++) {
            

            const departement = +geoResult.features[j].properties.code
        
            const jourDepChoisi = covidResult.find((row) => row.dep == departement && d3.timeFormat("%Y-%m-%d")(row.jour) == d3.timeFormat("%Y-%m-%d")(jourChoisi))
            geoDataTemp.features[j].properties.value = jourDepChoisi ? parseInt(jourDepChoisi.hosp) : 0;
            geoDataTemp.features[j].properties.all = jourDepChoisi;
            }
        console.log("final data", geoDataTemp)
        setGeoData(geoDataTemp)
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
        
        
        const values = data.features.map(d => d.properties.value)
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
            .html("Département: " + d.properties.nom + ", " + "Valeur: " + d.properties.value)
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
        yearLabel.text((jourChoisi));
          
          //const depLabel = svg
              //.append("text")
              //.attr("x", width - 350)
              //.attr("y", 100)
              //.attr("font-size", 112)
              //.attr("fill", "lightgrey")
              //.attr("text-anchor", "middle")
              //.text(selectedDep.nom);

        console.log(data.features)
          
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
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                //on prend la valeur recupere plus haut
                const value = d.properties.value;
                return color(value)
            });
      }
    }
  
      return (
          <div>
              <svg ref={svgRef} ></svg>
          </div>
      )
    
}

export default TPMap
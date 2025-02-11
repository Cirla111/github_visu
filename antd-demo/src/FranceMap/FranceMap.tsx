import React, { useState, useEffect, useRef } from 'react'
import * as d3 from "d3";
import Papa from 'papaparse';
import ScrubberElem from '../ScrubberElem/ScrubberElem.tsx';
import { Col, Flex, Radio, Row, Typography } from 'antd';

const { Title } = Typography;

function FranceMap() {
    const [ rainData, setRainData ] = useState();
    const [ geoData, setGeoData ] = useState();
    const [ finalData, setFinalData ] = useState();

    const [ selectedDep, setSelectedDep ] = useState({})
    const [ moisExtent, setMoisExtent ] = useState([0,0])
    const [ moisChoisi, setMoisChoisi ] = useState("200001")
    const [ mode, setMode ] = useState('mois')

    const svgRef = useRef();
    const wrapperRef = useRef();

    useEffect(() => {
        
        fetch( "/data.csv" )
            .then( response => response.text() )
            .then((csvText) => {

                Papa.parse(csvText, {
                  complete: (result) => {
                    const mois = result.data.map((line) => parseInt(line.AAAAMM)) 
                    setMoisExtent(d3.extent(mois))
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
            Path(finalData); 
        }
    }, [finalData, moisChoisi]);


    function fuseByDepAndAAAAMM(data) {
        return Object.values(data.reduce((acc, curr) => {
          const key = `${curr.DEPARTEMENT}_${curr.AAAAMM}`;
          
          if (!acc[key]) {
            acc[key] = { DEPARTEMENT: curr.DEPARTEMENT, AAAAMM: curr.AAAAMM, RR: 0, count: 0, test: 0 };
          }
          
          if (!isNaN(parseFloat(curr.RR))){
            acc[key].RR += parseFloat(curr.RR);
            acc[key].count += 1
        }
          
          return acc;
        }, {}));
      }
    
    function transformToDictionary(data) {
    return data.reduce((acc, curr) => {
        acc[curr.AAAAMM] = { DEPARTEMENT: curr.DEPARTEMENT, AAAAMM: curr.AAAAMM, RR: curr.RR/curr.count};
        return acc;
    }, {});
    }

    const handleCorsica = (departement) => {
        if (departement === '2A' || departement === '2B') {
            return '20'
        } else {
            return departement
        }
    }

    const formatData = () => {
        const finalDataTemp = geoData
        const aggregatedRainData = fuseByDepAndAAAAMM(rainData)
        console.log("agg", aggregatedRainData);
        for (var j = 0; j < geoData.features.length; j++) {
            const departement = handleCorsica(geoData.features[j].properties.code)
        
            const DepChoisi = aggregatedRainData.filter((row) => row.DEPARTEMENT === departement)
            finalDataTemp.features[j].properties.all = transformToDictionary(DepChoisi);
        }
        console.log("final data", finalDataTemp)
        setFinalData(finalDataTemp)
    }

    const Path = (data) => {

        const { width: containerWidth, height: containerHeight } = wrapperRef.current.getBoundingClientRect();

        const projection = d3.geoConicConformal()
            .center([2.454071, 46.279229])
            .scale(containerWidth * 3.8) 
            .translate([containerWidth / 2, containerHeight / 2]); 

        const path = d3.geoPath(projection);

        const height="100%"
        const width ="100%"

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`) 
           .attr("preserveAspectRatio", "xMidYMid meet");
        
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

        <Row style={{height: '100%', width: '100%'}}>
          <Col flex={2}
          style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center', 
              height: '100%',
            }}
          >
              <Flex vertical align="flex-start" justify="center" style={{height: "85%", paddingLeft: "10%"}}>
                  <Title>Echelle temporelle</Title>
                  <Radio.Group
                      style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          paddingLeft: 40,
                        }}
                      onChange={(e) => setMode(e.target.value)}
                      value={mode}
                      options={[
                          { value: 'mois', label: (<div style={{fontSize: 20, fontWeight: 'bold'}}>Mois</div>) },
                          { value: 'annees', label: (<div style={{fontSize: 20, fontWeight: 'bold'}}>Années</div>) },
                      ]}
                      />
              </Flex>
              <ScrubberElem extent={moisExtent} setMois={setMoisChoisi} />
          </Col>
          <Col flex={3} style={{height: '100%'}}>
            <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
                    <svg ref={svgRef}></svg>
                </div>
          </Col>
            
        </Row>
    )
}

export default FranceMap
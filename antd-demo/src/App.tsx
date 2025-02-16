import React, { useState, useEffect } from 'react'
import './App.css';
import Papa from 'papaparse';
import * as d3 from "d3";
import { Layout, theme, Flex, Radio, Row, Col, Typography, Skeleton, Select } from 'antd';
import ScrubberElem from './ScrubberElem/ScrubberElem.tsx';
import FranceMap from './FranceMap/FranceMap.tsx';
import Dashboard from './Dashboard/Dashboard.tsx';


const { Header, Content } = Layout;

const { Title } = Typography;





function App() {

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [ rainData, setRainData ] = useState();
    const [ geoData, setGeoData ] = useState();
    const [ finalData, setFinalData ] = useState();

    const [ selectedDep, setSelectedDep ] = useState({})
    const [ moisExtent, setMoisExtent ] = useState([0,0])
    const [ moisChoisi, setMoisChoisi ] = useState("200001")
    const [ mode, setMode ] = useState('mois')

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

  const handleChange = (value: string) => {
    setSelectedDep(value)
    console.log(`selected ${value}`);
  };

  const createDepartementsList = () => {
    const departements: {value: number, label: number}[] = [];
    for (let i = 1; i <= 95; i++) {
      departements.push({ value: i, label: i });
    }
    return departements;
  }

  return (
    <div className="App">
      hey
    </div>
  );
}

export default App;

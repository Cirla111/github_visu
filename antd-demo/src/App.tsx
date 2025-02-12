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
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div className="demo-logo" />
          <Title style={{color: "white"}}>Carte des pluies par département en France de 1950 à 2023</Title>
        </Header>
        <Content>
          <div
            style={{
              background: colorBgContainer,
              height: "80vh",
              padding: 24,
              margin: "16px",
              borderRadius: borderRadiusLG,
            }}
          >
            {finalData ? <Row style={{height: '100%', width: '100%'}}>
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
                <FranceMap finalData={finalData} moisChoisi={moisChoisi} setSelectedDep={setSelectedDep} />
                {/* <Test/> */}
              </Col>
              
            </Row>
            : <Skeleton active />
          }
            
            
          </div>
          <div
            style={{
              background: colorBgContainer,
              height: "90vh",
              padding: 24,
              margin: "16px",
              borderRadius: borderRadiusLG,
            }}
          >
            <Select
              defaultValue={1}
              style={{ width: 120 }}
              onChange={handleChange}
              value={selectedDep}
              options={createDepartementsList()}
            />
            <Dashboard />
          </div>
        </Content>
      </Layout>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react'
import './App.css';
import Papa from 'papaparse';
import * as d3 from "d3";
import { Layout, theme, Flex, Radio, Row, Col, Typography, Skeleton, Select, Space, Modal, Button } from 'antd';
import ScrubberElem from './ScrubberElem/ScrubberElem.tsx';
import FranceMap from './FranceMap/FranceMap.tsx';
import Dashboard from './Dashboard/Dashboard.tsx';
import { QuestionOutlined } from '@ant-design/icons';



const { Header, Content } = Layout;

const { Title, Text } = Typography;





function App() {

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [ rainData, setRainData ] = useState();
    const [ geoData, setGeoData ] = useState();
    const [ finalData, setFinalData ] = useState();

    const [ selectedDep, setSelectedDep ] = useState(20)
    const [ moisExtent, setMoisExtent ] = useState([0,0])
    const [ moisChoisi, setMoisChoisi ] = useState("195001")
    const [ anneeExtent, setAnneeExtent ] = useState([0,0])
    const [ anneeChoisie, setAnneeChoisie] = useState(1950)
    const [ mode, setMode ] = useState('mois')
    const [ isModalOpen, setIsModalOpen ] = useState(true)
    const [isModalVisible, setIsModalVisible] = useState(false);
    

    useEffect(() => {
          
      fetch( `${process.env.PUBLIC_URL}/data.csv` )
          .then( response => response.text() )
          .then((csvText) => {

              Papa.parse(csvText, {
                complete: (result) => {
                  const dataTemp = result.data.map(row => ({
                    ...row,
                    Year: parseInt(row.AAAAMM?.substring(0, 4)),
                    Month: parseInt(row.AAAAMM?.substring(4, 6))
                  }));
                  const mois = result.data.map((line) => parseInt(line.AAAAMM)) 
                  setMoisExtent(d3.extent(mois))
                  setRainData(dataTemp); 
                  const years = dataTemp.map((line) => line.Year) 
                  setAnneeExtent(d3.extent(years))
                  setRainData(dataTemp); 
                },
                header: true, 
              });
            })
          .catch((error) => console.error('Error fetching GeoJSON:', error));
      
  }, []);

  useEffect(() => {
          fetch(`${process.env.PUBLIC_URL}/departements.geojson`)
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
          acc[key] = { DEPARTEMENT: curr.DEPARTEMENT, AAAAMM: curr.AAAAMM, RR: 0, count: 0, Year: curr.Year, Month: curr.Month };
        }
        
        if (!isNaN(parseFloat(curr.RR))){
          acc[key].RR += parseFloat(curr.RR);
          acc[key].count += 1
      }
        
        return acc;
      }, {}));
    }

    function fuseByDepAndAAAA(data) {
      return Object.values(data.reduce((acc, curr) => {
        const key = `${curr.DEPARTEMENT}_${curr.Year}`;
        
        if (!acc[key]) {
          acc[key] = { DEPARTEMENT: curr.DEPARTEMENT, Year: curr.Year, RR: 0, count: 0, test: 0 };
        }
        
        if (!isNaN(parseFloat(curr.RR))){
          acc[key].RR += parseFloat(curr.RR);
          acc[key].count += 1
      }
        
        return acc;
      }, {}));
    }

  function transformToDictionary(data, key) {
  return data.reduce((acc, curr) => {
      acc[curr[key]] = { DEPARTEMENT: curr.DEPARTEMENT, [key]: curr[key], RR: curr.RR/curr.count};
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
      const aggregatedRainDataMonth = fuseByDepAndAAAAMM(rainData)
      const aggregatedRainDataYear = fuseByDepAndAAAA(rainData)
      console.log("aggMonth", aggregatedRainDataMonth);
      console.log("aggYear", aggregatedRainDataYear);
      for (var j = 0; j < geoData.features.length; j++) {
          const departement = handleCorsica(geoData.features[j].properties.code)
      
          const DepChoisiMonth = aggregatedRainDataMonth.filter((row) => row.DEPARTEMENT === departement)
          const DepChoisiYear = aggregatedRainDataYear.filter((row) => row.DEPARTEMENT === departement)

          finalDataTemp.features[j].properties.all = {...transformToDictionary(DepChoisiMonth, 'AAAAMM'),...transformToDictionary(DepChoisiYear, 'Year')};
      }
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
          <Button onClick={() => setIsModalVisible(true)} size={"small"} shape="circle" icon={<QuestionOutlined />}>
          </Button>
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
                  <ScrubberElem extent={mode === 'mois' ? moisExtent : anneeExtent} setDate={mode === 'mois' ? setMoisChoisi : setAnneeChoisie} mode={mode} />
              </Col>
              <Col flex={3} style={{height: '100%'}}>
              <FranceMap finalData={finalData} echelle={mode === 'mois' ? moisChoisi : anneeChoisie} setSelectedDep={setSelectedDep} />
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
            <Dashboard rainDataDashboard={rainData} fuseByDepAndAAAAMM={fuseByDepAndAAAAMM} fuseByDepAndAAAA={fuseByDepAndAAAA} dep={selectedDep} />
          </div>
        </Content>
      </Layout>
      <Modal title={<Title level={2}> L'objectif de cette visualisation </Title>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => setIsModalOpen(false)} width={"90%"} >
        <Space direction="vertical">
          <Text style={{fontSize: 20 }}>Cette application permet de visualiser l'évolution des précipitations dans chaque département de France au fil des années. La carte interactive affiche les précipitations dans chaque département pour le mois ou l'année sélectionnés. L'animation grâce au slider permet d'observer l'évolution des précipitations au fil des mois, et donc de comprendre comment une année de précipitation est structurée.</Text>
          <Text style={{fontSize: 20 }}>Le dashboard présent en bas de la page, quant à lui, permet de visualiser des statistiques pour un département en particulier, et ainsi d'explorer l'évolution des précipitations dans ce département, la manière dont les précipitations évoluent sur une année, et les stations d'intérêts. </Text>
          <Text style={{fontSize: 20 }}> </Text>
          <Text style={{fontSize: 20 }}>L'objectif de la visualisation est de permettre aux visiteurs de comprendre comment évoluent les précipitations sur une année en France, et de comparer à les fois les départements entre eux, et les années pour découvrir des tendances dans l'évolution de la quantité des précipitations.</Text>
          <Text style={{fontSize: 20 }}>La plateforme peut ainsi être utile à des spécialistes du climat cherchant à rapidement visualiser l'évolution des précipitations au fil des années, ou encore à un particulier cherchant les départements les plus pluvieux ainsi que les périodes de l'année les plus propices au développement d'une activité.</Text>
          <Text style={{fontSize: 20 }}> </Text>
          <Text style={{fontSize: 15 }} type="secondary">Les données sont issues du site de Météo-France. La base de données contient les données météorologiques de toutes les stations de chaque département, pour les années 1950 à 2023. Ces données ont subi un contrôle climatologique.</Text>
        </Space>
      </Modal>
      <Modal title={<Title level={2}>Exploration et prototypage</Title>} width={"90%"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => setIsModalVisible(false)} footer={null}>
        <Flex vertical>
          <img src={`${process.env.PUBLIC_URL}/design_sheet.jpg`} alt="Visualisation" style={{ width: "90%" }} />
          <Text style={{fontSize: 20 }}>Le premier graphique d'exploration représente la quantitée de pluie tombée chaque année sur deux villes de Frannce de 1961 à 2023. L'idée était de regarder si cette quantitée avait évoluée au cours des années, et s'il y avait une différence de quantitée entre une ville du Nord et une ville du Sud. Il a l'air de moins pleuvoir à Marseille qu'à Lille en moyenne, mais aucune évolution claire ne se dessine entre 1961 et 2023</Text>
          <img src={`${process.env.PUBLIC_URL}/rain_every_year_Marseille_Lille.png`} alt="Explo1" style={{ width: "90%" }} />
          <Text style={{fontSize: 20 }}>Le deuxième graphique affiche l'évolution des précipitations au cours des mois pour les années 1950 à 2023 à Lyon Tête d'Or. L'objectif était de déterminer si les précipitations évoluaient au fil des mois, et s'il y avait des tendances au fil des années. On observe bien une tendance, avec les précipitations diminuant à l'arrivée de l'été, et remontant pour atteindre un pic en Septembre/Octobre.</Text>
          <img src={`${process.env.PUBLIC_URL}/month_rain.jpeg`} alt="Explo2" style={{ width: "90%" }} />
        </Flex>
    </Modal>
    </div>
  );
}

export default App;

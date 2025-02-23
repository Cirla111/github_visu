import { Card, Col, Flex, Row, Statistic, Typography} from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import React from 'react'
import EachStationGraph from './EachStationGraph.tsx';
import RainEvolution from './RainEvolution.tsx';

const {Title} = Typography

function Dashboard(props) {

    const { rainDataDashboard, fuseByDepAndAAAAMM, fuseByDepAndAAAA, dep } = props;

    const depFilteredData = rainDataDashboard?.filter(d =>d.RR && parseInt(d.DEPARTEMENT) === dep)

    const rainDataByMonth = rainDataDashboard ? fuseByDepAndAAAAMM(rainDataDashboard).filter(d => d.RR && parseInt(d.DEPARTEMENT) === dep) : undefined

    const rainDataByYear = rainDataDashboard ? fuseByDepAndAAAA(rainDataDashboard).filter(d => d.RR && parseInt(d.DEPARTEMENT) === dep) : undefined

    const totalRR = rainDataByYear?.reduce((sum, currentObj) => sum + currentObj.RR, 0);
    const meanRR = totalRR / rainDataByYear?.length;

    const rain2023 = rainDataByYear ? rainDataByYear.at(-1)?.RR : 0
    const rain2022 = rainDataByYear ? rainDataByYear.at(-2)?.RR : 0

    const maxRR = rainDataByYear?.reduce((maxObj, currentObj) => {
        return (currentObj.RR > maxObj.RR) ? currentObj : maxObj;
      }, rainDataByYear[0]);

    console.log("rainDataByDep", rainDataByMonth)

    
  return (
    <Row style={{height:"100%" }} gutter={24} >
        <Col span={17} style={{height:"100%" }}>
            <Flex vertical justify="space-evenly" style={{height:"100%" }}>
                <Card title="Evolution des précipitations sur chaque station du département" style={{height:"45%" }}>
                    <EachStationGraph rainDataDashboard={rainDataDashboard} depFilteredData={depFilteredData} dep={dep} />
                </Card>
                <Card title="Evolution des précipitations sur une année pour chaque décennie" style={{height:"45%" }}>
                    <RainEvolution 
                        decadesDepRainData={rainDataByMonth?.filter(d => d.Year % 10 === 0)} 
                    />
                </Card>

            </Flex>
        </Col>
        <Col span={5} style={{height:"100%" }}>
            <Flex vertical justify="space-evenly" style={{height:"100%" }}>
                <Card title="Précipitations annuelles" style={{height:"30%" }}>
                    <Statistic title="En moyenne..." value={meanRR} precision={2} suffix="mm / an" />
                </Card>
                <Card title="Tendance des précipitations" style={{height:"30%" }}>
                <Statistic
                    title="2023"
                    value={rain2023}
                    precision={2}
                    valueStyle={rain2023 > rain2022 ? { color: '#3f8600' } : { color: '#cf1322' }}
                    prefix={ rain2023 > rain2022 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    suffix="mm / an"
                />
                </Card>
                <Card title="Année la plus pluvieuse" style={{height:"30%" }}>
                    <Title level={2} italic>{maxRR?.Year}</Title>
                </Card>

            </Flex>
        </Col>
    </Row>
  )
}

export default Dashboard
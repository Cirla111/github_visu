import { Card, Col, Flex, Row } from 'antd'
import React from 'react'

function Dashboard() {
  return (
    <Row style={{height:"100%" }} gutter={24} >
        <Col span={17} style={{height:"100%" }}>
            <Flex vertical justify="space-evenly" style={{height:"100%" }}>
                <Card title="Titre du graph" style={{height:"45%" }}>
                    hello
                </Card>
                <Card title="Titre du graph" style={{height:"45%" }}>
                    hello
                </Card>

            </Flex>
        </Col>
        <Col span={5} style={{height:"100%" }}>
            <Flex vertical justify="space-evenly" style={{height:"100%" }}>
                <Card title="Titre du graph" style={{height:"30%" }}>
                    hello
                </Card>
                <Card title="Titre du graph" style={{height:"30%" }}>
                    hello
                </Card>
                <Card title="Titre du graph" style={{height:"30%" }}>
                    hello
                </Card>

            </Flex>
        </Col>
    </Row>
  )
}

export default Dashboard
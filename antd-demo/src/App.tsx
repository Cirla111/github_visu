import React from 'react';
import './App.css';
import { Layout, Menu, theme } from 'antd';
import TPMap from './TPMap/TPMap.tsx';
import FranceMap from './FranceMap/FranceMap.tsx';
import Test from './Test.tsx';


const { Header, Content } = Layout;

const items = [{
  key: 1,
  label: 'Main',
}, {
  key: 2,
  label: 'Dashboard',
}

];

function App() {

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <div className="App">
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div className="demo-logo" />
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
            <FranceMap/>
            {/* <Test/> */}
          </div>
        </Content>
      </Layout>
    </div>
  );
}

export default App;

import React from 'react';
import './App.css';
import { Layout, Menu, theme } from 'antd';
import TPMap from './TPMap/TPMap.tsx';
import FranceMap from './FranceMap/FranceMap.tsx';


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
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['2']}
            items={items}
            style={{ flex: 1, minWidth: 0 }}
          />
        </Header>
        <Content style={{ padding: '0 48px' }}>
          <div style={{ margin: '16px 0' }}>
          </div>
          <div
            style={{
              background: colorBgContainer,
              minHeight: 280,
              padding: 24,
              borderRadius: borderRadiusLG,
            }}
          >
            <FranceMap/>
          </div>
        </Content>
      </Layout>
    </div>
  );
}

export default App;

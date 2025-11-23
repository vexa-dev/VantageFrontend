import React from 'react';
import { Button, ConfigProvider, Card, Typography } from 'antd';

const { Title } = Typography;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00b96b', // Color personalizado (Verde Vantage)
          borderRadius: 8,
        },
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#f0f2f5' // Fondo gris suave típico de sistemas
      }}>
        <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Title level={2}>Vantage 🚀</Title>
          <p>Frontend con React + TypeScript + Ant Design</p>
          <br />
          <Button type="primary" size="large" onClick={() => alert('¡Funciona!')}>
            Probar Botón
          </Button>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default App;
import React from 'react';
import { Typography, Card, Badge } from 'antd';

const { Title, Text } = Typography;

const Sprints: React.FC = () => {
  const data = [
    {
      title: 'Sprint 1: Inicialización',
      description: 'Configuración del proyecto y autenticación básica.',
      status: 'active',
    },
    {
      title: 'Sprint 2: Gestión de Usuarios',
      description: 'CRUD de usuarios y roles.',
      status: 'planned',
    },
  ];

  return (
    <div>
      <Title level={2}>Sprints</Title>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.map((item, index) => (
          <Card 
            key={index}
            title={item.title} 
            extra={<Badge status={item.status === 'active' ? 'processing' : 'default'} text={item.status === 'active' ? 'Activo' : 'Planificado'} />}
          >
            <Text>{item.description}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Sprints;

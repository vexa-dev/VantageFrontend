// Dashboard Component
import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Proyectos Activos"
              value={3}
              prefix={<ProjectOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tareas Completadas"
              value={12}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Horas Totales"
              value={45}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: 24 }}>
        <Card title="Actividad Reciente">
          <p>Usuario X completó la tarea Y...</p>
          <p>Nuevo sprint iniciado...</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

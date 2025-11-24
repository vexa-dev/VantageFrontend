import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const Projects: React.FC = () => {
  return (
    <div>
      <Title level={2}>Proyectos</Title>
      <Card>
        <Paragraph>
          Bienvenido a la página de Proyectos. Aquí podrás gestionar tus proyectos.
        </Paragraph>
      </Card>
    </div>
  );
};

export default Projects;

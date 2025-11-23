import React from 'react';
import { Typography, Table, Tag, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Backlog: React.FC = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Estado',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'Done' ? 'green' : 'geekblue'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
    },
  ];

  const data = [
    {
      key: '1',
      id: 'TASK-1',
      title: 'Diseñar base de datos',
      status: 'Done',
      priority: 'High',
    },
    {
      key: '2',
      id: 'TASK-2',
      title: 'Crear API de autenticación',
      status: 'In Progress',
      priority: 'High',
    },
    {
      key: '3',
      id: 'TASK-3',
      title: 'Implementar Frontend Login',
      status: 'To Do',
      priority: 'Medium',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Product Backlog</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Nueva Historia
        </Button>
      </div>
      
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default Backlog;

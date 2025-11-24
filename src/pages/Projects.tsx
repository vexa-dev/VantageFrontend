import React, { useState, useEffect } from 'react';
import { Typography, Card, FloatButton, Modal, Form, Input, Select, App, Button, Row, Col, Tag, Space } from 'antd';
import { PlusOutlined, ProjectOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Projects: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [scrumMasters, setScrumMasters] = useState<any[]>([]);
  const [form] = Form.useForm();

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterSM, setFilterSM] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Check if user is Product Owner
  const isPO = user?.roles?.some(role => 
    role === 'PO' || role === 'PRODUCT_OWNER' || role === 'ROLE_PO' || role === 'ROLE_PRODUCT_OWNER'
  );

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/all');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Error al cargar proyectos');
    }
  };

  const fetchScrumMasters = async () => {
    try {
      const response = await api.get('/usuarios/role/ROLE_SM');
      setScrumMasters(response.data);
    } catch (error) {
      console.error('Error fetching Scrum Masters:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchScrumMasters();
  }, []);

  const handleOpenModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCreateProject = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/projects', {
        name: values.name,
        description: values.description,
        icon: values.icon,
        scrumMasterId: values.scrumMasterId
      });
      message.success('Proyecto creado exitosamente');
      setIsModalVisible(false);
      fetchProjects(); // Reload projects
    } catch (error) {
      console.error('Error creating project:', error);
      message.error('Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                           project.description?.toLowerCase().includes(searchText.toLowerCase()));
    const matchesSM = filterSM ? project.scrumMaster?.id === filterSM : true;
    const matchesStatus = filterStatus ? project.status === filterStatus : true;
    
    return matchesSearch && matchesSM && matchesStatus;
  });

  return (
    <div style={{ position: 'relative', minHeight: '80vh', paddingBottom: '60px' }}>
      <Title level={2}>Proyectos</Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Buscar por título o descripción" 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select 
              style={{ width: '100%' }} 
              placeholder="Filtrar por Scrum Master"
              allowClear
              onChange={val => setFilterSM(val)}
            >
              {scrumMasters.map(sm => (
                <Option key={sm.id} value={sm.id}>{sm.fullName}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select 
              style={{ width: '100%' }} 
              placeholder="Estado"
              allowClear
              onChange={val => setFilterStatus(val)}
            >
              <Option value="active">Activo</Option>
              <Option value="completed">Completado</Option>
              <Option value="archived">Archivado</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Project Grid */}
      <Row gutter={[16, 16]}>
        {filteredProjects.map(project => (
          <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
            <Card hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: '24px', marginRight: '10px' }}>{project.icon || '🚀'}</div>
                <Title level={4} style={{ margin: 0 }} ellipsis={{ rows: 1 }}>{project.name}</Title>
              </div>
              
              <Paragraph ellipsis={{ rows: 2, expandable: false }} style={{ height: '44px', color: '#666' }}>
                {project.description}
              </Paragraph>

              <Space style={{ width: '100%', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Scrum Master:</Text>
                  <Text strong>{project.scrumMaster?.fullName || 'N/A'}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Product Owner:</Text>
                  <Text>{project.owner?.fullName}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Text type="secondary">Estado:</Text>
                   <Tag color={project.status === 'active' ? 'green' : 'default'}>{project.status}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Devs:</Text>
                  <Tag color="blue">{project.members?.length || 0}</Tag>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Floating Action Button for PO */}
      {isPO && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{ right: 24, bottom: 24 }}
          tooltip="Crear Nuevo Proyecto"
          onClick={handleOpenModal}
        />
      )}

      {/* Create Project Modal */}
      <Modal
        title="Crear nuevo proyecto"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.6)' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          initialValues={{
            status: 'active',
            icon: '🚀' // Default icon
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item
              name="icon"
              label="Icono"
              style={{ width: '100px' }}
            >
              <Select>
                <Option value="🚀">🚀</Option>
                <Option value="💻">💻</Option>
                <Option value="📱">📱</Option>
                <Option value="🌐">🌐</Option>
                <Option value="🎨">🎨</Option>
                <Option value="📊">📊</Option>
                <Option value="🛒">🛒</Option>
                <Option value="🎮">🎮</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="name"
              label="Título del proyecto"
              rules={[{ required: true, message: 'Por favor ingresa el título' }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<ProjectOutlined />} placeholder="Nombre del proyecto" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[{ required: true, message: 'Por favor ingresa una descripción' }]}
          >
            <Input.TextArea rows={4} placeholder="Describe el proyecto..." />
          </Form.Item>

          <Form.Item
            name="scrumMasterId"
            label="Scrum Master"
            rules={[{ required: true, message: 'Por favor selecciona un Scrum Master' }]}
          >
            <Select placeholder="Selecciona un Scrum Master">
              {scrumMasters.map(sm => (
                <Option key={sm.id} value={sm.id}>
                  {sm.fullName || sm.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Estado"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Crear Proyecto
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;

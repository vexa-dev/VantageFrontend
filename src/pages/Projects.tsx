import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  FloatButton,
  Modal,
  Form,
  Input,
  Select,
  App,
  Button,
  Row,
  Col,
  Tag,
  Avatar,
  Divider,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ProjectOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

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
  const [searchText, setSearchText] = useState("");
  const [filterSM, setFilterSM] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const isPO = user?.roles?.some(
    (r) =>
      r === "PO" ||
      r === "PRODUCT_OWNER" ||
      r === "ROLE_PO" ||
      r === "ROLE_PRODUCT_OWNER"
  );

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/all");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar proyectos");
    }
  };

  const fetchScrumMasters = async () => {
    try {
      const res = await api.get("/usuarios/role/ROLE_SM");
      setScrumMasters(res.data);
    } catch (err) {
      console.error(err);
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
      await api.post("/projects", {
        name: values.name,
        description: values.description,
        icon: values.icon,
        scrumMasterId: values.scrumMasterId,
      });
      message.success("Proyecto creado exitosamente");
      setIsModalVisible(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      message.error("Error al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesSM = filterSM ? p.scrumMaster?.id === filterSM : true;
    const matchesStatus = filterStatus ? p.status === filterStatus : true;
    return matchesSearch && matchesSM && matchesStatus;
  });

  return (
    <div
      style={{ position: "relative", minHeight: "80vh", paddingBottom: "60px" }}
    >
      <Title level={2}>Proyectos</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Buscar por título o descripción"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Filtrar por Scrum Master"
              allowClear
              onChange={(val) => setFilterSM(val)}
            >
              {scrumMasters.map((sm) => (
                <Option key={sm.id} value={sm.id}>
                  {sm.fullName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Estado"
              allowClear
              onChange={(val) => setFilterStatus(val)}
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
        {filteredProjects.map((project) => (
          <Col xs={24} sm={12} md={12} lg={8} key={project.id}>
            <Card
              hoverable
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
              // CORRECCIÓN 1: Usar 'styles' en lugar de 'bodyStyle' para Ant Design v5+
              styles={{
                body: {
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px",
                },
              }}
            >
              {/* --- HEADER: Título y Estado --- */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <Avatar
                    shape="square"
                    style={{
                      backgroundColor: "#f0f5ff",
                      color: "#1890ff",
                      minWidth: "32px",
                    }}
                  >
                    {project.icon || "🚀"}
                  </Avatar>
                  <Title
                    level={5}
                    style={{ margin: 0 }}
                    ellipsis={{ tooltip: project.name }}
                  >
                    {project.name}
                  </Title>
                </div>

                <Tag
                  color={project.status === "active" ? "green" : "default"}
                  style={{ margin: 0 }}
                >
                  {project.status === "active" ? "Activo" : project.status}
                </Tag>
              </div>

              {/* --- BODY: Descripción --- */}
              <Paragraph
                ellipsis={{ rows: 3, expandable: false, symbol: "..." }}
                style={{ color: "#666", flex: 1, marginBottom: 16 }}
              >
                {project.description}
              </Paragraph>

              {/* --- FOOTER: Roles y Devs --- */}
              <div
                style={{
                  marginTop: "auto",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 12,
                }}
              >
                <Row justify="space-between" align="bottom">
                  {/* Columna Izquierda: Roles */}
                  <Col span={18}>
                    {/* CORRECCIÓN 2: Reemplazo de <Space> por un div flex estándar para evitar warning */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "100%",
                      }}
                    >
                      {/* Product Owner */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tooltip title="Product Owner">
                          <SafetyCertificateOutlined
                            style={{ color: "#1890ff" }}
                          />
                        </Tooltip>
                        <Text style={{ fontSize: "13px" }} ellipsis>
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", marginRight: 4 }}
                          >
                            PO:
                          </Text>
                          {project.owner?.fullName || "Sin asignar"}
                        </Text>
                      </div>

                      {/* Scrum Master */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Tooltip title="Scrum Master">
                          <UserOutlined style={{ color: "#fa8c16" }} />
                        </Tooltip>
                        <Text style={{ fontSize: "13px" }} ellipsis>
                          <Text
                            type="secondary"
                            style={{ fontSize: "12px", marginRight: 4 }}
                          >
                            SM:
                          </Text>
                          {project.scrumMaster?.fullName || "Sin asignar"}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Columna Derecha: Dev Count */}
                  <Col span={6} style={{ textAlign: "right" }}>
                    <Tooltip
                      title={`${
                        project.members?.length || 0
                      } Desarrolladores asignados`}
                    >
                      <Tag
                        icon={<TeamOutlined />}
                        color="blue"
                        style={{ margin: 0 }}
                      >
                        {project.members?.length || 0}
                      </Tag>
                    </Tooltip>
                  </Col>
                </Row>
              </div>
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
        styles={{ mask: { backgroundColor: "rgba(0, 0, 0, 0.6)" } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          initialValues={{ status: "active", icon: "🚀" }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <Form.Item name="icon" label="Icono" style={{ width: "100px" }}>
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
              rules={[
                { required: true, message: "Por favor ingresa el título" },
              ]}
              style={{ flex: 1 }}
            >
              <Input
                prefix={<ProjectOutlined />}
                placeholder="Nombre del proyecto"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              { required: true, message: "Por favor ingresa una descripción" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Describe el proyecto..." />
          </Form.Item>

          <Form.Item
            name="scrumMasterId"
            label="Scrum Master"
            rules={[
              {
                required: true,
                message: "Por favor selecciona un Scrum Master",
              },
            ]}
          >
            <Select placeholder="Selecciona un Scrum Master">
              {scrumMasters.map((sm) => (
                <Option key={sm.id} value={sm.id}>
                  {sm.fullName || sm.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Estado">
            <Input disabled />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsModalVisible(false)}
              style={{ marginRight: 8 }}
            >
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

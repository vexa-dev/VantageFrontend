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
  const [developers, setDevelopers] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

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

  const isSM = user?.roles?.some(
    (r: string) => r === "SM" || r === "SCRUM_MASTER" || r === "ROLE_SM"
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

  const fetchDevelopers = async () => {
    try {
      const res = await api.get("/usuarios/role/ROLE_DEV");
      setDevelopers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchScrumMasters();
    fetchDevelopers();
  }, []);

  const getDevMembers = (project: any) => {
    if (!project?.members) return [];
    return project.members.filter(
      (m: any) =>
        m.id !== project.owner?.id && m.id !== project.scrumMaster?.id
    );
  };

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

  const handleCardClick = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalVisible(true);
    // Pre-fill assigned devs if any
    // Pre-fill assigned devs if any (excluding PO and SM)
    const devMembers = getDevMembers(project);
    const devIds = devMembers.map((m: any) => m.id);
    assignForm.setFieldsValue({ devIds });
  };

  const handleAssignDevs = async (values: any) => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      await api.put(`/projects/${selectedProject.id}/members`, values.devIds);
      message.success("Desarrolladores asignados exitosamente");
      setIsDetailsModalVisible(false);
      fetchProjects(); // Refresh to show new member count
    } catch (err) {
      console.error(err);
      message.error("Error al asignar desarrolladores");
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
              styles={{
                body: {
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px",
                },
              }}
              onClick={() => handleCardClick(project)}
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
                        getDevMembers(project).length
                      } Desarrolladores asignados`}
                    >
                      <Tag
                        icon={<TeamOutlined />}
                        color="blue"
                        style={{ margin: 0 }}
                      >
                        {getDevMembers(project).length}
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

      {/* Project Details Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              shape="square"
              style={{ backgroundColor: "#f0f5ff", color: "#1890ff" }}
            >
              {selectedProject?.icon || "🚀"}
            </Avatar>
            <span>{selectedProject?.name}</span>
            <Tag color={selectedProject?.status === "active" ? "green" : "default"}>
              {selectedProject?.status === "active" ? "Activo" : selectedProject?.status}
            </Tag>
          </div>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={{ marginTop: 20 }}>
          <Title level={5}>Descripción</Title>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {selectedProject?.description}
          </Paragraph>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">Product Owner (Creador)</Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Avatar icon={<SafetyCertificateOutlined />} style={{ backgroundColor: "#1890ff" }} />
                <Text strong>{selectedProject?.owner?.fullName || "Desconocido"}</Text>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary">Scrum Master</Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
                <Text strong>{selectedProject?.scrumMaster?.fullName || "Sin asignar"}</Text>
              </div>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>Equipo de Desarrollo</Title>
          <div style={{ marginBottom: 16 }}>
            {getDevMembers(selectedProject).length > 0 ? (
              <Avatar.Group max={{ count: 10 }}>
                {getDevMembers(selectedProject).map((m: any) => (
                  <Tooltip key={m.id} title={m.fullName}>
                    <Avatar style={{ backgroundColor: "#87d068" }}>
                      {m.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            ) : (
              <Text type="secondary">No hay desarrolladores asignados aún.</Text>
            )}
          </div>

          {isSM && (
            <div style={{ backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8, marginTop: 20 }}>
              <Title level={5} style={{ marginTop: 0 }}>Asignar Desarrolladores</Title>
              <Form form={assignForm} layout="vertical" onFinish={handleAssignDevs}>
                <Form.Item
                  name="devIds"
                  label="Selecciona los desarrolladores para este proyecto"
                >
                  <Select
                    mode="multiple"
                    placeholder="Buscar desarrolladores..."
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                  >
                    {developers.map((dev) => (
                      <Option key={dev.id} value={dev.id}>
                        {dev.fullName || dev.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Guardar Asignación
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Projects;

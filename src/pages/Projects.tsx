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
  DatePicker,
  Switch,
} from "antd";
import {
  PlusOutlined,
  ProjectOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import dayjs from "dayjs";

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
  const [productOwners, setProductOwners] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterSM, setFilterSM] = useState<string | null>(null);
  const [filterPO, setFilterPO] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showMyProjects, setShowMyProjects] = useState(false);

  const isPO = user?.roles?.some(
    (r: string) =>
      r === "PO" ||
      r === "PRODUCT_OWNER" ||
      r === "ROLE_PO" ||
      r === "ROLE_PRODUCT_OWNER"
  );

  const isSM = user?.roles?.some(
    (r: string) => r === "SM" || r === "SCRUM_MASTER" || r === "ROLE_SM"
  );

  const isAdmin = user?.roles?.some(
    (r: string) => r === "ROLE_ADMIN" || r === "ADMIN"
  );

  const isOwner = user?.roles?.some(
    (r: string) => r === "ROLE_OWNER" || r === "OWNER"
  );

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar proyectos");
    }
  };

  const fetchScrumMasters = async () => {
    try {
      const res = await api.get("/users/role/ROLE_SM");
      setScrumMasters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await api.get("/users/role/ROLE_DEV");
      setDevelopers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await api.get("/users/role/ROLE_PO");
      setProductOwners(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchScrumMasters();
    fetchDevelopers();
    if (isAdmin || isOwner) {
      fetchPOs();
    }
  }, [isAdmin, isOwner]);

  const getDevMembers = (project: any) => {
    if (!project?.members) return [];
    return project.members.filter(
      (m: any) => m.id !== project.owner?.id && m.id !== project.scrumMaster?.id
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
        poId: values.poId, // Admin selects PO
        smId: values.scrumMasterId, // Admin selects SM
        devIds: values.devIds, // Admin selects Devs
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
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
    const devMembers = getDevMembers(project);
    const devIds = devMembers.map((m: any) => m.id);
    if (isSM || isPO) {
      assignForm.setFieldsValue({ devIds });
    }
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

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    const devMembers = getDevMembers(project);
    const devIds = devMembers.map((m: any) => m.id);

    editForm.setFieldsValue({
      name: project.name,
      description: project.description,
      icon: project.icon,
      status: project.status,
      scrumMasterId: project.scrumMaster?.id,
      poId: project.owner?.id,
      devIds: devIds,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: project.endDate ? dayjs(project.endDate) : null,
    });
    setIsEditModalVisible(true);
  };

  const handleEditProject = async (values: any) => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      await api.put(`/projects/${selectedProject.id}`, {
        ...values,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        // scrumMasterId, poId, and devIds are included in ...values
      });
      message.success("Proyecto actualizado exitosamente");
      setIsEditModalVisible(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesSM = filterSM ? p.scrumMaster?.id === filterSM : true;
    const matchesPO = filterPO ? p.owner?.id === filterPO : true;
    const matchesStatus = filterStatus ? p.status === filterStatus : true;

    // My Projects Filter
    let matchesMyProjects = true;
    if (showMyProjects && user) {
      const isOwner = p.owner?.id === user.id;
      const isSM = p.scrumMaster?.id === user.id;
      const isMember = p.members?.some((m: any) => m.id === user.id);
      matchesMyProjects = isOwner || isSM || isMember;
    }

    return (
      matchesSearch &&
      matchesSM &&
      matchesPO &&
      matchesStatus &&
      matchesMyProjects
    );
  });

  return (
    <div
      style={{ position: "relative", minHeight: "80vh", paddingBottom: "60px" }}
    >
      <Title level={2}>Proyectos</Title>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar por nombre..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          allowClear
          placeholder="Filtrar por Scrum Master"
          style={{ width: 200 }}
          onChange={setFilterSM}
        >
          {scrumMasters.map((sm) => (
            <Option key={sm.id} value={sm.id}>
              {sm.fullName || sm.email}
            </Option>
          ))}
        </Select>

        {(isAdmin || isOwner) && (
          <Select
            allowClear
            placeholder="Filtrar por Product Owner"
            style={{ width: 200 }}
            onChange={setFilterPO}
          >
            {productOwners.map((po) => (
              <Option key={po.id} value={po.id}>
                {po.fullName || po.email}
              </Option>
            ))}
          </Select>
        )}

        <Select
          allowClear
          placeholder="Estado"
          style={{ width: 150 }}
          onChange={setFilterStatus}
        >
          <Option value="active">Activo</Option>
          <Option value="completed">Completado</Option>
          <Option value="archived">Archivado</Option>
        </Select>

        {!isAdmin && !isOwner && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch checked={showMyProjects} onChange={setShowMyProjects} />
            <Text>Mis Proyectos</Text>
          </div>
        )}
      </div>

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

                <div style={{ display: "flex", gap: 4 }}>
                  {isAdmin && (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                    />
                  )}
                  <Tag
                    color={project.status === "active" ? "green" : "default"}
                    style={{ margin: 0 }}
                  >
                    {project.status === "active" ? "Activo" : project.status}
                  </Tag>
                </div>
              </div>

              <Paragraph
                ellipsis={{ rows: 3, expandable: false, symbol: "..." }}
                style={{ color: "#666", flex: 1, marginBottom: 16 }}
              >
                {project.description}
              </Paragraph>

              {/* --- DATES --- */}
              {(project.startDate || project.endDate) && (
                <div
                  style={{ marginBottom: 12, fontSize: "12px", color: "#888" }}
                >
                  {project.startDate && (
                    <span>Inicio: {project.startDate}</span>
                  )}
                  {project.startDate && project.endDate && (
                    <span style={{ margin: "0 8px" }}>|</span>
                  )}
                  {project.endDate && <span>Fin: {project.endDate}</span>}
                </div>
              )}

              {/* --- FOOTER --- */}
              <div
                style={{
                  marginTop: "auto",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 12,
                }}
              >
                <Row justify="space-between" align="bottom">
                  <Col span={18}>
                    {/* Roles: PO & SM */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "100%",
                      }}
                    >
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

      {/* Floating Action Button for ADMIN only */}
      {isAdmin && (
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Fecha Inicio">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Fecha Fin (Aprox)">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="poId"
            label="Product Owner"
            rules={[{ required: true, message: "Selecciona un Product Owner" }]}
          >
            <Select placeholder="Selecciona un Product Owner">
              {productOwners.map((po) => (
                <Option key={po.id} value={po.id}>
                  {po.fullName || po.email}
                </Option>
              ))}
            </Select>
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

          <Form.Item
            name="devIds"
            label="Developers"
            rules={[{ required: false }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Seleccionar Desarrolladores"
              optionFilterProp="children"
            >
              {developers.map((dev) => (
                <Option key={dev.id} value={dev.id}>
                  {dev.fullName || dev.email}
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

      {/* Edit Project Modal */}
      <Modal
        title="Editar Proyecto"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditProject}>
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Fecha Inicio">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="Fecha Fin (Aprox)">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="poId"
            label="Product Owner"
            rules={[{ required: true, message: "Selecciona un Product Owner" }]}
          >
            <Select placeholder="Selecciona un Product Owner">
              {productOwners.map((po) => (
                <Option key={po.id} value={po.id}>
                  {po.fullName || po.email}
                </Option>
              ))}
            </Select>
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

          <Form.Item
            name="devIds"
            label="Developers"
            rules={[{ required: false }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Seleccionar Desarrolladores"
              optionFilterProp="children"
            >
              {developers.map((dev) => (
                <Option key={dev.id} value={dev.id}>
                  {dev.fullName || dev.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Estado">
            <Select>
              <Option value="active">Activo</Option>
              <Option value="completed">Completado</Option>
              <Option value="archived">Archivado</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsEditModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Actualizar Proyecto
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
            <Tag
              color={selectedProject?.status === "active" ? "green" : "default"}
              style={{ marginLeft: 10 }}
            >
              {selectedProject?.status || "active"}
            </Tag>
          </div>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {selectedProject && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Descripción</Text>
              <Paragraph
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: 12,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                {selectedProject.description}
              </Paragraph>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" title="Fechas">
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Inicio:</Text>
                      <Text strong>{selectedProject.startDate || "N/A"}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Fin (Estimado):</Text>
                      <Text strong>{selectedProject.endDate || "N/A"}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Equipo Principal">
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <SafetyCertificateOutlined style={{ color: "#1890ff" }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Product Owner
                        </Text>
                        <div style={{ fontWeight: 500 }}>
                          {selectedProject.owner?.fullName || "Sin asignar"}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <UserOutlined style={{ color: "#fa8c16" }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Scrum Master
                        </Text>
                        <div style={{ fontWeight: 500 }}>
                          {selectedProject.scrumMaster?.fullName ||
                            "Sin asignar"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider>Equipo de Desarrollo</Divider>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {getDevMembers(selectedProject).length > 0 ? (
                  getDevMembers(selectedProject).map((dev: any) => (
                    <Tag
                      icon={<UserOutlined />}
                      color="blue"
                      key={dev.id}
                      style={{ padding: "4px 10px", fontSize: 14 }}
                    >
                      {dev.fullName || dev.email}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary" italic>
                    No hay desarrolladores asignados aún.
                  </Text>
                )}
              </div>

              {(isSM || isPO) && (
                <div
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    Gestión de Miembros
                  </Text>
                  <Form
                    form={assignForm}
                    layout="inline"
                    onFinish={handleAssignDevs}
                  >
                    <Form.Item
                      name="devIds"
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Seleccionar desarrolladores para asignar"
                        style={{ width: "100%" }}
                        optionFilterProp="children"
                      >
                        {developers.map((dev) => (
                          <Option key={dev.id} value={dev.id}>
                            {dev.fullName || dev.email}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<TeamOutlined />}
                      >
                        Actualizar Equipo
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )}
            </div>

            <div
              style={{
                textAlign: "right",
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Button onClick={() => setIsDetailsModalVisible(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;

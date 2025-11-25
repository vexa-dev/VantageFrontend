import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Tag,
  Select,
  Row,
  Col,
  Empty,
  Spin,
  App,
  Avatar,
  Tooltip,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Breadcrumb,
} from "antd";
import {
  ThunderboltOutlined,
  TrophyOutlined,
  PlusOutlined,
  ProjectOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Backlog: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // View Mode: 'EPICS' or 'STORIES'
  const [viewMode, setViewMode] = useState<"EPICS" | "STORIES">("EPICS");
  const [selectedEpic, setSelectedEpic] = useState<any | null>(null);

  const [epics, setEpics] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);

  // Create Modal States
  const [isCreateEpicModalVisible, setIsCreateEpicModalVisible] =
    useState(false);
  const [isCreateStoryModalVisible, setIsCreateStoryModalVisible] =
    useState(false);
  const [creating, setCreating] = useState(false);

  // Edit Modal States
  const [isEditEpicModalVisible, setIsEditEpicModalVisible] = useState(false);
  const [isEditStoryModalVisible, setIsEditStoryModalVisible] = useState(false);
  const [editingEpic, setEditingEpic] = useState<any | null>(null);
  const [editingStory, setEditingStory] = useState<any | null>(null);

  const [epicForm] = Form.useForm();
  const [storyForm] = Form.useForm();

  const isPO = user?.roles?.some(
    (r: string) =>
      r === "PO" ||
      r === "PRODUCT_OWNER" ||
      r === "ROLE_PO" ||
      r === "ROLE_PRODUCT_OWNER"
  );

  // Load Projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await api.get("/projects");
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProjectId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        message.error("Error al cargar proyectos");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Load Epics when Project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchEpics();
      setViewMode("EPICS");
      setSelectedEpic(null);
    }
  }, [selectedProjectId]);

  const fetchEpics = async () => {
    if (!selectedProjectId) return;
    setLoadingEpics(true);
    try {
      const res = await api.get(`/epics/project/${selectedProjectId}`);
      setEpics(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar épicas");
    } finally {
      setLoadingEpics(false);
    }
  };

  // Load Stories when Epic is selected
  useEffect(() => {
    if (selectedEpic) {
      fetchStories();
    }
  }, [selectedEpic]);

  const fetchStories = async (epicId?: number) => {
    const id = epicId || selectedEpic?.id;
    if (!id) return;

    setLoadingStories(true);
    try {
      const res = await api.get(`/stories/epic/${id}`);
      setStories(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar historias");
    } finally {
      setLoadingStories(false);
    }
  };

  const handleCreateEpic = async (values: any) => {
    if (!selectedProjectId) return;
    setCreating(true);
    try {
      await api.post("/epics", {
        ...values,
        projectId: selectedProjectId,
      });
      message.success("Épica creada exitosamente");
      setIsCreateEpicModalVisible(false);
      epicForm.resetFields();
      fetchEpics();
    } catch (err) {
      console.error(err);
      message.error("Error al crear la épica");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateStory = async (values: any) => {
    if (!selectedProjectId || !selectedEpic) return;
    setCreating(true);
    try {
      await api.post("/stories", {
        ...values,
        projectId: selectedProjectId,
        epicId: selectedEpic.id,
      });
      message.success("Historia creada exitosamente");
      setIsCreateStoryModalVisible(false);
      storyForm.resetFields();
      // Force fetch with the current epic ID
      await fetchStories(selectedEpic.id);
    } catch (err) {
      console.error(err);
      message.error("Error al crear la historia");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEpic = async (epicId: number) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar esta épica?",
      content:
        "Esta acción no se puede deshacer y eliminará todas las historias asociadas.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/epics/${epicId}`);
          message.success("Épica eliminada");
          fetchEpics();
        } catch (err) {
          console.error(err);
          message.error("Error al eliminar la épica");
        }
      },
    });
  };

  const handleDeleteStory = async (storyId: number) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar esta historia?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/stories/${storyId}`);
          message.success("Historia eliminada");
          fetchStories();
        } catch (err) {
          console.error(err);
          message.error("Error al eliminar la historia");
        }
      },
    });
  };

  const openEditEpicModal = (epic: any) => {
    setEditingEpic(epic);
    epicForm.setFieldsValue({
      title: epic.title,
      description: epic.description,
    });
    setIsEditEpicModalVisible(true);
  };

  const handleEditEpic = async (values: any) => {
    if (!editingEpic) return;
    setCreating(true);
    try {
      await api.put(`/epics/${editingEpic.id}`, {
        ...values,
        projectId: selectedProjectId,
      });
      message.success("Épica actualizada");
      setIsEditEpicModalVisible(false);
      setEditingEpic(null);
      fetchEpics();
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar la épica");
    } finally {
      setCreating(false);
    }
  };

  const openEditStoryModal = (story: any) => {
    setEditingStory(story);
    storyForm.setFieldsValue({
      title: story.title,
      description: story.description,
      businessValue: story.businessValue,
      urgency: story.urgency,
      storyPoints: story.storyPoints,
    });
    setIsEditStoryModalVisible(true);
  };

  const handleEditStory = async (values: any) => {
    if (!editingStory) return;
    setCreating(true);
    try {
      await api.put(`/stories/${editingStory.id}`, {
        ...values,
        projectId: selectedProjectId,
        epicId: selectedEpic?.id,
      });
      message.success("Historia actualizada");
      setIsEditStoryModalVisible(false);
      setEditingStory(null);
      fetchStories();
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar la historia");
    } finally {
      setCreating(false);
    }
  };

  const handleProjectChange = (value: number) => {
    setSelectedProjectId(value);
  };

  const getPriorityColor = (score: number) => {
    if (score >= 10) return "red";
    if (score >= 5) return "orange";
    return "green";
  };

  return (
    <div style={{ paddingBottom: "60px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Breadcrumb
            items={[
              { title: "Backlog" },
              {
                title:
                  viewMode === "STORIES" && selectedEpic
                    ? `Epic #${selectedEpic.epicNumber}`
                    : "Epics",
              },
            ]}
            style={{ marginBottom: 8 }}
          />
          <Title level={2} style={{ margin: 0 }}>
            {viewMode === "EPICS"
              ? "Product Backlog (Epics)"
              : `Epic #${selectedEpic?.epicNumber}: ${selectedEpic?.title}`}
          </Title>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {viewMode === "EPICS" && (
            <div style={{ width: 300 }}>
              <Select
                placeholder="Selecciona un proyecto"
                style={{ width: "100%" }}
                loading={loadingProjects}
                value={selectedProjectId}
                onChange={handleProjectChange}
                options={projects.map((p) => ({
                  label: (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Avatar
                        size="small"
                        shape="square"
                        style={{ backgroundColor: "#f0f5ff", color: "#1890ff" }}
                      >
                        {p.icon || "🚀"}
                      </Avatar>
                      {p.name}
                    </div>
                  ),
                  value: p.id,
                }))}
              />
            </div>
          )}

          {viewMode === "STORIES" && (
            <>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setViewMode("EPICS")}
              >
                Volver a Epicas
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => fetchStories()}
              >
                Refrescar
              </Button>
            </>
          )}

          {isPO && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                viewMode === "EPICS"
                  ? setIsCreateEpicModalVisible(true)
                  : setIsCreateStoryModalVisible(true)
              }
              disabled={!selectedProjectId}
            >
              {viewMode === "EPICS" ? "Nueva Épica" : "Nueva Historia"}
            </Button>
          )}
        </div>
      </div>

      {/* EPICS VIEW */}
      {viewMode === "EPICS" &&
        (loadingEpics ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : epics.length > 0 ? (
          <Row gutter={[16, 16]}>
            {epics.map((epic) => (
              <Col xs={24} sm={12} md={8} lg={6} key={epic.id}>
                <Card
                  hoverable
                  onClick={() => {
                    setSelectedEpic(epic);
                    setViewMode("STORIES");
                  }}
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  styles={{
                    body: { flex: 1, display: "flex", flexDirection: "column" },
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Tag color="purple">Epic #{epic.epicNumber}</Tag>
                      <div onClick={(e) => e.stopPropagation()}>
                        {isPO && (
                          <>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => openEditEpicModal(epic)}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteEpic(epic.id)}
                            />
                          </>
                        )}
                        <Tag color="default">{epic.status}</Tag>
                      </div>
                    </div>
                    <Text strong style={{ fontSize: 16 }}>
                      {epic.title}
                    </Text>
                  </div>

                  <Paragraph
                    ellipsis={{ rows: 3, expandable: false }}
                    style={{ color: "#666", flex: 1, marginBottom: 16 }}
                  >
                    {epic.description}
                  </Paragraph>

                  <div
                    style={{
                      textAlign: "right",
                      color: "#999",
                      fontSize: "12px",
                    }}
                  >
                    Click para ver historias
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description={
              selectedProjectId
                ? "No hay épicas en este proyecto. ¡Crea una para comenzar!"
                : "Selecciona un proyecto"
            }
          />
        ))}

      {/* STORIES VIEW */}
      {viewMode === "STORIES" &&
        (loadingStories ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : stories.length > 0 ? (
          <Row gutter={[16, 16]}>
            {stories.map((story) => (
              <Col xs={24} sm={12} md={8} lg={6} key={story.id}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  styles={{
                    body: { flex: 1, display: "flex", flexDirection: "column" },
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Tag color="blue">#{story.storyNumber}</Tag>
                      <div onClick={(e) => e.stopPropagation()}>
                        {isPO && (
                          <>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => openEditStoryModal(story)}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteStory(story.id)}
                            />
                          </>
                        )}
                        <Tag
                          color={story.status === "DONE" ? "green" : "default"}
                        >
                          {story.status}
                        </Tag>
                      </div>
                    </div>
                    <Text strong style={{ fontSize: 16 }}>
                      {story.title}
                    </Text>
                  </div>

                  <Paragraph
                    ellipsis={{ rows: 3, expandable: false }}
                    style={{ color: "#666", flex: 1, marginBottom: 16 }}
                  >
                    {story.description}
                  </Paragraph>

                  <div
                    style={{
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Tooltip title="Story Points">
                      <Tag icon={<TrophyOutlined />} color="purple">
                        {story.storyPoints} pts
                      </Tag>
                    </Tooltip>

                    <Tooltip
                      title={`Priority Score: ${story.priorityScore?.toFixed(
                        1
                      )}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ThunderboltOutlined
                          style={{
                            color: getPriorityColor(story.priorityScore || 0),
                          }}
                        />
                        <Text type="secondary">
                          {story.priorityScore?.toFixed(1)}
                        </Text>
                      </div>
                    </Tooltip>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No hay historias en esta épica" />
        ))}

      {/* Create Epic Modal */}
      <Modal
        title="Crear Nueva Épica"
        open={isCreateEpicModalVisible}
        onCancel={() => setIsCreateEpicModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={epicForm} layout="vertical" onFinish={handleCreateEpic}>
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Por favor ingresa el título" }]}
          >
            <Input placeholder="Título de la Épica" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              { required: true, message: "Por favor ingresa una descripción" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Descripción de la Épica..." />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsCreateEpicModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Crear Épica
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Story Modal */}
      <Modal
        title={`Crear Historia en Epic #${selectedEpic?.epicNumber}`}
        open={isCreateStoryModalVisible}
        onCancel={() => setIsCreateStoryModalVisible(false)}
        footer={null}
        centered
      >
        <Form
          form={storyForm}
          layout="vertical"
          onFinish={handleCreateStory}
          initialValues={{ storyPoints: 1, businessValue: 0, urgency: 0 }}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Por favor ingresa el título" }]}
          >
            <Input placeholder="Como usuario quiero..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción / Criterios de Aceptación"
            rules={[
              { required: true, message: "Por favor ingresa una descripción" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Detalles de la historia..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="businessValue"
                label="Valor Negocio"
                tooltip="0-100"
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="urgency" label="Urgencia" tooltip="0-100">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="storyPoints" label="Puntos" tooltip="Fibonacci">
                <Select>
                  {[1, 2, 3, 5, 8, 13, 21].map((p) => (
                    <Option key={p} value={p}>
                      {p}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsCreateStoryModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Crear Historia
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Epic Modal */}
      <Modal
        title="Editar Épica"
        open={isEditEpicModalVisible}
        onCancel={() => setIsEditEpicModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={epicForm} layout="vertical" onFinish={handleEditEpic}>
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Por favor ingresa el título" }]}
          >
            <Input placeholder="Título de la Épica" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              { required: true, message: "Por favor ingresa una descripción" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Descripción de la Épica..." />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsEditEpicModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Actualizar Épica
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Story Modal */}
      <Modal
        title="Editar Historia"
        open={isEditStoryModalVisible}
        onCancel={() => setIsEditStoryModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={storyForm} layout="vertical" onFinish={handleEditStory}>
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Por favor ingresa el título" }]}
          >
            <Input placeholder="Como usuario quiero..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción / Criterios de Aceptación"
            rules={[
              { required: true, message: "Por favor ingresa una descripción" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Detalles de la historia..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="businessValue"
                label="Valor Negocio"
                tooltip="0-100"
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="urgency" label="Urgencia" tooltip="0-100">
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="storyPoints" label="Puntos" tooltip="Fibonacci">
                <Select>
                  {[1, 2, 3, 5, 8, 13, 21].map((p) => (
                    <Option key={p} value={p}>
                      {p}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              onClick={() => setIsEditStoryModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Actualizar Historia
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Backlog;

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
} from "antd";
import {
  ThunderboltOutlined,
  TrophyOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Backlog: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);
  
  // Create Story State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const isPO = user?.roles?.some(
    (r: string) =>
      r === "PO" ||
      r === "PRODUCT_OWNER" ||
      r === "ROLE_PO" ||
      r === "ROLE_PRODUCT_OWNER"
  );

  // Cargar proyectos asignados al usuario
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        // Usamos /projects para obtener solo los proyectos del usuario (getMyProjects)
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

  // Cargar backlog cuando cambia el proyecto seleccionado
  const fetchBacklog = async () => {
    if (!selectedProjectId) return;
    setLoadingStories(true);
    try {
      const res = await api.get(`/stories/backlog/${selectedProjectId}`);
      setStories(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar el backlog");
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchBacklog();
  }, [selectedProjectId]);

  const handleCreateStory = async (values: any) => {
    if (!selectedProjectId) return;
    setCreating(true);
    try {
      await api.post("/stories", {
        ...values,
        projectId: selectedProjectId,
      });
      message.success("Historia creada exitosamente");
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchBacklog();
    } catch (err) {
      console.error(err);
      message.error("Error al crear la historia");
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
        <Title level={2} style={{ margin: 0 }}>
          Product Backlog
        </Title>
        
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 300 }}>
            <Select
              placeholder="Selecciona un proyecto"
              style={{ width: "100%" }}
              loading={loadingProjects}
              value={selectedProjectId}
              onChange={handleProjectChange}
              options={projects.map((p) => ({
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          {isPO && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsCreateModalVisible(true)}
              disabled={!selectedProjectId}
            >
              Nueva Historia
            </Button>
          )}
        </div>
      </div>

      {loadingStories ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : stories.length > 0 ? (
        <Row gutter={[16, 16]}>
          {stories.map((story) => (
            <Col xs={24} sm={12} md={8} lg={6} key={story.id}>
              <Card
                hoverable
                style={{ height: "100%", display: "flex", flexDirection: "column" }}
                styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Tag color="blue">#{story.id}</Tag>
                    <Tag color={story.status === "DONE" ? "green" : "default"}>
                      {story.status}
                    </Tag>
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

                  <Tooltip title={`Priority Score: ${story.priorityScore?.toFixed(1)}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <ThunderboltOutlined
                        style={{ color: getPriorityColor(story.priorityScore || 0) }}
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
        <Empty
          description={
            selectedProjectId
              ? "No hay historias en el backlog de este proyecto"
              : "Selecciona un proyecto para ver su backlog"
          }
        />
      )}

      {/* Create Story Modal */}
      <Modal
        title="Crear Nueva Historia de Usuario"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        centered
      >
        <Form
          form={form}
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
            rules={[{ required: true, message: "Por favor ingresa una descripción" }]}
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
              <Form.Item
                name="urgency"
                label="Urgencia"
                tooltip="0-100"
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="storyPoints"
                label="Puntos"
                tooltip="Fibonacci"
              >
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
            <Button onClick={() => setIsCreateModalVisible(false)} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Crear Historia
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Backlog;

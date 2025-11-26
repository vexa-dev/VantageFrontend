import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Badge,
  Select,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  App,
  Empty,
  Spin,
  Row,
  Col,
  Avatar,
  Tag,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const Sprints: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [sprints, setSprints] = useState<any[]>([]);
  const [unassignedIssues, setUnassignedIssues] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isSM = user?.roles?.some(
    (r: string) =>
      r === "SM" ||
      r === "SCRUM_MASTER" ||
      r === "ROLE_SM" ||
      r === "ROLE_SCRUM_MASTER"
  );

  const [projectIssues, setProjectIssues] = useState<any[]>([]);

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

  // Load Sprints when Project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchSprints();
    }
  }, [selectedProjectId]);

  // Load unassigned issues when create modal opens
  useEffect(() => {
    if (isCreateModalVisible && selectedProjectId) {
      fetchUnassignedIssues();
    }
  }, [isCreateModalVisible, selectedProjectId]);

  // Load ALL project issues when edit modal opens (to allow assigning/unassigning)
  useEffect(() => {
    if (isEditing && selectedProjectId) {
      fetchProjectIssues();
    }
  }, [isEditing, selectedProjectId]);

  // Populate form when editing starts
  useEffect(() => {
    if (isEditing && selectedSprint) {
      form.setFieldsValue({
        name: selectedSprint.name,
        goal: selectedSprint.goal,
        dates: [dayjs(selectedSprint.startDate), dayjs(selectedSprint.endDate)],
        issueIds: selectedSprint.issues?.map((i: any) => i.id) || [],
      });
    }
  }, [isEditing, selectedSprint, form]);

  const fetchSprints = async () => {
    if (!selectedProjectId) return;
    setLoadingSprints(true);
    try {
      const res = await api.get(`/sprints/project/${selectedProjectId}`);
      setSprints(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar sprints");
    } finally {
      setLoadingSprints(false);
    }
  };

  const fetchUnassignedIssues = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await api.get(
        `/issues/project/${selectedProjectId}/unassigned`
      );
      setUnassignedIssues(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar issues no asignados");
    }
  };

  const fetchProjectIssues = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await api.get(`/issues/project/${selectedProjectId}`);
      setProjectIssues(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar issues del proyecto");
    }
  };

  const handleCreateSprint = async (values: any) => {
    if (!selectedProjectId) return;
    setCreating(true);
    try {
      const [startDate, endDate] = values.dates;
      await api.post("/sprints", {
        name: values.name,
        goal: values.goal,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        projectId: selectedProjectId,
        issueIds: values.issueIds,
      });
      message.success("Sprint creado exitosamente");
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchSprints();
    } catch (err) {
      console.error(err);
      message.error("Error al crear el sprint");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSprint = async (values: any) => {
    if (!selectedSprint) return;
    setCreating(true);
    try {
      const [startDate, endDate] = values.dates;
      await api.put(`/sprints/${selectedSprint.id}`, {
        name: values.name,
        goal: values.goal,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
        projectId: selectedProjectId,
        issueIds: values.issueIds,
      });
      message.success("Sprint actualizado exitosamente");
      setIsDetailsModalVisible(false);
      setIsEditing(false);
      setSelectedSprint(null);
      fetchSprints();
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar el sprint");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSprint = async () => {
    if (!selectedSprint) return;
    Modal.confirm({
      title: "¿Estás seguro de eliminar este sprint?",
      content: "Esta acción no se puede deshacer.",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/sprints/${selectedSprint.id}`);
          message.success("Sprint eliminado");
          setIsDetailsModalVisible(false);
          setSelectedSprint(null);
          fetchSprints();
        } catch (err) {
          console.error(err);
          message.error("Error al eliminar el sprint");
        }
      },
    });
  };

  const openDetailsModal = (sprint: any) => {
    setSelectedSprint(sprint);
    setIsEditing(false);
    setIsDetailsModalVisible(true);
  };

  const getStatusColor = (sprint: any) => {
    const now = dayjs();
    const start = dayjs(sprint.startDate);
    const end = dayjs(sprint.endDate);

    if (now.isBefore(start)) return "default"; // Planned
    if (now.isAfter(end)) return "success"; // Completed
    return "processing"; // Active
  };

  const getStatusText = (sprint: any) => {
    const now = dayjs();
    const start = dayjs(sprint.startDate);
    const end = dayjs(sprint.endDate);

    if (now.isBefore(start)) return "Planificado";
    if (now.isAfter(end)) return "Completado";
    return "Activo";
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Sprints
        </Title>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Select
            placeholder="Selecciona un proyecto"
            style={{ width: 300 }}
            loading={loadingProjects}
            value={selectedProjectId}
            onChange={setSelectedProjectId}
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
          {isSM && selectedProjectId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setIsCreateModalVisible(true);
              }}
            >
              Crear Sprint
            </Button>
          )}
        </div>
      </div>

      {loadingSprints ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : sprints.length > 0 ? (
        <Row gutter={[16, 16]}>
          {sprints.map((sprint, index) => (
            <Col xs={24} sm={12} lg={8} key={sprint.id}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Tag color="blue">Sprint #{index + 1}</Tag>
                    <span>{sprint.name}</span>
                  </div>
                }
                extra={
                  <Badge
                    status={getStatusColor(sprint) as any}
                    text={getStatusText(sprint)}
                  />
                }
                hoverable
                onClick={() => openDetailsModal(sprint)}
                style={{ cursor: "pointer" }}
              >
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  type="secondary"
                  style={{ minHeight: 44 }}
                >
                  {sprint.goal || "Sin objetivo definido"}
                </Paragraph>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#666",
                    marginTop: 16,
                  }}
                >
                  <CalendarOutlined />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {dayjs(sprint.startDate).format("DD MMM")} -{" "}
                    {dayjs(sprint.endDate).format("DD MMM YYYY")}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="No hay sprints creados para este proyecto" />
      )}

      {/* Create Modal */}
      <Modal
        title="Crear Nuevo Sprint"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={creating}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSprint}>
          <Form.Item
            name="name"
            label="Nombre del Sprint"
            rules={[{ required: true, message: "Ingresa el nombre" }]}
          >
            <Input placeholder="Ej: Sprint 1: Inicialización" />
          </Form.Item>
          <Form.Item
            name="goal"
            label="Objetivo del Sprint"
            rules={[{ required: true, message: "Ingresa el objetivo" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe el objetivo principal"
            />
          </Form.Item>
          <Form.Item
            name="dates"
            label="Duración"
            rules={[{ required: true, message: "Selecciona las fechas" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="issueIds" label="Asignar Issues (Opcional)">
            <Select
              mode="multiple"
              placeholder="Selecciona issues para este sprint"
              optionLabelProp="label"
              filterOption={(input, option) =>
                ((option?.label as string) ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {unassignedIssues.map((issue) => (
                <Select.Option
                  key={issue.id}
                  value={issue.id}
                  label={issue.title}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{issue.title}</span>
                    <Tag>{issue.status}</Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Details/Edit Modal */}
      <Modal
        title={isEditing ? "Editar Sprint" : "Detalles del Sprint"}
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={
          isEditing
            ? [
                <Button key="cancel" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  loading={creating}
                  onClick={() => form.submit()}
                >
                  Guardar Cambios
                </Button>,
              ]
            : [
                isSM && (
                  <Button
                    key="delete"
                    danger
                    onClick={handleDeleteSprint}
                    style={{ float: "left" }}
                  >
                    Eliminar
                  </Button>
                ),
                <Button
                  key="close"
                  onClick={() => setIsDetailsModalVisible(false)}
                >
                  Cerrar
                </Button>,
                isSM && (
                  <Button
                    key="edit"
                    type="primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                ),
              ]
        }
        width={600}
      >
        {isEditing ? (
          <Form form={form} layout="vertical" onFinish={handleUpdateSprint}>
            <Form.Item
              name="name"
              label="Nombre del Sprint"
              rules={[{ required: true, message: "Ingresa el nombre" }]}
            >
              <Input placeholder="Ej: Sprint 1: Inicialización" />
            </Form.Item>
            <Form.Item
              name="goal"
              label="Objetivo del Sprint"
              rules={[{ required: true, message: "Ingresa el objetivo" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe el objetivo principal"
              />
            </Form.Item>
            <Form.Item
              name="dates"
              label="Duración"
              rules={[{ required: true, message: "Selecciona las fechas" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="issueIds" label="Asignar Issues">
              <Select
                mode="multiple"
                placeholder="Selecciona issues para este sprint"
                optionLabelProp="label"
                filterOption={(input, option) =>
                  ((option?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {projectIssues.map((issue) => (
                  <Select.Option
                    key={issue.id}
                    value={issue.id}
                    label={issue.title}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{issue.title}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {issue.sprint &&
                          issue.sprint.id !== selectedSprint?.id && (
                            <Tag color="orange">Otro Sprint</Tag>
                          )}
                        <Tag>{issue.status}</Tag>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        ) : (
          selectedSprint && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">
                  Sprint #
                  {sprints.findIndex((s) => s.id === selectedSprint.id) + 1}
                </Tag>
                <Badge
                  status={getStatusColor(selectedSprint) as any}
                  text={getStatusText(selectedSprint)}
                  style={{ marginLeft: 8 }}
                />
              </div>
              <Title level={4}>{selectedSprint.name}</Title>
              <Paragraph type="secondary">
                {selectedSprint.goal || "Sin objetivo"}
              </Paragraph>

              <div style={{ marginTop: 24 }}>
                <Text strong>Fechas:</Text>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <CalendarOutlined />
                  {dayjs(selectedSprint.startDate).format("DD MMM YYYY")} -{" "}
                  {dayjs(selectedSprint.endDate).format("DD MMM YYYY")}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Text strong>
                  Issues Asignados ({selectedSprint.issues?.length || 0}):
                </Text>
                <div
                  style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}
                >
                  {selectedSprint.issues && selectedSprint.issues.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {selectedSprint.issues.map((issue: any) => (
                        <Card
                          key={issue.id}
                          size="small"
                          style={{
                            width: "100%",
                            cursor: "pointer",
                            transition: "border-color 0.3s",
                            boxShadow: "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = "#40a9ff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = "")
                          }
                          onClick={() => {
                            setIsDetailsModalVisible(false);
                            if (issue.story?.id) {
                              navigate(`/issues/${issue.story.id}`);
                            } else {
                              message.warning(
                                "Este issue no tiene una historia asociada"
                              );
                            }
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text>{issue.title}</Text>
                            <Tag>{issue.status}</Tag>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      description="No hay issues asignados"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default Sprints;

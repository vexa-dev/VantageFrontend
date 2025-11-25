import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  App,
  Breadcrumb,
  Space,
  Avatar,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BugOutlined,
  ArrowLeftOutlined,
  CodeOutlined,
  DatabaseOutlined,
  BgColorsOutlined,
  ExperimentOutlined,
  CloudServerOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Issues: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useAuthStore();

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [storyDetails, setStoryDetails] = useState<any>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  const isSM = user?.roles?.some(
    (r: string) => r === "SM" || r === "SCRUM_MASTER" || r === "ROLE_SM"
  );

  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchStoryDetails();
  }, [storyId]);

  const fetchStoryDetails = async () => {
    try {
      const res = await api.get(`/stories/${storyId}`);
      setStoryDetails(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar detalles de la historia");
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/issues/story/${storyId}`);
      setIssues(res.data);
    } catch (err) {
      console.error(err);
      message.error("Error al cargar issues");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/issues/story/${storyId}/assignees`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingIssue) {
        await api.put(`/issues/${editingIssue.id}`, values, config);
        message.success("Issue actualizado");
      } else {
        await api.post("/issues", { ...values, storyId }, config);
        message.success("Issue creado");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingIssue(null);
      fetchIssues();
    } catch (err) {
      console.error(err);
      message.error("Error al guardar issue");
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "¿Eliminar Issue?",
      content: "Esta acción no se puede deshacer.",
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.delete(`/issues/${id}`);
          message.success("Issue eliminado");
          fetchIssues();
        } catch (err) {
          console.error(err);
          message.error("Error al eliminar issue");
        }
      },
    });
  };

  const openModal = (issue?: any) => {
    if (issue) {
      setEditingIssue(issue);
      form.setFieldsValue({
        ...issue,
        assigneeIds: issue.assignees?.map((u: any) => u.id),
      });
    } else {
      setEditingIssue(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "BUG":
        return <BugOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />;
      case "BACKEND":
        return <CodeOutlined style={{ color: "#1890ff", fontSize: 16 }} />;
      case "FRONTEND":
        return <DesktopOutlined style={{ color: "#52c41a", fontSize: 16 }} />;
      case "DATABASE":
        return <DatabaseOutlined style={{ color: "#722ed1", fontSize: 16 }} />;
      case "DEVOPS":
        return (
          <CloudServerOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
        );
      case "DESIGN":
        return <BgColorsOutlined style={{ color: "#eb2f96", fontSize: 16 }} />;
      case "QA":
        return (
          <ExperimentOutlined style={{ color: "#faad14", fontSize: 16 }} />
        );
      default:
        return null;
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      TO_DO: "To Do",
      IN_PROGRESS: "In Progress",
      CODE_REVIEW: "Code Review",
      QA: "QA",
      DONE: "Done",
      BLOCKED: "Blocked",
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      title: "Tipo",
      dataIndex: "category",
      key: "category",
      render: (category: string) => (
        <Space>
          {getCategoryIcon(category)}
          <Text>{category}</Text>
        </Space>
      ),
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Tiempo (h)",
      dataIndex: "timeEstimate",
      key: "timeEstimate",
      render: (time: number) => (time ? <Tag>{time} h</Tag> : "-"),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "IN_PROGRESS") color = "processing";
        if (status === "DONE") color = "success";
        if (status === "BLOCKED") color = "error";
        if (status === "QA") color = "warning";
        if (status === "CODE_REVIEW") color = "purple";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Asignados",
      dataIndex: "assignees",
      key: "assignees",
      render: (assignees: any[]) => (
        <Avatar.Group max={{ count: 3 }}>
          {assignees?.map((u) => (
            <Tooltip title={u.fullName} key={u.id}>
              <Avatar style={{ backgroundColor: "#87d068" }}>
                {u.fullName[0]}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: any) =>
        isSM && (
          <Space>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openModal(record);
              }}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record.id);
              }}
            />
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          {
            title: (
              <a
                onClick={() => {
                  if (storyDetails) {
                    navigate("/backlog", {
                      state: {
                        viewMode: "STORIES",
                        selectedEpic: storyDetails.epic,
                        selectedProjectId: storyDetails.project?.id,
                      },
                    });
                  } else {
                    navigate("/backlog");
                  }
                }}
              >
                Backlog
              </a>
            ),
          },
          { title: "Issues" },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Story Title and Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {storyDetails && (
          <Title level={2} style={{ margin: 0 }}>
            #{storyDetails.storyNumber} - {storyDetails.title}
          </Title>
        )}
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (storyDetails) {
                navigate("/backlog", {
                  state: {
                    viewMode: "STORIES",
                    selectedEpic: storyDetails.epic,
                    selectedProjectId: storyDetails.project?.id,
                  },
                });
              } else {
                navigate(-1);
              }
            }}
          >
            Volver
          </Button>
          {isSM && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              Crear Issue
            </Button>
          )}
        </Space>
      </div>

      {/* Project and Story Details - Compact Two-Column Layout */}
      {storyDetails && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            {/* Left Column */}
            <div style={{ flex: 1 }}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Proyecto: <Text strong>{storyDetails.project?.name}</Text>
              </Text>
              {storyDetails.epic?.title && (
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Épica: <Text strong>{storyDetails.epic.title}</Text>
                </Text>
              )}
              {storyDetails.description && (
                <>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 8, marginBottom: 4 }}
                  >
                    Descripción:
                  </Text>
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2, expandable: true, symbol: "ver más" }}
                    style={{ marginBottom: 0 }}
                  >
                    {storyDetails.description}
                  </Paragraph>
                </>
              )}
            </div>

            {/* Right Column - Acceptance Criteria */}
            {storyDetails.acceptanceCriteria &&
              storyDetails.acceptanceCriteria.length > 0 && (
                <div style={{ flex: 1 }}>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 4 }}
                  >
                    Criterios de Aceptación:
                  </Text>
                  <ul
                    style={{
                      marginTop: 4,
                      marginBottom: 0,
                      paddingLeft: 20,
                      color: "#666",
                    }}
                  >
                    {storyDetails.acceptanceCriteria
                      .slice(0, 3)
                      .map((criterion: string, index: number) => (
                        <li key={index} style={{ marginBottom: 2 }}>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {criterion}
                          </Text>
                        </li>
                      ))}
                    {storyDetails.acceptanceCriteria.length > 3 && (
                      <li style={{ marginBottom: 2 }}>
                        <Text
                          type="secondary"
                          style={{ fontSize: 13, fontStyle: "italic" }}
                        >
                          +{storyDetails.acceptanceCriteria.length - 3} más...
                        </Text>
                      </li>
                    )}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={issues}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => {
            setSelectedIssue(record);
            setIsDetailsModalVisible(true);
          },
          style: { cursor: "pointer" },
        })}
      />

      {/* Modal de Detalles */}
      <Modal
        title={
          <Text strong style={{ fontSize: 18 }}>
            Detalles del Issue
          </Text>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Cerrar
          </Button>,
          ...(isSM
            ? [
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setIsDetailsModalVisible(false);
                    openModal(selectedIssue);
                  }}
                >
                  Editar
                </Button>,
              ]
            : []),
        ]}
        width={700}
      >
        {selectedIssue && (
          <div style={{ padding: "16px 0" }}>
            <Space
              orientation="vertical"
              size="large"
              style={{ width: "100%" }}
            >
              {/* Categoría y Estado */}
              <div>
                <Text type="secondary">Categoría y Estado</Text>
                <div style={{ marginTop: 8 }}>
                  <Space size="middle">
                    <Space>
                      {getCategoryIcon(selectedIssue.category)}
                      <Tag color="blue">{selectedIssue.category}</Tag>
                    </Space>
                    <Tag
                      color={
                        selectedIssue.status === "IN_PROGRESS"
                          ? "processing"
                          : selectedIssue.status === "DONE"
                          ? "success"
                          : selectedIssue.status === "BLOCKED"
                          ? "error"
                          : selectedIssue.status === "QA"
                          ? "warning"
                          : selectedIssue.status === "CODE_REVIEW"
                          ? "purple"
                          : "default"
                      }
                    >
                      {formatStatus(selectedIssue.status)}
                    </Tag>
                  </Space>
                </div>
              </div>

              {/* Título */}
              <div>
                <Text type="secondary">Título</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedIssue.title}
                  </Text>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Text type="secondary">Descripción</Text>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 4,
                  }}
                >
                  <Text>{selectedIssue.description || "Sin descripción"}</Text>
                </div>
              </div>

              {/* Tiempo Estimado */}
              <div>
                <Text type="secondary">Tiempo Estimado</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag
                    color="orange"
                    style={{ fontSize: 14, padding: "4px 12px" }}
                  >
                    {selectedIssue.timeEstimate
                      ? `${selectedIssue.timeEstimate} horas`
                      : "No especificado"}
                  </Tag>
                </div>
              </div>

              {/* Asignados */}
              <div>
                <Text type="secondary">Desarrolladores Asignados</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedIssue.assignees &&
                  selectedIssue.assignees.length > 0 ? (
                    <Space size="middle" wrap>
                      {selectedIssue.assignees.map((assignee: any) => (
                        <Space key={assignee.id}>
                          <Avatar style={{ backgroundColor: "#87d068" }}>
                            {assignee.fullName[0]}
                          </Avatar>
                          <Text>{assignee.fullName}</Text>
                        </Space>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">Sin asignar</Text>
                  )}
                </div>
              </div>

              {/* Fecha de Creación */}
              {selectedIssue.createdAt && (
                <div>
                  <Text type="secondary">Fecha de Creación</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>
                      {new Date(selectedIssue.createdAt).toLocaleString(
                        "es-PE"
                      )}
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title={editingIssue ? "Editar Issue" : "Crear Issue"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Ingresa el título" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Categoría"
            rules={[{ required: true }]}
            initialValue="BACKEND"
          >
            <Select>
              <Option value="BACKEND">Backend (Lógica, API)</Option>
              <Option value="FRONTEND">Frontend (Interfaz, React)</Option>
              <Option value="DATABASE">Base de Datos (SQL, Migraciones)</Option>
              <Option value="QA">QA / Testing</Option>
              <Option value="DESIGN">Diseño (UI/UX)</Option>
              <Option value="BUG">Bug</Option>
              <Option value="DEVOPS">DevOps</Option>
            </Select>
          </Form.Item>

          <Form.Item name="timeEstimate" label="Tiempo estimado (horas)">
            <Input type="number" step="0.5" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Estado"
            rules={[{ required: true }]}
            initialValue="TO_DO"
          >
            <Select>
              <Option value="TO_DO">To Do</Option>
              <Option value="IN_PROGRESS">In Progress</Option>
              <Option value="CODE_REVIEW">Code Review</Option>
              <Option value="QA">QA / Testing</Option>
              <Option value="DONE">Done</Option>
              <Option value="BLOCKED">Blocked</Option>
            </Select>
          </Form.Item>

          <Form.Item name="assigneeIds" label="Asignar a">
            <Select mode="multiple" placeholder="Selecciona desarrolladores">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: "right" }}>
            <Button
              onClick={() => setIsModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Issues;

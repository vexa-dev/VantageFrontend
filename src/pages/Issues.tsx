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
  CheckSquareOutlined,
  RiseOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const { Title, Text } = Typography;
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

  const isSM = user?.roles?.some(
    (r: string) => r === "SM" || r === "SCRUM_MASTER" || r === "ROLE_SM"
  );

  useEffect(() => {
    fetchIssues();
    fetchUsers();
  }, [storyId]);

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
        return <BugOutlined style={{ color: "red" }} />;
      case "BACKEND":
      case "FRONTEND":
      case "DATABASE":
      case "DEVOPS":
        return <CheckSquareOutlined style={{ color: "blue" }} />;
      case "DESIGN":
        return <RiseOutlined style={{ color: "purple" }} />;
      case "QA":
        return <CheckSquareOutlined style={{ color: "orange" }} />;
      default:
        return null;
    }
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
              onClick={() => openModal(record)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record.id)}
            />
          </Space>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate("/backlog")}>Backlog</a> },
          { title: "Issues" },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2}>Gestión de Issues</Title>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
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

      <Table
        columns={columns}
        dataSource={issues}
        rowKey="id"
        loading={loading}
      />

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

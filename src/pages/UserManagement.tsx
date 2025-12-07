import React, { useEffect, useState } from "react";
import {
  Typography,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Alert,
  App,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  StopOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const { Title, Text } = Typography;
const { Option } = Select;

interface UserType {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { message, modal } = App.useApp();

  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [form] = Form.useForm();

  // Reassignment Modal State
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [replacementUserId, setReplacementUserId] = useState<number | null>(
    null
  );
  const [reassignMessage, setReassignMessage] = useState("");

  const { user } = useAuthStore();
  const isOwner = user?.roles?.some((r) => r === "ROLE_OWNER" || r === "OWNER");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/company");
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      message.error("Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = users;

    // 1. Text Search
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      );
    }

    // 2. Role Filter
    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // 3. Status Filter
    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      result = result.filter((u) => u.isActive === isActive);
    }

    setFilteredUsers(result);
  }, [users, searchText, roleFilter, statusFilter]);

  const handleOpenModal = (user: UserType | null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSaveUser = async (values: any) => {
    try {
      if (editingUser) {
        // Edit Mode
        await api.put(`/users/${editingUser.id}`, {
          fullName: values.fullName,
          email: values.email,
          role: values.role,
        });
        message.success("Usuario actualizado exitosamente");
      } else {
        // Create Mode
        await api.post("/users", {
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        message.success("Usuario creado exitosamente");
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      const err = error.response?.data?.message || "Intente nuevamente";
      message.error("Error al guardar usuario: " + err);
    }
  };

  const handleDelete = (
    userId: number,
    replacementId: number | null = null
  ) => {
    api
      .delete(`/users/${userId}`, {
        params: replacementId ? { replacementUserId: replacementId } : {},
      })
      .then(() => {
        message.success("Usuario desactivado exitosamente");
        fetchUsers();
        setReassignModalVisible(false);
        setUserToDelete(null);
        setReplacementUserId(null);
      })
      .catch((error: any) => {
        const errorType = error.response?.data?.type;
        const errorMessage = error.response?.data?.message;

        if (errorType === "CRITICAL_DEPENDENCY") {
          modal.error({
            title: "No se puede desactivar",
            content: (
              <div>
                <Text type="danger" strong>
                  Dependencia Crítica Detectada
                </Text>
                <p>{errorMessage}</p>
                <Text type="secondary">
                  Este usuario es responsable de proyectos activos. Debes ir a
                  la configuración del proyecto y asignar un nuevo Leader/Owner
                  antes de continuar.
                </Text>
              </div>
            ),
            okText: "Entendido",
          });
        } else if (errorType === "REASSIGNMENT_NEEDED") {
          setUserToDelete(userId);
          setReassignMessage(errorMessage);
          setReassignModalVisible(true);
        } else {
          message.error(
            "Error al desactivar: " +
              (errorMessage || "Ocurrió un error inesperado")
          );
        }
      });
  };

  const handleActivate = (userId: number) => {
    modal.confirm({
      title: "¿Deseas reactivar este usuario?",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      content: "El usuario recuperará su acceso al sistema inmediatamente.",
      okText: "Sí, Activar",
      okType: "primary",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api.put(`/users/${userId}/activate`);
          message.success("Usuario reactivado exitosamente");
          fetchUsers();
        } catch (error: any) {
          message.error("Error al activar usuario");
        }
      },
    });
  };

  const confirmDelete = (userId: number) => {
    modal.confirm({
      title: "¿Deseas desactivar este usuario?",
      icon: <ExclamationCircleOutlined />,
      content:
        "El usuario perderá el acceso al sistema, pero su historial se mantendrá. Puedes reactivarlo contactando a soporte (o futura feature).",
      okText: "Sí, Desactivar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk() {
        handleDelete(userId);
      },
    });
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        let color = "geekblue";
        if (role === "ROLE_OWNER") color = "gold";
        if (role === "ROLE_ADMIN") color = "red";
        if (role === "ROLE_PO") color = "purple";
        if (role === "ROLE_DEV") color = "cyan";
        return <Tag color={color}>{role.replace("ROLE_", "")}</Tag>;
      },
    },
    {
      title: "Estado",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "ACTIVO" : "INACTIVO"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: UserType) => (
        <Space size="middle">
          {record.role !== "ROLE_OWNER" && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(record)}
              >
                Editar
              </Button>

              {record.isActive ? (
                <Button
                  type="text"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => confirmDelete(record.id)}
                >
                  Desactivar
                </Button>
              ) : (
                <Button
                  type="text"
                  style={{ color: "#52c41a" }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleActivate(record.id)}
                >
                  Activar
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  if (!isOwner) {
    return (
      <Alert
        message="Acceso Restringido"
        description="Solo el Owner puede gestionar usuarios."
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  // Filter out users needed for replacement
  const devsList = users.filter(
    (u) => u.id !== userToDelete && u.role === "ROLE_DEV" && u.isActive
  );

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Gestión de Usuarios</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal(null)}
        >
          Crear Usuario
        </Button>
      </div>

      {/* FILTERS SECTION */}
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: "#fff",
          borderRadius: 8,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={10}>
            <Input
              placeholder="Buscar por nombre o email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              defaultValue="ALL"
              style={{ width: "100%" }}
              onChange={setRoleFilter}
              value={roleFilter}
            >
              <Option value="ALL">Todos los Roles</Option>
              <Option value="ROLE_ADMIN">Administrador</Option>
              <Option value="ROLE_PO">Product Owner</Option>
              <Option value="ROLE_SM">Scrum Master</Option>
              <Option value="ROLE_DEV">Developer</Option>
            </Select>
          </Col>
          <Col xs={12} sm={7}>
            <Select
              defaultValue="ALL"
              style={{ width: "100%" }}
              onChange={setStatusFilter}
              value={statusFilter}
            >
              <Option value="ALL">Todos los Estados</Option>
              <Option value="ACTIVE">Activos</Option>
              <Option value="INACTIVE">Inactivos</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
      />

      {/* CREATE/EDIT USER MODAL */}
      <Modal
        title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item
            name="fullName"
            label="Nombre Completo"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nombre Apellido" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: "Ingrese el email" },
              { type: "email", message: "Email inválido" },
            ]}
          >
            <Input placeholder="usuario@empresa.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: "Ingrese contraseña" }]}
            >
              <Input.Password placeholder="******" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: "Seleccione un rol" }]}
          >
            <Select placeholder="Seleccionar Rol">
              <Option value="ROLE_ADMIN">Administrador</Option>
              <Option value="ROLE_PO">Product Owner</Option>
              <Option value="ROLE_SM">Scrum Master</Option>
              <Option value="ROLE_DEV">Developer</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <Button onClick={() => setIsModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* REASSIGNMENT MODAL */}
      <Modal
        title="Reasignación Necesaria"
        open={reassignModalVisible}
        onCancel={() => {
          setReassignModalVisible(false);
          setUserToDelete(null);
          setReplacementUserId(null);
        }}
        onOk={() => {
          if (userToDelete) {
            handleDelete(userToDelete, replacementUserId);
          }
        }}
        okText="Confirmar y Desactivar"
        okButtonProps={{ disabled: !replacementUserId, danger: true }}
      >
        <Alert
          message="Tareas Pendientes"
          description={reassignMessage}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p>
          Seleccione un desarrollador para transferir las tareas pendientes:
        </p>
        <Select
          style={{ width: "100%" }}
          placeholder="Seleccionar nuevo responsable"
          onChange={(val) => setReplacementUserId(val)}
        >
          {devsList.map((dev) => (
            <Option key={dev.id} value={dev.id}>
              {dev.fullName}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default UserManagement;

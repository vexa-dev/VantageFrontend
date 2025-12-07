import React, { useState } from "react";
import { Typography, Card, Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { formatRole } from "../utils/roleUtils";
import api from "../services/api";

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        fullName: values.fullName,
        email: values.email,
      });
      message.success("Perfil actualizado correctamente");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al actualizar el perfil";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}/password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success("Contraseña actualizada correctamente");
      passwordForm.resetFields();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al actualizar la contraseña";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>Configuración de Usuario</Title>

      {/* Perfil */}
      <Card title="Información del Perfil" style={{ marginBottom: "24px" }}>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
          initialValues={{
            fullName: user?.fullName || "",
            email: user?.email || "",
            role: user?.roles?.map((r) => formatRole(r)).join(", ") || "",
          }}
        >
          <Form.Item
            label="Nombre Completo"
            name="fullName"
            rules={[
              {
                required: true,
                message: "Por favor ingresa tu nombre completo",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nombre Completo" />
          </Form.Item>

          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[
              { required: true, message: "Por favor ingresa tu correo" },
              { type: "email", message: "Ingresa un correo válido" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="correo@ejemplo.com" />
          </Form.Item>

          <Form.Item label="Rol" name="role">
            <Input prefix={<SafetyCertificateOutlined />} disabled />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Guardar Cambios
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Cambiar Contraseña */}
      <Card title="Seguridad">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="Contraseña Actual"
            name="currentPassword"
            rules={[
              {
                required: true,
                message: "Por favor ingresa tu contraseña actual",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Contraseña actual"
            />
          </Form.Item>

          <Form.Item
            label="Nueva Contraseña"
            name="newPassword"
            rules={[
              {
                required: true,
                message: "Por favor ingresa una nueva contraseña",
              },
              {
                min: 6,
                message: "La contraseña debe tener al menos 6 caracteres",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nueva contraseña"
            />
          </Form.Item>

          <Form.Item
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                message: "Por favor confirma tu nueva contraseña",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Las contraseñas no coinciden")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirmar contraseña"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cambiar Contraseña
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Foto de Perfil - Placeholder */}
      <Card title="Foto de Perfil" style={{ marginTop: "24px" }}>
        <Text type="secondary">
          La funcionalidad de foto de perfil estará disponible próximamente.
        </Text>
      </Card>
    </div>
  );
};

export default Settings;

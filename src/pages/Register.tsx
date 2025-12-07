import React, { useState } from "react";
import { Form, Input, Button, Typography, App, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// Assets
import BackgroundImage from "../assets/Fondo-Login.jpg";

const { Title, Text, Link } = Typography;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinishRegister = async (values: any) => {
    setLoading(true);
    try {
      // Payload para registrar Owner + Company
      const payload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        companyName: values.companyName,
        subscriptionType: "FREE", // Default
      };

      await api.post("/auth/signup", payload);
      message.success(
        "¡Empresa registrada con éxito! Inicia sesión para continuar."
      );
      navigate("/login");
    } catch (error) {
      console.error(error);
      message.error("Error al registrar empresa. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
          borderRadius: 8,
        },
        components: {
          Input: {
            controlHeightLG: 50,
          },
        },
      }}
    >
      <div style={styles.pageContainer}>
        {/* Background */}
        <div style={styles.backgroundLayer}>
          <img
            src={BackgroundImage}
            alt="Background"
            style={styles.backgroundImage}
          />
          <div style={styles.overlay} />
        </div>

        <div style={styles.formCard}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Title level={2} style={{ margin: 0 }}>
              Registrar Empresa
            </Title>
            <Text type="secondary">
              Crea tu cuenta de propietario y configura tu espacio en Vantage.
            </Text>
          </div>

          <Form
            layout="vertical"
            size="large"
            onFinish={onFinishRegister}
            requiredMark={false}
          >
            <Title level={5}>Tus Datos</Title>
            <Form.Item
              name="fullName"
              rules={[
                { required: true, message: "Ingresa tu nombre completo" },
              ]}
            >
              <Input placeholder="Nombre Completo" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Ingresa tu email", type: "email" },
              ]}
            >
              <Input placeholder="Correo Electrónico (Usuario Principal)" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "Ingresa una contraseña" }]}
            >
              <Input.Password placeholder="Contraseña" />
            </Form.Item>

            <Title level={5} style={{ marginTop: 20 }}>
              Tu Empresa
            </Title>
            <Form.Item
              name="companyName"
              rules={[
                { required: true, message: "Ingresa el nombre de tu empresa" },
              ]}
            >
              <Input placeholder="Nombre de la Empresa (Ej. Tech Solutions)" />
            </Form.Item>

            <Form.Item style={{ marginTop: 30 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={styles.blackButton}
              >
                Comenzar con Vantage
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Text>
              ¿Ya tienes cuenta?{" "}
              <Link onClick={() => navigate("/login")}>Inicia sesión</Link>
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

const styles = {
  pageContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
    overflow: "auto",
    padding: "20px",
  } as React.CSSProperties,
  backgroundLayer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
  } as React.CSSProperties,
  backgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  } as React.CSSProperties,
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(5px)",
  } as React.CSSProperties,
  formCard: {
    backgroundColor: "#fff",
    padding: "40px 50px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "500px",
    zIndex: 10,
  } as React.CSSProperties,
  blackButton: {
    height: "50px",
    fontSize: "16px",
    fontWeight: 600,
    backgroundColor: "#000",
    border: "none",
  } as React.CSSProperties,
};

export default Register;

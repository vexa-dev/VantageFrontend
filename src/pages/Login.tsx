import React, { useState } from "react";
import { Form, Input, Button, Typography, App, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import PublicNavbar from "../components/PublicNavbar";

// Assets
import LogoVantage from "../assets/Logo-LetrasDerecha.png";
import BackgroundImage from "../assets/Fondo-Login.jpg";

const { Text, Link } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // --- Lógica de Inicio de Sesión ---
  const onFinishLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      setLogin(response.data);
      message.success(`¡Bienvenido de nuevo!`);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      message.error("Credenciales incorrectas.");
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
          colorBgContainer: "#f5f5f5",
          colorBorder: "#d9d9d9", // Borde ligero visible
        },
        components: {
          Input: {
            controlHeightLG: 50,
            activeBg: "#ffffff",
            hoverBg: "#e6e6e6",
          },
        },
      }}
    >
      <div style={styles.pageContainer}>
        <PublicNavbar />
        {/* IMAGEN DE FONDO FIJA */}
        <div style={styles.backgroundLayer}>
          <img
            src={BackgroundImage}
            alt="Background"
            style={styles.backgroundImage}
          />
        </div>

        {/* CONTENEDOR LOGIN */}
        <div style={styles.loginCard}>
          <div style={styles.formWrapper}>
            <Text
              style={{
                marginBottom: 15,
                fontSize: "16px",
                fontWeight: 500,
                color: "#666",
              }}
            >
              Desarrollo ágil, simplificado
            </Text>
            <img
              src={LogoVantage}
              alt="Vantage Logo"
              style={{ width: 180, marginBottom: 40 }}
            />

            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <Typography.Title level={2} style={{ margin: 0 }}>
                ¡Hola de nuevo!
              </Typography.Title>
              <Text type="secondary">Bienvenido a Vantage</Text>
            </div>

            <Form
              name="login_form"
              onFinish={onFinishLogin}
              layout="vertical"
              size="large"
              requiredMark={false}
              style={{ width: "100%" }}
            >
              <Form.Item
                label="Correo Electrónico"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Ingresa tu email",
                    type: "email",
                  },
                ]}
              >
                <Input placeholder="Ej. usuario@vantage.com" />
              </Form.Item>

              <Form.Item
                label="Contraseña"
                name="password"
                rules={[{ required: true, message: "Ingresa tu contraseña" }]}
              >
                <Input.Password placeholder="Ej. ••••••••" />
              </Form.Item>

              <Form.Item style={{ marginTop: 30 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={styles.blackButton}
                >
                  Iniciar Sesión
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Text type="secondary">
                ¿No tienes una cuenta?{" "}
                <Link
                  onClick={() => navigate("/register")}
                  style={{ fontWeight: 600, color: "#000" }}
                >
                  Regístrate
                </Link>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

const styles = {
  pageContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  } as React.CSSProperties,

  backgroundLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  } as React.CSSProperties,

  backgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  } as React.CSSProperties,

  loginCard: {
    position: "relative",
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 40px rgba(0,0,0,0.2)",
    borderRadius: "16px",
    width: "450px",
    overflow: "hidden",
  } as React.CSSProperties,

  formWrapper: {
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  } as React.CSSProperties,

  blackButton: {
    height: "50px",
    borderRadius: "25px",
    fontSize: "16px",
    fontWeight: 600,
    backgroundColor: "#1a1a1a",
    border: "none",
  } as React.CSSProperties,
};

export default Login;

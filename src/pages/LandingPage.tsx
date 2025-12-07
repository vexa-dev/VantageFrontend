import React, { useState } from "react";
import {
  Typography,
  Button,
  ConfigProvider,
  Form,
  Input,
  Card,
  Row,
  Col,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../assets/Fondo-Login.jpg";
import {
  RocketOutlined,
  MailOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import axios from "axios";
import PublicNavbar from "../components/PublicNavbar";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/contact/send", values);
      message.success("¡Mensaje enviado con éxito!");
      form.resetFields();
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Hubo un error al enviar el mensaje. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <div style={styles.container}>
        {/* Navbar */}
        <PublicNavbar onScrollToSection={scrollToSection} />

        {/* Hero Section */}
        <div style={styles.heroSection}>
          <div style={styles.heroContent}>
            <Title
              level={1}
              style={{
                fontSize: "5rem",
                marginBottom: "1rem",
                color: "#000",
                fontWeight: 800,
              }}
            >
              Vantage
            </Title>
            <Text
              style={{
                fontSize: "1.8rem",
                marginBottom: "3rem",
                display: "block",
                color: "#333",
                maxWidth: "600px",
                margin: "0 auto 3rem auto",
              }}
            >
              Gestiona tus proyectos con agilidad, estilo y eficiencia.
            </Text>

            <Button
              type="primary"
              size="large"
              style={styles.ctaButton}
              onClick={() => navigate("/register")}
            >
              Comenzar Ahora
            </Button>
          </div>

          {/* Background Overlay */}
          <div style={styles.backgroundLayer}>
            <img
              src={BackgroundImage}
              alt="Background"
              style={styles.backgroundImage}
            />
            <div style={styles.whiteOverlay} />
          </div>
        </div>

        {/* About App Section */}
        <div id="about-app" style={styles.section}>
          <Title level={2} style={styles.sectionTitle}>
            ¿Qué es Vantage?
          </Title>
          <Paragraph style={styles.sectionSubtitle}>
            Una plataforma integral diseñada para optimizar el flujo de trabajo
            de tu equipo.
          </Paragraph>

          <Row
            gutter={[48, 48]}
            style={{ marginTop: "40px", maxWidth: "1200px", margin: "0 auto" }}
          >
            <Col xs={24} md={8}>
              <Card variant="borderless" style={styles.featureCard}>
                <ThunderboltOutlined style={styles.iconStyle} />
                <Title level={4}>Gestión Ágil</Title>
                <Paragraph>
                  Tableros Kanban dinámicos y seguimiento de sprints en tiempo
                  real.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card variant="borderless" style={styles.featureCard}>
                <SafetyCertificateOutlined style={styles.iconStyle} />
                <Title level={4}>Seguridad Total</Title>
                <Paragraph>
                  Tus datos protegidos con los más altos estándares de seguridad
                  y roles.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card variant="borderless" style={styles.featureCard}>
                <RocketOutlined style={styles.iconStyle} />
                <Title level={4}>Productividad</Title>
                <Paragraph>
                  Herramientas intuitivas que permiten a tu equipo enfocarse en
                  lo importante.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Team Section */}
        <div
          id="team"
          style={{ ...styles.section, backgroundColor: "#f9f9f9" }}
        >
          <Title level={2} style={styles.sectionTitle}>
            Nuestro Equipo
          </Title>
          <Paragraph style={styles.sectionSubtitle}>
            Conoce a las mentes detrás de Vantage.
          </Paragraph>

          <Row
            gutter={[32, 32]}
            style={{ marginTop: "40px", maxWidth: "1000px", margin: "0 auto" }}
          >
            {/* Placeholder Team Members */}
            {["Carlos", "Ana", "Luis"].map((name, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card
                  hoverable
                  style={{ textAlign: "center", borderRadius: "12px" }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#ddd",
                      margin: "0 auto 15px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SmileOutlined
                      style={{ fontSize: "30px", color: "#666" }}
                    />
                  </div>
                  <Title level={4} style={{ margin: "10px 0 5px 0" }}>
                    {name}
                  </Title>
                  <Text type="secondary">Desarrollador Full Stack</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Contact Section */}
        <div id="contact" style={styles.section}>
          <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
            <Title level={2} style={styles.sectionTitle}>
              Contáctanos
            </Title>
            <Paragraph
              style={{ ...styles.sectionSubtitle, marginBottom: "40px" }}
            >
              ¿Tienes preguntas? Estamos aquí para ayudarte.
            </Paragraph>

            <Card
              style={{
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                borderRadius: "16px",
              }}
            >
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  name="name"
                  label="Nombre"
                  rules={[
                    { required: true, message: "Por favor ingresa tu nombre" },
                  ]}
                >
                  <Input placeholder="Tu nombre completo" size="large" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Correo Electrónico"
                  rules={[
                    { required: true, message: "Por favor ingresa tu correo" },
                    { type: "email", message: "Ingresa un correo válido" },
                  ]}
                >
                  <Input placeholder="tu@email.com" size="large" />
                </Form.Item>
                <Form.Item
                  name="message"
                  label="Mensaje"
                  rules={[
                    { required: true, message: "Por favor ingresa tu mensaje" },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="¿En qué podemos ayudarte?"
                    size="large"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    icon={<MailOutlined />}
                  >
                    Enviar Mensaje
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>
            © {new Date().getFullYear()} Vantage. Todos los derechos reservados.
          </Text>
        </div>
      </div>
    </ConfigProvider>
  );
};

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    position: "relative" as "relative",
  },
  heroSection: {
    position: "relative" as "relative",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center" as "center",
    // overflow: "hidden", // Removed to prevent scrolling issues if any
  },
  heroContent: {
    zIndex: 5,
    padding: "0 20px",
  },
  ctaButton: {
    height: "56px",
    padding: "0 40px",
    fontSize: "1.1rem",
    borderRadius: "28px",
    backgroundColor: "#000",
    border: "none",
    fontWeight: 600,
  } as React.CSSProperties,
  backgroundLayer: {
    position: "absolute" as "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as "cover",
    opacity: 0.3,
  },
  whiteOverlay: {
    position: "absolute" as "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0))",
  },
  section: {
    padding: "80px 20px",
    textAlign: "center" as "center",
  },
  sectionTitle: {
    marginBottom: "10px",
    fontSize: "2.5rem",
    fontWeight: 700,
  },
  sectionSubtitle: {
    fontSize: "1.1rem",
    color: "#666",
    maxWidth: "700px",
    margin: "0 auto",
  },
  featureCard: {
    textAlign: "center" as "center",
    padding: "20px",
    background: "transparent",
  },
  iconStyle: {
    fontSize: "40px",
    marginBottom: "20px",
    color: "#000",
  },
  footer: {
    backgroundColor: "#222",
    color: "#fff",
    padding: "40px 20px",
    textAlign: "center" as "center",
  },
};

export default LandingPage;

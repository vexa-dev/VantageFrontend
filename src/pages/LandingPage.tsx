import React from "react";
import { Typography, Button, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../assets/Fondo-Login.jpg"; // Reutilizamos el fondo

const { Title, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  console.log("Rendering LandingPage");

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
        },
      }}
    >
      <div style={styles.container}>
        {/* Navbar sencilla */}
        <div style={styles.navbar}>
          <div style={styles.logo}>Vantage</div>
          <Button
            type="default"
            onClick={() => navigate("/login")}
            style={styles.loginButton}
          >
            Iniciar Sesión
          </Button>
        </div>

        {/* Hero Section */}
        <div style={styles.heroContent}>
          <Title
            level={1}
            style={{ fontSize: "4rem", marginBottom: "1rem", color: "#000" }}
          >
            Vantage
          </Title>
          <Text
            style={{
              fontSize: "1.5rem",
              marginBottom: "3rem",
              display: "block",
              color: "#333",
            }}
          >
            Gestiona tus proyectos con agilidad y estilo.
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
    </ConfigProvider>
  );
};

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  } as React.CSSProperties,

  logo: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    letterSpacing: "-1px",
  } as React.CSSProperties,

  loginButton: {
    fontWeight: 600,
    border: "1px solid #000",
  } as React.CSSProperties,

  heroContent: {
    zIndex: 5,
    textAlign: "center",
    maxWidth: "800px",
    padding: "0 20px",
  } as React.CSSProperties,

  ctaButton: {
    height: "60px",
    padding: "0 50px",
    fontSize: "1.2rem",
    borderRadius: "30px",
    backgroundColor: "#000",
    border: "none",
    fontWeight: 600,
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
    opacity: 0.3, // Soft background
  } as React.CSSProperties,

  whiteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))",
  } as React.CSSProperties,
};

export default LandingPage;

import React from "react";
import { Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

interface PublicNavbarProps {
  onScrollToSection?: (id: string) => void;
}

const PublicNavbar: React.FC<PublicNavbarProps> = ({ onScrollToSection }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const handleLogoClick = () => {
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleNavClick = (sectionId: string) => {
    if (isLandingPage && onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      navigate("/");
      // Optional: Logic to scroll after navigation could be added here if needed
      // For now, simply returning to Home is consistent with "regresar a la pagina principal"
    }
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.logo} onClick={handleLogoClick}>
        Vantage
      </div>
      <div style={styles.navLinks}>
        <span
          style={styles.navLink}
          onClick={() => handleNavClick("about-app")}
        >
          Sobre Vantage
        </span>
        <span style={styles.navLink} onClick={() => handleNavClick("team")}>
          Nosotros
        </span>
        <span style={styles.navLink} onClick={() => handleNavClick("contact")}>
          Contáctanos
        </span>

        {location.pathname !== "/login" && (
          <Button
            type="primary"
            onClick={() => navigate("/login")}
            style={styles.loginButton}
          >
            Iniciar Sesión
          </Button>
        )}
      </div>
    </div>
  );
};

const styles = {
  navbar: {
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    width: "100%",
    padding: "15px 50px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    boxSizing: "border-box" as "border-box",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    letterSpacing: "-0.5px",
    cursor: "pointer",
    color: "#000",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },
  navLink: {
    cursor: "pointer",
    fontWeight: 500,
    color: "#333",
    transition: "color 0.3s",
  } as React.CSSProperties,
  loginButton: {
    fontWeight: 600,
  } as React.CSSProperties,
};

export default PublicNavbar;

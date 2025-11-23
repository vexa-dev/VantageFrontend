import React, { useState } from 'react';
import { Form, Input, Button, Typography, App, ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// Assets
import LogoVantage from '../assets/Logo-LetrasDerecha.png';
import BackgroundImage from '../assets/Fondo-Login.jpg';

const { Text, Link } = Typography;

const LoginContent: React.FC = () => {
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  
  // false = Login (Form on Right), true = Register (Form on Left)
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // --- Lógica de Inicio de Sesión ---
  const onFinishLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      setLogin(response.data);
      message.success(`¡Bienvenido de nuevo!`);
      navigate('/'); 
    } catch (error) {
      message.error('Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Registro ---
  const onFinishRegister = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/auth/signup', values);
      message.success('¡Cuenta creada con éxito! Por favor inicia sesión.');
      setIsSignUpMode(false); // Ir al login
    } catch (error) {
      message.error('Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  // --- Componente del Formulario ---
  const FormContent = ({ mode }: { mode: 'login' | 'register' }) => {
    const isLogin = mode === 'login';
    return (
      <div style={styles.formWrapper}>
        <Text style={{ marginBottom: 15, fontSize: '16px', fontWeight: 500, color: '#666' }}>
            Desarrollo ágil, simplificado
        </Text>
        <img src={LogoVantage} alt="Vantage Logo" style={{ width: 180, marginBottom: 40 }} />
        
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
                {isLogin ? '¡Hola de nuevo!' : 'Crear Cuenta'}
            </Typography.Title>
            <Text type="secondary">
                {isLogin ? 'Bienvenido a Vantage' : 'Únete para gestionar tus proyectos'}
            </Text>
        </div>

        <Form
          name={`${mode}_form`}
          onFinish={isLogin ? onFinishLogin : onFinishRegister}
          layout="vertical"
          size="large"
          requiredMark={false}
          style={{ width: '100%' }}
        >
          {/* Campo Nombre solo para Registro */}
          {!isLogin && (
             <Form.Item
                label="Nombre Completo"
                name="fullName"
                rules={[{ required: true, message: 'Ingresa tu nombre completo' }]}
             >
               <Input placeholder="Ej. Juan Pérez" />
             </Form.Item>
          )}

          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[{ required: true, message: 'Ingresa tu email', type: 'email' }]}
          >
            <Input placeholder="Ej. usuario@vantage.com" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
          >
            <Input.Password placeholder="Ej. ••••••••" />
          </Form.Item>

          <Form.Item style={{ marginTop: 30 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={styles.blackButton}>
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            {isLogin ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
            <Link onClick={() => setIsSignUpMode(!isSignUpMode)} style={{ fontWeight: 600, color: '#000' }}>
               {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </Link>
          </Text>
        </div>
      </div>
    );
  };

  return (
      <div style={styles.pageContainer}>
        {/* IMAGEN DE FONDO FIJA */}
        <div style={styles.backgroundLayer}>
            <img src={BackgroundImage} alt="Background" style={styles.backgroundImage} />
        </div>

        {/* CONTENEDOR DESLIZANTE DEL FORMULARIO */}
        <div style={{
            ...styles.slidingPanel,
            // Si es SignUp (Registro), movemos el panel a la izquierda (0%).
            // Si es Login, lo movemos a la derecha (100% - ancho del panel).
            left: isSignUpMode ? '0' : 'calc(100% - 600px)',
        }}>
            <FormContent mode={isSignUpMode ? 'register' : 'login'} />
        </div>
      </div>
  );
};

const AuthPage: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000000',
          borderRadius: 8,
          colorBgContainer: '#f5f5f5',
          colorBorder: '#d9d9d9', // Borde ligero visible
        },
        components: {
          Input: {
            controlHeightLG: 50,
            activeBg: '#ffffff',
            hoverBg: '#e6e6e6',
          },
        },
      }}
    >
      <App>
        <LoginContent />
      </App>
    </ConfigProvider>
  );
};

const styles = {
  pageContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#000',
  } as React.CSSProperties,

  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  } as React.CSSProperties,

  backgroundImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,

  slidingPanel: {
    position: 'absolute',
    top: 0,
    width: '600px',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 40px rgba(0,0,0,0.2)',
    zIndex: 10,
    transition: 'left 0.6s ease-in-out',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,

  formWrapper: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,

  blackButton: {
    height: '50px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#1a1a1a',
    border: 'none',
  } as React.CSSProperties
};

export default AuthPage;

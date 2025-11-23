// src/pages/Login.tsx
import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Tu conexión con Axios
import { useAuthStore } from '../store/authStore'; // Tu estado global

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 1. Petición al Backend
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
      });

      // 2. Guardar en Zustand (y LocalStorage)
      setLogin(response.data);
      
      message.success(`¡Bienvenido, ${response.data.email}!`);
      
      // 3. Redirigir al Dashboard
      navigate('/'); 
      
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error('Credenciales incorrectas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: 12 }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {/* Puedes poner tu logo aquí */}
            <Title level={2} style={{ color: '#00b96b', marginBottom: 0 }}>Vantage</Title>
            <Text type="secondary">Inicia sesión para priorizar</Text>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '¡Por favor ingresa tu correo!' },
              { type: 'email', message: 'Correo no válido' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Correo Electrónico" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '¡Por favor ingresa tu contraseña!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" />
          </Form.Item>

          <Form.Item>
            <ConfigProvider theme={{ token: { colorPrimary: '#00b96b' } }}>
              <Button type="primary" htmlType="submit" block loading={loading} icon={<LoginOutlined />}>
                Ingresar
              </Button>
            </ConfigProvider>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
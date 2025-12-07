import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography, Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { formatRole } from "../utils/roleUtils";
import {
  UserOutlined,
  LogoutOutlined,
  ProjectOutlined,
  DashboardOutlined,
  OrderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Estado para controlar si el menú está colapsado o no
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "/projects",
      icon: <FolderOutlined />,
      label: "Proyectos",
      onClick: () => navigate("/projects"),
    },
    {
      key: "/backlog",
      icon: <OrderedListOutlined />,
      label: "Backlog",
      onClick: () => navigate("/backlog"),
    },
    {
      key: "/sprints",
      icon: <ProjectOutlined />,
      label: "Sprints",
      onClick: () => navigate("/sprints"),
    },
    {
      key: "/kanban",
      icon: <AppstoreOutlined />,
      label: "Tablero Kanban",
      onClick: () => navigate("/kanban"),
    },
  ];

  const canManageUsers = user?.roles?.some(
    (r) =>
      r === "ROLE_OWNER" || r === "OWNER" || r === "ROLE_ADMIN" || r === "ADMIN"
  );

  if (canManageUsers) {
    menuItems.push({
      key: "/users",
      icon: <UserOutlined />,
      label: "Usuarios",
      onClick: () => navigate("/users"),
    });
  }

  const userMenu = {
    items: [
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Configuración",
        onClick: () => navigate("/settings"),
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Cerrar Sesión",
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="light"
      width={250}
      style={{
        height: "100vh",
        boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* --- LOGO AREA --- */}
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "0" : "0 24px",
            borderBottom: "1px solid #f0f0f0",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Text strong style={{ fontSize: "20px", whiteSpace: "nowrap" }}>
              Vantage
            </Text>
          )}

          {/* Botón para colapsar/expandir */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* --- MENU --- */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            marginTop: "10px",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </div>

        {/* --- USER PROFILE AREA (BOTTOM) --- */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <Dropdown menu={userMenu} placement="topLeft">
            <Avatar
              style={{
                backgroundColor: "#000",
                cursor: "pointer",
                flexShrink: 0,
              }}
              icon={<UserOutlined />}
            />
          </Dropdown>

          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <Text
                strong
                style={{ display: "block", fontSize: "12px" }}
                ellipsis
              >
                {user?.email || "Usuario"}
              </Text>
              <Text type="secondary" style={{ fontSize: "10px" }}>
                {user?.roles && user.roles.length > 0
                  ? user.roles.map((r) => formatRole(r)).join(", ")
                  : "Usuario"}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;

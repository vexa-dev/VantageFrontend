import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const { Content } = Layout;

const MainLayout: React.FC = () => {
  return (
    <Layout style={{ height: "100vh" }}>
      <Sidebar />
      <Content
        style={{
          padding: "24px",
          maxWidth: "1460px",
          width: "100%",
          margin: "0 auto",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;

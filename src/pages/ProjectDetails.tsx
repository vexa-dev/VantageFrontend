import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Spin,
  Empty,
  Statistic,
  List,
} from "antd";
import {
  ClockCircleOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

const { Title, Text } = Typography;

interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Issue {
  id: number;
  timeEstimate: number;
  status: string;
  story?: { id: number };
  sprint?: { id: number };
}

interface Story {
  id: number;
  title: string;
  storyNumber: number;
  status?: string;
  issueCount?: number;
}

interface Sprint {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  active: boolean;
  issueCount?: number;
  totalHours?: number;
}

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [storiesWithoutIssues, setStoriesWithoutIssues] = useState<Story[]>([]);
  const [issueStats, setIssueStats] = useState<{
    totalIssues: number;
    totalHours: number;
    statusDistribution: { name: string; value: number }[];
  }>({ totalIssues: 0, totalHours: 0, statusDistribution: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        // 1. Fetch Project Details
        const projectRes = await api.get(`/projects/${projectId}`);
        setProject(projectRes.data);

        // 2. Fetch Issues
        const issuesRes = await api.get(`/issues/project/${projectId}`);
        const issues: Issue[] = issuesRes.data;

        // Calculate Issue Stats
        let totalHours = 0;
        const statusCounts: Record<string, number> = {};

        issues.forEach((issue) => {
          totalHours += issue.timeEstimate || 0;
          const status = issue.status || "UNKNOWN";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusDistribution = Object.keys(statusCounts).map((key) => ({
          name: key,
          value: statusCounts[key],
        }));

        setIssueStats({
          totalIssues: issues.length,
          totalHours,
          statusDistribution,
        });

        // 3. Fetch Sprints
        const sprintsRes = await api.get(`/sprints/project/${projectId}`);
        const allSprints = sprintsRes.data;

        // Calculate Sprint Metrics
        const sprintMetrics: Record<number, { count: number; hours: number }> =
          {};
        issues.forEach((i) => {
          if (i.sprint?.id) {
            if (!sprintMetrics[i.sprint.id]) {
              sprintMetrics[i.sprint.id] = { count: 0, hours: 0 };
            }
            sprintMetrics[i.sprint.id].count++;
            sprintMetrics[i.sprint.id].hours += i.timeEstimate || 0;
          }
        });

        const processedSprints = allSprints.map((s: Sprint) => ({
          ...s,
          issueCount: sprintMetrics[s.id]?.count || 0,
          totalHours: sprintMetrics[s.id]?.hours || 0,
        }));

        // Sort Sprints
        processedSprints.sort((a: Sprint, b: Sprint) => {
          if (a.active && !b.active) return -1;
          if (!a.active && b.active) return 1;
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });

        setSprints(processedSprints);

        // 4. Fetch Stories for "Stories without Issues"
        const backlogRes = await api.get(`/stories/backlog/${projectId}`);
        const backlog: Story[] = backlogRes.data;

        const issuesByStory: Record<number, number> = {};
        issues.forEach((i) => {
          if (i.story?.id) {
            issuesByStory[i.story.id] = (issuesByStory[i.story.id] || 0) + 1;
          }
        });

        const storiesNoIssues = backlog.filter(
          (s) => !issuesByStory[s.id] || issuesByStory[s.id] === 0
        );
        setStoriesWithoutIssues(storiesNoIssues);
      } catch (error) {
        console.error("Error fetching project details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <Empty description="Proyecto no encontrado" />;
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ArrowLeftOutlined
          style={{ fontSize: 24, cursor: "pointer" }}
          onClick={() => navigate(-1)}
        />
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {project.icon} {project.name}
          </Title>
          <Text type="secondary">{project.description}</Text>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Stats & Chart Column */}
        <Col xs={24} lg={8}>
          <Card title="Estadísticas Generales" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Issues"
                  value={issueStats.totalIssues}
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Horas Totales"
                  value={issueStats.totalHours}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
            <div style={{ height: 300, marginTop: 24 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueStats.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {issueStats.statusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Historias sin Issues">
            <List
              dataSource={storiesWithoutIssues}
              renderItem={(item) => (
                <List.Item>
                  <Text>
                    #{item.storyNumber} {item.title}
                  </Text>
                </List.Item>
              )}
              locale={{ emptyText: "Todas las historias tienen issues" }}
            />
          </Card>
        </Col>

        {/* Sprints Column */}
        <Col xs={24} lg={16}>
          <Title level={4}>Sprints</Title>
          {sprints.map((sprint) => (
            <Card
              key={sprint.id}
              style={{
                marginBottom: 16,
                borderColor: sprint.active ? "#b7eb8f" : "#f0f0f0",
                background: sprint.active ? "#f6ffed" : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {sprint.name}
                    </Title>
                    {sprint.active && <Tag color="green">Activo</Tag>}
                  </div>
                  <Text type="secondary">{sprint.goal}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ marginRight: 16 }}>
                      {sprint.startDate} - {sprint.endDate}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: 4 }}>
                    <Tag icon={<ThunderboltOutlined />}>
                      {sprint.issueCount} Issues
                    </Tag>
                  </div>
                  <div>
                    <Tag icon={<ClockCircleOutlined />}>
                      {sprint.totalHours}h Estimadas
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Col>
      </Row>
    </div>
  );
};

export default ProjectDetails;

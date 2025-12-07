// Dashboard Component - Product Owner View
import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Spin,
  Empty,
  Input,
  Select,
  Badge,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  RocketOutlined,
  WarningOutlined,
  StopOutlined,
  FundOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
  owner?: { id: number; email: string };
}

interface Issue {
  id: number;
  timeEstimate: number;
  status: string;
  story?: { id: number };
  sprint?: { id: number; name: string };
}

interface Story {
  id: number;
  title: string;
  storyPoints: number;
  priorityScore: number;
  storyNumber: number;
  status?: string;
  project?: Project;
  epic?: { epicNumber: number };
  sprint?: { id: number; name: string };
}

interface ProjectStats {
  projectId: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  topStories: Story[];
  allStories: Story[];
  unestimatedCount: number;
}

interface GlobalKPIs {
  totalProjects: number;
  backlogHealth: number;
  overallProgress: number;
  deliveredValue: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<number, ProjectStats>>({});
  const [globalKPIs, setGlobalKPIs] = useState<GlobalKPIs>({
    totalProjects: 0,
    backlogHealth: 0,
    overallProgress: 0,
    deliveredValue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<
    "PROJECTS_DEFAULT" | "PROJECTS_PROGRESS_DESC" | "ALL_STORIES_PRIORITY"
  >("PROJECTS_PROGRESS_DESC");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "P1" | "P2">(
    "ALL"
  );

  const isPO = user?.roles?.some((r) => r === "ROLE_PO" || r === "PO");
  const isOwner = user?.roles?.some((r) => r === "ROLE_OWNER" || r === "OWNER");

  if (isOwner) {
    return (
      <div style={{ padding: 24, textAlign: "center", marginTop: 50 }}>
        <Title level={2}>Este es el dashboard del owner</Title>
      </div>
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!isPO) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Projects
        const projectsRes = await api.get("/projects");
        const projectsData = projectsRes.data;
        setProjects(projectsData);

        const newStats: Record<number, ProjectStats> = {};
        let totalProgressSum = 0;
        let totalDeliveredPoints = 0;
        let totalStories = 0;
        let totalEstimatedStories = 0;

        // 2. Fetch Data for each project
        await Promise.all(
          projectsData.map(async (project: Project) => {
            try {
              // Fetch Issues for Progress
              const issuesRes = await api.get(`/issues/project/${project.id}`);
              const issues: Issue[] = issuesRes.data;

              let totalHours = 0;
              let completedHours = 0;

              issues.forEach((issue) => {
                const hours = issue.timeEstimate || 0;
                totalHours += hours;
                if (issue.status === "DONE") {
                  completedHours += hours;
                }
              });

              const progress =
                totalHours > 0
                  ? Math.round((completedHours / totalHours) * 100)
                  : 0;

              totalProgressSum += progress;

              // Fetch Backlog for Stories
              const backlogRes = await api.get(
                `/stories/backlog/${project.id}`
              );
              const backlog: Story[] = backlogRes.data.map((s: Story) => ({
                ...s,
                project: project,
              }));

              // Sort by priorityScore descending
              const sortedBacklog = backlog.sort(
                (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
              );

              // Identify completed stories (status DONE)
              const issuesByStory: Record<number, Issue[]> = {};
              issues.forEach((i) => {
                if (i.story?.id) {
                  if (!issuesByStory[i.story.id]) {
                    issuesByStory[i.story.id] = [];
                  }
                  issuesByStory[i.story.id].push(i);
                }
              });

              const completedStoryIds = new Set<number>();
              Object.keys(issuesByStory).forEach((sId) => {
                const storyId = Number(sId);
                const storyIssues = issuesByStory[storyId];
                const allDone = storyIssues.every(
                  (i) => i.status?.toUpperCase() === "DONE"
                );
                if (allDone && storyIssues.length > 0) {
                  completedStoryIds.add(storyId);
                }
              });

              // Filter active backlog (exclude completed)
              const activeBacklog = sortedBacklog.filter(
                (s) =>
                  !completedStoryIds.has(s.id) &&
                  s.status?.toUpperCase() !== "DONE"
              );

              // Count unestimated stories
              const unestimatedCount = activeBacklog.filter(
                (s) => !s.storyPoints || s.storyPoints === 0
              ).length;

              // Calculate delivered value (completed stories)
              const completedStories = sortedBacklog.filter(
                (s) =>
                  completedStoryIds.has(s.id) ||
                  s.status?.toUpperCase() === "DONE"
              );
              const deliveredPoints = completedStories.reduce(
                (sum, s) => sum + (s.storyPoints || 0),
                0
              );
              totalDeliveredPoints += deliveredPoints;

              // Backlog health metrics
              totalStories += activeBacklog.length;
              totalEstimatedStories += activeBacklog.filter(
                (s) => s.storyPoints && s.storyPoints > 0
              ).length;

              // Attach sprint info to stories
              const storiesWithSprints = activeBacklog.map((story) => {
                const storyIssues = issuesByStory[story.id] || [];
                const sprint = storyIssues[0]?.sprint;
                return { ...story, sprint };
              });

              newStats[project.id] = {
                projectId: project.id,
                totalHours,
                completedHours,
                progress,
                topStories: storiesWithSprints.slice(0, 5),
                allStories: storiesWithSprints,
                unestimatedCount,
              };
            } catch (error) {
              console.error(
                `Error fetching data for project ${project.id}`,
                error
              );
            }
          })
        );

        setStats(newStats);

        // Calculate Global KPIs
        const backlogHealth =
          totalStories > 0
            ? Math.round((totalEstimatedStories / totalStories) * 100)
            : 0;
        const overallProgress =
          projectsData.length > 0
            ? Math.round(totalProgressSum / projectsData.length)
            : 0;

        setGlobalKPIs({
          totalProjects: projectsData.length,
          backlogHealth,
          overallProgress,
          deliveredValue: totalDeliveredPoints,
        });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isPO]);

  if (!isPO) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={3}>Bienvenido a Vantage</Title>
        <Text>
          Este dashboard es exclusivo para Product Owners. Por favor, contacta a
          un administrador si crees que deberías tener acceso.
        </Text>
      </div>
    );
  }

  const getProjectStatus = (
    progress: number
  ): { status: string; color: string; icon: React.ReactNode } => {
    if (progress === 0) {
      return {
        status: "Bloqueado",
        color: "red",
        icon: <StopOutlined />,
      };
    } else if (progress < 30) {
      return {
        status: "En Riesgo",
        color: "orange",
        icon: <WarningOutlined />,
      };
    } else {
      return {
        status: "En Curso",
        color: "green",
        icon: <RocketOutlined />,
      };
    }
  };

  const getFilteredContent = () => {
    const lowerSearch = searchText.toLowerCase();

    if (viewMode === "ALL_STORIES_PRIORITY") {
      // Aggregate all stories from all projects
      let allStories: Story[] = [];
      Object.values(stats).forEach((stat) => {
        allStories = [...allStories, ...stat.allStories];
      });

      // Filter by search text
      if (searchText) {
        allStories = allStories.filter(
          (s) =>
            s.title.toLowerCase().includes(lowerSearch) ||
            s.project?.name.toLowerCase().includes(lowerSearch)
        );
      }

      // Filter by priority
      if (priorityFilter === "P1") {
        allStories = allStories.filter((s) => (s.priorityScore || 0) > 10);
      } else if (priorityFilter === "P2") {
        allStories = allStories.filter(
          (s) => (s.priorityScore || 0) >= 5 && (s.priorityScore || 0) <= 10
        );
      }

      // Sort by priority
      allStories.sort(
        (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
      );

      // Table columns
      const columns: ColumnsType<Story> = [
        {
          title: "Proyecto",
          dataIndex: ["project", "name"],
          key: "project",
          width: 150,
          render: (name: string, record: Story) => (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span>{record.project?.icon}</span>
              <Text ellipsis style={{ maxWidth: 120 }}>
                {name}
              </Text>
            </div>
          ),
        },
        {
          title: "Epic",
          dataIndex: ["epic", "epicNumber"],
          key: "epic",
          width: 80,
          render: (epicNumber: number) =>
            epicNumber ? <Tag color="purple">#{epicNumber}</Tag> : "-",
        },
        {
          title: "Story",
          dataIndex: "storyNumber",
          key: "storyNumber",
          width: 80,
          render: (num: number) => <Tag color="blue">#{num}</Tag>,
        },
        {
          title: "Título",
          dataIndex: "title",
          key: "title",
          ellipsis: true,
          render: (title: string) => <Text strong>{title}</Text>,
        },
        {
          title: "Prioridad (WSJF)",
          dataIndex: "priorityScore",
          key: "priorityScore",
          width: 150,
          align: "center",
          sorter: (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0),
          render: (score: number) => (
            <Tag
              color={score > 10 ? "red" : score > 5 ? "orange" : "default"}
              icon={<TrophyOutlined />}
            >
              {score?.toFixed(1)}
            </Tag>
          ),
        },
        {
          title: "Puntos",
          dataIndex: "storyPoints",
          key: "storyPoints",
          width: 100,
          align: "center",
          render: (points: number) => (
            <Tag color="purple">{points || 0} pts</Tag>
          ),
        },
        {
          title: "Estado",
          dataIndex: "status",
          key: "status",
          width: 120,
          render: (status: string) => {
            const statusColors: Record<string, string> = {
              BACKLOG: "default",
              TODO: "blue",
              DOING: "orange",
              TESTING: "purple",
              DONE: "green",
            };
            return (
              <Tag color={statusColors[status] || "default"}>
                {status || "BACKLOG"}
              </Tag>
            );
          },
        },
        {
          title: "Sprint",
          dataIndex: ["sprint", "name"],
          key: "sprint",
          width: 120,
          render: (sprintName: string) =>
            sprintName ? <Tag color="cyan">{sprintName}</Tag> : "-",
        },
        {
          title: "Acción",
          key: "action",
          width: 80,
          align: "center",
          render: (_: unknown, record: Story) => (
            <ProjectOutlined
              style={{ cursor: "pointer", color: "#1890ff", fontSize: 18 }}
              onClick={() =>
                navigate("/backlog", {
                  state: { selectedProjectId: record.project?.id },
                })
              }
            />
          ),
        },
      ];

      return (
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Backlog Prioritario (WSJF)</span>
              <Select
                value={priorityFilter}
                onChange={(value) => setPriorityFilter(value)}
                style={{ width: 150 }}
                options={[
                  { value: "ALL", label: "Todas" },
                  { value: "P1", label: "P1 (Score > 10)" },
                  { value: "P2", label: "P2 (Score 5-10)" },
                ]}
              />
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={allStories}
            rowKey={(record) => `${record.project?.id}-${record.id}`}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        </Card>
      );
    }

    // Default or Progress View (Project Cards)
    let filteredProjects = projects.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(lowerSearch);
      const storyMatch = stats[p.id]?.allStories.some((s) =>
        s.title.toLowerCase().includes(lowerSearch)
      );

      // Filter out completed projects (100% progress)
      const isCompleted = stats[p.id]?.progress === 100;
      if (isCompleted) {
        return false;
      }

      return nameMatch || storyMatch;
    });

    if (viewMode === "PROJECTS_PROGRESS_DESC") {
      filteredProjects.sort((a, b) => {
        const progA = stats[a.id]?.progress || 0;
        const progB = stats[b.id]?.progress || 0;
        return progB - progA;
      });
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredProjects.map((project) => {
          const projectStats = stats[project.id];
          if (!projectStats) return null;

          const statusInfo = getProjectStatus(projectStats.progress);

          return (
            <Col xs={24} sm={24} md={12} lg={8} key={project.id}>
              <Badge.Ribbon text={statusInfo.status} color={statusInfo.color}>
                <Card
                  hoverable
                  title={
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 20 }}>{project.icon}</span>
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {project.name}
                      </Text>
                    </div>
                  }
                  actions={[
                    <div
                      key="details"
                      onClick={() => navigate(`/project-details/${project.id}`)}
                    >
                      <ProjectOutlined /> Ver Detalles
                    </div>,
                  ]}
                  onClick={() => navigate(`/project-details/${project.id}`)}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {/* Progress Section */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text type="secondary">Progreso del Proyecto</Text>
                        <Text type="secondary">
                          {projectStats.completedHours} /{" "}
                          {projectStats.totalHours} horas
                        </Text>
                      </div>
                      <Progress
                        percent={projectStats.progress}
                        status="active"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </div>

                    {/* Stats Row */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="Horas Totales"
                          value={projectStats.totalHours}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ fontSize: 18 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Completado"
                          value={projectStats.progress}
                          suffix="%"
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ fontSize: 18, color: "#3f8600" }}
                        />
                      </Col>
                    </Row>

                    {/* Backlog Health */}
                    {projectStats.unestimatedCount > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text strong>
                            <FileTextOutlined style={{ color: "#faad14" }} />{" "}
                            Historias sin Estimar
                          </Text>
                          <Tag color="warning">
                            {projectStats.unestimatedCount}
                          </Tag>
                        </div>
                      </div>
                    )}

                    {/* Top Stories */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong>
                          <ThunderboltOutlined style={{ color: "#faad14" }} />{" "}
                          Top Historias Prioritarias
                        </Text>
                      </div>
                      {projectStats.topStories.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {projectStats.topStories.map((story) => (
                            <div
                              key={story.id}
                              style={{
                                padding: "8px 0",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  overflow: "hidden",
                                }}
                              >
                                {story.epic && (
                                  <Tag color="purple">
                                    #{story.epic.epicNumber}
                                  </Tag>
                                )}
                                <Tag color="blue">#{story.storyNumber}</Tag>
                                <Text ellipsis style={{ maxWidth: 150 }}>
                                  {story.title}
                                </Text>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Tag color="purple">
                                  {story.storyPoints} pts
                                </Tag>
                                <Tag
                                  color={
                                    (story.priorityScore || 0) > 10
                                      ? "red"
                                      : "orange"
                                  }
                                  icon={<TrophyOutlined />}
                                >
                                  {story.priorityScore?.toFixed(1)}
                                </Tag>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="No hay historias priorizadas"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </Badge.Ribbon>
            </Col>
          );
        })}
      </Row>
    );
  };

  return (
    <div
      style={{
        height: "calc(100vh - 48px)",
        display: "flex",
        flexDirection: "column",
        margin: "-24px",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          flexShrink: 0,
          padding: "24px 24px 16px 24px",
          background: "#f0f2f5",
        }}
      >
        <Title level={2} style={{ margin: 0, marginBottom: 16 }}>
          Dashboard - Product Owner
        </Title>

        {/* Global KPIs */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total de Proyectos"
                value={globalKPIs.totalProjects}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Salud del Backlog"
                value={globalKPIs.backlogHealth}
                suffix="%"
                prefix={<FundOutlined />}
                valueStyle={{
                  color:
                    globalKPIs.backlogHealth > 70
                      ? "#3f8600"
                      : globalKPIs.backlogHealth > 40
                      ? "#faad14"
                      : "#cf1322",
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Historias estimadas
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Progreso General"
                value={globalKPIs.overallProgress}
                suffix="%"
                prefix={<RocketOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Promedio de proyectos
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Valor Entregado"
                value={globalKPIs.deliveredValue}
                suffix="pts"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Story Points completados
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Input
            placeholder="Buscar proyecto o historia..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            style={{ width: 250 }}
            options={[
              { value: "PROJECTS_DEFAULT", label: "Proyectos (A-Z)" },
              {
                value: "PROJECTS_PROGRESS_DESC",
                label: "Proyectos (Mayor Progreso)",
              },
              {
                value: "ALL_STORIES_PRIORITY",
                label: "Backlog Prioritario (Tabla)",
              },
            ]}
          />
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px 24px 24px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar"
      >
        <style>
          {`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          getFilteredContent()
        )}
      </div>
    </div>
  );
};

export default Dashboard;

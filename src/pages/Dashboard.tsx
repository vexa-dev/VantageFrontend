// Dashboard Component
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
} from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
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
}

interface Issue {
  id: number;
  timeEstimate: number;
  status: string;
  story?: { id: number }; // Added to link issue to story
  sprint?: { id: number }; // Added to link issue to sprint
}

interface Story {
  id: number;
  title: string;
  storyPoints: number;
  priorityScore: number;
  storyNumber: number;
  status?: string; // Added for filtering
  project?: Project; // Added for global view context
  epic?: { epicNumber: number }; // Added for display
  issueCount?: number; // Added for SM view
}

interface Sprint {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  active: boolean;
  issueCount?: number; // Added for SM view
  totalHours?: number; // Added for SM view
}

interface ProjectStats {
  projectId: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  topStories: Story[];
  allStories: Story[]; // Added to store all stories
  activeSprints: Sprint[]; // Added for SM view
  storiesWithoutIssues: Story[]; // Added for SM view
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<number, ProjectStats>>({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<
    | "PROJECTS_DEFAULT"
    | "PROJECTS_PROGRESS_DESC"
    | "ALL_STORIES_PRIORITY"
    | "PROJECTS_ALL"
  >("PROJECTS_PROGRESS_DESC");

  const isPO = user?.roles?.some(
    (r: string) =>
      r === "PO" ||
      r === "PRODUCT_OWNER" ||
      r === "ROLE_PO" ||
      r === "ROLE_PRODUCT_OWNER"
  );

  const isSM = user?.roles?.some(
    (r: string) =>
      r === "SM" ||
      r === "SCRUM_MASTER" ||
      r === "ROLE_SM" ||
      r === "ROLE_SCRUM_MASTER"
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!isPO && !isSM) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Projects
        const projectsRes = await api.get("/projects");
        const projectsData = projectsRes.data;
        setProjects(projectsData);

        const newStats: Record<number, ProjectStats> = {};

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

              // Fetch Backlog for Top Stories
              const backlogRes = await api.get(
                `/stories/backlog/${project.id}`
              );
              const backlog: Story[] = backlogRes.data.map((s: Story) => ({
                ...s,
                project: project, // Attach project info for global view
              }));

              // Sort by priorityScore descending
              const sortedBacklog = backlog.sort(
                (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
              );

              // Identify completed stories (all issues DONE)
              const issuesByStory: Record<number, Issue[]> = {};
              const sprintMetrics: Record<
                number,
                { count: number; hours: number }
              > = {};

              issues.forEach((i) => {
                // Group by Story
                if (i.story?.id) {
                  if (!issuesByStory[i.story.id]) {
                    issuesByStory[i.story.id] = [];
                  }
                  issuesByStory[i.story.id].push(i);
                }

                // Group by Sprint
                if (i.sprint?.id) {
                  if (!sprintMetrics[i.sprint.id]) {
                    sprintMetrics[i.sprint.id] = { count: 0, hours: 0 };
                  }
                  sprintMetrics[i.sprint.id].count++;
                  sprintMetrics[i.sprint.id].hours += i.timeEstimate || 0;
                }
              });

              const completedStoryIds = new Set<number>();
              Object.keys(issuesByStory).forEach((sId) => {
                const storyId = Number(sId);
                const storyIssues = issuesByStory[storyId];
                // Check if all issues are DONE (case-insensitive)
                const allDone = storyIssues.every(
                  (i) => i.status?.toUpperCase() === "DONE"
                );
                if (allDone && storyIssues.length > 0) {
                  completedStoryIds.add(storyId);
                }
              });

              // Fetch Sprints
              const sprintsRes = await api.get(
                `/sprints/project/${project.id}`
              );
              const allSprints = sprintsRes.data.map((s: Sprint) => ({
                ...s,
                issueCount: sprintMetrics[s.id]?.count || 0,
                totalHours: sprintMetrics[s.id]?.hours || 0,
              }));

              // Sort sprints: Active first, then by end date descending
              allSprints.sort((a: Sprint, b: Sprint) => {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
                return (
                  new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
                );
              });

              // Process Backlog for SM and PO
              const processedBacklog = sortedBacklog.map((s) => ({
                ...s,
                issueCount: issuesByStory[s.id]?.length || 0,
              }));

              // Filter backlog to exclude completed stories
              // Also exclude if story status is explicitly DONE
              const activeBacklog = processedBacklog.filter(
                (s) =>
                  !completedStoryIds.has(s.id) &&
                  s.status?.toUpperCase() !== "DONE"
              );

              const storiesWithoutIssues = activeBacklog.filter(
                (s) => (s.issueCount || 0) === 0
              );

              newStats[project.id] = {
                projectId: project.id,
                totalHours,
                completedHours,
                progress,
                topStories: activeBacklog.slice(0, 5),
                allStories: activeBacklog,
                activeSprints: allSprints, // Renamed in interface but keeping property name for now or updating interface?
                storiesWithoutIssues,
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
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isPO, isSM]);

  if (!isPO && !isSM) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={3}>Bienvenido a Vantage</Title>
        <Text>
          Este dashboard es exclusivo para Product Owners y Scrum Masters. Por
          favor, contacta a un administrador si crees que deberías tener acceso.
        </Text>
      </div>
    );
  }

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

      // Sort by priority (already sorted within projects, but need global sort)
      allStories.sort(
        (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
      );

      return (
        <Card title="Todas las Historias Priorizadas (WSJF)">
          {allStories.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allStories.map((story) => (
                <div
                  key={`${story.project?.id}-${story.id}`}
                  style={{
                    padding: "12px",
                    border: "1px solid #f0f0f0",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {story.project?.icon} {story.project?.name}
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {story.epic && (
                          <Tag color="purple">#{story.epic.epicNumber}</Tag>
                        )}
                        <Tag color="blue">#{story.storyNumber}</Tag>
                        <Text strong ellipsis style={{ maxWidth: 400 }}>
                          {story.title}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Tag color="purple">{story.storyPoints} pts</Tag>
                    <Tag
                      color={(story.priorityScore || 0) > 10 ? "red" : "orange"}
                      icon={<TrophyOutlined />}
                    >
                      {story.priorityScore?.toFixed(1)}
                    </Tag>
                    <ProjectOutlined
                      style={{ cursor: "pointer", color: "#1890ff" }}
                      onClick={() =>
                        navigate("/backlog", {
                          state: { selectedProjectId: story.project?.id },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No se encontraron historias" />
          )}
        </Card>
      );
    }

    // Default or Progress View (Project Cards)
    let filteredProjects = projects.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(lowerSearch);
      // Also check if any story in the project matches
      const storyMatch = stats[p.id]?.allStories.some((s) =>
        s.title.toLowerCase().includes(lowerSearch)
      );

      // Filter out completed projects (100% progress) unless in "PROJECTS_ALL" mode
      const isCompleted = stats[p.id]?.progress === 100;
      if (isCompleted && viewMode !== "PROJECTS_ALL") {
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

          return (
            <Col xs={24} sm={24} md={12} lg={8} key={project.id}>
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
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
                        styles={{ content: { fontSize: 18 } }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Completado"
                        value={projectStats.progress}
                        suffix="%"
                        prefix={<CheckCircleOutlined />}
                        styles={{ content: { fontSize: 18, color: "#3f8600" } }}
                      />
                    </Col>
                  </Row>

                  {/* Sprints (SM Only) */}
                  {isSM && projectStats.activeSprints.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong>
                          <ClockCircleOutlined style={{ color: "#52c41a" }} />{" "}
                          Sprints
                        </Text>
                        <Tag color="blue">
                          {projectStats.activeSprints.length} Sprints
                        </Tag>
                      </div>
                    </div>
                  )}

                  {/* Stories without Issues (SM Only) */}
                  {isSM && projectStats.storiesWithoutIssues.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text strong>
                          <CheckCircleOutlined style={{ color: "#ff4d4f" }} />{" "}
                          Historias sin Issues
                        </Text>
                        <Tag color="red">
                          {projectStats.storiesWithoutIssues.length}
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
                        <ThunderboltOutlined style={{ color: "#faad14" }} /> Top
                        Historias Prioritarias
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
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Text ellipsis style={{ maxWidth: 150 }}>
                                  {story.title}
                                </Text>
                                {isSM && (
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 10 }}
                                  >
                                    {story.issueCount} issues
                                  </Text>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Tag color="purple">{story.storyPoints} pts</Tag>
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
        margin: "-24px", // Counteract MainLayout padding
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          flexShrink: 0,
          padding: "24px 24px 16px 24px",
          background: "#f0f2f5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Dashboard
        </Title>
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
                label: "Todas las Historias (Prioridad)",
              },
              {
                value: "PROJECTS_ALL",
                label: "Ver todos los proyectos",
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
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
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

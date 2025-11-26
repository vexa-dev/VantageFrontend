import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Typography,
  Card,
  Select,
  Spin,
  App,
  Tag,
  Avatar,
  Empty,
  Modal,
  Tooltip,
  Divider,
  Row,
  Col,
  Button,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const { Title, Text } = Typography;

type IssueStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "CODE_REVIEW"
  | "QA"
  | "DONE";

interface Issue {
  id: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: string;
  assignees?: {
    id: number;
    fullName: string;
  }[];
  timeEstimate?: number;
  category?: string;
  story?: {
    id: number;
    title: string;
  };
}

interface Column {
  id: IssueStatus;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: "TO_DO", title: "To Do", color: "#597ef7" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#2f54eb" },
  // BLOCKED column removed from board view
  { id: "CODE_REVIEW", title: "Code Review", color: "#722ed1" },
  { id: "QA", title: "QA", color: "#faad14" },
  { id: "DONE", title: "Done", color: "#52c41a" },
];

// --- Sortable Item Component ---
const SortableItem = ({
  issue,
  onClick,
  isDev,
  currentUserId,
}: {
  issue: Issue;
  onClick: (issue: Issue) => void;
  isDev: boolean;
  currentUserId?: number;
}) => {
  const isAssignedToMe = issue.assignees?.some((a) => a.id === currentUserId);
  const isDraggable = !isDev || isAssignedToMe;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: { type: "Issue", issue },
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 10,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        style={{
          cursor: isDraggable ? "grab" : "default",
          boxShadow: isDragging
            ? "0 5px 15px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.05)",
          borderColor: isAssignedToMe ? "#1890ff" : "transparent",
          backgroundColor: isAssignedToMe ? "#e6f7ff" : "#fff",
          borderRadius: "8px",
        }}
        hoverable={isDraggable}
        onClick={() => onClick(issue)}
        variant={isAssignedToMe ? "outlined" : "borderless"}
      >
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: "14px", color: "#1f1f1f" }}>
            {issue.title}
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Tag
              style={{
                marginRight: 0,
                border: "none",
                background: "rgba(0,0,0,0.04)",
                fontWeight: 500,
                width: "fit-content",
              }}
            >
              {issue.priority}
            </Tag>
            {issue.timeEstimate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#8c8c8c",
                }}
              >
                <ClockCircleOutlined style={{ fontSize: "12px" }} />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {issue.timeEstimate}h
                </Text>
              </div>
            )}
          </div>

          {issue.assignees && issue.assignees.length > 0 && (
            <Avatar.Group max={{ count: 3 }} size="small">
              {issue.assignees.map((assignee, index) => (
                <Tooltip key={index} title={assignee.fullName}>
                  <Avatar
                    style={{
                      backgroundColor: "#87d068",
                      border: "2px solid #fff",
                    }}
                  >
                    {assignee.fullName
                      ? assignee.fullName[0].toUpperCase()
                      : "?"}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
          )}
        </div>
      </Card>
    </div>
  );
};

// --- Column Component ---
const KanbanColumn = ({
  column,
  issues,
  onIssueClick,
  isDev,
  currentUserId,
}: {
  column: Column;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  isDev: boolean;
  currentUserId?: number;
}) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    disabled: true,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: "#ebecf0",
        padding: "16px 12px",
        borderRadius: "12px",
        minWidth: 260, // Reduced slightly to fit smaller screens without scroll
        flex: 1, // Allow column to grow and fill space
        display: "flex",
        flexDirection: "column",
        border: "1px solid #dfe1e6",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: "0 4px",
        }}
      >
        <Text
          strong
          style={{
            textTransform: "uppercase",
            color: column.color,
            fontSize: "13px",
            letterSpacing: "0.5px",
          }}
        >
          {column.title}
        </Text>
        <div
          style={{
            backgroundColor: column.color,
            color: "#fff",
            borderRadius: "12px",
            padding: "2px 10px",
            fontWeight: "bold",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        >
          {issues.length}
        </div>
      </div>
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ flex: 1, minHeight: 100 }}>
          {issues.map((issue) => (
            <SortableItem
              key={issue.id}
              issue={issue}
              onClick={onIssueClick}
              isDev={isDev}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanBoard: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const isDev = user?.roles?.some(
    (r: string) => r === "DEV" || r === "ROLE_DEV" || r === "DEVELOPER"
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch Projects
  useEffect(() => {
    api.get("/projects").then((res) => {
      setProjects(res.data);
      if (res.data.length > 0) setSelectedProjectId(res.data[0].id);
    });
  }, []);

  // Fetch Sprints
  useEffect(() => {
    if (selectedProjectId) {
      api.get(`/sprints/project/${selectedProjectId}`).then((res) => {
        setSprints(res.data);
        if (res.data.length > 0) setSelectedSprintId(res.data[0].id);
        else {
          setSelectedSprintId(null);
          setIssues([]);
        }
      });
    }
  }, [selectedProjectId]);

  // Fetch Issues
  useEffect(() => {
    if (selectedSprintId) {
      setLoading(true);
      api
        .get(`/sprints/${selectedSprintId}`)
        .then((res) => {
          if (res.data && res.data.issues) {
            setIssues(res.data.issues);
          } else {
            setIssues([]);
          }
        })
        .catch((err) => {
          console.error(err);
          message.error("Error cargando issues");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedSprintId]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = issues.find((i) => i.id === active.id);
    if (item) setActiveDragItem(item);
  };

  const handleDragOver = () => {
    // Optional: Handle visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIssue = issues.find((i) => i.id === activeId);
    if (!activeIssue) return;

    let newStatus: IssueStatus | undefined;

    const isOverColumn = COLUMNS.some((c) => c.id === overId);

    if (isOverColumn) {
      newStatus = overId as IssueStatus;
    } else {
      const overIssue = issues.find((i) => i.id === overId);
      if (overIssue) {
        newStatus = overIssue.status;
      }
    }

    if (newStatus && newStatus !== activeIssue.status) {
      const oldStatus = activeIssue.status;
      setIssues((prev) =>
        prev.map((i) => (i.id === activeId ? { ...i, status: newStatus! } : i))
      );

      try {
        await api.patch(`/issues/${activeId}/status`, { status: newStatus });
        message.success(`Issue movido a ${newStatus}`);
      } catch (error) {
        console.error(error);
        message.error("Error al actualizar el estado");
        setIssues((prev) =>
          prev.map((i) => (i.id === activeId ? { ...i, status: oldStatus } : i))
        );
      }
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  return (
    <div
      style={{
        padding: "16px 24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Tablero Kanban
            </Title>
            {selectedProject && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {selectedProject.name}
                </Text>
                <br />
                <Text type="secondary">{selectedProject.description}</Text>
                {selectedSprint && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {dayjs(selectedSprint.startDate).format(
                        "DD MMM YYYY"
                      )} - {dayjs(selectedSprint.endDate).format("DD MMM YYYY")}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Select
              style={{ width: 200 }}
              placeholder="Proyecto"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              options={projects.map((p) => ({
                value: p.id,
                label: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                ),
              }))}
            />
            <Select
              style={{ width: 200 }}
              placeholder="Sprint"
              value={selectedSprintId}
              onChange={setSelectedSprintId}
              options={sprints.map((s) => ({ value: s.id, label: s.name }))}
              disabled={!selectedProjectId}
            />
          </div>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : !selectedSprintId ? (
        <Empty description="Selecciona un Sprint para ver el tablero" />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              paddingBottom: 16,
              height: "100%",
              gap: 16, // Increased gap for better separation
            }}
          >
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                issues={issues.filter((i) => i.status === col.id)}
                onIssueClick={setSelectedIssue}
                isDev={!!isDev}
                currentUserId={user?.id}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDragItem ? (
              <Card size="small" style={{ cursor: "grabbing", width: 300 }}>
                <Text strong>{activeDragItem.title}</Text>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        title="Detalles del Issue"
        open={!!selectedIssue}
        onCancel={() => setSelectedIssue(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedIssue(null)}>
            Cerrar
          </Button>,
          selectedIssue?.story && (
            <Button
              key="backlog"
              type="primary"
              onClick={() => {
                navigate(`/issues/${selectedIssue.story?.id}`);
              }}
            >
              Ver en Backlog
            </Button>
          ),
        ]}
      >
        {selectedIssue && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  {selectedIssue.title}
                </Title>
                <Tag
                  color={
                    selectedIssue.priority === "HIGH"
                      ? "red"
                      : selectedIssue.priority === "MEDIUM"
                      ? "orange"
                      : "green"
                  }
                >
                  {selectedIssue.priority}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 16 }}>
                {selectedIssue.description || "Sin descripción proporcionada."}
              </Text>
              {selectedIssue.story && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Historia: </Text>
                  <Text strong>{selectedIssue.story.title}</Text>
                </div>
              )}
            </div>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <Text type="secondary">Estado</Text>
                  <Tag
                    color="blue"
                    style={{ fontSize: 14, padding: "4px 10px" }}
                  >
                    {selectedIssue.status.replace("_", " ")}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <Text type="secondary">Estimación</Text>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <ClockCircleOutlined style={{ color: "#faad14" }} />
                    <Text strong>
                      {selectedIssue.timeEstimate
                        ? `${selectedIssue.timeEstimate} horas`
                        : "No estimada"}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Text type="secondary">Asignado a</Text>
                  {selectedIssue.assignees &&
                  selectedIssue.assignees.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {selectedIssue.assignees.map((assignee, index) => (
                        <Tag
                          key={index}
                          icon={<UserOutlined />}
                          color="default"
                          style={{
                            padding: "4px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {assignee.fullName}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary" italic>
                      Sin asignar
                    </Text>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KanbanBoard;

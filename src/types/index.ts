// src/types/index.ts

export interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  id: number;
  email: string;
  roles: string[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner?: User;
}

export interface Story {
  id?: number;
  title: string;
  description?: string;
  status?: 'BACKLOG' | 'TODO' | 'DOING' | 'TESTING' | 'DONE';
  businessValue: number;
  urgency: number;
  storyPoints: number;
  priorityScore?: number;
  projectId: number;
  comments?: Comment[]; 
}
export interface Sprint {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface Comment {
  id: number;
  content: string;
  author: User;     
  createdAt: string; 
}
import { PostcardData, TemplateId } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ========== Projects ==========

export interface ProjectListItem {
  id: string;
  name: string;
  template_id: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  template_id: string;
  data: PostcardData;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export function fetchProjects(templateId?: TemplateId): Promise<ProjectListItem[]> {
  const query = templateId ? `?templateId=${templateId}` : '';
  return request(`/projects${query}`);
}

export function fetchProject(id: string): Promise<ProjectDetail> {
  return request(`/projects/${id}`);
}

export function createProject(body: {
  name: string;
  templateId: TemplateId;
  data: PostcardData;
  thumbnail?: string | null;
}): Promise<{ id: string }> {
  return request('/projects', { method: 'POST', body: JSON.stringify(body) });
}

export function updateProject(id: string, body: {
  name?: string;
  templateId?: TemplateId;
  data?: PostcardData;
  thumbnail?: string | null;
}): Promise<{ success: boolean }> {
  return request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteProject(id: string): Promise<{ success: boolean }> {
  return request(`/projects/${id}`, { method: 'DELETE' });
}

// ========== Guests ==========

export interface GuestItem {
  id: string;
  name: string;
  title: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export function fetchGuests(): Promise<GuestItem[]> {
  return request('/guests');
}

export function createGuest(body: {
  name: string;
  title?: string;
  image?: string | null;
}): Promise<GuestItem> {
  return request('/guests', { method: 'POST', body: JSON.stringify(body) });
}

export function updateGuest(id: string, body: {
  name?: string;
  title?: string;
  image?: string | null;
}): Promise<{ success: boolean }> {
  return request(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteGuest(id: string): Promise<{ success: boolean }> {
  return request(`/guests/${id}`, { method: 'DELETE' });
}

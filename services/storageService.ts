import { supabase } from '@/src/integrations/supabase/client';
import { PostcardData, ProjectAllData, TemplateId } from '../types';
import { INITIAL_PROJECT_DATA } from '../constants';

// ─── File Upload ───────────────────────────────────────────────
export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { error } = await supabase.storage.from('uploads').upload(fileName, file);
  if (error) throw error;
  
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadBase64(base64: string, folder: string): Promise<string> {
  const match = base64.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Invalid base64 string');
  
  const mimeType = match[1];
  const ext = mimeType.split('/')[1] || 'png';
  const buffer = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { error } = await supabase.storage.from('uploads').upload(fileName, buffer, { contentType: mimeType });
  if (error) throw error;
  
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Projects ───────────────────────────────────────────────────
export interface ProjectRow {
  id: string;
  title: string;
  template_id: string;
  data: ProjectAllData;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

/** Migrate old single-PostcardData format to ProjectAllData */
function migrateProjectData(raw: any): ProjectAllData {
  // If the data already has all three template keys, it's the new format
  if (raw && raw[TemplateId.MODERN] && raw[TemplateId.CODE] && raw[TemplateId.LIVESTREAM]) {
    return raw as ProjectAllData;
  }
  // Old format: raw is a single PostcardData with a templateId field
  if (raw && raw.templateId) {
    const oldData = raw as PostcardData;
    const migrated = { ...INITIAL_PROJECT_DATA };
    migrated[oldData.templateId as TemplateId] = oldData;
    return migrated;
  }
  return { ...INITIAL_PROJECT_DATA };
}

export async function getProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map(row => ({
    ...row,
    data: migrateProjectData(row.data),
  })) as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...(data as any), data: migrateProjectData((data as any).data) } as ProjectRow;
}

export async function createProject(title: string, projectData: ProjectAllData): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title, template_id: 'ALL', data: projectData as any })
    .select()
    .single();
  if (error) throw error;
  return { ...(data as any), data: migrateProjectData((data as any).data) } as ProjectRow;
}

export async function updateProject(id: string, updates: Partial<{ title: string; data: ProjectAllData; thumbnail: string }>): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Guests ─────────────────────────────────────────────────────
export interface GuestRow {
  id: string;
  name: string;
  title: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getGuests(): Promise<GuestRow[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as GuestRow[];
}

export async function createGuest(name: string, title: string, avatarUrl?: string): Promise<GuestRow> {
  const { data, error } = await supabase
    .from('guests')
    .insert({ name, title, avatar_url: avatarUrl || null })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as GuestRow;
}

export async function updateGuest(id: string, updates: Partial<{ name: string; title: string; avatar_url: string | null }>): Promise<void> {
  const { error } = await supabase.from('guests').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) throw error;
}

// ─── Logos ──────────────────────────────────────────────────────
export interface LogoRow {
  id: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export async function getLogos(): Promise<LogoRow[]> {
  const { data, error } = await supabase
    .from('logos')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as LogoRow[];
}

export async function createLogo(name: string, url: string): Promise<LogoRow> {
  const { data, error } = await supabase
    .from('logos')
    .insert({ name, url })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as LogoRow;
}

export async function updateLogo(id: string, updates: Partial<{ name: string; url: string }>): Promise<void> {
  const { error } = await supabase.from('logos').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteLogo(id: string): Promise<void> {
  const { error } = await supabase.from('logos').delete().eq('id', id);
  if (error) throw error;
}

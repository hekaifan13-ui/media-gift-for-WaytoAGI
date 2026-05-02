import { supabase } from '../integrations/supabase/client';
import { PostcardData, TemplateId } from '../types';

// ========== Projects ==========

export interface ProjectListItem {
  id: string;
  name: string;
  template_id: string;
  thumbnail: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProjectDetail {
  id: string;
  name: string;
  template_id: string;
  data: PostcardData;
  thumbnail: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchProjects(templateId?: TemplateId): Promise<ProjectListItem[]> {
  let query = supabase
    .from('projects')
    .select('id, name, template_id, thumbnail, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (templateId) {
    query = query.eq('template_id', templateId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ProjectListItem[];
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Project not found');
  return data as unknown as ProjectDetail;
}

export async function createProject(body: {
  name: string;
  templateId: TemplateId;
  data: PostcardData;
  thumbnail?: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name,
      template_id: body.templateId,
      data: body.data as unknown as Record<string, unknown>,
      thumbnail: body.thumbnail ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateProject(
  id: string,
  body: {
    name?: string;
    templateId?: TemplateId;
    data?: PostcardData;
    thumbnail?: string | null;
  }
): Promise<{ success: boolean }> {
  const updateObj: Record<string, unknown> = {};
  if (body.name !== undefined) updateObj.name = body.name;
  if (body.templateId !== undefined) updateObj.template_id = body.templateId;
  if (body.data !== undefined) updateObj.data = body.data as unknown as Record<string, unknown>;
  if (body.thumbnail !== undefined) updateObj.thumbnail = body.thumbnail;

  const { error } = await supabase
    .from('projects')
    .update(updateObj)
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

// ========== Guests ==========

export interface GuestItem {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchGuests(): Promise<GuestItem[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GuestItem[];
}

export async function createGuest(body: {
  name: string;
  title?: string;
  image?: string | null;
}): Promise<GuestItem> {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      name: body.name,
      title: body.title ?? '',
      image: body.image ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GuestItem;
}

export async function updateGuest(
  id: string,
  body: {
    name?: string;
    title?: string;
    image?: string | null;
  }
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('guests')
    .update(body)
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function deleteGuest(id: string): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

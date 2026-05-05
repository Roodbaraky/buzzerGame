import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Room {
  id: string;
  code: string;
  host_token: string;
  current_round: number;
  round_active: boolean;
  hostless_mode: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private supabase: SupabaseService) {}

  async createRoom(): Promise<Room> {
    const hostToken = crypto.randomUUID();
    const { data, error } = await this.supabase.client
      .from('rooms')
      .insert({ host_token: hostToken })
      .select()
      .single();

    if (error) throw error;
    return data as Room;
  }

  async getRoom(id: string): Promise<{ data: Room | null; error: any }> {
    const { data, error } = await this.supabase.client
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data as Room | null, error };
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const { data, error } = await this.supabase.client
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) return null;
    return data as Room;
  }
}

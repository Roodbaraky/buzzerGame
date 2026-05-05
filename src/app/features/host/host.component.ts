import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService } from '../../core/room.service';

@Component({
  selector: 'app-host',
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 class="text-3xl font-bold">Buzzer Game</h1>
      <p class="text-gray-500">Create a room and invite players to join</p>
      <button
        (click)="createRoom()"
        class="px-8 py-4 text-xl font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        [disabled]="creating"
      >
        {{ creating ? 'Creating...' : 'Create Room' }}
      </button>
      @if (error) {
        <p class="text-red-500">{{ error }}</p>
      }
    </div>
  `,
})
export class HostComponent {
  private router = inject(Router);
  private roomService = inject(RoomService);

  creating = false;
  error = '';

  async createRoom() {
    this.creating = true;
    this.error = '';
    try {
      const room = await this.roomService.createRoom();
      localStorage.setItem(`host_${room.id}`, room.host_token);
      this.router.navigate(['/room', room.id], { queryParams: { host: true } });
    } catch (e) {
      this.error = 'Failed to create room. Check your Supabase connection.';
      this.creating = false;
    }
  }
}

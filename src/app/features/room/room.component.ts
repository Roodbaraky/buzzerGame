import { Component, inject, OnInit, OnDestroy, signal, effect, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService, Room } from '../../core/room.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-room',
  imports: [],
  template: `
    <div class="flex flex-col items-center min-h-screen p-8">
      @if (room()) {
        <div class="flex flex-col items-center gap-6 max-w-md w-full">
          <h1 class="text-2xl font-bold">Room Created!</h1>

          <div class="text-6xl font-mono font-bold tracking-widest bg-gray-100 rounded-xl px-8 py-4">
            {{ room()!.code }}
          </div>

          <p class="text-gray-500">Share this code or have players scan the QR code</p>

          <canvas #qrCanvas class="border-4 border-gray-200 rounded-xl"></canvas>

          <p class="text-sm text-gray-400">
            Players waiting: {{ playerCount() }}
          </p>
        </div>
      } @else {
        <p class="text-gray-500 mt-20">Loading room...</p>
      }
    </div>
  `,
})
export class RoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private roomService = inject(RoomService);

  room = signal<Room | null>(null);
  playerCount = signal(0);
  isHost = false;

  private qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  private subscription: any = null;

  constructor() {
    effect(() => {
      const roomData = this.room();
      const canvas = this.qrCanvas()?.nativeElement;
      if (roomData && canvas) {
        this.generateQR(canvas, roomData.code);
      }
    });
  }

  get roomId(): string {
    return this.route.snapshot.paramMap.get('roomId') || '';
  }

  ngOnInit() {
    this.isHost = this.route.snapshot.queryParamMap.get('host') === 'true';
    this.loadRoom();
    this.watchPlayers();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe?.();
  }

  private async loadRoom() {
    const hostToken = localStorage.getItem(`host_${this.roomId}`);
    if (!hostToken) {
      this.room.set({
        id: this.roomId, code: '------', host_token: '',
        current_round: 1, round_active: false, hostless_mode: false, created_at: ''
      });
      return;
    }

    const { data } = await this.roomService.getRoom(this.roomId);
    if (data) {
      this.room.set(data);
    }
  }

  private watchPlayers() {
    // Placeholder for real-time player subscription (issue #3)
    this.playerCount.set(0);
  }

  private async generateQR(canvas: HTMLCanvasElement, code: string) {
    const url = `${window.location.origin}/join?code=${code}`;
    await QRCode.toCanvas(canvas, url, { width: 256 });
  }
}

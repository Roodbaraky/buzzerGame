import { Routes } from '@angular/router';
import { HostComponent } from './features/host/host.component';
import { RoomComponent } from './features/room/room.component';

export const routes: Routes = [
  { path: '', redirectTo: '/host', pathMatch: 'full' },
  { path: 'host', component: HostComponent },
  { path: 'room/:roomId', component: RoomComponent },
];

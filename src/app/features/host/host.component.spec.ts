import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HostComponent } from './host.component';
import { RoomService, Room } from '../../core/room.service';

describe('HostComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;
  let roomService: jasmine.SpyObj<RoomService>;
  let router: Router;

  const mockRoom: Room = {
    id: 'room-uuid-123',
    code: 'ABCDEF',
    host_token: 'host-token-xyz',
    current_round: 1,
    round_active: false,
    hostless_mode: false,
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    roomService = jasmine.createSpyObj('RoomService', ['createRoom']);

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([]),
        { provide: RoomService, useValue: roomService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should display the Create Room button', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent.trim()).toBe('Create Room');
  });

  it('should call roomService.createRoom when button is clicked', async () => {
    roomService.createRoom.and.returnValue(Promise.resolve(mockRoom));
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(roomService.createRoom).toHaveBeenCalled();
  });

  it('should store host token in localStorage after room creation', async () => {
    roomService.createRoom.and.returnValue(Promise.resolve(mockRoom));
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(localStorage, 'setItem').and.callThrough();

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();

    expect(localStorage.setItem).toHaveBeenCalledWith('host_room-uuid-123', 'host-token-xyz');
  });

  it('should navigate to room page after creation', async () => {
    roomService.createRoom.and.returnValue(Promise.resolve(mockRoom));
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/room', 'room-uuid-123'], { queryParams: { host: true } });
  });

  it('should disable button while creating room', () => {
    // Simulate a pending promise that never resolves
    roomService.createRoom.and.returnValue(new Promise(() => {}));

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(button.disabled).toBeTrue();
    expect(button.textContent.trim()).toBe('Creating...');
  });

  it('should show error message when room creation fails', async () => {
    roomService.createRoom.and.returnValue(Promise.reject(new Error('Network error')));

    const button = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.text-red-500');
    expect(error.textContent).toContain('Failed to create room');
    expect(button.disabled).toBeFalse();
  });
});

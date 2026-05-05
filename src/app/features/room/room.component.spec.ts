import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { RoomComponent } from './room.component';
import { RoomService, Room } from '../../core/room.service';

describe('RoomComponent', () => {
  let fixture: ComponentFixture<RoomComponent>;
  let component: RoomComponent;
  let roomService: jasmine.SpyObj<RoomService>;
  let route: ActivatedRoute;

  const mockRoom: Room = {
    id: 'room-uuid-123',
    code: 'ABCDEF',
    host_token: 'host-token-xyz',
    current_round: 1,
    round_active: false,
    hostless_mode: false,
    created_at: '2026-01-01T00:00:00Z',
  };

  function setup(params: Record<string, string>, queryParams: Record<string, string> = {}) {
    roomService = jasmine.createSpyObj('RoomService', ['getRoom']);

    TestBed.configureTestingModule({
      imports: [RoomComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => params[key] || null,
              },
              queryParamMap: {
                get: (key: string) => queryParams[key] || null,
              },
            },
          },
        },
        { provide: RoomService, useValue: roomService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomComponent);
    component = fixture.componentInstance;
    route = TestBed.inject(ActivatedRoute);
  }

  describe('as host', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue('host-token-xyz');
      roomService = jasmine.createSpyObj('RoomService', ['getRoom']);
      roomService.getRoom.and.returnValue(Promise.resolve({ data: mockRoom, error: null }));

      TestBed.configureTestingModule({
        imports: [RoomComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: { get: (key: string) => key === 'roomId' ? 'room-uuid-123' : null },
                queryParamMap: { get: (key: string) => key === 'host' ? 'true' : null },
              },
            },
          },
          { provide: RoomService, useValue: roomService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(RoomComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set isHost to true when host query param is true', () => {
      expect(component.isHost).toBeTrue();
    });

    it('should fetch room data on init', () => {
      expect(roomService.getRoom).toHaveBeenCalledWith('room-uuid-123');
    });

    it('should check localStorage for host token', () => {
      expect(localStorage.getItem).toHaveBeenCalledWith('host_room-uuid-123');
    });

    it('should display the room code', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const codeEl = fixture.nativeElement.querySelector('.font-mono');
      expect(codeEl).toBeTruthy();
      expect(codeEl.textContent.trim()).toBe('ABCDEF');
    });

    it('should show a QR canvas element', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });
  });

  describe('without host token', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      roomService = jasmine.createSpyObj('RoomService', ['getRoom']);

      TestBed.configureTestingModule({
        imports: [RoomComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: { get: (key: string) => key === 'roomId' ? 'room-uuid-123' : null },
                queryParamMap: { get: () => null },
              },
            },
          },
          { provide: RoomService, useValue: roomService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(RoomComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show placeholder code when no host token found', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.room()?.code).toBe('------');
    });

    it('should not call getRoom without host token', () => {
      expect(roomService.getRoom).not.toHaveBeenCalled();
    });
  });

  describe('player count', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue('host-token-xyz');
      roomService = jasmine.createSpyObj('RoomService', ['getRoom']);
      roomService.getRoom.and.returnValue(Promise.resolve({ data: mockRoom, error: null }));

      TestBed.configureTestingModule({
        imports: [RoomComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: { get: (key: string) => key === 'roomId' ? 'room-uuid-123' : null },
                queryParamMap: { get: (key: string) => key === 'host' ? 'true' : null },
              },
            },
          },
          { provide: RoomService, useValue: roomService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(RoomComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should show initial player count of 0', () => {
      expect(component.playerCount()).toBe(0);
    });
  });
});

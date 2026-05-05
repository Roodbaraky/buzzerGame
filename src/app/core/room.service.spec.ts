import { TestBed } from '@angular/core/testing';
import { RoomService, Room } from './room.service';
import { SupabaseService } from './supabase.service';

interface MockFilterBuilder {
  eq: jasmine.Spy;
  single: jasmine.Spy;
}

interface MockTransformBuilder {
  single: jasmine.Spy;
}

interface MockInsertBuilder {
  select: jasmine.Spy;
}

interface MockQueryBuilder {
  insert: jasmine.Spy;
  select: jasmine.Spy;
}

interface MockClient {
  from: jasmine.Spy;
}

type UuidString = ReturnType<typeof crypto.randomUUID>;

type SingleResult = { data: unknown; error: unknown };

function makeSingle(result: SingleResult): jasmine.Spy {
  return jasmine.createSpy('single').and.returnValue(Promise.resolve(result));
}

function makeFilter(result: SingleResult): MockFilterBuilder {
  const single = makeSingle(result);
  const eq = jasmine.createSpy('eq').and.returnValue({ single } satisfies MockTransformBuilder);
  return { eq, single };
}

function makeSelect(result: SingleResult): jasmine.Spy {
  return jasmine.createSpy('select').and.returnValue(makeFilter(result) satisfies MockFilterBuilder);
}

function makeInsert(result: SingleResult): jasmine.Spy {
  return jasmine.createSpy('insert').and.returnValue({ select: makeSelect(result) } satisfies MockInsertBuilder);
}

function makeFrom(handlers: Record<string, MockQueryBuilder>): jasmine.Spy {
  return jasmine.createSpy('from').and.callFake((table: string) => handlers[table]);
}

describe('RoomService', () => {
  let service: RoomService;
  let mockClient: MockClient;

  const mockRoom: Room = {
    id: 'abc-123',
    code: 'ABCDEF',
    host_token: 'host-token-xyz',
    current_round: 1,
    round_active: false,
    hostless_mode: false,
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockClient = {} as MockClient;

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: mockClient } },
      ],
    });

    service = TestBed.inject(RoomService);
  });

  describe('createRoom', () => {
    it('should insert a room and return the created room', async () => {
      const insertSpy = makeInsert({ data: mockRoom, error: null });
      const queryBuilder: MockQueryBuilder = { insert: insertSpy, select: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      spyOn(crypto, 'randomUUID').and.returnValue('host-token-xyz' as UuidString);

      const room = await service.createRoom();

      expect(room).toEqual(mockRoom);
      expect(mockClient.from).toHaveBeenCalledWith('rooms');
      expect(insertSpy).toHaveBeenCalledWith({ host_token: 'host-token-xyz' });
    });

    it('should throw when Supabase returns an error', async () => {
      const error = new Error('Connection failed');
      const insertSpy = makeInsert({ data: null, error });
      const queryBuilder: MockQueryBuilder = { insert: insertSpy, select: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      spyOn(crypto, 'randomUUID').and.returnValue('host-token-xyz' as UuidString);

      await expectAsync(service.createRoom()).toBeRejectedWith(error);
    });
  });

  describe('getRoom', () => {
    it('should fetch a room by id', async () => {
      const selectSpy = makeSelect({ data: mockRoom, error: null });
      const queryBuilder: MockQueryBuilder = { select: selectSpy, insert: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      const result = await service.getRoom('abc-123');

      expect(result.data).toEqual(mockRoom);
      expect(result.error).toBeNull();
    });

    it('should return error when room is not found', async () => {
      const error = { code: 'PGRST116', message: 'Not found' };
      const selectSpy = makeSelect({ data: null, error });
      const queryBuilder: MockQueryBuilder = { select: selectSpy, insert: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      const result = await service.getRoom('nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('getRoomByCode', () => {
    it('should fetch a room by uppercased code', async () => {
      const single = makeSingle({ data: mockRoom, error: null });
      const eq = jasmine.createSpy('eq').and.returnValue({ single } satisfies MockTransformBuilder);
      const select = jasmine.createSpy('select').and.returnValue({ eq, single } satisfies MockFilterBuilder);
      const queryBuilder: MockQueryBuilder = { select, insert: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      const room = await service.getRoomByCode('abcdef');

      expect(room).toEqual(mockRoom);
      expect(eq).toHaveBeenCalledWith('code', 'ABCDEF');
    });

    it('should return null when code is not found', async () => {
      const selectSpy = makeSelect({ data: null, error: { message: 'Not found' } });
      const queryBuilder: MockQueryBuilder = { select: selectSpy, insert: jasmine.createSpy() };
      mockClient.from = makeFrom({ rooms: queryBuilder });

      const room = await service.getRoomByCode('ZZZZZZ');

      expect(room).toBeNull();
    });
  });
});

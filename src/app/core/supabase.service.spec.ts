import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  it('should be created and expose a Supabase client', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(SupabaseService);

    expect(service).toBeTruthy();
    expect(service.client).toBeTruthy();
    expect(service.client.from).toBeDefined();
  });
});

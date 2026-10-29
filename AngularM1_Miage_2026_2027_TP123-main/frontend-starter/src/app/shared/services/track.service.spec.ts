import { HttpEvent, HttpEventType, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { Track } from '../models/track.model';
import { AuthService } from './auth.service';
import { TrackService } from './track.service';

describe('TrackService and authInterceptor', () => {
  let service: TrackService;
  let httpTesting: HttpTestingController;

  const track: Track = {
    id: 'track-1',
    title: 'Blues',
    originalName: 'blues.mp3',
    mimeType: 'audio/mpeg',
    size: 1024,
    createdAt: '2026-10-29T10:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.removeItem('gpc_token');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TrackService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('gpc_token');
  });

  it('sends pagination and search parameters when listing tracks', () => {
    let responseCount = 0;
    service.list(2, 5, 'blues').subscribe((response) => {
      responseCount = response.items.length;
    });

    const request = httpTesting.expectOne('/api/tracks?page=2&limit=5&search=blues');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('5');
    expect(request.request.params.get('search')).toBe('blues');
    request.flush({ items: [track], page: 2, limit: 5, total: 6, pages: 2 });
    expect(responseCount).toBe(1);
  });

  it('deletes a track with DELETE /api/tracks/:id', () => {
    let completed = false;
    service.remove(track.id).subscribe(() => {
      completed = true;
    });

    const request = httpTesting.expectOne('/api/tracks/track-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('adds the bearer token to protected API requests', () => {
    TestBed.inject(AuthService).token.set('test-token');
    service.list().subscribe();

    const request = httpTesting.expectOne('/api/tracks?page=1&limit=5');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ items: [], page: 1, limit: 5, total: 0, pages: 1 });
  });

  it('requests upload progress and forwards progress and response events', () => {
    const file = new File(['audio'], 'blues.mp3', { type: 'audio/mpeg' });
    const events: HttpEvent<Track>[] = [];
    service.upload(file, 'Blues').subscribe((event) => events.push(event));

    const request = httpTesting.expectOne('/api/tracks');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBe(true);
    expect(request.request.body).toBeInstanceOf(FormData);
    if (!(request.request.body instanceof FormData)) {
      throw new Error('Expected the upload body to be FormData.');
    }
    expect(request.request.body.get('audio')).toBe(file);
    expect(request.request.body.get('title')).toBe('Blues');

    request.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    request.flush(track);
    expect(events.map((event) => event.type)).toEqual([
      HttpEventType.Sent,
      HttpEventType.UploadProgress,
      HttpEventType.Response,
    ]);
    expect(events[1]).toMatchObject({ loaded: 50, total: 100 });
  });
});

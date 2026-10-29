import { Component, inject, OnDestroy, signal } from '@angular/core';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly maxFileSize = 25 * 1024 * 1024;
  private readonly acceptedAudioTypes = new Set([
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
  ]);
  private readonly maxCoverSize = 5 * 1024 * 1024;
  private readonly acceptedCoverTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  readonly tracks = signal<Track[]>([]);
  readonly coverUrls = signal<Record<string, string>>({});
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  readonly deleteError = signal('');
  readonly deleteSuccess = signal('');
  readonly deletingTrackId = signal('');
  readonly audioUrl = signal('');
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal(false);
  readonly audioError = signal('');
  readonly title = new FormControl('', { nonNullable: true });
  readonly searchTitle = new FormControl('', { nonNullable: true });
  readonly appliedSearch = signal('');
  file?: File;
  coverFile?: File;
  private fileInput?: HTMLInputElement;
  private coverInput?: HTMLInputElement;
  private activeSearch = '';
  private readonly pageSize = 5;
  private requestId = 0;
  private audioRequestId = 0;

  constructor() {
    this.load();
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileInput = input;
    this.file = input.files?.[0];
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.uploadProgress.set(null);

    if (this.file) {
      const validationError = this.validateFile(this.file);
      if (validationError) {
        this.file = undefined;
        this.uploadError.set(validationError);
      }
    }

    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);
  }

  chooseCover(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.coverInput = input;
    this.coverFile = input.files?.[0];
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.uploadProgress.set(null);

    if (!this.coverFile) return;
    if (this.coverFile.size > this.maxCoverSize) {
      this.coverFile = undefined;
      this.uploadError.set('La couverture dépasse la taille maximale autorisée de 5 Mo.');
    } else if (!this.acceptedCoverTypes.has(this.coverFile.type)) {
      this.coverFile = undefined;
      this.uploadError.set('Format de couverture non accepté. Choisissez une image JPEG, PNG ou WebP.');
    }
  }

  load(): void {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set('');
    this.service.list(this.page(), this.pageSize, this.activeSearch).subscribe({
      next: (response) => {
        if (requestId !== this.requestId) return;
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.clearCoverUrls();
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
        for (const track of response.items) {
          if (track.coverMimeType) this.loadCover(track, requestId);
        }
      },
      error: (error) => {
        if (requestId !== this.requestId) return;
        console.error('[TracksPage] Chargement impossible', error);
        this.error.set(
          error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
            ? error.error.message
            : 'Impossible de charger les pistes. Réessayez.',
        );
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    if (this.loading() || page < 1 || page > this.pages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  searchTracks(): void {
    const search = this.searchTitle.value.trim();
    if (search === this.activeSearch && this.page() === 1) return;
    this.activeSearch = search;
    this.appliedSearch.set(search);
    this.page.set(1);
    this.load();
  }

  clearSearch(): void {
    this.searchTitle.setValue('');
    if (!this.activeSearch && this.page() === 1) return;
    this.activeSearch = '';
    this.appliedSearch.set('');
    this.page.set(1);
    this.load();
  }

  upload(): void {
    const file = this.file;
    const cover = this.coverFile;
    if (!file || this.uploading()) return;

    const validationError = this.validateFile(file);
    if (validationError) {
      this.uploadError.set(validationError);
      return;
    }
    if (cover) {
      const coverError = this.validateCover(cover);
      if (coverError) {
        this.uploadError.set(coverError);
        return;
      }
    }

    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.service.upload(file, this.title.value.trim() || file.name, cover).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress.set(
            event.total === undefined || event.total === 0
              ? null
              : Math.round((event.loaded / event.total) * 100),
          );
          return;
        }
        if (!(event instanceof HttpResponse)) return;

        const track = event.body;
        if (!track) {
          this.uploading.set(false);
          this.uploadProgress.set(null);
          this.uploadError.set('Le serveur a terminé l’envoi sans renvoyer la piste.');
          return;
        }

        console.debug('[TracksPage] Piste envoyée', track.id);
        this.uploading.set(false);
        this.uploadProgress.set(100);
        this.uploadSuccess.set(
          cover
            ? 'La piste et sa couverture ont été envoyées avec succès.'
            : 'La piste a été envoyée avec succès.',
        );
        this.title.setValue('');
        this.file = undefined;
        this.coverFile = undefined;
        if (this.fileInput) this.fileInput.value = '';
        if (this.coverInput) this.coverInput.value = '';
        this.page.set(1);
        this.load();
      },
      error: (error: unknown) => {
        console.error('[TracksPage] Envoi impossible', error);
        this.uploading.set(false);
        this.uploadProgress.set(null);
        this.uploadError.set(this.getRequestErrorMessage(error));
      },
    });
  }

  remove(track: Track): void {
    if (this.deletingTrackId()) return;
    const confirmed = window.confirm(`Supprimer définitivement « ${track.title} » ?`);
    if (!confirmed) return;

    this.deleteError.set('');
    this.deleteSuccess.set('');
    this.deletingTrackId.set(track.id);
    this.service.remove(track.id).subscribe({
      next: () => {
        this.deletingTrackId.set('');
        this.deleteSuccess.set(`« ${track.title} » a été supprimée.`);
        this.snackBar.open(`« ${track.title} » a été supprimée.`, 'Fermer', {
          duration: 5000,
          politeness: 'polite',
        });
        if (this.currentTrack()?.id === track.id) {
          const audioUrl = this.audioUrl();
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          this.audioUrl.set('');
          this.currentTrack.set(null);
        }
        const page = this.tracks().length === 1 && this.page() > 1
          ? this.page() - 1
          : this.page();
        this.page.set(page);
        this.load();
      },
      error: (error: unknown) => {
        console.error('[TracksPage] Suppression impossible', error);
        this.deletingTrackId.set('');
        const message =
          error instanceof HttpErrorResponse && (error.status === 403 || error.status === 404)
            ? 'Cette piste n’existe plus ou n’est pas accessible à votre compte. Actualisez la bibliothèque.'
            : this.getRequestErrorMessage(error);
        this.deleteError.set(message);
        this.snackBar.open(message, 'Fermer', {
          duration: 7000,
          politeness: 'assertive',
        });
      },
    });
  }

  private validateFile(file: File): string {
    if (file.size > this.maxFileSize) {
      return 'Le fichier dépasse la taille maximale autorisée de 25 Mo.';
    }
    if (!this.acceptedAudioTypes.has(file.type)) {
      return 'Format non accepté. Choisissez un fichier MP3, WAV, OGG ou M4A.';
    }
    return '';
  }

  private validateCover(file: File): string {
    if (file.size > this.maxCoverSize) {
      return 'La couverture dépasse la taille maximale autorisée de 5 Mo.';
    }
    if (!this.acceptedCoverTypes.has(file.type)) {
      return 'Format de couverture non accepté. Choisissez une image JPEG, PNG ou WebP.';
    }
    return '';
  }

  private getRequestErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        return body.message;
      }
      if (error.status === 0) {
        return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
      }
      return `La requête a échoué (erreur HTTP ${error.status}). Réessayez.`;
    }
    return 'Une erreur inattendue est survenue. Réessayez.';
  }

  play(track: Track): void {
    const requestId = ++this.audioRequestId;
    this.audioLoading.set(true);
    this.audioError.set('');
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        if (requestId !== this.audioRequestId) return;
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
        this.currentTrack.set(track);
        this.audioLoading.set(false);
      },
      error: (error: unknown) => {
        if (requestId !== this.audioRequestId) return;
        console.error('[TracksPage] Lecture impossible', error);
        this.audioLoading.set(false);
        this.audioError.set(
          error instanceof HttpErrorResponse && error.status === 0
            ? 'Impossible de joindre le serveur pour récupérer ce morceau.'
            : 'Impossible de récupérer ce morceau. Vérifiez votre connexion et réessayez.',
        );
      },
    });
  }

  onAudioError(): void {
    this.audioError.set(
      'Le navigateur n’a pas pu lire ce fichier audio. Il est peut-être endommagé ou dans un format incompatible.',
    );
  }

  private loadCover(track: Track, requestId: number): void {
    this.service.cover(track.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        if (requestId !== this.requestId) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        this.coverUrls.update((urls) => ({ ...urls, [track.id]: objectUrl }));
      },
      error: (error: unknown) => {
        if (requestId === this.requestId) {
          console.error(`[TracksPage] Couverture impossible à charger (${track.id})`, error);
        }
      },
    });
  }

  private clearCoverUrls(): void {
    for (const url of Object.values(this.coverUrls())) URL.revokeObjectURL(url);
    this.coverUrls.set({});
  }

  formatSize(size: number): string {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} Ko`;
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date));
  }

  ngOnDestroy(): void {
    this.audioRequestId++;
    this.requestId++;
    const audioUrl = this.audioUrl();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    this.clearCoverUrls();
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.pattern(/\S/)],
    }),
  });

  ngOnInit(): void {
    // Fetch the authoritative profile when the guarded page is opened.
    this.load();
  }

  load(): void {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    this.auth.profile().subscribe({
      next: (user) => {
        this.loading.set(false);
        this.form.setValue({ name: user.name });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        console.error(
          '[ProfilePage] Chargement impossible',
          error instanceof HttpErrorResponse ? error.status : 'erreur inattendue',
        );
        this.error.set('Impossible de charger le profil. Réessayez dans un instant.');
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    this.auth.update(this.form.getRawValue().name.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Votre nom a été mis à jour.');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        console.error(
          '[ProfilePage] Enregistrement impossible',
          error instanceof HttpErrorResponse ? error.status : 'erreur inattendue',
        );
        this.error.set('Impossible d’enregistrer le profil. Réessayez dans un instant.');
      },
    });
  }
}

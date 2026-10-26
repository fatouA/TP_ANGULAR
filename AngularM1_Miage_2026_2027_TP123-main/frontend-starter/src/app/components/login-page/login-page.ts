import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly submitting = signal(false);
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submit(): void {
    // Marking every field touched makes its validation message visible on submit.
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    const values = this.form.getRawValue();
    this.auth.login(values.email.trim(), values.password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/tracks');
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        console.error(
          '[LoginPage] Échec de connexion',
          error instanceof HttpErrorResponse ? error.status : 'erreur inattendue',
        );

        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.error.set('Adresse e-mail ou mot de passe incorrect.');
        } else if (error instanceof HttpErrorResponse && error.status === 0) {
          this.error.set('Le serveur est injoignable. Réessayez dans un instant.');
        } else {
          this.error.set('La connexion a échoué. Vérifiez vos informations et réessayez.');
        }
      },
    });
  }
}

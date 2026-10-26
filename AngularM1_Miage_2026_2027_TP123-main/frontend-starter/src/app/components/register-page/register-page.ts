import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly submitting = signal(false);
  
  // These client-side rules mirror the minimum values accepted by the API.
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.pattern(/\S/)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  submit(): void {
    // Prevent sending invalid fields and duplicate submissions to the API.
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    const values = this.form.getRawValue();
    this.auth.register(values.name.trim(), values.email.trim(), values.password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/profile');
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        console.error(
          '[RegisterPage] Échec de l’inscription',
          error instanceof HttpErrorResponse ? error.status : 'erreur inattendue',
        );

        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.error.set('Cette adresse e-mail est déjà utilisée.');
        } else if (error instanceof HttpErrorResponse && error.status === 0) {
          this.error.set('Le serveur est injoignable. Réessayez dans un instant.');
        } else {
          this.error.set('L’inscription a échoué. Vérifiez les informations saisies et réessayez.');
        }
      },
    });
  }
}

import Swal  from 'sweetalert2';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
          Swal.fire({
          title: 'Registration Successful',
          text: 'Great to have you! Taking you to My Recipes',
          icon: 'success',
          width: '600px',
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF921C'
        }).then((result) => {
            if (result.isConfirmed) {
            this.router.navigate(['/recipes']);
          }
        });
      },
      error: (err) => {
       const errorMessage = err.error?.msg || 'Registration failed. Please try again.';

        Swal.fire({
          title: 'Oops!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF921C',
          width: '600px'

        });
      }
    });
  }
}

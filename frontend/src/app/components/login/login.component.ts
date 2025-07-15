import Swal from 'sweetalert2';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
           this.router.navigate(['/recipes']);
      },
      error: (err) => {
        const errorMessage =
          err.error?.msg || 'Login failed. Please try again.';

        Swal.fire({
          title: 'Oops!',
          text: errorMessage,
          icon: 'error',
          width: '600px',
          confirmButtonText: 'OK',
          confirmButtonColor: '#FF921C',
        });
      },
    });
  }
}

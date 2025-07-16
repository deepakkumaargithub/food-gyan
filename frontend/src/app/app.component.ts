import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Food Gyan';

  constructor(public authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
  }

  navigateToDiscoverRecipes(): void {
    this.router.navigate(['/recipes/discover']);
  }
  navigateToFavouriteRecipes(): void {
    this.router.navigate(['/recipes/favourites']);
  }
}

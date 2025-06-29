import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent implements OnInit {
  recipes: any[] = [];
  isLoading = true;
  currentUserId: string | null = null;
  isDiscoverRecipesPage: boolean = false;

  constructor(
    private recipeService: RecipeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();

    this.route.url.subscribe(segments => {

      this.isDiscoverRecipesPage = segments.some(s => s.path === 'discover');
      this.loadRecipes();
    });
  }

  loadRecipes(): void {
    this.isLoading = true;
    let recipesObservable: Observable<any[]>;

    if (this.isDiscoverRecipesPage) {

      recipesObservable = this.recipeService.getAllPublicRecipes();
    } else {

      recipesObservable = this.recipeService.getRecipes();
    }

    recipesObservable.subscribe({
      next: (data: any[]) => {
        this.recipes = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load recipes:', err);
        this.snackBar.open('Failed to load recipes', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  isRecipeOwner(recipe: any): boolean {
    return this.currentUserId === recipe.creatorId;
  }

  editRecipe(id: string): void {
    this.router.navigate(['/recipes/edit', id]);
  }

  deleteRecipe(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { title: 'Delete Recipe', message: 'Are you sure you want to delete this recipe?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recipeService.deleteRecipe(id).subscribe({
          next: () => {
            this.snackBar.open('Recipe deleted successfully', 'Close', { duration: 3000 });
            this.loadRecipes();
          },
          error: (err: any) => { 
            this.snackBar.open('Failed to delete recipe', 'Close', { duration: 3000 });
            console.error('Delete Recipe Error:', err);
          }
        });
      }
    });
  }
}

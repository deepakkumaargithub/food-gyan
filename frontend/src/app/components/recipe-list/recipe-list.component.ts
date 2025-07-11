import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent implements OnInit {
  recipes: any[] = [];
  currentUserId: string | null = null;
  isDiscoverRecipesPage: boolean = false;

  constructor(
    private recipeService: RecipeService,
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
    let recipesObservable: Observable<any[]>;

    if (this.isDiscoverRecipesPage) {

      recipesObservable = this.recipeService.getAllPublicRecipes();
    } else {

      recipesObservable = this.recipeService.getRecipes();
    }

    recipesObservable.subscribe({
      next: (data: any[]) => {
        this.recipes = data;
      },
      error: (err: any) => {
        console.error('Failed to load recipes:', err);
        Swal.fire({
          title: 'Opps!',
          text: 'Failed to load recipes',
          icon: 'error',
          showCancelButton: true,
          confirmButtonColor: '#FF921C',
          cancelButtonText: 'Cancel'

        })
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
    Swal.fire({
    title: 'Delete Recipe',
    text: 'Are you sure you want to delete this recipe?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#FF921C',
    cancelButtonColor: '#FF921C',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      this.recipeService.deleteRecipe(id).subscribe({
        next: () => {
          Swal.fire('Deleted!', 'Recipe deleted successfully.', 'success');
          this.loadRecipes();
        },
        error: (err: any) => {
          Swal.fire('Failed', 'Failed to delete recipe.', 'error');
          console.error('Delete Recipe Error:', err);
        }
      });
    }
  });
  }
}

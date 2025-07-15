import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { RecipeDetailModalComponent } from '../recipe-detail-modal/recipe-detail-modal.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RecipeDetailModalComponent
  ],
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss']
})
export class RecipeListComponent implements OnInit {
  recipes: any[] = [];
  currentUserId: string | null = null;
  isDiscoverRecipesPage: boolean = false;

  selectedRecipe: any = null;

  // NEW: Property to track the currently active filter
  currentFilter: string = 'All'; // Default filter: show all recipes

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();

    this.route.url.subscribe(segments => {
      this.isDiscoverRecipesPage = segments.some(s => s.path === 'discover');
      // MODIFIED: Call loadRecipes without arguments, it will now use this.currentFilter
      this.loadRecipes();
    });
  }

  // MODIFIED: loadRecipes no longer takes an argument; it uses this.currentFilter
  loadRecipes(): void {
    let recipesObservable: Observable<any[]>;

    if (this.isDiscoverRecipesPage) {
      // MODIFIED: Pass currentFilter to getAllPublicRecipes
      recipesObservable = this.recipeService.getAllPublicRecipes(this.currentFilter);
    } else {
      // MODIFIED: Pass currentUserId and currentFilter to getRecipes (for user's own recipes)
      if (this.currentUserId) { // Ensure currentUserId is available for 'My Recipes'
        recipesObservable = this.recipeService.getRecipes(this.currentUserId, this.currentFilter);
      } else {
        // If no user ID for 'My Recipes', clear recipes and return
        this.recipes = [];
        return;
      }
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
        });
      }
    });
  }

  // NEW: Method to handle filter button clicks
  filterRecipes(filterType: string): void {
    this.currentFilter = filterType; // Update the filter state
    this.loadRecipes(); // Reload recipes with the new filter applied
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
            // MODIFIED: Reload recipes using the current filter after deletion
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


  viewRecipeDetails(recipe: any): void {
    this.selectedRecipe = recipe;
  }


  closeModal(): void {
    this.selectedRecipe = null;
  }
}

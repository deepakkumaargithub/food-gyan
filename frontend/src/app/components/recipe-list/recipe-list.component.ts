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
  isFavouritesPage: boolean= false;


  selectedRecipe: any = null;

  currentFilter: string = 'All';

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
  this.currentUserId = this.authService.getCurrentUserId();

  this.route.url.subscribe(segments => {
    const pathSegments = segments.map(s => s.path);

    this.isDiscoverRecipesPage = pathSegments.includes('discover');
    this.isFavouritesPage = pathSegments.includes('favourites');

    this.loadRecipes();
  });
}



  loadRecipes(): void {
  let recipesObservable: Observable<any[]>;

  if (this.isDiscoverRecipesPage) {

    recipesObservable = this.recipeService.getAllPublicRecipes(this.currentFilter);

  } else if (this.isFavouritesPage) {

    recipesObservable = this.recipeService.getFavourites(this.currentFilter);

  } else {

    if (this.currentUserId) {
      recipesObservable = this.recipeService.getRecipes(this.currentUserId, this.currentFilter);
    } else {
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
        title: 'Oops!',
        text: 'Failed to load recipes',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#FF921C',
        cancelButtonText: 'Cancel'
      });
    }
  });
}



  filterRecipes(filterType: string): void {
    this.currentFilter = filterType;
    this.loadRecipes();
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


  viewRecipeDetails(recipe: any): void {
    this.selectedRecipe = recipe;
  }


  closeModal(): void {
    this.selectedRecipe = null;
  }

  toggleLike(recipe: any) {
  this.recipeService.toggleLike(recipe.id).subscribe({
    next: (res: any) => {
      recipe.liked = res.liked;
    },
    error: () => {
      alert('Error liking recipe');
    }
  });
}

}

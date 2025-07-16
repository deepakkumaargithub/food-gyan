import Swal from 'sweetalert2';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  templateUrl: './recipe-form.component.html',
  styleUrls: ['./recipe-form.component.scss'], 
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: string | null = null;
  pageTitle = 'Create Recipe';

  allIngredients: string[] = [];
  filteredIngredients: string[] = [];
  selectedIngredients: string[] = [];
  ingredientInput: string = '';

  showDropdown: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private recipeService: RecipeService
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      ingredients: [[] as string[], Validators.required],
      steps: ['', Validators.required],
      calories: ['', [Validators.required, Validators.min(0)]],
      protein: ['', [Validators.required, Validators.min(0)]],
      private: [false],
      type: ['', Validators.required],
      allergyInfo: [''],
    });
  }

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    if (this.recipeId) {
      this.isEditMode = true;
      this.pageTitle = 'Edit Recipe';
      this.recipeService.getRecipe(this.recipeId).subscribe({
        next: (data) => {
          this.recipeForm.patchValue(data);
          if (data.ingredients && Array.isArray(data.ingredients)) {
            this.selectedIngredients = [...data.ingredients];
            this.recipeForm.get('ingredients')?.setValue(this.selectedIngredients);
          }
        },
        error: () => {
          Swal.fire({
            title: 'Error',
            text: 'Failed to load recipe data.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF921C',
          }).then(() => this.router.navigate(['/recipes']));
        },
      });
    }

    this.loadIngredients(); // Fetch all available ingredients when form loads
  }

  onIngredientInputFocus() {
    this.showDropdown = true;
    this.filterIngredients();
    console.log('Input focused. showDropdown:', this.showDropdown, 'filteredIngredients:', this.filteredIngredients);
  }

  onIngredientInputBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      console.log('Input blurred. showDropdown:', this.showDropdown);
    }, 150);
  }

  seedTopIngredients() {
    this.recipeService.seedIngredients().subscribe({
      next: (res) => {
        this.loadIngredients(); // Reload ingredients after seeding
      },
      error: () => {
        console.log("Failed : Could not laod ingredients in drop down menu")
      }
    });
  }

  loadIngredients() {
    this.recipeService.getAllIngredients().subscribe(data => {
      this.allIngredients = data;
      console.log('All ingredients loaded:', this.allIngredients);
      if (this.allIngredients.length === 0) {
        this.seedTopIngredients();
      }
      if (this.showDropdown) { // If dropdown is already open, refresh its content
        this.filterIngredients();
      }
    });
  }

  filterIngredients() {
    const search = this.ingredientInput.toLowerCase();
    this.filteredIngredients = this.allIngredients.filter(ing =>
      ing.toLowerCase().includes(search) && !this.selectedIngredients.includes(ing)
    );
    console.log('Filtering ingredients for:', this.ingredientInput, 'Filtered results:', this.filteredIngredients);
    // Show dropdown only if there are results OR if input is empty and focused (show all available)
    this.showDropdown = this.filteredIngredients.length > 0 && (this.ingredientInput.length > 0 || document.activeElement === document.getElementById('ingredientInput'));
  }

  selectIngredient(ingredient: string) {
    if (!this.selectedIngredients.includes(ingredient)) {
      this.selectedIngredients.push(ingredient);
      this.recipeForm.get('ingredients')?.setValue(this.selectedIngredients);
      this.recipeForm.get('ingredients')?.markAsDirty();
      this.recipeForm.get('ingredients')?.markAsTouched();
    }
    this.ingredientInput = '';
    this.filteredIngredients = [];
    this.showDropdown = false;
    console.log('Selected:', ingredient, 'Current selected:', this.selectedIngredients);
  }

  addIngredient(newIngredient: string) {
    const value = newIngredient.trim();
    if (value && !this.selectedIngredients.includes(value)) {
      this.selectedIngredients.push(value);
      if (!this.allIngredients.includes(value)) {
        this.allIngredients.push(value); // Add to master list for future suggestions
      }
      this.recipeForm.get('ingredients')?.setValue(this.selectedIngredients);
      this.recipeForm.get('ingredients')?.markAsDirty();
      this.recipeForm.get('ingredients')?.markAsTouched();
    }
    this.ingredientInput = '';
    this.filteredIngredients = [];
    this.showDropdown = false;
    console.log('Added:', newIngredient, 'Current selected:', this.selectedIngredients);
  }

  removeIngredient(ingredient: string) {
    const index = this.selectedIngredients.indexOf(ingredient);
    if (index >= 0) {
      this.selectedIngredients.splice(index, 1);
      this.recipeForm.get('ingredients')?.setValue(this.selectedIngredients);
      this.recipeForm.get('ingredients')?.markAsDirty();
      this.recipeForm.get('ingredients')?.markAsTouched();
    }
    console.log('Removed:', ingredient, 'Current selected:', this.selectedIngredients);
    // IMPORTANT: After removing, re-filter to show it in the available list if input is focused
    if (document.activeElement === document.getElementById('ingredientInput')) {
      this.onIngredientInputFocus(); // Re-trigger focus logic to update dropdown
    }
  }

  onSubmit(): void {
    this.recipeForm.get('ingredients')?.markAsTouched();
    this.recipeForm.get('ingredients')?.markAsDirty();

    if (this.recipeForm.invalid) {
      console.error('Form is invalid. Errors:', this.recipeForm.errors);
      Object.keys(this.recipeForm.controls).forEach(key => {
        const controlErrors = this.recipeForm.get(key)?.errors;
        if (controlErrors) {
          console.log('Control ' + key + ' has errors: ', controlErrors);
        }
      });
      return;
    }

    const recipeData = {
      ...this.recipeForm.value,
      ingredients: this.selectedIngredients
    };

    if (this.isEditMode && this.recipeId) {
      this.recipeService.updateRecipe(this.recipeId, recipeData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Recipe Updated',
            text: 'Your recipe has been successfully updated.',
            icon: 'success',
            width: '600px',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF921C',
          }).then(() => this.router.navigate(['/recipes']));
        },
        error: (err) => {
          const errorMessage = err.error?.msg || 'Failed to update recipe';
          Swal.fire({
            title: 'Update Failed',
            text: errorMessage,
            icon: 'error',
            width: '600px',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF921C',
          });
        },
      });
    } else {
      this.recipeService.createRecipe(recipeData).subscribe({
        next: () => {
          Swal.fire({
            title: 'Recipe Created!',
            text: 'Redirecting to My Recipes.',
            icon: 'success',
            width: '600px',
            confirmButtonText: 'OK',
            confirmButtonColor: '#FF921C',
          }).then(() => this.router.navigate(['/recipes']));
        },
        error: (err) => {
          const errorMessage = err.error?.msg || 'Failed to create recipe';
          Swal.fire({
            title: 'Creation Failed',
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
}

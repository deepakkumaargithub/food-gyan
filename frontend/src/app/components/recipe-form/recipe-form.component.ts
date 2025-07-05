import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  templateUrl: './recipe-form.component.html',
  styleUrls: ['../login/login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule
  ]
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: string | null = null;
  isLoading = false;
  pageTitle = 'Create Recipe';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private recipeService: RecipeService,
    private snackBar: MatSnackBar
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      ingredients: ['', Validators.required],
      steps: ['', Validators.required],
      private:['', Validators.required],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      allergyInfo: ['']
    });
  }

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    if (this.recipeId) {
      this.isEditMode = true;
      this.pageTitle = 'Edit Recipe';
      this.isLoading = true;
      this.recipeService.getRecipe(this.recipeId).subscribe({
        next: (data) => {
          this.recipeForm.patchValue(data);
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Failed to load recipe data', 'Close', { duration: 3000 });
          this.router.navigate(['/recipes']);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.recipeForm.invalid) {
      return;
    }
    this.isLoading = true;
    const recipeData = this.recipeForm.value;

    if (this.isEditMode && this.recipeId) {
      this.recipeService.updateRecipe(this.recipeId, recipeData).subscribe({
        next: () => {
          this.snackBar.open('Recipe updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/recipes']);
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.error?.msg || 'Failed to update recipe';
          this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        }
      });
    } else {
      this.recipeService.createRecipe(recipeData).subscribe({
        next: () => {
          this.snackBar.open('Recipe created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/recipes']);
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.error?.msg || 'Failed to create recipe';
          this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        }
      });
    }
  }
}

import Swal from 'sweetalert2';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  templateUrl: './recipe-form.component.html',
  styleUrls: ['./recipe-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: string | null = null;
  pageTitle = 'Create Recipe';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private recipeService: RecipeService
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      ingredients: ['', Validators.required],
      steps: ['', Validators.required],
      calories: ['', [Validators.required, Validators.min(0)]],
      protein: ['', [Validators.required, Validators.min(0)]],
      private: [''],
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
  }

  onSubmit(): void {
    if (this.recipeForm.invalid) return;

    const recipeData = this.recipeForm.value;

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

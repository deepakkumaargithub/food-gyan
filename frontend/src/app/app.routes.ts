import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {

    path: 'recipes',
    component: RecipeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'recipes/discover',
    component: RecipeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'recipes/new',
    component: RecipeFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'recipes/edit/:id',
    component: RecipeFormComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  { path: '**', redirectTo: '/recipes' }
];

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // CHANGED: Import HttpParams
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  // NO CHANGE: Keeping apiUrl as 'http://localhost:3000/api/recipes' as per your request.
  // This means:
  // - getRecipes() hits /api/recipes (for current user's recipes)
  // - getAllPublicRecipes() hits /api/recipes/all (for public recipes)
  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // CHANGED: getRecipes now accepts userId and an optional typeFilter
  // It still targets the base /api/recipes endpoint, expecting the backend
  // to implicitly filter by the authenticated user and then by type.
  getRecipes(userId: string, typeFilter?: string): Observable<any[]> {
    let params = new HttpParams();
    // NEW: Add 'type' query parameter if a specific filter is provided and not 'All'
    if (typeFilter && typeFilter !== 'All') {
      params = params.append('type', typeFilter);
    }
    // CHANGED: Pass HttpParams to the GET request
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // CHANGED: getAllPublicRecipes now accepts an optional typeFilter
  // It targets the /api/recipes/all endpoint, expecting the backend to filter public recipes by type.
  getAllPublicRecipes(typeFilter?: string): Observable<any[]> {
    let params = new HttpParams();
    // NEW: Add 'type' query parameter if a specific filter is provided and not 'All'
    if (typeFilter && typeFilter !== 'All') {
      params = params.append('type', typeFilter);
    }
    // CHANGED: Pass HttpParams to the GET request
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }

  // NO CHANGES: Existing methods remain untouched
  getRecipe(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createRecipe(recipe: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, recipe);
  }

  updateRecipe(id: string, recipe: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, recipe);
  }

  deleteRecipe(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // CHANGED: Import HttpParams
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getRecipes(userId: string, typeFilter?: string): Observable<any[]> {
    let params = new HttpParams();

    if (typeFilter && typeFilter !== 'All') {
      params = params.append('type', typeFilter);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getFavourites(typeFilter?: string): Observable<any[]> {
  let url = `${this.apiUrl}/favourites`;

  const params = typeFilter && typeFilter !== 'All' ? { params: { type: typeFilter } } : {};

  return this.http.get<any[]>(url, params);
}



  getAllPublicRecipes(typeFilter?: string): Observable<any[]> {
    let params = new HttpParams();
    if (typeFilter && typeFilter !== 'All') {
      params = params.append('type', typeFilter);
    }
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }

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

  getAllIngredients(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/ingredients`);
  }
  seedIngredients(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seed-ingredients`, {});
  }
  toggleLike(recipeId: string) {
    return this.http.post<{ liked: boolean }>(`${this.apiUrl}/toggle-like`, {
      recipeId,
    });
  }

}

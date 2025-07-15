import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-detail-modal.component.html',
  styleUrl: './recipe-detail-modal.component.scss'
})
export class RecipeDetailModalComponent {

  @Input() recipe: any;
  @Output() close = new EventEmitter<void>();

  closeModal(){
    this.close.emit();
  }


  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    this.closeModal();
  }
  onBackdropClick(event: MouseEvent) {
  
  if ((event.target as HTMLElement).classList.contains('modal-wrapper')) {
    this.closeModal();
  }
}


}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DeckService } from '../../core/services/deck.service';
import { Card } from '../../core/models/card.model';

@Component({
  selector: 'app-deck-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-view.component.html',
  styleUrls: ['./deck-view.component.css'],
})
export class DeckViewComponent implements OnInit, OnDestroy {
  deck: Card[] = [];
  drawn: Card[] = [];
  points = 0;

  private subs = new Subscription();

  constructor(private deckService: DeckService) {}

  ngOnInit(): void {
    this.subs.add(
      this.deckService.deck$.subscribe((d) => (this.deck = d))
    );
    this.subs.add(
      this.deckService.drawn$.subscribe((d) => {
        this.drawn = d;
        this.points = this.deckService.drawnPoints;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onReset(jokers: number): void {
    this.deckService.resetDeck(jokers);
  }

  onShuffle(): void {
    this.deckService.shuffle();
  }

  onDraw(count: number): void {
    this.deckService.draw(count);
  }

  onSort(): void {
    this.deckService.sortDrawn();
  }

  onUndo(): void {
    this.deckService.undo();
  }

  onRedo(): void {
    this.deckService.redo();
  }
}

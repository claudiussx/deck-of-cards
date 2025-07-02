/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DeckService } from '../../core/services/deck.service';
import { Card, StandardCard, JokerCard } from '../../core/models/card.model';

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

  get canUndo(): boolean {
    // You’ll need to expose the history length from your service.
    return this.deckService.canUndo();  
  }

  get canRedo(): boolean {
    return this.deckService.canRedo();
  }

  get canDraw(): boolean {
    return this.deck.length > 0;
  }
  

  getCardImage(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      const path = `assets/cards/${jc.id === 1 ? 'red_joker' : 'black_joker'}.png`;
      console.log('Joker path:', path);
      return path;
    }

    const sc = card as StandardCard;
    const rank = sc.rank.toLowerCase();
    const suit = sc.suit.toLowerCase();
    const path = `assets/cards/${rank}_of_${suit}.png`;
    console.log('Standard path:', path);
    return path;
  }

  /** human readable label for test */
  getCardLabel(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      return `Joker #${jc.id}`;
    }
    const sc = card as StandardCard;
    return `${sc.rank} of ${sc.suit}`;
  }
}

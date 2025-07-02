/* eslint-disable @angular-eslint/prefer-inject */
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef
} from '@angular/core';
import { CommonModule }                   from '@angular/common';
import { Subscription }                   from 'rxjs';
import { DeckService }                    from '../../core/services/deck.service';
import { Card, StandardCard, JokerCard }  from '../../core/models/card.model';

@Component({
  selector: 'app-deck-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-view.component.html',
  styleUrls: ['./deck-view.component.css'],
})
export class DeckViewComponent implements OnInit, OnDestroy {
  @ViewChild('deckBack', { read: ElementRef }) 
  deckBack!: ElementRef<HTMLElement>;

  @ViewChildren('cardEls', { read: ElementRef })
  cardEls!: QueryList<ElementRef<HTMLElement>>;

  deck: Card[]   = [];
  drawn: Card[]  = [];
  points = 0;
  isShuffling = false;

  private subs = new Subscription();

  constructor(private deckService: DeckService) {}

  ngOnInit(): void {
    this.subs.add(
      this.deckService.deck$.subscribe(d => (this.deck = d))
    );
    this.subs.add(
      this.deckService.drawn$.subscribe(d => {
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
    this.isShuffling = true;
    this.deckService.shuffle();
    setTimeout(() => (this.isShuffling = false), 500);
  }

  onDraw(count: number): void {
   
    this.deckService.draw(count);

    setTimeout(() => {
      if (!this.deckBack) return;
      const deckRect = this.deckBack.nativeElement.getBoundingClientRect();
      const allEls  = this.cardEls.toArray();
      const newEls  = allEls.slice(-count);

    newEls.forEach(elRef => {
        const el = elRef.nativeElement;
        const finalRect = el.getBoundingClientRect();

        const dx = deckRect.left - finalRect.left;
        const dy = deckRect.top  - finalRect.top;
        el.style.transform    = `translate(${dx}px, ${dy}px) scale(0.8)`;
        el.style.opacity      = '0';
        el.style.transition   = 'none';

        requestAnimationFrame(() => {
          el.style.transition = 'transform 400ms ease-out, opacity 400ms ease-out';
          el.style.transform  = '';
          el.style.opacity    = '1';
        });
      });
    }, 0);
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
    return this.deckService.canUndo();
  }
  get canRedo(): boolean {
    return this.deckService.canRedo();
  }
  get canDraw(): boolean {
    return this.deck.length > 0;
  }

  trackByCard(_idx: number, card: Card): string {
    return card.type === 'joker'
      ? `joker-${(card as JokerCard).id}`
      : `${(card as StandardCard).suit}-${(card as StandardCard).rank}`;
  }

  getCardImage(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      return `assets/cards/${jc.id === 1 ? 'red_joker' : 'black_joker'}.png`;
    }
    const sc = card as StandardCard;
    return `assets/cards/${sc.rank.toLowerCase()}_of_${sc.suit.toLowerCase()}.png`;
  }

  getCardLabel(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      return `Joker #${jc.id}`;
    }
    const sc = card as StandardCard;
    return `${sc.rank} of ${sc.suit}`;
  }
}

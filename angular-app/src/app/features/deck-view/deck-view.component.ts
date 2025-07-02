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
import { ChangeDetectorRef }              from '@angular/core';

@Component({
  selector: 'app-deck-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-view.component.html',
  styleUrls: ['./deck-view.component.css'],
})
export class DeckViewComponent implements OnInit, OnDestroy {
  // Reference to the deck back element in the template
  @ViewChild('deckBack', { read: ElementRef }) 
  deckBack!: ElementRef<HTMLElement>;

  // References to all card elements currently rendered
  @ViewChildren('cardEls', { read: ElementRef })
  cardEls!: QueryList<ElementRef<HTMLElement>>;

  // The current deck of cards (cards not yet drawn)
  deck: Card[] = [];
  // The cards that have been drawn from the deck
  drawn: Card[] = [];
  // The total points of the drawn cards
  points = 0;
  // Whether the deck is currently being shuffled (for animation)
  isShuffling = false;

  // Holds all subscriptions so we can clean up later
  private subs = new Subscription();

  // Inject the deck service and change detector
  constructor(private deckService: DeckService, private cd: ChangeDetectorRef) {}

  // Subscribe to deck and drawn card changes when the component is initialized
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

  // Unsubscribe from all observables when the component is destroyed
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Reset the deck with a given number of jokers
  onReset(jokers: number): void {
    this.deckService.resetDeck(jokers);
  }

  // Shuffle the deck and show a shuffling animation for 500ms
  onShuffle(): void {
    this.isShuffling = true;
    this.deckService.shuffle();
    setTimeout(() => (this.isShuffling = false), 500);
  }

  // Draw a number of cards from the deck, animate them, and handle joker effects
  onDraw(count: number): void {
    // Get the position of the deck back for animation
    const deckRect = this.deckBack.nativeElement.getBoundingClientRect();
    // Draw cards from the service
    this.deckService.draw(count);
    // Update the view to reflect new cards
    this.cd.detectChanges();

    // Get all card elements and the ones just drawn
    const allEls = this.cardEls.toArray();
    const newEls = allEls.slice(-count);
    const newCards = this.drawn.slice(-count);

    // Instantly move new cards to the deck back position and hide them
    newEls.forEach(elRef => {
      const el = elRef.nativeElement;
      const finalRect = el.getBoundingClientRect();
      const dx = deckRect.left - finalRect.left;
      const dy = deckRect.top - finalRect.top;

      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px) scale(0.8)`;
      el.style.opacity = '0';
    });

    // Animate cards to their final position and show them
    requestAnimationFrame(() => {
      newEls.forEach((elRef, i) => {
        const el = elRef.nativeElement;
        const card = newCards[i];

        el.style.transition = 'transform 400ms ease-out, opacity 400ms ease-out';
        el.style.transform = '';
        el.style.opacity = '1';

        // If the card is a joker, add a special effect
        if (card.type === 'joker') {
          setTimeout(() => {
            el.classList.add('joker-effect');
            setTimeout(() => el.classList.remove('joker-effect'), 800);
          }, 400);
        }
      });
    });
  }

  // Sort the drawn cards (e.g., by suit and rank)
  onSort(): void {
    this.deckService.sortDrawn();
  }

  // Undo the last draw or action
  onUndo(): void {
    this.deckService.undo();
  }

  // Redo the last undone action
  onRedo(): void {
    this.deckService.redo();
  }

  // Whether undo is possible
  get canUndo(): boolean {
    return this.deckService.canUndo();
  }
  // Whether redo is possible
  get canRedo(): boolean {
    return this.deckService.canRedo();
  }
  // Whether there are cards left to draw
  get canDraw(): boolean {
    return this.deck.length > 0;
  }

  // Track cards by a unique identifier for efficient rendering
  trackByCard(_idx: number, card: Card): string {
    return card.type === 'joker'
      ? `joker-${(card as JokerCard).id}`
      : `${(card as StandardCard).suit}-${(card as StandardCard).rank}`;
  }

  // Get the image path for a card
  getCardImage(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      return `assets/cards/${jc.id === 1 ? 'red_joker' : 'black_joker'}.png`;
    }
    const sc = card as StandardCard;
    return `assets/cards/${sc.rank.toLowerCase()}_of_${sc.suit.toLowerCase()}.png`;
  }

  // Get a human-readable label for a card
  getCardLabel(card: Card): string {
    if (card.type === 'joker') {
      const jc = card as JokerCard;
      return `Joker #${jc.id}`;
    }
    const sc = card as StandardCard;
    return `${sc.rank} of ${sc.suit}`;
  }
}

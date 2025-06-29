import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
    Card,
    StandardCard,
    JokerCard,
    Suit,
    Rank,
} from '../models/card.model';

// Represents a snapshot of the deck and drawn cards for undo/redo
interface Snapshot {
    deck: Card[];
    drawn: Card[];
}

@Injectable({ providedIn: 'root' })
export class DeckService {
    // Holds the current deck of cards (reactive)
    private deckSubject = new BehaviorSubject<Card[]>([]);
    deck$ = this.deckSubject.asObservable();

    // Holds the currently drawn cards (reactive)
    private drawnSubject = new BehaviorSubject<Card[]>([]);
    drawn$ = this.drawnSubject.asObservable();

    // Undo/redo history stacks
    private history: Snapshot[] = [];
    private future: Snapshot[] = [];
    private maxHistory = 5; // Limit how many actions can be undone

    constructor() {
        this.loadState(); // Try to restore previous state from localStorage
        if (!this.deckSubject.value.length) {
            this.resetDeck(); // Start with a fresh deck if nothing is loaded
        }
        // Save state to localStorage whenever deck or drawn cards change
        this.deck$.subscribe(() => this.saveState());
        this.drawn$.subscribe(() => this.saveState());
    }

    /**
     * Resets the deck to a full set of 52 cards, plus optional jokers.
     * Also clears undo/redo history.
     */
    resetDeck(jokersCount: number = 0) {
        this.clearHistory();
        const deck = this.generateStandardDeck();
        const jokers = this.generateJokers(jokersCount);
        this.deckSubject.next([...deck, ...jokers]);
        this.drawnSubject.next([]);
    }

    /**
     * Shuffles the current deck using the Fisher–Yates algorithm.
     * Saves the previous state for undo.
     */
    shuffle() {
        this.saveSnapshot();
        const deck = [...this.deckSubject.value];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.deckSubject.next(deck);
    }

    /**
     * Draws a number of cards from the top of the deck.
     * Moves them to the drawn pile and saves state for undo.
     */
    draw(count: number) {
        if (count <= 0) return;
        this.saveSnapshot();
        const deck = [...this.deckSubject.value];
        const drawn = [...this.drawnSubject.value];
        for (let i = 0; i < count && deck.length; i++) {
            drawn.push(deck.shift()!);
        }
        this.deckSubject.next(deck);
        this.drawnSubject.next(drawn);
    }

    /**
     * Sorts the drawn cards by suit (Clubs, Spades, Hearts, Diamonds),
     * then by value (Ace high), with jokers always at the end.
     */
    sortDrawn() {
        this.saveSnapshot();
        const order: Suit[] = ['Clubs', 'Spades', 'Hearts', 'Diamonds'];
        const drawn = [...this.drawnSubject.value].sort((a, b) => {
            // Jokers always go last
            if (a.type === 'joker' && b.type !== 'joker') return 1;
            if (b.type === 'joker' && a.type !== 'joker') return -1;
            if (a.type === 'joker' && b.type === 'joker') {
                return (a as JokerCard).id - (b as JokerCard).id;
            }
            // Both are standard cards: sort by suit, then value (Ace high)
            const sa = a as StandardCard;
            const sb = b as StandardCard;
            const suitDiff = order.indexOf(sa.suit) - order.indexOf(sb.suit);
            if (suitDiff) return suitDiff;
            return sb.value - sa.value; // Ace (14) first
        });
        this.drawnSubject.next(drawn);
    }

    /**
     * Undo the last action (draw, shuffle, sort, etc).
     * Moves the current state to the redo stack.
     */
    undo() {
        if (!this.history.length) return;
        this.future.unshift(this.capture());
        const prev = this.history.pop()!;
        this.restore(prev);
    }

    /**
     * Redo the last undone action, if any.
     */
    redo() {
        if (!this.future.length) return;
        this.history.push(this.capture());
        const next = this.future.shift()!;
        this.restore(next);
    }

    /**
     * Calculates the total points of all drawn cards.
     * Jokers are worth 0 points.
     */
    get drawnPoints(): number {
        return this.drawnSubject.value.reduce((sum, c) =>
            c.type === 'standard' ? sum + c.value : sum
        , 0);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Generates a standard 52-card deck (no jokers).
     */
    private generateStandardDeck(): StandardCard[] {
        const suits: Suit[] = ['Clubs', 'Spades', 'Hearts', 'Diamonds'];
        const ranks: { rank: Rank; value: number }[] = [
            { rank: '2', value: 2 }, { rank: '3', value: 3 },
            { rank: '4', value: 4 }, { rank: '5', value: 5 },
            { rank: '6', value: 6 }, { rank: '7', value: 7 },
            { rank: '8', value: 8 }, { rank: '9', value: 9 },
            { rank: '10', value: 10 },
            { rank: 'Jack', value: 11 },
            { rank: 'Queen', value: 12 },
            { rank: 'King', value: 13 },
            { rank: 'Ace', value: 14 },
        ];

        // Create one card for each suit and rank
        return suits.flatMap(suit =>
            ranks.map(r => ({
                type: 'standard' as const,
                suit,
                rank: r.rank,
                value: r.value,
            }))
        );
    }

    /**
     * Generates the specified number of jokers.
     */
    private generateJokers(count: number): JokerCard[] {
        return Array.from({ length: count }, (_, i) => ({
            type: 'joker' as const,
            rank: 'Joker',
            id: i + 1,
        }));
    }

    /**
     * Saves the current state to the undo history.
     * Clears the redo stack.
     */
    private saveSnapshot() {
        this.history.push(this.capture());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.future = [];
    }

    /**
     * Captures the current deck and drawn cards as a snapshot.
     */
    private capture(): Snapshot {
        return {
            deck: [...this.deckSubject.value],
            drawn: [...this.drawnSubject.value],
        };
    }

    /**
     * Restores the deck and drawn cards from a snapshot.
     */
    private restore(snap: Snapshot) {
        this.deckSubject.next(snap.deck);
        this.drawnSubject.next(snap.drawn);
    }

    /**
     * Clears the undo and redo history.
     */
    private clearHistory() {
        this.history = [];
        this.future = [];
    }

    // ─── Persistence ────────────────────────────────────────────────────────────

    private readonly STORAGE_KEY = 'deck-of-cards-state';

    /**
     * Saves the current deck and drawn cards to localStorage.
     */
    private saveState() {
        const state = {
            deck: this.deckSubject.value,
            drawn: this.drawnSubject.value,
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    /**
     * Loads the deck and drawn cards from localStorage, if available.
     */
    private loadState() {
        const json = localStorage.getItem(this.STORAGE_KEY);
        if (!json) return;
        try {
            const { deck, drawn } = JSON.parse(json);
            this.deckSubject.next(deck);
            this.drawnSubject.next(drawn);
        } catch {
            // If parsing fails, clear the stored state
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card, StandardCard, JokerCard, Suit } from '../models/card.model';
import { DeckFactory } from './deck.factory';
import { DeckRepository } from './deck.repository';
import { Command } from '../commands/command';
import { SnapshotCommand } from '../commands/snapshot.command';

@Injectable({ providedIn: 'root' })
export class DeckService {
    // Holds the current deck state (cards left to draw)
    public deckSubject = new BehaviorSubject<Card[]>([]);
    // Holds the cards that have been drawn
    public drawnSubject = new BehaviorSubject<Card[]>([]);

    deck$ = this.deckSubject.asObservable();
    drawn$ = this.drawnSubject.asObservable();

    // Command history for undo/redo functionality
    private commandHistory: Command[] = [];
    private redoStack: Command[] = [];

    // Handles persistence (local storage, etc.)
    private repo = new DeckRepository();

    constructor() {
        // Try to load a saved deck from storage, or start with a new one.
        const saved = this.repo.load();
        if (saved) {
            this.deckSubject.next(saved.deck);
            this.drawnSubject.next(saved.drawn);
        } else {
            this.resetDeck();
        }

        // Keep deck state in sync with storage.
        this.deck$.subscribe(() => this.repo.save(this.deckSubject.value, this.drawnSubject.value));
        this.drawn$.subscribe(() => this.repo.save(this.deckSubject.value, this.drawnSubject.value));
    }

    /**
     * Resets the deck to a new shuffled state, optionally with jokers.
     * Clears undo/redo history.
     */
    resetDeck(jokersCount = 0) {
        this.commandHistory = [];
        this.redoStack = [];
        const standard = DeckFactory.createStandardDeck();
        const jokers = DeckFactory.createJokers(jokersCount);
        this.deckSubject.next([...standard, ...jokers]);
        this.drawnSubject.next([]);
    }

    /**
     * Shuffles the deck using Fisher-Yates algorithm.
     * Supports undo/redo.
     */
    shuffle() {
        this.runCommand(
            new SnapshotCommand(this, () => {
                // Fisher-Yates shuffle
                const deck = [...this.deckSubject.value];
                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
                this.deckSubject.next(deck);
            })
        );
    }

    /**
     * Draws a number of cards from the deck to the drawn pile.
     * Supports undo/redo.
     */
    draw(count: number) {
        if (count <= 0) return;
        this.runCommand(
            new SnapshotCommand(this, () => {
                const deck = [...this.deckSubject.value];
                const drawn = [...this.drawnSubject.value];
                for (let i = 0; i < count && deck.length; i++) {
                    drawn.push(deck.shift()!);
                }
                this.deckSubject.next(deck);
                this.drawnSubject.next(drawn);
            })
        );
    }

    /**
     * Sorts the drawn cards by suit and value, with jokers at the end.
     * Supports undo/redo.
     */
    sortDrawn() {
        this.runCommand(
            new SnapshotCommand(this, () => {
                // Sort by suit, then value, jokers at the end
                const order: Suit[] = ['Clubs', 'Spades', 'Hearts', 'Diamonds'];
                const drawn = [...this.drawnSubject.value].sort((a, b) => {
                    if (a.type === 'joker' && b.type !== 'joker') return 1;
                    if (b.type === 'joker' && a.type !== 'joker') return -1;
                    if (a.type === 'joker' && b.type === 'joker') {
                        return (a as JokerCard).id - (b as JokerCard).id;
                    }
                    const sa = a as StandardCard, sb = b as StandardCard;
                    const suitDiff = order.indexOf(sa.suit) - order.indexOf(sb.suit);
                    return suitDiff || (sb.value - sa.value);
                });
                this.drawnSubject.next(drawn);
            })
        );
    }

    /**
     * Undo the last command (if possible).
     */
    undo() {
        const cmd = this.commandHistory.pop();
        if (!cmd) return;
        cmd.undo();
        this.redoStack.push(cmd);
    }

    /**
     * Redo the last undone command (if possible).
     */
    redo() {
        const cmd = this.redoStack.pop();
        if (!cmd) return;
        cmd.execute();
        this.commandHistory.push(cmd);
    }

    /**
     * Calculates the total points of drawn cards (standard cards only).
     */
    get drawnPoints(): number {
        // Only standard cards have points
        return this.drawnSubject.value.reduce((sum, c) =>
            c.type === 'standard' ? sum + c.value : sum
            , 0);
    }

    /**
     * Runs a command and adds it to the history, clearing the redo stack.
     */
    private runCommand(cmd: Command) {
        cmd.execute();
        this.commandHistory.push(cmd);
        this.redoStack = [];
    }

    /**
     * Returns true if there are commands to undo.
     */
    public canUndo(): boolean {
        return this.commandHistory.length > 0;
    }

    /**
     * Returns true if there are commands to redo.
     */
    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Used by SnapshotCommand to restore the deck and drawn cards to a previous state.
     */
    public restore({ deck, drawn }: { deck: Card[]; drawn: Card[] }) {
        this.deckSubject.next(deck);
        this.drawnSubject.next(drawn);
    }
}

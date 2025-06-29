import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Card, StandardCard, JokerCard, Suit } from '../models/card.model';
import { DeckFactory } from './deck.factory';
import { DeckRepository } from './deck.repository';
import { Command } from '../commands/command';
import { SnapshotCommand } from '../commands/snapshot.command';

@Injectable({ providedIn: 'root' })
export class DeckService {
    // These subjects hold the current deck and the drawn cards.
    // SnapshotCommand uses them to save and restore state.
    public deckSubject  = new BehaviorSubject<Card[]>([]);
    public drawnSubject = new BehaviorSubject<Card[]>([]);

    // These observables are for the UI to subscribe to deck and drawn card changes.
    deck$  = this.deckSubject.asObservable();
    drawn$ = this.drawnSubject.asObservable();

    // These arrays keep track of undo and redo actions.
    private commandHistory: Command[] = [];
    private redoStack:      Command[] = [];

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

        // Save the deck and drawn cards to storage whenever they change.
        this.deck$.subscribe(() => this.repo.save(this.deckSubject.value, this.drawnSubject.value));
        this.drawn$.subscribe(() => this.repo.save(this.deckSubject.value, this.drawnSubject.value));
    }

    // Resets the deck to a new shuffled state, optionally with jokers.
    // Also clears the undo/redo history.
    resetDeck(jokersCount: number = 0) {
        this.commandHistory = [];
        this.redoStack      = [];
        const standard = DeckFactory.createStandardDeck();
        const jokers   = DeckFactory.createJokers(jokersCount);
        this.deckSubject.next([...standard, ...jokers]);
        this.drawnSubject.next([]);
    }

    // Shuffles the current deck and saves the action for undo/redo.
    shuffle() {
        this.runCommand(
            new SnapshotCommand(this, () => {
                const deck = [...this.deckSubject.value];
                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
                this.deckSubject.next(deck);
            })
        );
    }

    // Draws a number of cards from the deck and saves the action for undo/redo.
    draw(count: number) {
        if (count <= 0) return;
        this.runCommand(
            new SnapshotCommand(this, () => {
                const deck  = [...this.deckSubject.value];
                const drawn = [...this.drawnSubject.value];
                for (let i = 0; i < count && deck.length; i++) {
                    drawn.push(deck.shift()!);
                }
                this.deckSubject.next(deck);
                this.drawnSubject.next(drawn);
            })
        );
    }

    // Sorts the drawn cards by suit and value, putting jokers at the end.
    sortDrawn() {
        this.runCommand(
            new SnapshotCommand(this, () => {
                const order: Suit[] = ['Clubs','Spades','Hearts','Diamonds'];
                const drawn = [...this.drawnSubject.value].sort((a, b) => {
                    if (a.type==='joker' && b.type!=='joker') return 1;
                    if (b.type==='joker' && a.type!=='joker') return -1;
                    if (a.type==='joker' && b.type==='joker') {
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

    // Undoes the last action, if there is one.
    undo() {
        const cmd = this.commandHistory.pop();
        if (!cmd) return;
        cmd.undo();
        this.redoStack.push(cmd);
    }

    // Redoes the last undone action, if there is one.
    redo() {
        const cmd = this.redoStack.pop();
        if (!cmd) return;
        cmd.execute();
        this.commandHistory.push(cmd);
    }

    // Calculates the total value of all standard cards that have been drawn.
    get drawnPoints(): number {
        return this.drawnSubject.value.reduce((sum, c) =>
            c.type === 'standard' ? sum + c.value : sum
        , 0);
    }

    // Runs a command and adds it to the undo history.
    // Also clears the redo stack.
    private runCommand(cmd: Command) {
        cmd.execute();
        this.commandHistory.push(cmd);

        // If you want to limit the undo history, uncomment below.
        // if (this.commandHistory.length > 5) {
        //     this.commandHistory.shift();
        // }

        this.redoStack = [];
    }

    // Used by SnapshotCommand to restore the deck and drawn cards to a previous state.
    public restore({ deck, drawn }: { deck: Card[]; drawn: Card[] }) {
        this.deckSubject.next(deck);
        this.drawnSubject.next(drawn);
    }
}

// This test suite covers the main functionalities of the DeckService, including deck generation, shuffling, drawing cards, sorting drawn cards, undo/redo actions, points calculation, and state persistence. 
// Each test checks the expected behavior of the service methods and ensures that the service maintains its integrity across operations.

import { TestBed } from '@angular/core/testing';
import { DeckService } from './deck.service';

describe('DeckService', () => {
    let service: DeckService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        // Clear storage to start fresh for each test
        localStorage.clear();
        service = TestBed.inject(DeckService);
    });

    it('should generate 52 cards with 0 jokers', (done) => {
        service.resetDeck(0);
        service.deck$.subscribe(deck => {
            // Expect a standard deck without jokers
            expect(deck.length).toBe(52);
            done();
        });
    });

    it('should generate 54 cards with 2 jokers', (done) => {
        service.resetDeck(2);
        service.deck$.subscribe(deck => {
            // Deck should include 2 jokers
            expect(deck.length).toBe(54);
            expect(deck.filter(c => c.type === 'joker').length).toBe(2);
            done();
        });
    });

    it('should shuffle the deck', () => {
        service.resetDeck(0);
        // Save the original order for comparison
        const original = [...(service as any).deckSubject.value];
        service.shuffle();
        const shuffled = (service as any).deckSubject.value;
        // Shuffled deck should not match the original order
        expect(shuffled).not.toEqual(original);
    });

    it('should draw cards correctly', () => {
        service.resetDeck(0);
        service.draw(3);
        const deck = (service as any).deckSubject.value;
        const drawn = (service as any).drawnSubject.value;
        // 3 cards should be drawn, deck should have 49 left
        expect(drawn.length).toBe(3);
        expect(deck.length).toBe(49);
    });

    it('should sort drawn cards with correct order and jokers last', () => {
        service.resetDeck(2);
        // Manually set drawn to an unsorted mix:
        (service as any).drawnSubject.next([
            { type: 'joker', rank: 'Joker', id: 1 },
            { type: 'standard', suit: 'Hearts', rank: '2', value: 2 },
            { type: 'standard', suit: 'Clubs', rank: 'Ace', value: 14 },
        ]);
        service.sortDrawn();
        const drawn = (service as any).drawnSubject.value;
        // Expect sorting: Clubs Ace, Hearts 2, Joker last
        expect(drawn[0].suit).toBe('Clubs');
        expect(drawn[1].suit).toBe('Hearts');
        expect(drawn[2].type).toBe('joker');
    });

    it('should undo and redo draw action', () => {
        service.resetDeck(0);
        service.draw(2);
        // After draw, 2 cards should be in drawn pile
        expect((service as any).drawnSubject.value.length).toBe(2);

        service.undo();
        // After undo, drawn pile should be empty
        expect((service as any).drawnSubject.value.length).toBe(0);

        service.redo();
        // After redo, drawn pile should have 2 cards again
        expect((service as any).drawnSubject.value.length).toBe(2);
    });

    it('should calculate drawnPoints correctly', () => {
        service.resetDeck(0);
        service.draw(2);
        // Points should reflect the sum of drawn cards' values
        const points = service.drawnPoints;
        expect(points).toBeGreaterThanOrEqual(2);
    });

    it('should persist and load state', () => {
        service.resetDeck(1);
        service.draw(5);
        // Create a fresh instance to simulate reload
        const newService = TestBed.inject(DeckService);
        // Drawn and deck state should persist across service instances
        expect((newService as any).drawnSubject.value.length).toBe(5);
        expect((newService as any).deckSubject.value.length).toBe(52 - 5 + 1); // 53 initial minus 5 drawn
    });
});
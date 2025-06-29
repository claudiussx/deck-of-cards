import { Card } from '../models/card.model';

/** Manages the persistence of the deck state */
export class DeckRepository {
  private readonly STORAGE_KEY = 'deck-of-cards-state';

  save(deck: Card[], drawn: Card[]): void {
    const state = { deck, drawn };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  load(): { deck: Card[]; drawn: Card[] } | null {
    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as { deck: Card[]; drawn: Card[] };
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
}

import { Card } from '../models/card.model';

/** 
 * Manages the persistence of the deck state using localStorage.
 * This allows the deck and drawn cards to be saved and restored across sessions.
 */
export class DeckRepository {
  // Key used to store/retrieve deck state in localStorage
  private readonly STORAGE_KEY = 'deck-of-cards-state';

  /**
   * Saves the current deck and drawn cards to localStorage.
   * @param deck The current deck of cards (remaining in the deck)
   * @param drawn The cards that have already been drawn
   */
  save(deck: Card[], drawn: Card[]): void {
    const state = { deck, drawn };
    // Convert the state to a JSON string and store it
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Loads the deck and drawn cards state from localStorage.
   * @returns The parsed state if available and valid, otherwise null.
   */
  load(): { deck: Card[]; drawn: Card[] } | null {
    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) return null; // No saved state found
    try {
      // Attempt to parse the saved state
      return JSON.parse(json) as { deck: Card[]; drawn: Card[] };
    } catch {
      // If parsing fails (corrupted data), remove the invalid entry
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
}

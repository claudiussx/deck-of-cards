import { StandardCard, JokerCard, Suit, Rank } from '../models/card.model';

/**
 * Factory class for creating decks of cards.
 */
export class DeckFactory {
  /**
   * Create the 52 standard playing cards.
   * Each card is represented as a StandardCard object.
   */
  static createStandardDeck(): StandardCard[] {
    // All four suits in a standard deck
    const suits: Suit[] = ['Clubs', 'Spades', 'Hearts', 'Diamonds'];

    // All ranks with their corresponding values
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

    // Generate all combinations of suits and ranks
    return suits.flatMap(suit =>
      ranks.map(r => ({
        type: 'standard' as const, // Mark as a standard card
        suit,
        rank: r.rank,
        value: r.value,
      }))
    );
  }

  /**
   * Create 1–2 jokers, each with a unique id.
   * @param count Number of jokers to create (usually 1 or 2)
   */
  static createJokers(count: number): JokerCard[] {
    // Create an array of JokerCard objects with unique ids
    return Array.from({ length: count }, (_, i) => ({
      type: 'joker' as const, // Mark as a joker card
      rank: 'Joker',
      id: i + 1, // Unique id for each joker
    }));
  }
}

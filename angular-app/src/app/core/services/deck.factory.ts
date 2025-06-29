import { StandardCard, JokerCard, Suit, Rank } from '../models/card.model';

export class DeckFactory {
  /** Create the 52 standard playing cards */
  static createStandardDeck(): StandardCard[] {
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

    return suits.flatMap(suit =>
      ranks.map(r => ({
        type: 'standard' as const,
        suit,
        rank: r.rank,
        value: r.value,
      }))
    );
  }

  /** Create 1–2 jokers, each with a unique id */
  static createJokers(count: number): JokerCard[] {
    return Array.from({ length: count }, (_, i) => ({
      type: 'joker' as const,
      rank: 'Joker',
      id: i + 1,
    }));
  }
}

// Possible suits for a standard playing card
export type Suit = 'Clubs' | 'Spades' | 'Hearts' | 'Diamonds';

// Possible ranks for a standard playing card (2 through Ace)
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'Jack' | 'Queen' | 'King' | 'Ace';

// Rank for a Joker card (Jokers don't have suits)
export type JokerRank = 'Joker';

// Represents a standard playing card (not a Joker)
export interface StandardCard {
  type: 'standard'; // Used to distinguish from Joker cards
  suit: Suit;       // The suit of the card (e.g., Hearts)
  rank: Rank;       // The rank of the card (e.g., King)
  value: number;    // Numeric value for game logic (e.g., 10 for King)
}

// Represents a Joker card
export interface JokerCard {
  type: 'joker';    // Used to distinguish from standard cards
  rank: JokerRank;  // Always 'Joker'
  id: number;       // Unique identifier for each Joker (in case there are multiple)
}

// Union type for any card in the deck (standard or Joker)
export type Card = StandardCard | JokerCard;

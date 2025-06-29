export type Suit = 'Clubs' | 'Spades' | 'Hearts' | 'Diamonds';

export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'Jack' | 'Queen' | 'King' | 'Ace';

export type JokerRank = 'Joker';

export interface StandardCard {
  type: 'standard';
  suit: Suit;
  rank: Rank;
  value: number; // e.g. 2-10 are 2-10, Jack is 11, Queen is 12, King is 13, Ace is 14
}

export interface JokerCard {
  type: 'joker';
  rank: JokerRank;
  id: number; // Joker 1 or Joker 2
}

export type Card = StandardCard | JokerCard;

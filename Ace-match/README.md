## README.md

# Ace Card Battle

A strategic card game for 4 players where you compete to achieve the highest score.

## Table of Contents

- [Game Description](#game-description)
- [How to Play](#how-to-play)
- [Game Rules](#game-rules)
- [Special Cards](#special-cards)
- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Game Description

Ace Card Battle is a turn-based card game where 4 players compete to achieve the highest score. Each player has an Ace card that tracks their score throughout the game. Players take turns playing cards from their hand or flipping face-down cards on the table to strategically increase their own score or decrease their opponents' scores.

## How to Play

1. **Setup**: The game begins with 4 Ace cards (one for each player) on the table, 6 face-down cards, and the remaining cards distributed equally among the 4 players.

2. **Gameplay**: Players take turns performing one of the following actions:
   - **Play a Card**: Select a card from your hand to play. The value of the card is added to your score.
   - **Flip a Face-Down Card**: Select a face-down card to flip, then select a card from your hand and an opponent. The value of the face-down card is subtracted from the opponent's score.

3. **Special Cards**: Certain cards have special effects when played:
   - **King**: Gives you an extra turn
   - **Queen**: Skips the next player's turn
   - **Jack**: Reduces an opponent's score

4. **Winning**: The game ends when all players have no cards left in their hands. The player with the highest score wins.

## Game Rules

- Each player starts with an Ace card that tracks their score (initially 0).
- Players take turns in clockwise order.
- On your turn, you may either play a card from your hand or flip a face-down card.
- When you play a card, its value is added to your score.
- When you flip a face-down card, you must also play a card from your hand and select an opponent. The value of the face-down card is subtracted from the opponent's score.
- Special card effects are applied immediately after playing the card.
- The game ends when all players have no cards left in their hands.
- The player with the highest score at the end of the game wins.

## Special Cards

### King (K)
- **Value**: 13 points
- **Effect**: Gives you an extra turn immediately after your current turn.

### Queen (Q)
- **Value**: 12 points
- **Effect**: Skips the next player's turn.

### Jack (J)
- **Value**: 11 points
- **Effect**: Reduces a random opponent's score by 10 points (or their entire score if less than 10).

## Installation

* Open the `.html` file in your web browser:

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes made to the project.
```

## Game Summary

### Key Features:
1. **4 Ace cards** - One for each player to track their scores
2. **6 face-down cards** - Players can flip these to subtract values from opponents' scores
3. **Card distribution** - Remaining cards are distributed equally among 4 players
4. **Turn-based gameplay** - Players take turns playing cards or flipping face-down cards
5. **Special card effects**:
   - King: Gives an extra turn
   - Queen: Skips the next player's turn
   - Jack: Reduces a random opponent's score by 10 points

### Game Balance:
- The Jack's effect is limited to 10 points to prevent overly powerful moves
- Face-down cards add strategic depth as players must decide when to use them
- Special cards are highlighted visually and have enhanced value in AI decision-making
- The game ends when all cards are played, ensuring a finite game length

### UI/UX Features:
- Clean, card-game themed design with green felt background
- Visual indicators for the current player
- Game log to track all actions
- Score display showing rankings
- Responsive design for mobile devices
- Rules modal for easy reference

The game is fully playable with both human and AI players, making it suitable for single-player or multiplayer experiences.

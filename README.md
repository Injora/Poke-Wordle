# Poké Wordle

A fun, interactive "Who's That Pokémon?" guessing game built with React and Vite. Guess the Pokémon from its silhouette within 3 tries!

## Features
- **Classic Silhouette Guessing:** The game shows you a solid black silhouette of a random Pokémon.
- **Wordle-style Hints:** Characters light up green (correct position) or yellow (correct letter, wrong position) based on your guess.
- **Progressive Hint System:** Unlocks the Pokémon's Type and Generation/Region as you make incorrect guesses.
- **Streak Tracking:** Keep track of your consecutive correct guesses in a session.
- **Responsive UI:** Dynamic animations, custom Pokéball aesthetics, and mobile-friendly design.
- **No Backend Required:** Completely powered by the [PokéAPI](https://pokeapi.co/).

## Tech Stack
- **React** (State management, Components, Hooks)
- **Vite** (Build tool)
- **Vanilla CSS** (Custom animations like shaking, flipping, and spinning)
- **PokéAPI** (Data source for Pokémon sprites, names, types, and generations)

## Running Locally

To run this project on your local machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/Injora/Poke-Wordle.git
   ```
2. Navigate into the directory:
   ```bash
   cd Poke-Wordle
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and enjoy the guessing game!

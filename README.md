# Dual Knights

Welcome to **Dual Knights**, an interactive puzzle game playable directly on Reddit! 

## App Overview

**What does this app do?**
Dual Knights is a mind-bending puzzle game where you control two knights—the Red Knight and the Blue Knight—at the exact same time. The catch? They move in opposite directions! If you press "Right", the Red Knight moves right while the Blue Knight moves left. Your goal is to navigate both knights to their respective destination tiles *simultaneously* to complete the level. You'll need to use walls and obstacles to align them perfectly.

**Who is it for?**
This game is for puzzle enthusiasts, strategy fans, and any Reddit user looking for a fun, challenging brain-teaser to play while browsing their feed. It's completely family-friendly and accessible to all skill levels.

**Critical Operational Notes:**
- **Simultaneous Arrival:** Both knights must land on their destination tiles at the same time. If only one arrives, or if they collide with each other or a barrel, it's Game Over!
- **Level Designer:** The app includes a built-in Level Designer allowing users to create, play, and share their own custom puzzles.
- **Global Leaderboard:** Players can compete for the lowest step counts globally. All data is securely stored using Reddit's Devvit backend (Redis).

## How to Interact with the App

Once you encounter a Dual Knights post on Reddit, simply click the play button to start!
- **Desktop:** Click the on-screen D-pad arrows to move, or use your keyboard's Arrow Keys (Up, Down, Left, Right).
- **Mobile:** Tap the on-screen D-pad arrows to navigate.
- **HUD Controls:** Use the right-hand menu to Retry the level, Reset your view, toggle the grid for better visibility, or return to the Main Menu.

## How to Configure and Deploy

*(Note: These instructions are for community moderators and developers looking to deploy the app to their subreddits.)*

### Prerequisites
- Node.js (v22 or higher)
- Devvit CLI installed globally (`npm install -g @devvit/cli`)

### Installation & Deployment
1. **Clone or Download** the project repository.
2. **Install Dependencies:** Run `npm install` in the root directory.
3. **Login to Devvit:** Run `devvit login` and follow the authentication steps in your browser.
4. **Select Subreddit:** Run `devvit select` and choose the subreddit where you want to test or deploy the app.
5. **Upload the App:** Run `devvit upload` to submit the app to the Reddit servers.
6. **Create a Post:** Once uploaded and installed on your subreddit, you can create a new interactive post by running:
   ```bash
   devvit playtest <your-subreddit-name>
   ```

### Configuration
There are no complex configuration settings required for standard gameplay. All game state, leaderboards, and custom levels are automatically managed by the Devvit Redis backend. If you wish to customize the default maps, you can modify the tilemap data in the `assets/` folder prior to deploying.

# 🎯 Focus Timer

A simple yet powerful time-tracking application designed to run in the background and help you track your focused work time. Built with Svelte, TypeScript, and Vite for a fast and responsive experience.

## Features

- **Multiple Named Timers**: Create individual timers with custom names for different projects or tasks
- **One Active Timer**: Only one timer can run at a time, ensuring focused tracking
- **Persistent Data**: All timer data is stored in localStorage for persistence across browser sessions
- **Focus Points System**: Earn focus points for every 30 minutes of concentrated work
- **Disruption Handling**: Easily subtract time from timers to account for interruptions
- **Real-time Updates**: Timer displays update every 5 seconds while running
- **Clean Interface**: Simple, intuitive UI focused on clarity and ease of use

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Build for production: `npm run build`

## How It Works

### Timer Management
- Create timers with descriptive names for different projects or activities
- Start a timer to begin tracking time - this automatically stops any other running timer
- Stop a timer to end the current session and log the time interval
- Delete timers you no longer need

### Focus Points
- Focus points are awarded for every complete 30-minute chunk of work
- This gamifies longer work sessions and encourages sustained focus
- Points are calculated across all time intervals for each timer

### Time Intervals
- Each start/stop cycle creates a time interval with start time, end time, and duration
- Intervals are preserved in localStorage for persistent tracking
- Total elapsed time is calculated from all intervals

### Disruption Handling
- Use the clock button (⏰) to subtract time from a timer
- Perfect for accounting for interruptions, breaks, or non-productive time
- Focus points are automatically recalculated when time is subtracted

## Technical Details

**Built With:**
- [Svelte 5](https://svelte.dev/) - Reactive UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool and dev server

**Architecture:**

- **Component-based**: Modular Svelte components for easy maintenance
- **TypeScript interfaces**: Strong typing for timer data structures
- **Reactive state management**: Svelte's built-in reactivity for real-time updates
- **localStorage persistence**: No backend required - all data stored locally
- **Efficient updates**: Global 5-second update interval for active timers only

## Development

**Recommended IDE Setup**: [VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

**Available Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking

## Configuration

The app includes some configurable constants in `src/App.svelte`:
- `FOCUS_CHUNK_MINUTES`: Duration for focus point calculation (default: 30 minutes)
- `UPDATE_INTERVAL_MS`: How often running timers update their display (default: 5000ms)

## Data Persistence

All timer data is stored in the browser's localStorage:
- `focus-timers`: Array of timer objects with intervals and metadata
- `active-timer-id`: ID of the currently running timer (if any)

Data persists across browser sessions and page refreshes. Running timers will resume their intervals when the page is reloaded.

## License

This project is open source and available under the MIT License.

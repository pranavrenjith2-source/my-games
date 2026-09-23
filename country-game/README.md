# Daily Geography Puzzle App

A clean, mobile-responsive web app that serves a fresh five-puzzle geography challenge every 24 hours.

## Features

- Uses the [Open Trivia Database API](https://opentdb.com/) (`category=22`, Geography) for daily puzzle content.
- Rotating puzzle modes by challenge window:
  - `Seterra style` day: click highlighted country regions on an interactive SVG world map.
  - `Geo-Games style` day: type the country name from clues with optional hints.
- `GeoGrid style` day: fill a 3x3 clue grid with countries that satisfy both row and column clues.
- Seterra map uses world GeoJSON polygons and falls back to button choices if a region cannot be matched.
- GeoGrid mode uses a built-in country dataset, unique-answer validation, and persistent board state during the active 24-hour window.
- Immediate right/wrong feedback.
- Progress bar across 5 puzzles, or 9 GeoGrid cells on GeoGrid days.
- Daily lock using local storage after completion (24-hour window).
- Final score screen with a `Share` button (`navigator.share` + clipboard fallback).
- Educational aesthetic with world-map background and high-contrast typography.
- Mobile-first responsive layout.

## Run locally

This is a static app. Any static server works:

```bash
cd /Users/pranav/dev/country-game
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy options

### GitHub Pages

1. Push this folder to a GitHub repository.
2. In repository settings, enable Pages from the default branch root.
3. Use the provided Pages URL.

### Netlify

1. Create a new site from this folder/repo.
2. Build command: none.
3. Publish directory: `/` (project root).

## Files

- `index.html` - App structure and mode-specific UI blocks
- `styles.css` - Visual design, map styling, responsive styles
- `app.js` - API fetch, rotating modes, SVG map rendering, GeoGrid logic, storage lock, sharing
- `world-map.svg` - Background map artwork

# Portugal IPTV Player

A professional IPTV player for Portuguese channels with a clean, modern interface.

## Features

- **Channel List** with search and filtering
- **Video Player** with playback controls
- **Featured Channels** section
- **Responsive Design** with glass morphism UI
- **Auto-refresh** of channel list
- **Online Status** indicator
- **Category Filtering**

## Tech Stack

- **Vue 3** - Component framework
- **Vite** - Fast development server and build tool
- **Video.js** - Video player
- **TypeScript** - Type safety
- **CSS Variables** - Theme management

## Installation

```bash
npm install
cdn install
npm run dev
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

Builds to the `dist/` folder

## Project Structure

```
src/
├── components/     # Vue components
├── services/       # Business logic
├── types/          # Type definitions
├── App.vue         # Main application
└── main.ts         # Entry point
```

## Design System

### Colors
- `--primary: #0066ff`
- `--accent: #00d2ff`
- `--bg: #0a0c10`
- `--glass-bg: rgba(15, 18, 25, 0.7)`

### Typography
- Font: Outfit (Google Fonts)
- Sizes: Responsive with fluid scaling

### Components
- ChannelList - List of channels with search
- VideoPlayer - Video player with controls
- LoadingSpinner - Loading indicator
- Design system tokens for consistency

## Future Improvements

- [ ] Add user settings
- [ ] Implement favorites
- [ ] Add category management
- [ ] Add player settings (quality, subtitles)
- [ ] Implement error recovery
- [ ] Add analytics
- [ ] Responsive design for mobile

## License

MIT
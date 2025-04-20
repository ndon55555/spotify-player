# Spotify Player

[![CI Status](https://github.com/ndon55555/spotify-player/actions/workflows/ci.yml/badge.svg)](https://github.com/ndon55555/spotify-player/actions/workflows/ci.yml)

A Next.js web application that enhances the Spotify experience with additional features.

## Features Beyond Standard Spotify

- **Playlist Position Memory**: Remembers where you left off in a playlist, allowing you to continue from the same track when you return

## Future Enhancements (Wishlist)

- Remove songs from Discover Weekly playlist (or generate song recommendations without Spotify's help)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies Used

- **Next.js**: React framework for building the user interface
- **Spotify Web Playback SDK**: For audio playback and control
- **Spotify Web API**: For retrieving user data, playlists, and controlling playback
- **Drizzle ORM**: For database operations to store user preferences and playlist positions
- **TailwindCSS**: For styling
- **TypeScript**: For type safety
- **Docker**: For containerization and deployment

## Development

### Prerequisites

- Node.js 23.x
- pnpm 10.7.0+
- Spotify Developer Account

### Environment Setup

Copy the `.env.sample` file to `.env` and fill in your Spotify API credentials.

### Available Commands

```bash
# Development
pnpm dev             # Start development server
pnpm lint            # Run ESLint
pnpm format          # Format code with Prettier
pnpm type:check      # Run TypeScript type checking

# Testing
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage report

# Database
pnpm db:generate     # Generate database migrations
pnpm db:migrate      # Run database migrations
pnpm db:studio       # Open Drizzle Studio
```

## Deployment

The application can be deployed using Docker. A Dockerfile is included in the repository.

```bash
docker build -t spotify-player .
docker run -p 3000:3000 spotify-player
```
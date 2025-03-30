# Spotify Player Component Structure

This directory contains the components for the Spotify Web Playback SDK integration. The styling has been factored out from inline Tailwind classes into dedicated CSS files, and the UI has been broken down into reusable components.

## Component Structure

### Main Components

- **WebPlayback**: The main component that orchestrates the Spotify Web Playback SDK and manages the overall state.

### UI Components

- **PlaylistItem**: Displays a single playlist with its image and name.
- **TrackItem**: Displays a single track with its album image, name, and artists.
- **CurrentTrackInfo**: Shows detailed information about the currently playing track.
- **ActivePlaylistHeader**: Displays information about the currently selected playlist.
- **PlaybackControls**: Contains the play/pause button for controlling playback.
- **VolumeControl**: Provides a slider for adjusting the volume.

### Utility Components

- **LoadingSpinner**: Displays a loading animation when content is being fetched.
- **EmptyState**: Shows a message when no content is available.

## Styling

The styling has been moved from inline Tailwind classes to component-specific CSS files:

- **variables.css**: Centralized CSS variables for consistent theming across components
- **MainWebPlayback.css**: Contains styles for the main container and layout
- **PlaylistItem.css**: Styles for playlist items
- **TrackItem.css**: Styles for track items
- **LoadingSpinner.css**: Styles for the loading spinner
- **EmptyState.css**: Styles for empty state messages
- **PlaybackControls.css**: Styles for playback controls
- **VolumeControl.css**: Styles for volume slider
- **CurrentTrackInfo.css**: Styles for current track information
- **ActivePlaylistHeader.css**: Styles for active playlist header

This approach follows the CSS-per-component pattern, which provides better encapsulation and maintainability by keeping styles close to their respective components.

## Type Definitions

Common type definitions are centralized in:

- **types.ts**: Contains interfaces for Spotify tracks, playlists, and playback state.

## CSS Explanations

The CSS file is organized into sections for each component with comments explaining what each style does:

1. **Main container styles**: Controls the overall layout and responsive behavior.
2. **Header section**: Styles for the top section with the logout button.
3. **Playlist section**: Styles for the playlist sidebar.
4. **Player section**: Styles for the main playback area.
5. **Track list**: Styles for the list of tracks in a playlist.
6. **Playback controls**: Styles for the play/pause button and volume slider.
7. **Loading and empty states**: Styles for loading spinners and empty state messages.

Each component's styles are grouped together and include comments explaining their purpose, making it easier to understand and maintain the styling.

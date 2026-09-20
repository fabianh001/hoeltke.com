import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

describe('AudioPlayer', () => {
  it('renders audio player controls without redundant title badge', () => {
    render(<AudioPlayer src="/audio/digest/2026-34.mp3" title="AI Weekly #11" issue={11} />);

    expect(screen.queryByText('AUDIO EDITION')).toBeNull();
    expect(screen.queryByText('AI Weekly #11')).toBeNull();
    expect(screen.getByRole('region', { name: /Audio player/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Play audio/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Rewind 10 seconds/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Forward 10 seconds/i })).toBeDefined();
  });

  it('cycles playback speed when clicked', () => {
    render(<AudioPlayer src="/audio/digest/2026-34.mp3" title="AI Weekly #11" issue={11} />);

    const speedBtn = screen.getByRole('button', { name: /Playback speed: 1x/i });
    expect(speedBtn).toBeDefined();

    fireEvent.click(speedBtn);
    expect(screen.getByRole('button', { name: /Playback speed: 1.25x/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Playback speed: 1.25x/i }));
    expect(screen.getByRole('button', { name: /Playback speed: 1.5x/i })).toBeDefined();
  });
});

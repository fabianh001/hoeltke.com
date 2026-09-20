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

  it('supports keyboard and pointer seeking', () => {
    const { container } = render(
      <AudioPlayer src="/audio/digest/2026-34.mp3" title="AI Weekly #11" issue={11} />,
    );
    const audio = container.querySelector('audio') as HTMLAudioElement;
    Object.defineProperty(audio, 'duration', { configurable: true, value: 120 });
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 10, writable: true });
    fireEvent.loadedMetadata(audio);

    const scrubber = screen.getByRole('slider', { name: /Audio scrubber/i });
    expect(scrubber.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(scrubber, { key: 'ArrowRight' });
    expect(audio.currentTime).toBe(15);
    fireEvent.keyDown(scrubber, { key: 'End' });
    expect(audio.currentTime).toBe(120);

    Object.defineProperties(scrubber, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ left: 0, width: 100, top: 0, right: 100, bottom: 8, height: 8, x: 0, y: 0, toJSON() {} }),
      },
    });
    fireEvent.pointerDown(scrubber, { clientX: 50, pointerId: 1 });
    expect(audio.currentTime).toBe(60);
  });
});

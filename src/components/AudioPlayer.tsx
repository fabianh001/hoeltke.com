import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  issue?: number;
}

export default function AudioPlayer({ src, title, issue }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const speeds = [1, 1.25, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.readyState >= 1) {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    }
  }, [src]);

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;
    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('Playback prevented:', err);
            setIsLoading(false);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current?.duration) {
      setDuration(audioRef.current.duration);
    }
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = audioRef.current;
    console.error('Audio playback error:', audio?.error || e);
    setIsLoading(false);
    setIsPlaying(false);
    setHasError(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const skipTime = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + delta), duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };


  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!progressBarRef.current || !audioRef.current || !duration) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = clickPos / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleSeek(e);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleSeek(moveEvent);
    };

    const onMouseUp = () => {
      setIsSeeking(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return null;
  }

  return (
    <div
      className="group my-4 rounded-xl border border-line bg-panel/75 px-3 py-2.5 sm:px-4 sm:py-2.5 font-mono shadow-xs backdrop-blur-xs transition-colors hover:border-line-bright"
      role="region"
      aria-label={title ? `Audio player for ${title}` : 'Audio player'}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => {
          if (audioRef.current?.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onCanPlayThrough={() => setIsLoading(false)}
        onError={handleError}
        onEnded={handleEnded}
      />

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
        {/* Play / Pause & Skip buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 order-1 shrink-0">
          {/* Skip Back 10s */}
          <button
            type="button"
            onClick={() => skipTime(-10)}
            disabled={duration === 0}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-white/5 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-accent"
            title="Rewind 10 seconds"
            aria-label="Rewind 10 seconds"
          >
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeWidth="1.75" />
              <path d="M3 3v5h5" strokeWidth="1.75" />
              <path d="M8.7 10.2L10.2 9v6" strokeWidth="1.5" />
              <rect x="11.8" y="9" width="4" height="6" rx="2" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={hasError}
            className="flex items-center justify-center h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 rounded-full bg-green text-bg font-bold shadow-[0_0_14px_rgba(62,247,143,0.35)] hover:shadow-[0_0_22px_rgba(62,247,143,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prompt focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            title={isPlaying ? 'Pause narration' : 'Play narration'}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isLoading && isPlaying ? (
              <svg className="w-4 h-4 animate-spin text-bg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <rect x="7" y="6" width="3" height="12" rx="1" />
                <rect x="14" y="6" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A1 1 0 0 0 8 6.82z" />
              </svg>
            )}
          </button>

          {/* Skip Forward 10s */}
          <button
            type="button"
            onClick={() => skipTime(10)}
            disabled={duration === 0}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-white/5 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-accent"
            title="Forward 10 seconds"
            aria-label="Forward 10 seconds"
          >
            <svg
              className="w-5 h-5 sm:w-5.5 sm:h-5.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" strokeWidth="1.75" />
              <path d="M21 3v5h-5" strokeWidth="1.75" />
              <path d="M8.7 10.2L10.2 9v6" strokeWidth="1.5" />
              <rect x="11.8" y="9" width="4" height="6" rx="2" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* Timeline & Scrubber with timestamps */}
        <div className="w-full sm:w-auto sm:flex-1 flex items-center gap-2 order-3 sm:order-2">
          <span className="text-xs text-muted tabular-nums min-w-8 text-right select-none">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            className="relative h-1.5 sm:h-2 flex-1 bg-line rounded-full cursor-pointer group/bar select-none overflow-hidden"
            role="slider"
            aria-label="Audio scrubber"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-green group-hover/bar:bg-green/90 transition-all rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-xs text-faint tabular-nums min-w-8 select-none">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>

        {/* Speed & Animated Equalizer */}

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs order-2 sm:order-3 shrink-0">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded border border-line px-1.5 py-0.5 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer text-[11px] min-w-8 text-center font-medium"
            title="Playback speed"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}×
          </button>

          {/* Equalizer animation */}
          <div className="flex items-end gap-0.5 h-3 px-1" aria-hidden="true">
            {[40, 90, 60, 100, 50, 75].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-xs bg-green transition-all duration-300 ${
                  isPlaying ? 'animate-pulse' : 'opacity-25'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, h * (i % 2 === 0 ? 1 : 0.7))}%` : '20%',
                  animationDuration: `${0.4 + i * 0.15}s`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

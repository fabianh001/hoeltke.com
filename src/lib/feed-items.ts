import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { RSSFeedItem } from '@astrojs/rss';
import { renderDigestHtml } from './render-markdown';

/** Minimal shape we need from a digest collection entry. */
export interface DigestEntry {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    date: Date;
    issue?: number;
    audio?: string;
  };
}

export function getAudioEnclosure(
  entry: DigestEntry,
  site: string,
  audioDir?: string,
): RSSFeedItem['enclosure'] | undefined {
  const baseAudioDir = audioDir ?? join(process.cwd(), 'public/audio/digest');
  const normalizedSite = site.replace(/\/$/, '');

  let audioUrl = entry.data.audio;
  let fileSizeBytes = 0;
  let mimeType = 'audio/mpeg';

  if (!audioUrl) {
    const mp3File = join(baseAudioDir, `${entry.id}.mp3`);
    const wavFile = join(baseAudioDir, `${entry.id}.wav`);

    if (existsSync(mp3File)) {
      audioUrl = `${normalizedSite}/audio/digest/${entry.id}.mp3`;
      try {
        fileSizeBytes = statSync(mp3File).size;
      } catch {}
      mimeType = 'audio/mpeg';
    } else if (existsSync(wavFile)) {
      audioUrl = `${normalizedSite}/audio/digest/${entry.id}.wav`;
      try {
        fileSizeBytes = statSync(wavFile).size;
      } catch {}
      mimeType = 'audio/wav';
    }
  } else {
    if (audioUrl.endsWith('.wav')) mimeType = 'audio/wav';
    if (!/^https?:\/\//i.test(audioUrl)) {
      const cleanPath = audioUrl.replace(/^\/+/, '');
      const localFile = join(process.cwd(), 'public', cleanPath);
      if (existsSync(localFile)) {
        try {
          fileSizeBytes = statSync(localFile).size;
        } catch {}
      }
      audioUrl = `${normalizedSite}/${cleanPath}`;
    }
  }

  if (!audioUrl) return undefined;

  return {
    url: audioUrl,
    length: fileSizeBytes,
    type: mimeType,
  };
}

/** Pure mapping so it is testable without the Astro content runtime. */
export function buildFeedItems(
  entries: DigestEntry[],
  site: string,
  audioDir?: string,
): RSSFeedItem[] {
  return [...entries]
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((entry) => {
      const enclosure = getAudioEnclosure(entry, site, audioDir);
      const item: RSSFeedItem = {
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.date,
        link: `/digest/${entry.id}/`,
        content: renderDigestHtml(entry.body ?? '', site),
      };
      if (enclosure) {
        item.enclosure = enclosure;
        item.customData = [
          '<itunes:episodeType>full</itunes:episodeType>',
          entry.data.issue ? `<itunes:episode>${entry.data.issue}</itunes:episode>` : '',
          '<itunes:explicit>false</itunes:explicit>',
        ].filter(Boolean).join('');
      }
      return item;
    });
}

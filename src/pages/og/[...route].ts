import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const issues = await getCollection('digest');

const pages: Record<string, { title: string; description: string }> = {
  default: {
    title: 'AI Weekly',
    description: 'the week in AI, auto-curated · hoeltke.com',
  },
};

for (const entry of issues) {
  pages[`digest/${entry.id}`] = {
    title: entry.data.title,
    description: entry.data.description,
  };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: `$ ${page.title}`,
    description: page.description,
    bgGradient: [
      [10, 14, 20],
      [15, 23, 34],
    ],
    border: { color: [69, 224, 160], width: 14, side: 'inline-start' },
    padding: 72,
    font: {
      title: {
        size: 60,
        lineHeight: 1.25,
        families: ['JetBrains Mono'],
        weight: 'Bold',
        color: [211, 224, 238],
      },
      description: {
        size: 30,
        lineHeight: 1.5,
        families: ['JetBrains Mono'],
        color: [126, 145, 168],
      },
    },
    fonts: [
      './src/assets/fonts/JetBrainsMono-Bold.ttf',
      './src/assets/fonts/JetBrainsMono-Regular.ttf',
    ],
  }),
});

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
    bgGradient: [[255, 255, 255]],
    border: { color: [229, 229, 229], width: 1, side: 'inline-start' },
    padding: 72,
    font: {
      title: {
        size: 60,
        lineHeight: 1.25,
        families: ['OpenAI Sans'],
        weight: 'Bold',
        color: [24, 24, 24],
      },
      description: {
        size: 30,
        lineHeight: 1.5,
        families: ['OpenAI Sans'],
        color: [93, 93, 93],
      },
    },
    fonts: [
      './public/fonts/openai-sans/OpenAISans-Bold.woff2',
      './public/fonts/openai-sans/OpenAISans-Regular.woff2',
    ],
  }),
});

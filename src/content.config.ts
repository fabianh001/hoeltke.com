import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const digest = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/digest' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    issue: z.number(),
    tags: z.array(z.string()).default([]),
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

export const collections = { digest };

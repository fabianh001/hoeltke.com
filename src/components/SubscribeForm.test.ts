import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import SubscribeForm from './SubscribeForm.astro';

test('renders a same-origin subscribe form with honeypot', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(SubscribeForm, { props: { variant: 'card' } });
  expect(html).toContain('action="/api/subscribe"');
  expect(html).toContain('name="email"');
  expect(html).toContain('name="website"'); // honeypot
  expect(html).toContain('data-subscribe');
});

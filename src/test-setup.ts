import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// @testing-library/react's auto-cleanup relies on global test hooks being
// registered with the test framework; wire it up explicitly for jsdom component tests.
afterEach(() => {
  cleanup();
});

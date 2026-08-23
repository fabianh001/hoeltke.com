/** Prebuild the confirmation-email template for the subscribe service (CI step). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfirmEmail } from '../src/lib/confirm-email';

const out = join(dirname(fileURLToPath(import.meta.url)), '../server/confirm-email.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(buildConfirmEmail(), null, 2));
console.log(`✓ wrote ${out}`);

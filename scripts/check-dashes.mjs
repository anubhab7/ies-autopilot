// Fails when an em dash (U+2014) or en dash (U+2013) appears in any repo file.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const IGNORED = new Set(['node_modules', 'dist', '.git', 'playwright-report', 'test-results', '.vercel']);
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|pptx)$/i;
const FORBIDDEN = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (IGNORED.has(name)) continue;
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) {
      walk(full);
    } else if (!BINARY.test(name)) {
      const lines = readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (FORBIDDEN.test(line)) hits.push(`${relative(ROOT, full)}:${index + 1}`);
      });
    }
  }
}

walk(ROOT);

if (hits.length > 0) {
  console.error(`Found em or en dashes in ${hits.length} line(s):`);
  for (const hit of hits) console.error(`  ${hit}`);
  console.error('Replace them with commas, colons, parentheses, or the word "to".');
  process.exit(1);
}
console.log('No em or en dashes found.');

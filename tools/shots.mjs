// Print the shot list (id, start, end) of the page: node tools/shots.mjs
import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const LIB = process.env.LIB || 'C:/Users/HP/lemo-opuscar';
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const DEMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { browser, page } = await openDemo(DEMO, {});
const S = await page.evaluate(() => window.SHOTS.map(s => [s.id, +s.a.toFixed(2), +s.b.toFixed(2)]));
console.log(JSON.stringify(S));
await browser.close(); closeServer(); process.exit(0);

/**
 * Generate thumbnails for objects that predate thumbnail support.
 *
 *   pnpm thumbnails:backfill            # every user
 *   pnpm thumbnails:backfill users/<id> # one user, or any key prefix
 *
 * Safe to re-run: files that already have a thumbnail are skipped, and files
 * that cannot produce one are reported rather than retried forever.
 */
import { listAllKeys } from '../utils/s3Helpers.js';
import { ensureThumbnail } from '../utils/thumbnails.js';
import { getMimeType, supportsThumbnail, thumbnailKeyFor, THUMBNAIL_PREFIX } from '../utils/mimeTypes.js';

const prefix = process.argv[2] || 'users/';

const run = async (): Promise<void> => {
  console.log(`Scanning ${prefix} ...`);

  const keys = await listAllKeys(prefix);
  const existingThumbnails = new Set(await listAllKeys(THUMBNAIL_PREFIX));

  const candidates = keys.filter(
    (key) =>
      !key.endsWith('/') &&                       // folder markers
      !key.startsWith(THUMBNAIL_PREFIX) &&        // never thumbnail a thumbnail
      supportsThumbnail(getMimeType(key))
  );

  const missing = candidates.filter((key) => !existingThumbnails.has(thumbnailKeyFor(key)));

  console.log(
    `${keys.length} objects, ${candidates.length} can have thumbnails, ` +
    `${candidates.length - missing.length} already do, ${missing.length} to generate.`
  );

  let generated = 0;
  let failed = 0;

  for (const key of missing) {
    process.stdout.write(`  ${key} ... `);
    const started = Date.now();
    const thumbnailKey = await ensureThumbnail(key);

    if (thumbnailKey) {
      generated++;
      console.log(`ok (${Date.now() - started}ms)`);
    } else {
      failed++;
      console.log('skipped');
    }
  }

  console.log(`\nDone. ${generated} generated, ${failed} skipped.`);
  if (failed > 0) {
    console.log('Skipped files keep their icon. PDFs need pdftoppm and videos need ffmpeg on PATH.');
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });

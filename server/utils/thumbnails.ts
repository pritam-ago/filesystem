import {
  putObject,
  copyObject,
  deleteObject,
  deleteFolder,
  listAllKeys,
} from './s3Helpers.js';
import { generateThumbnail } from './thumbnailGenerator.js';
import { getMimeType, supportsThumbnail, thumbnailKeyFor } from './mimeTypes.js';

/**
 * Thumbnails mirror the object key space exactly: the preview for
 * users/1/a.png lives at thumbnails/users/1/a.png.
 *
 * That means anything which moves or removes an object has to do the same to
 * its thumbnail. Otherwise a renamed file loses its preview, and - worse - a
 * new file that reuses a deleted file's name inherits the old file's preview.
 */

/**
 * Generate a thumbnail for an object and store it alongside the key space.
 *
 * Never throws: a file that cannot be previewed - an unsupported codec, a PDF
 * when pdftoppm is not installed, a corrupt upload - must not fail the upload
 * that triggered it. The file simply keeps its icon.
 *
 * Returns the thumbnail's key, or undefined if none was produced.
 */
export const ensureThumbnail = async (key: string): Promise<string | undefined> => {
  const mimeType = getMimeType(key);
  if (!supportsThumbnail(mimeType)) return undefined;

  try {
    const thumbnail = await generateThumbnail(key, mimeType);
    const thumbnailKey = thumbnailKeyFor(key);

    await putObject(thumbnailKey, thumbnail, 'image/jpeg');
    return thumbnailKey;
  } catch (error) {
    console.error(
      `Failed to generate thumbnail for ${key}:`,
      error instanceof Error ? error.message : error
    );
    return undefined;
  }
};

/** Remove the thumbnail for a file, or every thumbnail under a folder. */
export const deleteThumbnails = async (key: string): Promise<void> => {
  try {
    if (key.endsWith('/')) {
      await deleteFolder(thumbnailKeyFor(key));
      return;
    }

    // DeleteObject is idempotent, so a file that never had a thumbnail is fine.
    await deleteObject(thumbnailKeyFor(key));
  } catch (error) {
    // Never let thumbnail housekeeping fail the delete the user asked for.
    console.error(
      `Failed to remove thumbnails for ${key}:`,
      error instanceof Error ? error.message : error
    );
  }
};

// listAllKeys does prefix matching, which is what a folder wants but would let
// a file key like ".../a.png" also match ".../a.png.bak". Narrow it back down.
const matchingThumbnailKeys = (keys: string[], sourceKey: string, sourcePrefix: string): string[] =>
  sourceKey.endsWith('/') ? keys : keys.filter((key) => key === sourcePrefix);

/** Move the thumbnail for a file, or every thumbnail under a folder. */
export const moveThumbnails = async (sourceKey: string, destinationKey: string): Promise<void> => {
  try {
    const sourcePrefix = thumbnailKeyFor(sourceKey);
    const destinationPrefix = thumbnailKeyFor(destinationKey);

    // Listing rather than copying blind means a file with no thumbnail is a
    // no-op instead of a NoSuchKey error. For a file key this matches at most
    // the one object; for a folder key it matches the whole subtree.
    const keys = matchingThumbnailKeys(await listAllKeys(sourcePrefix), sourceKey, sourcePrefix);

    for (const key of keys) {
      await copyObject(key, destinationPrefix + key.slice(sourcePrefix.length));
      await deleteObject(key);
    }
  } catch (error) {
    console.error(
      `Failed to move thumbnails from ${sourceKey} to ${destinationKey}:`,
      error instanceof Error ? error.message : error
    );
  }
};

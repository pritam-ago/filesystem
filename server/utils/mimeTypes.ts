// ListObjectsV2 does not return an object's Content-Type - only HeadObject and
// GetObject do - so a listing would need one extra request per file to know
// what each one is. Deriving the type from the file extension keeps listing to
// a single round trip, and it matches how the client already picks its icons.
const MIME_TYPES: Record<string, string> = {
  // images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  heic: 'image/heic',

  // video
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',

  // audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',

  // documents
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const getMimeType = (keyOrName: string): string => {
  const name = keyOrName.split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  // dot <= 0 means no extension, or a dotfile whose leading dot starts the name
  if (dot <= 0) return '';

  return MIME_TYPES[name.slice(dot + 1).toLowerCase()] || '';
};

// What generateThumbnail() can actually produce a preview for. PDFs need
// pdftoppm on PATH; if it is missing the attempt fails and the file simply
// keeps its icon.
export const supportsThumbnail = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('video/') ||
  mimeType === 'application/pdf';

export const THUMBNAIL_PREFIX = 'thumbnails/';

export const thumbnailKeyFor = (key: string): string => `${THUMBNAIL_PREFIX}${key}`;

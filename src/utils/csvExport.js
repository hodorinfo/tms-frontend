/**
 * Trigger browser download for a Blob (e.g. CSV from API).
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse Content-Disposition header for filename=...
 */
export function filenameFromContentDisposition(header, fallback = 'export.csv') {
  if (!header || typeof header !== 'string') return fallback;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  return match?.[1]?.trim() || fallback;
}

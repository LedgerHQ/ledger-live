import path from 'node:path';

export function getFullExtension(filePath: string) {
  if (!filePath || filePath === '.' || filePath === '..') return '';

  const fileName = path.basename(filePath);
  const lastDotIndex = fileName.indexOf('.');

  return lastDotIndex === -1 ? '' : fileName.slice(lastDotIndex);
}

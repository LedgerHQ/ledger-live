export function detectJS(fileName: string | undefined) {
  if (fileName) {
    if (/\.[cm]?jsx?$/.test(fileName)) return 'javascript';
    if (/\.[cm]?tsx?$/.test(fileName)) return 'typescript';
  }

  return;
}

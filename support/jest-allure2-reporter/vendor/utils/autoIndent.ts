export function autoIndent(text: string) {
  const [first, ...rest] = text.split('\n');
  const indent = detectIndent(rest);
  if (indent > 0) {
    return [first, ...rest.map((line) => line.slice(indent))].join('\n');
  }

  return text;
}

function detectIndent(lines: string[]) {
  const result = lines.reduce((min, line) => {
    const trimmed = line.trimStart();
    const indent = trimmed === '' ? min : line.length - trimmed.length;
    return Math.min(indent, min);
  }, Number.POSITIVE_INFINITY);

  return Number.isFinite(result) ? result : 0;
}

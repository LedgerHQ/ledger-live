const SEP = String.raw`(?::|%3A)`;
const SLASH = String.raw`(?:/|%2F)`;
// Up to the path when one follows (a key may hold any character), else up to the next delimiter.
const DESCRIPTOR = new RegExp(
  String.raw`(?:account|mock)${SEP}2${SEP}(?:utxo|address)${SEP}(?:[^\s"'\`<>]*?${SEP}m(?:${SLASH}\d+[hH']?)+|[^\s"'\`<>,;&?]*)`,
  "gi",
);

/** Replaces every v2 descriptor string in a text (an error message, a stack, a log) with `[redacted]`. */
export function redactAccountDescriptors(text: string): string {
  return text.replace(DESCRIPTOR, "[redacted]");
}

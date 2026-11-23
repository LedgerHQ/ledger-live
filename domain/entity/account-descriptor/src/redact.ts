const SEP = String.raw`(?::|%3A)`;
const DESCRIPTOR = new RegExp(
  String.raw`\b(?:account|mock)${SEP}2${SEP}(?:utxo|address)${SEP}[^\s"'\`<>,;&?#]*[\dhH']`,
  "gi",
);

/** Replaces every v2 descriptor string in a text (an error message, a stack, a log) with `[redacted]`. */
export function redactAccountDescriptors(text: string): string {
  return text.replace(DESCRIPTOR, "[redacted]");
}

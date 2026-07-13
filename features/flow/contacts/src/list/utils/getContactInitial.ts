const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

export function getContactInitial(name: string): string {
  const initial = graphemeSegmenter?.segment(name).containing(0)?.segment;

  if (initial !== undefined) {
    return initial.toUpperCase();
  }

  const initialCodePoint = name.codePointAt(0);

  return initialCodePoint === undefined ? "" : String.fromCodePoint(initialCodePoint).toUpperCase();
}

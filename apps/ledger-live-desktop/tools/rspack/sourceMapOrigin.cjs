// Maps an offset in an emitted chunk back to the package or app file it came from.

const B64 = new Map(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]),
);

// Hand-rolled: no source-map library is reachable from this package.
function decodeMappings(mappings) {
  const perLine = [];
  let sourceIndex = 0;
  for (const lineText of mappings.split(";")) {
    const segments = [];
    let generatedColumn = 0;
    for (const segmentText of lineText.split(",")) {
      if (!segmentText) continue;
      const values = [];
      let shift = 0;
      let value = 0;
      for (const char of segmentText) {
        const digit = B64.get(char);
        if (digit === undefined) break;
        value += (digit & 31) << shift;
        if (digit & 32) {
          shift += 5;
          continue;
        }
        const negative = value & 1;
        value >>= 1;
        values.push(negative ? -value : value);
        shift = 0;
        value = 0;
      }
      if (values.length === 0) continue;
      generatedColumn += values[0];
      const isMapped = values.length >= 4;
      segments.push([generatedColumn, isMapped ? (sourceIndex += values[1]) : null]);
    }
    perLine.push(segments);
  }
  return perLine;
}

function sourceAt(decoded, sources, line, column) {
  const segments = decoded[line - 1];
  if (!segments || segments.length === 0) return null;
  let found = null;
  for (const [generatedColumn, sourceIndex] of segments) {
    if (generatedColumn > column) break;
    found = sourceIndex;
  }
  return found === null ? null : (sources[found] ?? null);
}

function originOf(source) {
  const parts = source.split(/[\\/]node_modules[\\/]/);
  const tail = parts[parts.length - 1];
  if (!tail) return source;
  return parts.length === 1
    ? tail.replace(/^webpack:\/\/[^/]*\//, "").replace(/^(?:\.\.?\/)+/, "")
    : tail;
}

function originLookup(code, raw) {
  const decoded = decodeMappings(raw.mappings);
  const lineStarts = [];
  for (let offset = 0; ;) {
    lineStarts.push(offset);
    const next = code.indexOf("\n", offset);
    if (next === -1) break;
    offset = next + 1;
  }
  return index => {
    let line = lineStarts.findIndex(start => start > index);
    line = line === -1 ? lineStarts.length : line;
    const source = sourceAt(decoded, raw.sources, line, index - lineStarts[line - 1]);
    return source ? originOf(source) : null;
  };
}

module.exports = { originLookup };

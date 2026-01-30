import storageWrapper from ".";

const savedStats = new Map<string, { timePerKey: number; writes: number; keys: string[] }>();

let logInterval: NodeJS.Timeout | undefined;

export function monitorWrite(key: string | [string, unknown][], write: () => void) {
  if (!__DEV__) return write();
  const start = Date.now();

  write();

  const duration = Date.now() - start;
  const keys = Array.isArray(key) ? key.map(([k]) => k) : [key];
  const timePerKey = duration / keys.length;
  groupKeys(keys).forEach(group => {
    const name = group.prefix.endsWith(".") ? `${group.prefix}*` : group.prefix;
    let stat = savedStats.get(name);
    if (!stat) {
      stat = { timePerKey: 0, writes: 0, keys: [] };
      savedStats.set(name, stat);
    }
    stat.timePerKey =
      (stat.timePerKey * stat.writes + timePerKey * group.keys.length) /
      (stat.writes + group.keys.length);
    stat.writes = stat.writes + group.keys.length;
    stat.keys.push(...group.keys);
  });

  if (!logInterval) logInterval = setInterval(logStorageWrites, 10_000);
}

function groupKeys(keys: string[]) {
  if (keys.length === 1) return [{ prefix: keys[0], keys }];
  const groups: Array<{ prefix: string; keys: string[] }> = [];
  keys.forEach(key => {
    let group = groups.find(({ prefix }) => key.startsWith(prefix));
    if (!group) {
      const prefix = /\..*[ :]/.test(key) ? key.replace(/(\.)[^.]*$/, "$1") : key;
      group = { prefix, keys: [] };
      groups.push(group);
    }
    group.keys.push(key);
  });
  return groups;
}

function logStorageWrites() {
  let longestNameLength = 0;
  savedStats.forEach(value => {
    value.keys = Array.from(new Set([...value.keys]));
  });
  const data = Array.from(savedStats.entries())
    .map(([name, { timePerKey, writes, keys }]) => {
      longestNameLength = Math.max(longestNameLength, name.length);
      const keyCount = keys.length;
      const size = Array.from(keys)
        .map(k => storageWrapper.getString(k)?.length ?? 0)
        .reduce((a, b) => a + b);
      return { key: name, timePerKey, writes, size, keyCount };
    })
    .sort((a, b) => b.size - a.size);

  const col = [longestNameLength + 2, 12, 14, 14, 15];
  console.log(
    "[Storage] Writes:\n",
    toRow(["name", "keys count", "size (KB)", "writes / key", "avg time (ms)"]),
    toRow(["", ":", ":", ":", ":"], "-"),
    ...data.map(({ key, timePerKey, writes, size, keyCount }) =>
      toRow([
        key,
        keyCount,
        toFixed(3).format(size / 1024),
        toFixed(2, 0).format(writes / keyCount),
        toFixed(0).format(timePerKey * keyCount),
      ]),
    ),
  );

  function toRow(cells: unknown[], padding = " ") {
    const spaced = padding === " ";
    const spacingDiff = spaced ? 2 : 0;
    const row = cells
      .map((cell, i) =>
        i === 0
          ? String(cell).padEnd(col[i] - spacingDiff, padding)
          : String(cell).padStart(col[i] - spacingDiff, padding),
      )
      .join(spaced ? " | " : "|");
    return spaced ? `\n| ${row} |` : `\n|${row}|`;
  }
}
const toFixed = (fixedMax: number, fixedMin = fixedMax) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: fixedMax, minimumFractionDigits: fixedMin });

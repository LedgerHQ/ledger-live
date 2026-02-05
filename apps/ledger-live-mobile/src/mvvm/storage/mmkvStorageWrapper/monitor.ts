type Stat = { timePerKey: number; samples: number; sizes: Map<string, number> };
const stats = { read: new Map<string, Stat>(), write: new Map<string, Stat>() };
type Op = keyof typeof stats;

const totalTime: Record<Op, number> = { read: 0, write: 0 };
const totalSize: Record<Op, number> = { read: 0, write: 0 };

const sizes = new Map<string, number>();
let isMonitoring = false;

let logInterval: NodeJS.Timeout | undefined;

export function monitor<R, T = undefined>(
  operation: Op,
  input: { key: string | string[] | [string, unknown][]; value?: T | undefined },
  fn: () => R,
): R {
  if (!__DEV__) return fn();
  const start = Date.now();

  const wasMonitoring = isMonitoring;
  isMonitoring = true;
  const res = fn();
  if (!wasMonitoring) isMonitoring = false;

  if (
    operation === "read" &&
    typeof input.key === "string" &&
    (res === null || typeof res === "string")
  ) {
    const size = typeof res === "string" ? res.length : 0;
    sizes.set(input.key, size);
  } else if (operation === "write" && typeof input.key === "string" && "value" in input) {
    const size = typeof input.value === "string" ? input.value.length : 0;
    sizes.set(input.key, size);
  }

  if (isMonitoring) return res;

  const duration = Date.now() - start;
  totalTime[operation] += duration;
  const keys = Array.isArray(input.key)
    ? input.key.map(item => (typeof item === "string" ? item : item[0]))
    : [input.key];
  const timePerKey = duration / keys.length;
  groupKeys(keys).forEach(group => {
    const name = group.prefix.endsWith(".") ? `${group.prefix}*` : group.prefix;
    let stat = stats[operation].get(name);
    if (!stat) {
      stat = { timePerKey: 0, samples: 0, sizes: new Map() };
      stats[operation].set(name, stat);
    }
    stat.timePerKey =
      (stat.timePerKey * stat.samples + timePerKey * group.keys.length) /
      (stat.samples + group.keys.length);
    stat.samples = stat.samples + group.keys.length;
    group.keys.forEach(k => {
      const size = sizes.get(k) ?? 0;
      stat.sizes.set(k, size);
      totalSize[operation] += size;
    });
  });

  if (!logInterval) logInterval = setInterval(logBoth, 10_000);

  return res;
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

function logBoth() {
  logStorage("read");
  logStorage("write");
}

const MAX_NAME_LENGTH = 40;
const lastLoggedSize: Record<Op, number> = { read: 0, write: 0 };
function logStorage(op: Op) {
  if (!__DEV__) return;
  if (totalSize[op] === lastLoggedSize[op]) return;
  lastLoggedSize[op] = totalSize[op];

  let longestNameLength = 0;
  const data = Array.from(stats[op].entries())
    .map(([name, { timePerKey, samples, sizes }]) => {
      longestNameLength = Math.min(Math.max(longestNameLength, name.length), MAX_NAME_LENGTH);
      const keyCount = sizes.size;
      const size = Array.from(sizes.values()).reduce((a, b) => a + b, 0);
      return { name, timePerKey, samples, keyCount, size };
    })
    .sort((a, b) => b.size - a.size);

  const col = [longestNameLength + 2, 12, 14, 14, 15];
  const verb = op === "read" ? "reading" : "writing";
  console.log(
    `[Storage] Total time spent ${verb} ${toFixed(0).format(totalTime[op])} ms (${toFixed(3).format(totalSize[op] / 1024)} KB):\n`,
    toRow(["name", "keys count", "size (KB)", `${op}s / key`, "avg time (ms)"]),
    toRow(["", ":", ":", ":", ":"], "-"),
    ...data.map(({ name, timePerKey, samples, size, keyCount }) =>
      toRow([
        truncate(name, MAX_NAME_LENGTH),
        keyCount,
        toFixed(3).format(size / 1024),
        toFixed(2, 0).format(samples / keyCount),
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

const truncate = (str: string, max: number) =>
  str.length > max ? `${str.slice(0, max - 1)}…` : str;

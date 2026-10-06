import { execFileSync } from "node:child_process";

/**
 * Estimates how much a PR grows node_modules from the pnpm-lock.yaml diff, without any install.
 *
 * Every lockfile entry is one directory in node_modules/.pnpm (peer variants count separately, like pnpm).
 * Only entries whose count differs between base and head are priced, with the registry `unpackedSize`.
 * Optional os/cpu/libc packages follow `pnpm.supportedArchitectures` of each ref, else the host platform.
 */

const ENTRY_RE = /^ {2}(['"]?)([^'"\s].*?)\1:(?: \{\})?\s*$/;
const LIST_RE = /^ {4}(cpu|os|libc): \[(.*)\]\s*$/;
const RELIABILITY_PATHS = [".npmrc", "pnpm-workspace.yaml", "patches"];
const TOP = 5;
// CI runs on glibc Linux; pnpm only installs the libc variant matching the host
const HOST_LIBC = "glibc";
// HEAD is the PR merge commit and HEAD^1 the tip of the base branch
// Shared by all size lookups, so a registry outage cannot stall the required Danger job
const FETCH_BUDGET_MS = 2 * 60_000;
const BASE = "HEAD^1";
const HEAD = "HEAD";

type Platform = { os: string[]; cpu: string[]; libc: string[] };
type Lockfile = { installs: string[]; meta: Map<string, Platform> };
type Host = { os: string; cpu: string };
type Counts = Map<string, number>;
type Mover = { name: string; deltaBytes: number; added: string[]; removed: string[] };

export type SizeReport = { exceedsThreshold: boolean; markdown: string };

function splitKey(key: string): { name: string; version: string } | null {
  const base = key.split("(", 1)[0].replace(/^\/+/, "");
  const i = base.lastIndexOf("@");
  if (i <= 0) return null;
  const name = base.slice(0, i);
  const version = base.slice(i + 1);
  if (!version || !/^\d/.test(version) || version.includes("/") || name.includes(":")) return null;
  return { name, version };
}

const parseList = (raw: string) =>
  raw
    .split(",")
    .map(x => x.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

function matches(values: string[], current: string) {
  if (!values.length) return true;
  const allow = values.filter(v => !v.startsWith("!"));
  const deny = values.filter(v => v.startsWith("!")).map(v => v.slice(1));
  if (deny.includes(current)) return false;
  return !allow.length || allow.includes(current);
}

/** Supports lockfileVersion 6.0 (`/name@version` keys) and 9.0 (`name@version`). */
function parseLockfile(text: string): Lockfile {
  const installs: string[] = [];
  const meta = new Map<string, Platform>();
  const skipped = new Set<string>();
  let section: string | null = null;
  let v9 = false;
  let cur: string | null = null;
  for (const line of text.split("\n")) {
    if (line && !/^\s/.test(line) && !line.startsWith("#")) {
      const idx = line.indexOf(":");
      section = line.slice(0, idx);
      if (section === "lockfileVersion") {
        v9 = line
          .slice(idx + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "")
          .startsWith("9");
      }
      cur = null;
      continue;
    }
    if (section !== "packages" && section !== "snapshots") continue;
    const m = ENTRY_RE.exec(line);
    if (m) {
      const parsed = splitKey(m[2]);
      cur = parsed && `${parsed.name}@${parsed.version}`;
      // v9: `packages` holds metadata and `snapshots` the installed dirs. v5/v6: `packages` holds both.
      if (cur && ((v9 && section === "snapshots") || (!v9 && section === "packages"))) {
        installs.push(cur);
      }
      continue;
    }
    if (!cur || section !== "packages") continue;
    if (
      line.startsWith("    resolution:") &&
      (line.includes("directory:") ||
        line.includes("repo:") ||
        line.includes("tarball: file") ||
        line.includes("type: git"))
    ) {
      skipped.add(cur);
      continue;
    }
    const lm = LIST_RE.exec(line);
    if (lm) {
      const field = lm[1];
      const entry = meta.get(cur) ?? { os: [], cpu: [], libc: [] };
      if (field === "os" || field === "cpu" || field === "libc") entry[field] = parseList(lm[2]);
      meta.set(cur, entry);
    }
  }
  return { installs: installs.filter(k => !skipped.has(k)), meta };
}

/** Platforms pnpm installs optional deps for, or null when only the host is installed. */
function supportedArchitectures(packageJsonText: string | null, host: Host): Platform | null {
  let sa;
  try {
    sa = JSON.parse(packageJsonText ?? "{}").pnpm?.supportedArchitectures;
  } catch {
    return null;
  }
  if (!sa) return null;
  const resolve = (vals: string[], current: string) => [
    ...new Set(vals.map(v => (v === "current" ? current : v))),
  ];
  return {
    os: resolve(sa.os ?? ["current"], host.os),
    cpu: resolve(sa.cpu ?? ["current"], host.cpu),
    libc: resolve(sa.libc ?? ["current"], HOST_LIBC),
  };
}

/** Directory count per "name@version" for what the config installs (`all` ignores the platform filter). */
function countInstalls(
  { installs, meta }: Lockfile,
  arch: Platform | null,
  host: Host,
  all: boolean,
): Counts {
  const allowed = arch ?? { os: [host.os], cpu: [host.cpu], libc: [HOST_LIBC] };
  const counts: Counts = new Map();
  for (const key of installs) {
    const m = meta.get(key);
    const ok =
      all ||
      !m ||
      (allowed.os.some(o => matches(m.os, o)) &&
        allowed.cpu.some(c => matches(m.cpu, c)) &&
        allowed.libc.some(l => matches(m.libc, l)));
    if (ok) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

const changedKeys = (a: Counts, b: Counts) =>
  [...new Set([...a.keys(), ...b.keys()])].filter(k => (a.get(k) ?? 0) !== (b.get(k) ?? 0));

/** Sum of size * (head count - base count), and per package name, biggest first. */
function priceDiff(base: Counts, head: Counts, sizeOf: (key: string) => number) {
  let total = 0;
  const byName = new Map<string, Mover>();
  for (const key of new Set([...base.keys(), ...head.keys()])) {
    const dCount = (head.get(key) ?? 0) - (base.get(key) ?? 0);
    if (!dCount) continue;
    const delta = dCount * sizeOf(key);
    total += delta;
    const at = key.lastIndexOf("@");
    const name = key.slice(0, at);
    const entry = byName.get(name) ?? { name, deltaBytes: 0, added: [], removed: [] };
    entry.deltaBytes += delta;
    (dCount > 0 ? entry.added : entry.removed).push(key.slice(at + 1));
    byName.set(name, entry);
  }
  const movers = [...byName.values()]
    .filter(e => e.deltaBytes)
    .sort((a, b) => Math.abs(b.deltaBytes) - Math.abs(a.deltaBytes));
  return { total, movers };
}

function unpackedSize(body: unknown): number | null {
  if (typeof body !== "object" || body === null || !("dist" in body)) return null;
  const { dist } = body;
  if (typeof dist !== "object" || dist === null || !("unpackedSize" in dist)) return null;
  return typeof dist.unpackedSize === "number" ? dist.unpackedSize : null;
}

async function fetchSize(
  registry: string,
  key: string,
  deadline: AbortSignal,
): Promise<number | null> {
  const at = key.lastIndexOf("@");
  const url = `${registry}/${key.slice(0, at)}/${key.slice(at + 1)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    let status = 0;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.any([AbortSignal.timeout(30_000), deadline]),
      });
      status = res.status;
      if (res.ok) return unpackedSize(await res.json());
    } catch {
      // retried below
    }
    if (deadline.aborted) break;
    if (status === 404 || status === 410) return null;
    // auth and other client errors will not heal by retrying
    if (status >= 400 && status < 500 && status !== 429) break;
    await new Promise(r => setTimeout(r, 1000 + attempt * 2000));
  }
  throw new Error(`failed to fetch ${key}`);
}

/** Lookups still pending when the shared deadline expires count as failed. */
async function fetchSizes(keys: string[], registry: string, workers = 32) {
  const sizes = new Map<string, number | null>();
  const deadline = AbortSignal.timeout(FETCH_BUDGET_MS);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, keys.length) }, async () => {
      while (next < keys.length && !deadline.aborted) {
        const key = keys[next++];
        try {
          sizes.set(key, await fetchSize(registry, key, deadline));
        } catch {
          // counted as failed below
        }
      }
    }),
  );
  return { sizes, failed: keys.length - sizes.size };
}

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const gitShow = (ref: string, path: string) => {
  try {
    return git("show", `${ref}:${path}`);
  } catch {
    return null;
  }
};

function pnpmSection(ref: string) {
  try {
    return JSON.stringify(JSON.parse(gitShow(ref, "package.json") ?? "{}").pnpm ?? null);
  } catch {
    return null;
  }
}

const formatMb = (bytes: number) =>
  `${bytes >= 0 ? "+" : "−"}${(Math.abs(bytes) / 1e6).toFixed(1)} MB`;

function renderMarkdown(r: {
  hostLabel: string;
  arch: boolean;
  installedDeltaBytes: number;
  allPlatformsDeltaBytes: number;
  movers: Mover[];
  packageJsonChanged: boolean;
  unreliable: string[];
  unknownSizes: number;
}) {
  const lines = [
    `## 📦 node_modules size: ${formatMb(r.installedDeltaBytes)}`,
    "",
    `Estimated from \`pnpm-lock.yaml\` (${r.hostLabel}${r.arch ? ", `supportedArchitectures`" : ""}), all platforms: ${formatMb(r.allPlatformsDeltaBytes)}.`,
  ];
  if (r.movers.length) {
    lines.push("", "| Package | Delta | Versions |", "| --- | ---: | --- |");
    for (const m of r.movers.slice(0, TOP)) {
      const versions = [...m.added.map(v => `+${v}`), ...m.removed.map(v => `−${v}`)]
        .slice(0, 4)
        .join(", ");
      lines.push(`| \`${m.name}\` | ${formatMb(m.deltaBytes)} | ${versions} |`);
    }
  }
  if (!r.packageJsonChanged) {
    lines.push(
      "",
      "No `package.json` changed: the lockfile alone re-resolved dependencies (transitive bump or dedupe).",
    );
  }
  if (r.unreliable.length) {
    lines.push(
      "",
      `⚠️ \`${r.unreliable.join("`, `")}\` changed: the estimate may be off, measure a real install if it matters.`,
    );
  }
  if (r.unknownSizes) {
    lines.push(
      "",
      `${r.unknownSizes} changed package version(s) have no size in the registry (counted as 0).`,
    );
  }
  return lines.join("\n");
}

/** Throws when sizes cannot be fetched, since a delta priced at 0 would read as "no impact". */
export async function estimateNodeModulesSizeDelta(thresholdMb: number): Promise<SizeReport> {
  const host: Host = { os: process.platform, cpu: process.arch };
  // CI points npm at Artifactory (jfrog-npm-auth), so sizes come from the same registry as installs
  const registry = execFileSync("npm", ["config", "get", "registry"], { encoding: "utf8" })
    .trim()
    .replace(/\/$/, "");

  const baseLock = parseLockfile(gitShow(BASE, "pnpm-lock.yaml") ?? "");
  const headLock = parseLockfile(gitShow(HEAD, "pnpm-lock.yaml") ?? "");
  const meta = new Map([...baseLock.meta, ...headLock.meta]);
  const baseArch = supportedArchitectures(gitShow(BASE, "package.json"), host);
  const headArch = supportedArchitectures(gitShow(HEAD, "package.json"), host);

  const base = { installs: baseLock.installs, meta };
  const head = { installs: headLock.installs, meta };
  const installedBase = countInstalls(base, baseArch, host, false);
  const installedHead = countInstalls(head, headArch, host, false);
  const allBase = countInstalls(base, baseArch, host, true);
  const allHead = countInstalls(head, headArch, host, true);

  const needed = [
    ...new Set([...changedKeys(installedBase, installedHead), ...changedKeys(allBase, allHead)]),
  ];
  const { sizes, failed } = await fetchSizes(needed, registry);
  if (failed) throw new Error(`${failed} size lookups failed on ${registry}`);
  const sizeOf = (key: string) => sizes.get(key) ?? 0;

  const installed = priceDiff(installedBase, installedHead, sizeOf);
  const all = priceDiff(allBase, allHead, sizeOf);

  const changedFiles = git("diff", "--name-only", BASE, HEAD).split("\n").filter(Boolean);
  const unreliable = RELIABILITY_PATHS.filter(p =>
    changedFiles.some(f => f === p || f.startsWith(`${p}/`)),
  );
  if (pnpmSection(BASE) !== pnpmSection(HEAD)) unreliable.push("package.json#pnpm");

  return {
    exceedsThreshold: installed.total >= thresholdMb * 1e6,
    markdown: renderMarkdown({
      hostLabel: `${host.os}-${host.cpu}`,
      arch: Boolean(headArch),
      installedDeltaBytes: installed.total,
      allPlatformsDeltaBytes: all.total,
      movers: installed.movers.length ? installed.movers : all.movers,
      packageJsonChanged: changedFiles.some(
        f => f === "package.json" || f.endsWith("/package.json"),
      ),
      unreliable,
      unknownSizes: needed.filter(k => sizes.get(k) == null).length,
    }),
  };
}

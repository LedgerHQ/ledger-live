#!/usr/bin/env node
// Builds the effective config of each preset (code defaults + remote values, merged
// like LiveConfig.getValueByKey does) and a report comparing remote values to defaults.
// Usage: node build-report.mjs <outDir>
// Reads <outDir>/defaults.json and <outDir>/remote/*.json, writes <outDir>/<preset>.json,
// <outDir>/report.json and <outDir>/summary.md.
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.argv[2] ?? "out");
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

// Status types of CurrencyConfig in @ledgerhq/coin-module-framework.
const VALID_STATUS_TYPES = new Set([
  "active",
  "under_maintenance",
  "migration",
  "feature_unavailable",
  "will_be_deprecated",
  "deprecated",
]);

const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

// Same semantics as lodash `merge` for JSON values: plain objects and arrays are
// merged recursively (arrays by index), undefined source values are skipped.
function merge(target, source) {
  if (source === undefined) return target;
  if (isPlainObject(target) && isPlainObject(source)) {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) result[key] = merge(target[key], value);
    return result;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    const result = [...target];
    source.forEach((value, index) => (result[index] = merge(target[index], value)));
    return result;
  }
  return source;
}

// Same semantics as the Firebase provider parser in libs/live-config.
function parseRemote(raw, type) {
  switch (type) {
    case "string":
      return raw;
    case "number":
      return Number(raw);
    case "boolean":
      return /^(1|true|t|yes|y|on)$/i.test(raw);
    default:
      try {
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return undefined;
      }
  }
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function statusIssue(value) {
  if (!isPlainObject(value) || !("status" in value)) return undefined;
  const { status } = value;
  if (!isPlainObject(status)) return `status is ${JSON.stringify(status)}, expected an object`;
  if (!VALID_STATUS_TYPES.has(status.type))
    return `unknown status.type ${JSON.stringify(status.type)}`;
  return undefined;
}

const defaults = readJson(path.join(outDir, "defaults.json"));
const defaultsGitSha = process.env.GITHUB_SHA;
const remoteFiles = fs
  .readdirSync(path.join(outDir, "remote"))
  .filter(file => file.endsWith(".json"))
  .sort();

const presets = remoteFiles.map(file => {
  const { meta, entries } = readJson(path.join(outDir, "remote", file));
  const configKeys = new Set([
    ...Object.keys(defaults),
    ...Object.keys(entries).filter(key => key.startsWith("config_")),
  ]);

  const config = {};
  const issues = {
    remoteOnly: [],
    invalidRemote: [],
    invalidStatus: [],
    statusChanged: [],
  };

  for (const key of [...configKeys].sort()) {
    const known = defaults[key];
    const hasRemote = key in entries;
    const remote = hasRemote ? parseRemote(entries[key], known?.type) : undefined;

    if (!known) {
      config[key] = { source: "remote", value: remote ?? entries[key] };
      issues.remoteOnly.push(key);
      continue;
    }
    if (hasRemote && remote === undefined) issues.invalidRemote.push(key);

    const value =
      known.type === "object" ? merge(known.default, remote) : (remote ?? known.default);
    const entry = {
      type: known.type,
      source: remote === undefined ? "default" : "remote",
      value,
    };
    if (entry.source === "remote") {
      entry.default = known.default;
      entry.remote = remote;
    }
    config[key] = entry;

    const issue = statusIssue(value);
    if (issue)
      issues.invalidStatus.push({
        key,
        issue,
        alsoInDefault: !!statusIssue(known.default),
      });
    const from = known.default?.status?.type;
    const to = value?.status?.type;
    if (from !== to) issues.statusChanged.push({ key, from, to });
  }

  const featureFlags = {};
  const other = {};
  for (const [key, raw] of Object.entries(entries)) {
    if (key.startsWith("config_")) continue;
    const target = key.startsWith("feature_") ? featureFlags : other;
    target[key] = parseRemote(raw, "object") ?? raw;
  }

  const effective = {
    meta: { ...meta, defaultsGitSha },
    config,
    featureFlags,
    other,
  };
  fs.writeFileSync(path.join(outDir, `${meta.preset}.json`), JSON.stringify(effective, null, 2));
  return { meta, effective, issues };
});

function divergingKeys(pick) {
  const keys = new Set(presets.flatMap(p => Object.keys(pick(p.effective))));
  return [...keys]
    .filter(key =>
      presets.some(p => !equal(pick(p.effective)[key], pick(presets[0].effective)[key])),
    )
    .sort();
}

const report = {
  generatedAt: new Date().toISOString(),
  defaultsGitSha,
  templateVersions: Object.fromEntries(presets.map(p => [p.meta.preset, p.meta.templateVersion])),
  presets: Object.fromEntries(
    presets.map(({ meta, effective, issues }) => {
      const entries = Object.values(effective.config);
      return [
        meta.preset,
        {
          counts: {
            config: entries.length,
            fromRemote: entries.filter(e => e.source === "remote").length,
            fromDefault: entries.filter(e => e.source === "default").length,
            featureFlags: Object.keys(effective.featureFlags).length,
          },
          ...issues,
        },
      ];
    }),
  ),
  divergingConfig: divergingKeys(e =>
    Object.fromEntries(Object.entries(e.config).map(([k, v]) => [k, v.value])),
  ),
  divergingFeatureFlags: divergingKeys(e => e.featureFlags),
};
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

const list = items => (items.length ? items.map(item => `- ${item}`).join("\n") : "_none_");
const code = value => `\`${value}\``;
const lines = [
  "## Remote config export",
  "",
  "| Preset | Template | Config keys | From remote | From default | Feature flags |",
  "|---|---|---|---|---|---|",
  ...presets.map(({ meta }) => {
    const { counts } = report.presets[meta.preset];
    return `| ${meta.preset} | ${meta.templateVersion} | ${counts.config} | ${counts.fromRemote} | ${counts.fromDefault} | ${counts.featureFlags} |`;
  }),
  "",
];
for (const { meta } of presets) {
  const r = report.presets[meta.preset];
  lines.push(
    `### ${meta.preset}`,
    "",
    `**Invalid status (${r.invalidStatus.length})**`,
    list(
      r.invalidStatus.map(
        i => `${code(i.key)}: ${i.issue}${i.alsoInDefault ? " (also in code default)" : ""}`,
      ),
    ),
    "",
    `**Status changed by remote (${r.statusChanged.length})**`,
    list(r.statusChanged.map(i => `${code(i.key)}: ${i.from} → ${i.to}`)),
    "",
    `**Unparsable remote values (${r.invalidRemote.length})**`,
    list(r.invalidRemote.map(code)),
    "",
    `**Remote keys unknown to the code (${r.remoteOnly.length})**`,
    list(r.remoteOnly.map(code)),
    "",
  );
}
lines.push(
  `### Differences between presets`,
  "",
  `**Config (${report.divergingConfig.length})**`,
  list(report.divergingConfig.map(code)),
  "",
  `**Feature flags (${report.divergingFeatureFlags.length})**`,
  list(report.divergingFeatureFlags.map(code)),
  "",
);
fs.writeFileSync(path.join(outDir, "summary.md"), lines.join("\n"));
console.log(`Report written to ${outDir}`);

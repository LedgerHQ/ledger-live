type Deps = Record<string, string>;

const deps = (indent: string, entries: Deps) =>
  Object.entries(entries).map(([name, version]) => `${indent}${name}: ${version}`);

/** A lockfileVersion 9.0 text: importer "." depends on `root`, each snapshot on its own deps. */
export function lockfile(root: Deps, snapshots: Record<string, Deps>) {
  return [
    "lockfileVersion: '9.0'",
    "",
    "importers:",
    "",
    "  .:",
    "    dependencies:",
    ...Object.entries(root).flatMap(([name, version]) => [
      `      ${name}:`,
      `        specifier: ${version}`,
      `        version: ${version}`,
    ]),
    "",
    "packages:",
    "",
    ...[...new Set(Object.keys(snapshots).map(key => key.split("(", 1)[0]))].flatMap(key => [
      `  '${key}':`,
      "    resolution: {integrity: sha512-x}",
      "",
    ]),
    "snapshots:",
    "",
    ...Object.entries(snapshots).flatMap(([key, entries]) =>
      Object.keys(entries).length
        ? [`  '${key}':`, "    dependencies:", ...deps("      ", entries), ""]
        : [`  '${key}': {}`, ""],
    ),
  ].join("\n");
}

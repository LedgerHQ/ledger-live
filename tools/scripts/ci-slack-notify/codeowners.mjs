// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

/** Last matching CODEOWNERS rule wins */
export function parseCodeowners(text) {
  return text.split(/\r?\n/).flatMap(rawLine => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return [];
    const [pattern, ...rest] = line.split(/\s+/);
    const owners = rest.filter(part => part.startsWith("@"));
    return pattern && owners.length > 0 ? [{ pattern, owners }] : [];
  });
}

export const normalizeOwner = owner => owner.toLowerCase();

export function ownersForPath(rules, path) {
  let owners = [];
  for (const { pattern, owners: ruleOwners } of rules) {
    if (pattern === "*") {
      owners = ruleOwners;
      continue;
    }
    const prefix = pattern.replace(/^\//, "");
    const isDir = prefix.endsWith("/")
      ? path === prefix.slice(0, -1) || path.startsWith(prefix)
      : path === prefix || path.startsWith(`${prefix}/`);
    if (isDir) owners = ruleOwners;
  }
  return owners;
}

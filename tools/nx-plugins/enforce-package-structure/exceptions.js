"use strict";

// Packages allowed to bend a rule, keyed by project root. Keep this list short and justified:
// every entry is a place where the convention does not hold, not a place where it is inconvenient.
//
// `skip` exempts the package from the barrel rule: none of its barrels are checked.
// `allowNonRelative` is narrower: it lifts only the proxy rule, for a package whose job *is* to
// re-expose another one. Prefer `allowNonRelative`, and prefer neither.
//
// Every entry is temporary. Give each one an exit condition so it can be deleted rather than
// inherited.

/** @type {Record<string, { skip?: boolean, allowNonRelative?: boolean, reason: string }>} */
const PACKAGE_EXCEPTIONS = {
  "shared/env": {
    skip: true,
    reason:
      "TEMPORARY. Deprecated typed facade over the legacy @ledgerhq/live-env (see " +
      ".agents/skills/configuration), holding the repo's only BOUNDARY_EXCEPTION " +
      "(tools/nx-plugins/enforce-boundaries/constraints.js). Its barrel carries the wrapping " +
      "itself, and the package is retired rather than restructured. Exit condition: once its " +
      "last definition has migrated, the package is deleted, and this entry with it.",
  },
};

// Component rule waivers (R1 to R5) keyed by project root, then by component name or entry
// subpath. `skip` above does not reach these rules.
//
// R1 to R5 take no waiver: fix the component instead of adding an entry here. The rollout cleared
// every waiver; the linter still takes this map, and a stale entry fails the check. Leave it empty.

/** @type {Record<string, Record<string, { rules: string[], reason: string }>>} */
const COMPONENT_EXCEPTIONS = {};

// Files allowed to keep their violations, keyed by posix path from the repo root. These are the
// modules a barrel reaches through `export *`, or that `package.json#exports` names, which held
// a named re-export or a proxy before the rule followed them. The list only shrinks: a test fails
// on an entry whose file is gone or no longer has a violation.

const NAMED_REEXPORT =
  "TEMPORARY. Picks names from a file it re-exports, so that file mixes public and private. " +
  "Exit condition: move the private part to an internals location and write `export * from`, " +
  "then delete this entry.";

const WORKSPACE_PROXY =
  "TEMPORARY. Re-exports another workspace package, so this package is a proxy for it. Exit " +
  "condition: consumers import the original provider and declare it, this file goes, then delete " +
  "this entry.";

const THIRD_PARTY_PROXY =
  "TEMPORARY. Re-exports `useTheme` from styled-components, a proxy for a third-party package. " +
  "Exit condition: consumers import it from the provider, or the package owns a hook of its own, " +
  "then delete this entry.";

const INTERNALS_REEXPORT =
  "TEMPORARY. Re-exports from an internals location, which makes private code public. Exit " +
  "condition: move what is public out of internals, then delete this entry.";

/** @type {Record<string, string>} */
const FILE_EXCEPTIONS = {
  "domain/entity/client-identity/src/types.ts": NAMED_REEXPORT,
  "domain/entity/contact/src/cloudSync/module.ts": NAMED_REEXPORT,
  "features/platform/contacts/src/contactDeviceIntentsPort.ts": NAMED_REEXPORT,
  "features/platform/content-ab-tests/src/store.ts": INTERNALS_REEXPORT,
  "features/platform/style/src/hooks/useTheme.native.ts": THIRD_PARTY_PROXY,
  "features/platform/style/src/hooks/useTheme.web.ts": THIRD_PARTY_PROXY,
  "shared/analytics/src/analyticsEvents.ts": INTERNALS_REEXPORT,
  "shared/feature-flags/src/data/schema.ts": NAMED_REEXPORT,
};

module.exports = { COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, PACKAGE_EXCEPTIONS };

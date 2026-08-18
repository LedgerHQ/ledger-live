"use strict";

// Packages allowed to bend a rule, keyed by project root. Keep this list short and justified:
// every entry is a place where the convention does not hold, not a place where it is inconvenient.
//
// `skip` exempts the package entirely — none of its barrels are checked.
// `allowNonRelative` is narrower: it lifts only the proxy rule, for a package whose job *is* to
// re-expose another one. Prefer `allowNonRelative`, and prefer neither.
//
// Every entry is temporary. Give each one an exit condition so it can be deleted rather than
// inherited.

const OWNING_TEAM_DEFERRAL =
  "TEMPORARY. Conformant barrels were prepared and verified for this package, then reverted so the " +
  "owning team can land the change on its own schedule. Exit condition: the team converts its " +
  '`index.*` files to `export * from "./x"`, moving anything private to an internals location, ' +
  "then deletes this entry. Nothing here is blocked — only deferred.";

/** @type {Record<string, { skip?: boolean, allowNonRelative?: boolean, reason: string }>} */
const PACKAGE_EXCEPTIONS = {
  // @ledgerhq/engagement
  "features/flow/analytics-consent": { skip: true, reason: OWNING_TEAM_DEFERRAL },
  "features/flow/large-screen-upsell": { skip: true, reason: OWNING_TEAM_DEFERRAL },
  "features/flow/lazy-onboarding-banner": { skip: true, reason: OWNING_TEAM_DEFERRAL },

  // @ledgerhq/ptx
  "features/flow/pay-card-auth": { skip: true, reason: OWNING_TEAM_DEFERRAL },

  "shared/env": {
    skip: true,
    reason:
      "TEMPORARY. Typed facade over the legacy @ledgerhq/live-env, holding the repo's only " +
      "BOUNDARY_EXCEPTION (tools/nx-plugins/enforce-boundaries/constraints.js) — it is the single " +
      "legal path to that lib for new-architecture consumers, and its barrel currently carries the " +
      "wrapping itself. Exit condition: move the facade out of src/index.ts into a named file " +
      '(src/env.ts) and leave `export * from "./env"` behind, then delete this entry. That was ' +
      "measured to work with no consumer impact; it is deferred, not blocked.",
  },
};

module.exports = { PACKAGE_EXCEPTIONS };

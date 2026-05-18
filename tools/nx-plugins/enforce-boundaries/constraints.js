"use strict";

/**
 * Module-boundary dependency constraints for the new architecture
 * (domain/, shared/, features/). Shape mirrors @nx/enforce-module-boundaries
 * depConstraints so this config ports verbatim to .oxlintrc.json when
 * @nx/oxlint publishes stable.
 *
 * A rule fires only when the source package has the sourceTag. Legacy
 * packages without matching tags (libs/, apps/, e2e/, tools/) are
 * unconstrained on purpose.
 */
const DEP_CONSTRAINTS = [
  { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
  { sourceTag: "scope:domain", onlyDependOnLibsWithTags: ["scope:domain", "scope:shared"] },
  {
    sourceTag: "scope:features",
    onlyDependOnLibsWithTags: ["scope:features", "scope:domain", "scope:shared"],
  },
  {
    sourceTag: "type:domain-entity",
    onlyDependOnLibsWithTags: ["type:domain-entity", "scope:shared"],
  },
  {
    sourceTag: "type:domain-api",
    onlyDependOnLibsWithTags: ["type:domain-entity", "type:domain-api", "scope:shared"],
  },
  {
    sourceTag: "type:feature-platform",
    onlyDependOnLibsWithTags: ["type:feature-platform", "scope:domain", "scope:shared"],
  },
  {
    sourceTag: "type:feature-flow",
    onlyDependOnLibsWithTags: [
      "type:feature-flow",
      "type:feature-platform",
      "scope:domain",
      "scope:shared",
    ],
  },
];

module.exports = { DEP_CONSTRAINTS };

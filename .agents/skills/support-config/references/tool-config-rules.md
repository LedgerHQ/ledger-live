# `lint:tool-config` rules and their fixes

The check lives in [`tools/nx-plugins/enforce-tool-config`](../../../../tools/nx-plugins/enforce-tool-config),
one module per rule under `rules/`. Each violation prints as `[rule] file: message`. The fix is
always to move the setting into its preset, never to keep it in the package.

## `fmt`

One oxfmt config for the repository: [`support/fmt/oxfmt.config.mts`](../../../../support/fmt/oxfmt.config.mts),
re-exported by the workspace root.

| Message | Fix |
| --- | --- |
| `oxfmt config outside support/fmt` | Delete the `oxfmt.config.*` or `.oxfmtrc.*` in the package, below it or between it and the root. Add the ignore pattern it carried to `support/fmt/oxfmt.config.mts`, as a path from the workspace root. |
| `script "<name>" passes a config to oxfmt` | Drop `-c` / `--config` from the script: `oxfmt src`. |

## `lint`

One oxlint config per layer root, a one-line re-export of its `@support/lint` preset. The layer roots
and their presets are listed in `LAYER_CONFIGS` of [`rules/lint.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs).

| Message | Fix |
| --- | --- |
| `oxlint config outside a layer root` | Delete the config. Put the rule it carried in the layer's preset in `support/lint`. |
| `layer config missing` | Restore the layer root's `oxlint.config.mts` with the `export { default } from "@support/lint/<preset>";` line the message gives. |
| `a layer config only re-exports its preset` | Reduce the layer config to that one line. A change of rules goes in the preset. |
| `script "<name>" passes a config to oxlint` | Drop `-c` / `--config`: `oxlint src`. |
| `script "<name>" sets <flag>: rule flags go on the "lint" script only` | Move the flag to the `lint` script. |
| `script "lint" sets <flag>, which is not in the allowlist` | Set the rule in the layer's preset. Extend `ALLOWED_RULE_FLAGS` in `rules/lint.mjs` only for a rule one package alone needs, with the reason. |

## `jest`

Checks the packages that depend on `@support/jest`: each `jest*.config.*` exports one
`create*Config(...)` call from `@support/jest/<preset>` and nothing else. The arguments are not
checked.

| Message | Fix |
| --- | --- |
| `depends on @support/jest but has no jest config built by one of its presets` | Add a `jest.config.js` calling the layer's factory, or drop the dependency if the package has no tests. |
| `exports no config` / `assigns its export more than once` / `exports something other than a single config` | Make the file a single `module.exports = <factory>(...)` (or `export default`). |
| `exports a config that is not built by a @support/jest preset factory` | Replace the hand-written object with the factory of the package's layer. |
| `changes the result of <factory>() instead of passing its overrides argument` | Move the spread, merge or property assignment into the factory's overrides argument. |

## `tsconfig`

Checks every `tsconfig*.json` of the package, nested ones included.

| Message | Fix |
| --- | --- |
| `must extend a @support/tsconfig preset` | Add `extends` with the archetype ([pick it](../SKILL.md#pick-the-tsconfig-archetype)). |
| `extends "<x>" is not a preset @support/tsconfig exports` | Use a preset listed in `support/tsconfig/package.json#exports`. |
| `extends "<x>" is neither a @support/tsconfig preset nor a sibling config` / `points outside the package` | Extend a preset, or a config of the same package, not another package's config or `tsconfig.base.json`. |
| `extends "<x>" is not a tsconfig*.json this rule checks` | Rename the parent to `tsconfig.<name>.json`. |
| `inherits no @support/tsconfig archetype` | Put an archetype before the `lib/build`, `lib/esm` or `lib/tests` mixin, or extend the package's own `tsconfig.json` first. |
| `"<key>" is not allowed in a package tsconfig` | Keep only `extends`, `compilerOptions`, `references`, `include`, `exclude`, `files`. |
| `compilerOptions.<key> belongs to a preset` | Delete the option. If the package really needs it, change or add a preset in `support/tsconfig`. |
| `<key> repeats what the config inherits` | Delete the key: the preset already gives that value. |
| `does not resolve` / `cannot be parsed` | Fix the JSON or the `extends` path TypeScript reports. |

## `tsconfig-debt`

Not a rule of its own: a list in [`rules/tsconfig-debt.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs)
that the `tsconfig` rule reads, and its messages print under `[tsconfig]`. It names the package configs
allowed to relax their preset (`noImplicitAny`, `noImplicitThis`, `isolatedModules` or
`exactOptionalPropertyTypes` set to `false`). The list only shrinks.

| Message | Fix |
| --- | --- |
| `compilerOptions.<key> relaxes the strictness of its preset` | Fix the code so it passes the preset. A new entry in the list is the exception, not the fix. |
| `compilerOptions.<key> may only relax the preset, to false` | Delete the option, or set it to its relaxed value if the list names it. |
| `tsconfig-debt.mjs lists compilerOptions.<key>, which the config no longer relaxes` | Delete the entry from the list: the package is clean. |
| `lists <file>, which does not exist` | Delete the entry for the removed config. |

## Exclusions

[`exclusions.mjs`](../../../../tools/nx-plugins/enforce-tool-config/exclusions.mjs) exempts a
directory from named rules, each entry with a reason and an exit condition. It is for subtrees that
cannot conform yet, such as `apps/`. A new package does not go there.

# `lint:tool-config` rules and their fixes

The check lives in [`tools/nx-plugins/enforce-tool-config`](../../../../tools/nx-plugins/enforce-tool-config),
one module per rule under `rules/`. Each violation prints as `[rule] file: message`. Find the start of
the message in the section of its rule; the linked rule file holds the exact wording and the logic.
The fix is always to move the setting into its preset, never to keep it in the package.

## `[fmt]`

Messages from [`rules/fmt.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/fmt.mjs). The
one oxfmt config is [`support/fmt/oxfmt.config.mts`](../../../../support/fmt/oxfmt.config.mts).

| Message starts with | Fix |
| --- | --- |
| `oxfmt config outside support/fmt` | Delete the file. Add the ignore pattern it carried to `support/fmt/oxfmt.config.mts`, as a path from the workspace root. |
| `script "<name>" passes a config to oxfmt` | Drop the flag: `oxfmt src`. |

## `[lint]`

Messages from [`rules/lint.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs),
which also holds the map of layer roots to their `support/lint` presets and the allowlist of
per-package rule flags.

| Message starts with | Fix |
| --- | --- |
| `layer config missing` | Restore the file with the line the message prints. |
| `oxlint config outside a layer root` | Delete the config. Put the rule it carried in the layer's preset in `support/lint`. |
| `a layer config only re-exports its preset` | Reduce the file to the line the message prints. A change of rules goes in the preset. |
| `script "<name>" passes a config to oxlint` | Drop the flag: `oxlint src`. |
| `script "<name>" sets` (any script but `lint`) | Move the flag to the `lint` script. |
| `script "lint" sets` | Set the rule in the layer's preset. Add the flag to the allowlist only for a rule one package alone needs, with the reason. |

## `[jest]`

Messages from [`rules/jest.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/jest.mjs),
on the packages that depend on `@support/jest`.

| Message starts with | Fix |
| --- | --- |
| `depends on @support/jest but has no jest config` | Add a `jest.config.js` calling the layer's factory, or drop the dependency if the package has no tests. |
| `exports no config`, `assigns its export more than once`, `exports something other than a single config` | Make the file a single `module.exports = <factory>(...)` (or `export default`). |
| `exports a config that is not built by a @support/jest preset factory` | Replace it with the factory of the package's layer. |
| `changes the result of <factory>()` | Move the change into the factory's overrides argument. |

## `[tsconfig]`

Messages from [`rules/tsconfig.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig.mjs),
on every `tsconfig*.json` of the package, nested ones included.

| Message starts with | Fix |
| --- | --- |
| `must extend a @support/tsconfig preset` | Add `extends` with the archetype ([pick it](../SKILL.md#pick-the-tsconfig-archetype)). |
| `extends "<path>" is not a preset @support/tsconfig exports` | Use a preset listed in `support/tsconfig/package.json#exports`. |
| `extends "<path>" is neither a @support/tsconfig preset nor a sibling config`, `extends "<path>" points outside the package` | Extend a preset, or a config of the same package. |
| `extends "<path>" is not a tsconfig*.json this rule checks` | Rename the parent to `tsconfig.<name>.json`. |
| `inherits no @support/tsconfig archetype` | Put an archetype before the mixin, or extend the package's own `tsconfig.json` first. |
| `"<key>" is not allowed in a package tsconfig` | Delete the key. |
| `compilerOptions.<key> belongs to a preset` | Delete the option. If the package really needs it, change or add a preset in `support/tsconfig`. |
| `<key> repeats what the config inherits` | Delete the key. |
| `cannot be parsed`, `does not resolve`, `extends "<path>" does not exist` | Fix the JSON or the `extends` path the message reports. |

### The `tsconfig-debt` list

[`rules/tsconfig-debt.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs)
is not a rule of its own: `rules/tsconfig.mjs` reads it and prints these messages under `[tsconfig]`.
The list only shrinks.

| Message starts with | Fix |
| --- | --- |
| `compilerOptions.<key> relaxes the strictness of its preset` | Fix the code so it passes the preset. A new entry in the list is the exception, not the fix. |
| `compilerOptions.<key> may only relax the preset` | Delete the option, or set it to the relaxed value the message prints if the list names it. |
| `tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs lists compilerOptions.<key>` | Delete the entry: the package is clean. |
| `lists <file>, which does not exist` | Delete the entry. |

## Exclusions

[`exclusions.mjs`](../../../../tools/nx-plugins/enforce-tool-config/exclusions.mjs) exempts a
directory from named rules, each entry with a reason and an exit condition. It is for subtrees that
cannot conform yet, such as `apps/`. A new package does not go there.

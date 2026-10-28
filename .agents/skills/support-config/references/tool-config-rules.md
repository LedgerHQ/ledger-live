# `lint:tool-config` rules and their fixes

The check lives in [`tools/nx-plugins/enforce-tool-config`](../../../../tools/nx-plugins/enforce-tool-config),
one module per rule under `rules/`. Each violation prints as `[rule] file: message`. The tables below
name what each check rejects; the exact wording is in the rule file linked from each section. The fix
is always to move the setting into its preset, never to keep it in the package.

## `fmt`

Checks in [`rules/fmt.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/fmt.mjs). One
oxfmt config for the repository: [`support/fmt/oxfmt.config.mts`](../../../../support/fmt/oxfmt.config.mts),
re-exported by the workspace root.

| What it rejects | Fix |
| --- | --- |
| An `oxfmt.config.*` or `.oxfmtrc.*` in the package, below it, or between it and the root. | Delete the file. Add the ignore pattern it carried to `support/fmt/oxfmt.config.mts`, as a path from the workspace root. |
| A script that runs oxfmt with `-c` / `--config`. | Drop the flag: `oxfmt src`. |

## `lint`

Checks in [`rules/lint.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/lint.mjs). One
oxlint config per layer root, a one-line re-export of its `@support/lint` preset. The same file holds
the map of layer roots to their presets and the allowlist of per-package rule flags, each flag with
its reason.

| What it rejects | Fix |
| --- | --- |
| An oxlint config anywhere other than a layer root. | Delete the config. Put the rule it carried in the layer's preset in `support/lint`. |
| A layer root with no `oxlint.config.mts`. | Restore it as the one-line `export { default } from "@support/lint/<preset>";`, with the preset the violation names. |
| A layer config that does more than re-export its preset. | Reduce it to that one line. A change of rules goes in the preset. |
| A script that runs oxlint with `-c` / `--config`. | Drop the flag: `oxlint src`. |
| A rule flag (`-A`, `-W`, `-D` or a long form) on a script other than `lint`. | Move the flag to the `lint` script. |
| A rule flag on the `lint` script that the allowlist does not hold. | Set the rule in the layer's preset. Add the flag to the allowlist only for a rule one package alone needs, with the reason. |

## `jest`

Checks in [`rules/jest.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/jest.mjs), on the
packages that depend on `@support/jest`: each `jest*.config.*` exports one `create*Config(...)` call
from `@support/jest/<preset>` and nothing else. The arguments are not checked.

| What it rejects | Fix |
| --- | --- |
| A dependency on `@support/jest` with no jest config built by its presets. | Add a `jest.config.js` calling the layer's factory, or drop the dependency if the package has no tests. |
| A config file with no export, several assignments to its export, or an export that is not a single config. | Make the file a single `module.exports = <factory>(...)` (or `export default`). |
| An exported config not built by a `@support/jest` preset factory, such as a hand-written object. | Replace it with the factory of the package's layer. |
| A factory result changed after the call, by a spread, a merge or a property assignment. | Move the change into the factory's overrides argument. |

## `tsconfig`

Checks in [`rules/tsconfig.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig.mjs),
on every `tsconfig*.json` of the package, nested ones included.

| What it rejects | Fix |
| --- | --- |
| A config with no `extends`. | Add `extends` with the archetype ([pick it](../SKILL.md#pick-the-tsconfig-archetype)). |
| An `extends` on a `@support/tsconfig` path the package does not export. | Use a preset listed in `support/tsconfig/package.json#exports`. |
| An `extends` on another package's config, `tsconfig.base.json` or any path outside the package. | Extend a preset, or a config of the same package. |
| An `extends` on a file of the package that is not named `tsconfig*.json`. | Rename the parent to `tsconfig.<name>.json`. |
| A chain of `extends` that reaches no archetype, such as a `lib/build`, `lib/esm` or `lib/tests` mixin alone. | Put an archetype before the mixin, or extend the package's own `tsconfig.json` first. |
| A top-level key other than `extends`, `compilerOptions`, `references`, `include`, `exclude` and `files`. | Delete the key. |
| A compiler option other than `types`, `paths` and the `tsconfig-debt` relaxations below: the presets own it. | Delete the option. If the package really needs it, change or add a preset in `support/tsconfig`. |
| A key set to the value the config already inherits. | Delete the key. |
| A config TypeScript cannot parse, or an `extends` it cannot resolve or that names a missing file. | Fix the JSON or the `extends` path TypeScript reports. |

## `tsconfig-debt`

Not a rule of its own: a list in [`rules/tsconfig-debt.mjs`](../../../../tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs)
that the `tsconfig` rule reads, and its violations print under `[tsconfig]`. It names the package
configs allowed to relax their preset (`noImplicitAny`, `noImplicitThis`, `isolatedModules` or
`exactOptionalPropertyTypes` set to `false`). The list only shrinks.

| What it rejects | Fix |
| --- | --- |
| A config that relaxes one of those options without an entry in the list. | Fix the code so it passes the preset. A new entry in the list is the exception, not the fix. |
| One of those options set to anything but its relaxed value. | Delete the option, or set it to its relaxed value if the list names it. |
| An entry for an option the config no longer relaxes. | Delete the entry: the package is clean. |
| An entry for a config file that no longer exists. | Delete the entry. |

## Exclusions

[`exclusions.mjs`](../../../../tools/nx-plugins/enforce-tool-config/exclusions.mjs) exempts a
directory from named rules, each entry with a reason and an exit condition. It is for subtrees that
cannot conform yet, such as `apps/`. A new package does not go there.

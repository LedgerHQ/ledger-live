# @support/lint-rules

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

Custom oxlint JS plugins for monorepo-wide lint rules.

## Usage

Reference a rule file in your `.oxlintrc.json`:

```json
{
  "jsPlugins": ["../support/lint-rules/src/suffix-imports.js"],
  "rules": {
    "suffix-imports/no-platform-suffix": "error"
  }
}
```

## Rules

### `suffix-imports/no-platform-suffix`

Disallows explicit `.web` or `.native` suffixes in import paths. Platform resolution should be left to the bundler (Metro / webpack).

**Autofix available** — run `oxlint --fix` to strip the suffix automatically.

```ts
// ✗
import Foo from "./foo.native";
import Bar from "../bar.web";

// ✓
import Foo from "./foo";
import Bar from "../bar";
```

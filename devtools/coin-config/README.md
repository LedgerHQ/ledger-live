# @devtools/coin-config

The Coin config DevTool. It is laid out like the feature-flags tool, and lists the LiveConfig keys with their local overrides.

- **Toolbar:**
  - A search field.
  - Filter tabs **Coins** (the `config_currency_*` keys, the default), **All** and **Overridden**, each with its count.
  - An actions menu with **Reset all overrides**.
- **Summary:** how many keys the list shows out of the total, and how many are overridden.
- **Rows:** the type of the resolved value, and an **Overridden** tag. An overridden row is highlighted.
- **Editor:** a dialog on web, a bottom sheet on native. It opens on a row and holds a JSON editor with the resolved value.
  - **Review Changes** diffs the JSON against the schema default or the resolved value.
  - **Apply** saves the JSON as a local override. It stays disabled while the JSON does not parse or equals the resolved value.
  - **Restore** removes the key's override.

Overrides apply right away, without a reload. The host keeps them across restarts.

## Props contract

```ts
interface CoinConfigToolProps {
  keys: readonly string[];
  overrides: Readonly<Record<string, unknown>>;
  getResolvedValue: (key: string) => unknown;
  getDefaultValue: (key: string) => unknown;
  setOverride: (key: string, value: unknown) => void;
  clearOverride: (key: string) => void;
  clearAllOverrides: () => void;
}
```

`useCoinConfigToolProps({ keys, getValueByKey, getDefaultValueByKey })` from `@devtools/bindings` builds the props. It reads the `liveConfigOverrides` slice of [`@shared/live-config-overrides`](../../shared/live-config-overrides/README.md) and dispatches its actions. The host passes the LiveConfig reads, and the slice's middleware applies each change to LiveConfig.

## Imports

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see [devtools-import-boundary](../../.agents/skills/devtools-import-boundary/SKILL.md).

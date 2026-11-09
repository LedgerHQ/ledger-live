# @devtools/account-discovery

Scans a currency on the connected device with `@features/platform-account-discovery`: each candidate derived on the device, then asked to the account data sources through the `existence` kind. Shows each account found with its descriptor, when it was found, and how many derivations and existence checks the scan cost.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountDiscoveryToolProps` in `@devtools/bindings`.

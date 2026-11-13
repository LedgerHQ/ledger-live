# @devtools/account-discovery

Scans a currency with the account discovery Device Intent (`@features/platform-account-discovery-intent`): each candidate derived on the session of the app the executor opened, then asked to the account data sources through the `accountStatus` kind. Shows each account found with its descriptor, when it was found, and how many derivations and status reads the scan cost.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountDiscoveryToolProps` in `@devtools/bindings`.

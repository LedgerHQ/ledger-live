# @devtools/account-discovery

Scans a currency with the account discovery Device Intent (`@features/platform-intent-scan-accounts`, running `discoverAccounts`): each candidate derived on the session of the app the executor opened, then asked to the account data sources through the `accountStatus` kind. Shows each account found with its descriptor, when it was found, and how many derivations and status reads the scan cost. Descriptors carry the address or xpub: the page renders them, never logs them.

Accounts can be selected once found. "Complete selected" runs the completion step (a second Device Intent run) on the selected accounts whose family needs one (Aleo: one view key approval each), and shows where each stands. The rows keep the descriptor as discovered; what the device gave (Aleo: the view key) goes to the host's account context and is never shown. "Add" gives the selected accounts that are ready to the host app, which turns them into accounts. Accounts the app holds already are flagged and cannot be selected.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountDiscoveryToolState` in `@devtools/bindings`.

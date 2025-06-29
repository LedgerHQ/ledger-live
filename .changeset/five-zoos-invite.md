---
"ledger-live-desktop": patch
---

UI fixes for the ScanAccount screen in the new Add Account flow:

- Add a blur effect above the bottom button.
- Set the scrollbar width to none.
- Remove "src/helpers.types.ts" from libs/ui/packages/react/.unimportedrc.json.
- Hide the “stop scan” button if no account has been scanned yet.

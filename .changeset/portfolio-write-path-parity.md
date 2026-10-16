---
"@ledgerhq/live-common": minor
---

With `portfolio.enabled`, the generic bridge writes through the portfolio layer only: `getTransactionStatus` validates through `validateTransaction` (revived errors; an unvalidated status in `remote` mode, the portfolio-service serving no validation), the network sequence comes from `getNextSequence` in every mode, and the side writing completes the intent's data. When the client writes, the intent view carries the asset and the intent type, and every other intent field with its exact presence, so token and staking intents are written as on the legacy path; they are refused in `remote` mode only (a Cardano token included).

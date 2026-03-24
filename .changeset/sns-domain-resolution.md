---
"@ledgerhq/types-live": minor
"@ledgerhq/domain-service": minor
"@ledgerhq/live-common": minor
"@ledgerhq/live-wallet": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Add SNS (Solana Name Service) domain resolution support to the send flow, allowing users to send assets to .sol addresses. Generalize ENS-specific naming (ensName, ens_resolved) to chain-agnostic equivalents (domainName, domain_resolved) across the codebase.

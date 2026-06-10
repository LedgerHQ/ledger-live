---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-modules-monitoring": patch
"@ledgerhq/coin-tester-evm": patch
"@ledgerhq/coin-tester-tezos": patch
"@ledgerhq/coin-tester-solana": patch
---

Drop the `.js` extension from relative dynamic `import()` specifiers in live-common (coin module loaders and the generic coin framework bridge/api). Switch the remaining NodeNext consumers that read live-common source to `moduleResolution: "bundler"` so extensionless imports resolve in the IDE, while keeping their CommonJS build output unchanged.

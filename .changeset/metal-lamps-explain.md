---
"live-mobile": patch
"@ledgerhq/live-common": patch
---

fix: race condition on exchange issue in PairDevices

- Due to an incorrect usage of RxJS firstValueFrom
- Also improve observability with tracing

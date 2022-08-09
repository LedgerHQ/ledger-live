---
"@ledgerhq/live-common": patch
---

Refactoring of useOnboardingStatePolling bringing 2 changes:

- avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
- update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

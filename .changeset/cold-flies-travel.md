---
"@ledgerhq/live-common": minor
"live-mobile": patch
---

Feat: Usage of new abort timeouts and transport access refactoring

- `getOnboardingStatePolling` : usage of `transportAbortTimeoutMs` value for both the opening and exchange (via `getVersion`) abort timeout
- `getVersion` : usage of `abortTimeoutMs` on exchange
- More tracing and documentations

`withDevice` refactoring:

- better variables names
- more documentation (especially the queue-made-with-promise part)
- some simple unit tests

Updates on 1st version of the device SDK:

The 1st implementation of the "device SDK" is redefining a `withDevie` named `withTransport`.
It had its own queue of waiting jobs, that was independent from the queue of job from `withDevice`
With this refactoring, `withTransport` and `withDevice` have been updated to use the same jobs queue.

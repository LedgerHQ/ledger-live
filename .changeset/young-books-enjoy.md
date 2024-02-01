---
"@ledgerhq/live-common": patch
---

Refactor list apps v2:
  - move entrypoint to `live-common/src/device/use-cases/listAppsUseCase.ts`
  - move more of the `manager/api.ts` logic to `ManagerApiRepository`
  - create `StubManagerApiRepository` for mocks
  - implement some unit tests for `listApps/v2.ts`

Implement `getProviderIdUseCase` that takes `forceProvider: number` as a parameter

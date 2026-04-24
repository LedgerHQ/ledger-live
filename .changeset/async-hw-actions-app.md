---
"@ledgerhq/live-common": patch
---

Make `inferCommandParams` async in `hw/actions/app.ts` to support lazy coin-module loading.

`inferCommandParams` now awaits `loadAccountModuleForFamily`, and `createAction` moves from `useMemo`
to `useState + useEffect + .then()` for request computation. As a result, `request` is `null` on
the first render — the internal effect guards against this with `if (state.opened || !request) return`.

Also makes `dispatch` in `hw/getAddress/index.ts` and `signMessage` in `hw/signMessage/index.ts`
async to await `loadSetupForFamily`.

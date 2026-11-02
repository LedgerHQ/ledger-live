# Slice: app registration and async lifecycles

Details behind the slice part of [`domain-data`](../SKILL.md).

## Register the slice in both apps

An entity slice reaches the store through each app's root reducer. Add its state to the app
`State` type and its reducer to `appReducer`, the `combineReducers` call, under the key its
selectors' local root type names (`contacts` for `ContactsStateRoot`).

| App | `State` type | `combineReducers` |
| --- | --- | --- |
| Desktop | [`renderer/reducers/index.ts`](../../../../apps/ledger-live-desktop/src/renderer/reducers/index.ts) | same file |
| Mobile | [`src/reducers/types.ts`](../../../../apps/ledger-live-mobile/src/reducers/types.ts) | [`src/reducers/index.ts`](../../../../apps/ledger-live-mobile/src/reducers/index.ts) |

```ts
import { contactsSlice, type ContactsState } from "@domain/entity-contact";

export type State = {
  // ...
  contacts: ContactsState;
};

const appReducer = combineReducers({
  // ...
  contacts: contactsSlice.reducer,
});
```

An entity with a default-exported reducer registers `contacts: contactsReducer` instead.

## Async lifecycle in `extraReducers`

An entity slice makes no network call and cannot import from `domain/api`, so it never handles a
thunk's actions. It tracks a load with its own actions instead (`accountDataRequested` and
`accountDataFailed` in
[`account-data/src/status.ts`](../../../../domain/entity/account-data/src/status.ts)), or the thunk
dispatches the validated entities ([`data-layer-advanced`](../../data-layer-advanced/SKILL.md)).

A slice above `domain/api`, such as a `features/` slice that owns a loading status, handles the
three actions of a `createAsyncThunk` with the builder callback. It keeps the status only; the data
stays in the entity.

```ts
extraReducers: builder => {
  builder
    .addCase(syncContacts.pending, state => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(syncContacts.fulfilled, state => {
      state.status = "idle";
    })
    .addCase(syncContacts.rejected, (state, action) => {
      state.status = "error";
      state.error = action.error.message ?? null;
    });
},
```

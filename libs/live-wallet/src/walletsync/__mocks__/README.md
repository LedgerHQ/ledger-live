# WalletSync Module Mocks

Each WalletSync module declares mocks under `__mocks__/modules`. Tests use these
generators to exercise module sync behavior deterministically.

Export the objects and functions below for each module.

### `emptyState`

Initial module state. It should be an empty object or array.

The module should treat `emptyState` as having no diff with `null`.

### `genState(index)`

Generate a deterministic state for a given index. Each state must differ from
the others and represent a wide variety of possible states. `genState` must not
return `emptyState`.

Prefer some intersection between states. By convention, higher indexes contain
more data than lower indexes. For instance, `genState(0)` on accounts has one
account.

### `convertLocalToDistantState(localState)`

Convert the local state to the distant state sent to the distant server.

### `convertDistantToLocalState(distantState)`

Guess a conversion from distant state to local state. This is a guess because in
production it is not always possible to resolve synchronously, but mocks keep it
synchronous.

### `similarLocalState(a, b)`

Compare two local states and return whether they are similar, ignoring accepted
differences from distant/local translations or order changes.

## Template

```ts
type LocalState = ...
type DistantState = ...

export const emptyState: LocalState = ...

export const genState = (index: number): LocalState => {
  ...
};

export const convertLocalToDistantState = (localState: LocalState): DistantState => {
  ...
};

export const convertDistantToLocalState = (distantState: DistantState): LocalState => {
  ...
};

export const similarLocalState = (a: LocalState, b: LocalState) => {
  ...
};
```

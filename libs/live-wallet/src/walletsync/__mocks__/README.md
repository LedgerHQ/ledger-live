Each module need to declare mocks under **mocks**/modules with data generators for tests to be testing the modules with them. Here are the object and functions to export:

### `emptyState`

This is the initial state of the module. It should be an empty object or array.

The module need to consider that this emptyState have no diff with `null`.

### `genState(index)`

This function should generate a deterministic state for a given index. Each state must differ from each other and represent a wide variety of possible states. genState must not return emptyState. It's a good practice to have intersection between states. It is conventional that higher index have more data than lower index. For instance `genState(0)` on accounts have 1 account.

### `convertLocalToDistantState(localState)`

This function should convert the local state to the distant state. The distant state is the state that is sent to the distant server.

### `convertDistantToLocalState(distantState)`

This function should guess a conversion of the distant state to the local state. NB: this is a guess because in real life it is not always possible to resolve this synchronously, but we are making so in context of our mocks.

### `similarLocalState(a, b)`

Compare two local state and tells if they are "similar", ignoring possible diff related to Distant<>Local translations or possible change of orders that are acceptable for each module.

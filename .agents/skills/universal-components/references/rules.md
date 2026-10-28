# R1 to R5: what `lint:structure` reports

The rule lives in
[components.js](../../../../tools/nx-plugins/enforce-package-structure/components.js) and the
waiver check in
[validate.js](../../../../tools/nx-plugins/enforce-package-structure/validate.js); each code's
message is written there. Its settings are in
[components.config.json](../../../../tools/nx-plugins/enforce-package-structure/components.config.json),
and every code has a test in
[components.test.js](../../../../tools/nx-plugins/enforce-package-structure/components.test.js).
The printed line gives the rule and the message; the code is what the tests and this table use.

## Codes and fixes

| Rule | Code | Fix |
| --- | --- | --- |
| R1 | `universal-parity` | Export the component on both platforms under one name, or move it to a platform entry |
| R2 | `props-unnamed` | Annotate the first parameter with a named props type from the contract |
| R2 | `props-unreadable` | Declare the function wrapped by `memo` or `forwardRef` in the same module |
| R2 | `props-parameter-mismatch` | Give both implementations props, or neither |
| R2 | `props-name-mismatch` | Annotate both implementations with the same type name |
| R2 | `contract-not-found` | Import the props type from the contract module |
| R2 | `contract-outside-package` | Declare the contract in the package itself |
| R2 | `contract-reexported` | Import the type from the module that declares it |
| R2 | `contract-mismatch` | Import the type from one contract module on both platforms |
| R2 | `contract-suffixed` | Rename the contract to `X.types.ts` |
| R2 | `contract-shadowed` | Delete the platform-suffixed sibling and merge it into `X.types.ts` |
| R3 | `contract-platform-import` | Replace the platform import with a neutral type |
| R3 | `contract-react-type` | Pass the value instead of the event, the style or the element |
| R3 | `contract-global-type` | Replace the DOM type with a value or a handle type |
| R3 | `contract-platform-prop` | Drop `className` or `style`; expose a variant prop instead |
| R3 | `contract-gesture-callback` | Rename the callback after the intent (`onOpenContacts`) |
| R3 | `platform-prop-tag` | Tag the prop `@platform web` or `@platform native` |
| R3 | `platform-prop-shape` | Make the `@platform` prop optional and a primitive or string-literal union |
| R4 | `platform-module-export` | Move the type, hook or constant to the contract or another module |
| R5 | `component-in-both-entries` | Keep the component in universal entries or in platform entries, not both |
| R5 | `platform-entry-shared-module` | Point the platform entry at a module of its own |
| R5 | `platform-entry-unsuffixed` | Give the platform entry's module its platform suffix |
| any | `stale-waiver` | Remove the waiver the fix made unnecessary ([clearing a waiver](../SKILL.md#clearing-a-waiver)) |

R2 reports the first miss per component, in table order. Components of platform entries skip R1
to R4. The gesture check matches whole camelCase words, so `onPressure` or `onTapestry` would
pass; whether a name states an intent stays a review question.

## What R3 follows

R3 runs on the contract module, and the parser has no type checker, so it follows what the module
itself declares:

- every local type a prop holds, at any depth, including index signature values and getter
  return types;
- a local alias of an array, `type Tiles = Tile[]` or `ReadonlyArray<{ onPress(): void }>`, gets
  the verdict of the array it names;
- a local generic binds its parameters to the type arguments, and checks an argument only where
  its body places it in props: `type Wrap<T> = { item: T }` checks `T`, defaults included;
- `Readonly`, `Partial`, `Required`, `NonNullable`, `Array`, `ReadonlyArray` and `Record` keep
  their argument's props, so it is checked.

It does not follow, so review does:

- types imported from another module, even a local one: a DOM type behind an alias declared
  elsewhere escapes R3;
- the arguments of `Pick`, `Omit` and other library types that drop props, and of a local generic
  that drops its argument (`type WithoutPress<T> = Omit<T, "onPress">`);
- callback parameters, `Handler<T> = (value: T) => void` included, `keyof` of a type argument, and
  the condition of a conditional type that tests one;
- whether a prop is `testID` rather than `testId` or `data-testid`, and whether a callback typed
  `unknown` or with a locally declared event type receives a value.

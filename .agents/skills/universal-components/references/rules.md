# R1 to R5: what `lint:structure` reports

The rule lives in
[components.js](../../../../tools/nx-plugins/enforce-package-structure/components.js), its
settings in
[components.config.json](../../../../tools/nx-plugins/enforce-package-structure/components.config.json),
and every case below has a test in
[components.test.js](../../../../tools/nx-plugins/enforce-package-structure/components.test.js).
The printed line gives the rule and a message; the code is what the tests and this table use.

## Codes

| Rule | Code | Reported when |
| --- | --- | --- |
| R1 | `universal-parity` | A component is exported from a universal entry on one platform only, or under another name on each |
| R2 | `props-unnamed` | An implementation's first parameter is not annotated with a props type name (inline type or none) |
| R2 | `props-unreadable` | `memo(…)` or `forwardRef(…)` wraps a function declared in another module, so its props cannot be read |
| R2 | `props-parameter-mismatch` | One implementation takes props, the other takes none |
| R2 | `props-name-mismatch` | The two implementations annotate with different type names |
| R2 | `contract-not-found` | The props type is neither declared in nor imported by the implementation |
| R2 | `contract-outside-package` | The props type comes from another package |
| R2 | `contract-reexported` | The module the type is imported from re-exports it instead of declaring it |
| R2 | `contract-mismatch` | The two implementations import the type from different modules |
| R2 | `contract-suffixed` | The contract module carries a platform suffix (`X.types.web.ts`) |
| R2 | `contract-shadowed` | The unsuffixed contract has a `.web`, `.native`, `.ios` or `.android` sibling |
| R3 | `contract-platform-import` | The contract imports a `bannedImportPrefixes` package, other than a type-only `neutralImportTypes` name |
| R3 | `contract-react-type` | It references a `react` type outside `neutralReactTypes` (`ChangeEvent`, `CSSProperties`) |
| R3 | `contract-global-type` | It references a global the ECMAScript library does not declare (`HTMLElement`, `typeof document`) |
| R3 | `contract-platform-prop` | It declares a `className` or `style` prop |
| R3 | `contract-gesture-callback` | A callback name holds a `gestureWords` word (`onPress`, `onEditPress`) or matches `bannedCallbackNames` (`onChange`, `onSubmit`, `onKey*`) |
| R3 | `platform-prop-tag` | A `@platform` tag names neither `web` nor `native` |
| R3 | `platform-prop-shape` | A `@platform` prop is required or not a primitive or string-literal union |
| R4 | `platform-module-export` | A platform module that declares a universal component also exports a type, a hook or a constant |
| R5 | `component-in-both-entries` | A component is exported from a universal entry and from a platform entry |
| R5 | `platform-entry-shared-module` | A platform entry resolves to a module a universal entry resolves to |
| R5 | `platform-entry-unsuffixed` | A platform entry resolves to a module without its platform's suffix |
| any | `stale-waiver` | A `COMPONENT_EXCEPTIONS` waiver no longer matches a violation |

R2 reports the first miss per component, in table order. Components of platform entries skip R1
to R4. The gesture words match whole camelCase words, so
`onPressure` or `onTapestry` would pass; whether a name states an intent stays a review question.

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

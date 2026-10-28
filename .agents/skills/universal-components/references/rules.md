# R1 to R5: what `lint:structure` reports

Each failure prints its rule and a message. The rule is checked, and its codes and messages are
written, in [components.js](../../../../tools/nx-plugins/enforce-package-structure/components.js),
the waiver check in [validate.js](../../../../tools/nx-plugins/enforce-package-structure/validate.js).
Its settings are in
[components.config.json](../../../../tools/nx-plugins/enforce-package-structure/components.config.json),
and every code has a test in
[components.test.js](../../../../tools/nx-plugins/enforce-package-structure/components.test.js).

## Fixes by rule

Find the rule in the lint output, then:

- **R1** ([codes](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1686-L1704)):
  export the component on both platforms under one name, or move it to a platform entry.
- **R2** ([contract lookup](../../../../tools/nx-plugins/enforce-package-structure/components.js#L643-L672),
  [codes](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1558-L1654)):
  declare one props type in an unsuffixed `X.types.ts` of the package, with no platform-suffixed
  sibling, and annotate the first parameter of both implementations with it, imported from that
  module. A component wrapped in `memo` or `forwardRef` declares the function it wraps in the same
  module. R2 reports one miss per component at a time, so rerun after each fix.
- **R3** ([codes](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1250-L1387)):
  replace a platform import, a React event, style or element type, or a DOM type with a value or a
  neutral handle type; drop `className` and `style` for a variant prop; name a callback after the
  intent (`onOpenContacts`). A prop only one platform reads is tagged `@platform web` or
  `@platform native`, optional, and a primitive or string-literal union.
- **R4** ([exports](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1400-L1452),
  [code](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1541-L1553)):
  move the type, hook or constant to the contract or to another unsuffixed module.
- **R5** ([codes](../../../../tools/nx-plugins/enforce-package-structure/components.js#L1723-L1760)):
  keep the component in universal entries or in platform entries, not both, and point each
  platform entry at a module of its own that carries its platform suffix.
- **Waivers** ([code](../../../../tools/nx-plugins/enforce-package-structure/validate.js#L86-L108)):
  remove the waiver the fix made unnecessary, see
  [clearing a waiver](../SKILL.md#clearing-a-waiver).

Components of platform entries are out of R2 to R4:
[R2 to R4 skip the components of platform entries and test entries](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1387).

## What R3 follows

These tests pin what R3 checks in the contract module. Anything they leave out is a review
question.

Followed:

- [R3 checks the local types a contract's props hold, at any depth](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L936)
- [R3 checks the values of an index signature](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L955)
- [R3 checks the value a getter returns](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L968)
- [R3 checks the local types a prop holds behind a local alias](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L981)
- [R3 checks a type argument where a local generic places it in props](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1059)
- [R3 checks keyof, conditions and imported heritage arguments outside a local generic](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1223)
- [R3 checks the props a local generic contract receives as type arguments](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1239)
- [R3 fails: gesture and DOM event callback names, on whole camelCase words](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L879)

Not followed:

- [R3 follows the contract's own types, not imported ones](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L919)
- [R3 does not resolve a type parameter to the module-level type it shadows](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1010)
- [R3 does not check the type arguments of a local callback alias](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1024)
- [R3 does not check a type argument a local generic drops](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1036)
- [R3 passes: Pick and Omit drop the props they leave out](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L1252)
- [R3 passes: intent callbacks, and gesture words inside a longer word or outside callbacks](../../../../tools/nx-plugins/enforce-package-structure/components.test.js#L907)

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

- **R1**: export the component on both platforms under one name, or move it to a platform entry.
- **R2**: declare one props type in an unsuffixed `X.types.ts` of the package, with no
  platform-suffixed sibling, and annotate the first parameter of both implementations with it,
  imported from that module. A component wrapped in `memo` or `forwardRef` declares the function it
  wraps in the same module. R2 reports one miss per component at a time, so rerun after each fix.
- **R3**: replace a platform import, a React event, style or element type, or a DOM type with a
  value or a neutral handle type; drop `className` and `style` for a variant prop; name a callback
  after the intent (`onOpenContacts`). A prop only one platform reads is tagged `@platform web` or
  `@platform native`, optional, and a primitive or string-literal union.
- **R4**: move the type, hook or constant to the contract or to another unsuffixed module.
- **R5**: keep the component in universal entries or in platform entries, not both, and point each
  platform entry at a module of its own that carries its platform suffix.
- **Waivers**: remove the waiver the fix made unnecessary, see
  [clearing a waiver](../SKILL.md#clearing-a-waiver).

Components of platform entries and test entries are out of R2 to R4.

## What R3 follows

The R3 tests in
[components.test.js](../../../../tools/nx-plugins/enforce-package-structure/components.test.js)
pin what R3 checks in the contract module: the failing cases show what it follows, the passing
cases what it skips. Anything they leave out is a review question.

# Map a universal contract onto Lumen

The rules both platform files follow, linked from [ldls-web](../SKILL.md) and
[ldls-native](../../ldls-native/SKILL.md). Each of those skills keeps only its own mapping table,
example and list of what stays in its platform file.

A universal component has one platform-neutral contract in `X.types.ts`
([universal-components](../../universal-components/SKILL.md#the-contract-xtypests)). `X.web.tsx`
and `X.native.tsx` each translate it to Lumen, one line per prop:

- **Intent callbacks are wrapped.** Pass `() => onOpenContacts()` to the gesture prop, never
  `onOpenContacts` itself, so the gesture's event object never reaches the contract.
- **Value callbacks get the value.** Unwrap it from the event before calling the contract
  (`event.target.value` on web); a Lumen prop that already passes the bare value is wired directly.
- **`testID` is the contract's name.** Each platform maps it to its own test attribute.
- **Imperative access goes through the contract's handle type**, filled with `useImperativeHandle`,
  never a platform element ref.
- **Callbacks are named after the intent** (`onEdit`, `onSelectAddress`), never after a gesture:
  R3 and the [intent name check](../../universal-components/SKILL.md#review-only-checks).

Lumen imports, gesture and event props, event objects, styles and refs stay in the platform file
and never appear in the contract.

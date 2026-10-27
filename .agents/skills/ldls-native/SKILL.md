---
name: ldls-native
description: Lumen UI React Native design system rules (`@ledgerhq/lumen-ui-rnative`) and how a native implementation maps a universal contract onto Lumen. Use when writing or reviewing native UI, in `*.native.tsx` files or under `apps/ledger-live-mobile/**`.
---

# Lumen UI React Native

## Read the Lumen rules first

Lumen ships its own rules for components, the `lx` style system and tokens. Read them before writing UI:
[`apps/ledger-live-mobile/node_modules/@ledgerhq/lumen-ui-rnative/ai-rules/RULES.md`](../../../apps/ledger-live-mobile/node_modules/@ledgerhq/lumen-ui-rnative/ai-rules/RULES.md).

The file exists once `pnpm i` has run. pnpm links `@ledgerhq/lumen-ui-rnative` under the packages that
depend on it, not at the repo root. If the path is missing, open `ai-rules/RULES.md` in the installed
`@ledgerhq/lumen-ui-rnative` package of any native consumer.

## Map the contract onto Lumen

A universal component has one platform-neutral contract in `X.types.ts`, see the
[universal components ADR](../../../docs/adr/universal-components.md). The native file `X.native.tsx`
translates it to Lumen, one line per prop:

| Contract (`X.types.ts`)               | Native implementation (`X.native.tsx`)    |
| ------------------------------------- | ----------------------------------------- |
| Intent callback, `onOpenContacts()`   | `onPress={onOpenContacts}`                |
| Value callback, `onSearchQueryChange` | `onChangeText={onSearchQueryChange}`      |
| `testID`                              | `testID={testID}`                         |

```tsx
// ContactsButton.native.tsx
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactsButtonProps } from "./ContactsButton.types";

export function ContactsButton({ title, onOpenContacts, testID }: ContactsButtonProps) {
  return (
    <Card type="interactive" onPress={onOpenContacts} testID={testID}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
```

## What stays in the native file

These never appear in the contract. The native file owns them:

- Lumen imports and Lumen props types (`@ledgerhq/lumen-ui-rnative`), and any `react-native*` import.
- Gesture and input props: `onPress`, `onLongPress`, `onChangeText`, `onSubmitEditing`, `onFocus`, `onBlur`.
- Event objects: `GestureResponderEvent`, `NativeSyntheticEvent`. Unwrap the value before calling the contract.
- `lx`, `style`, `StyleProp<ViewStyle>`.
- Refs to native views. A component that needs imperative access fills the contract's handle type with `useImperativeHandle`.
- Values the native file can read itself, such as the safe area under a sheet (`useBottomSheetBottomInset()`), instead of a `bottomInset` prop.

A contract callback is named after the intent (`onEdit`, `onSelectAddress`), never after a gesture
(`onPress`, `onEditPress`).

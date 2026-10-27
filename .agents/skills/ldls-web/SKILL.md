---
name: ldls-web
description: Lumen UI React design system rules (`@ledgerhq/lumen-ui-react`) and how a web implementation maps a universal contract onto Lumen. Use when writing or reviewing web UI, in `*.web.tsx` files or under `apps/ledger-live-desktop/**`.
---

# Lumen UI React

## Read the Lumen rules first

Lumen ships its own rules for components, Tailwind tokens and typography. Read them before writing UI:
[`apps/ledger-live-desktop/node_modules/@ledgerhq/lumen-ui-react/ai-rules/RULES.md`](../../../apps/ledger-live-desktop/node_modules/@ledgerhq/lumen-ui-react/ai-rules/RULES.md).

The file exists once `pnpm i` has run. pnpm links `@ledgerhq/lumen-ui-react` under the packages that
depend on it, not at the repo root. If the path is missing, open `ai-rules/RULES.md` in the installed
`@ledgerhq/lumen-ui-react` package of any web consumer.

## Map the contract onto Lumen

A universal component has one platform-neutral contract in `X.types.ts`, see the
[universal components ADR](../../../docs/adr/universal-components.md). The web file `X.web.tsx`
translates it to Lumen, one line per prop:

| Contract (`X.types.ts`)               | Web implementation (`X.web.tsx`)                         |
| ------------------------------------- | -------------------------------------------------------- |
| Intent callback, `onOpenContacts()`   | `onClick={onOpenContacts}`                               |
| Value callback, `onSearchQueryChange` | `onChange={(event) => onSearchQueryChange(event.target.value)}` |
| `testID`                              | `data-testid={testID}`                                   |

```tsx
// ContactsButton.web.tsx
import { Card } from "@ledgerhq/lumen-ui-react";
import type { ContactsButtonProps } from "./ContactsButton.types";

export function ContactsButton({ title, onOpenContacts, testID }: ContactsButtonProps) {
  return (
    <Card type="interactive" onClick={onOpenContacts} data-testid={testID}>
      {title}
    </Card>
  );
}
```

## What stays in the web file

These never appear in the contract. The web file owns them:

- Lumen imports and Lumen props types (`@ledgerhq/lumen-ui-react`).
- Gesture and DOM event props: `onClick`, `onChange`, `onSubmit`, `onFocus`, `onBlur`, `onKey*`.
- Event objects: `ChangeEvent`, `SyntheticEvent`, `MouseEvent`. Unwrap the value before calling the contract.
- `data-testid`, which the contract spells `testID`.
- `className`, `style`, `CSSProperties` and Tailwind classes.
- Refs to `HTML*Element`. A component that needs imperative access fills the contract's handle type with `useImperativeHandle`.

A contract callback is named after the intent (`onEdit`, `onSelectAddress`), never after a gesture
(`onClick`, `onEditClick`).

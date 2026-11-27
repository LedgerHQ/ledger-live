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

## Legacy UI is deprecated

All new UI uses Lumen, in `src/mvvm/` and everywhere else. These take no new usage:

- `@ledgerhq/react-ui`
- the desktop V2 kit: `~/renderer/components/Box`, `~/renderer/components/Text`
- `styled-components`, also banned in `shared/`, `domain/`, `features/` and `support/` (`@features/platform-style` excepted)

The `legacy-ui` oxlint rules (`no-legacy-import`, `no-legacy-element`, `no-styled-definition`, `no-banned-component`) count existing usages against a baseline in `apps/ledger-live-desktop/oxlint-suppressions.json`. The baseline only shrinks: never add an entry. After you remove a usage, run `oxlint --prune-suppressions` from the app folder (plugin and pruning in the [lint README](../../../support/lint/README.md)). Changes to that file need a Coin Integration review.

## Map the contract onto Lumen

The rules both platforms follow are in
[universal-components](../universal-components/SKILL.md#map-the-contract-onto-lumen). On web,
`X.web.tsx` maps:

| Contract (`X.types.ts`)               | Web implementation (`X.web.tsx`)                         |
| ------------------------------------- | -------------------------------------------------------- |
| Intent callback, `onOpenContacts()`   | `onClick={onOpenContacts}`                               |
| Value callback, `onSearchQueryChange` | `onChange={(event) => onSearchQueryChange(event.target.value)}` |
| `testID`                              | `data-testid={testID}`                                   |

```tsx
// ContactsButton.web.tsx
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-react";
import type { ContactsButtonProps } from "./ContactsButton.types";

export function ContactsButton({ title, onOpenContacts, testID }: ContactsButtonProps) {
  return (
    <Card type="interactive" onClick={onOpenContacts} data-testid={testID}>
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

## What stays in the web file

These never appear in the contract. The web file owns them:

- Lumen imports and Lumen props types (`@ledgerhq/lumen-ui-react`).
- Gesture and DOM event props: `onClick`, `onChange`, `onSubmit`, `onFocus`, `onBlur`, `onKey*`.
- Event objects: `ChangeEvent`, `SyntheticEvent`, `MouseEvent`.
- `data-testid`, which the contract spells `testID`.
- `className`, `style`, `CSSProperties` and Tailwind classes.
- Refs to `HTML*Element`.

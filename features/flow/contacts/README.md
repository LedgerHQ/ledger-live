# @features/flow-contacts

Shared Contacts flow package.

This package owns Contacts-specific flow logic shared by Desktop and Mobile. It may depend on feature platform packages, domain packages, and shared packages when a flow needs them, but it must not contain app routing, app screen composition, persistence, Ledger Sync, device actions, or signer payloads.

## Current scope

- Contacts feature-flag configuration hook.
- Minimal pure resolver used by the hook.

UI screens and scenario state will be added by the dedicated Contacts scenario tickets.

## Usage

```ts
import { useContactsFeature } from "@features/flow-contacts";

export function ContactsEntryPoint() {
  const { isEnabled, showNewBadge } = useContactsFeature("desktop");

  return null;
}
```

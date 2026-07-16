# Card

Cross-platform card flow scaffold for Ledger Live. Currently exposes a minimal
`CardScreen` used as a placeholder inside the Pay tab of both apps.

## Usage

```tsx
import { CardScreen } from "@features/flow-card";

<CardScreen />;
```

## Platform Resolution

| Platform         | File resolved                                     |
| ---------------- | ------------------------------------------------- |
| Mobile (Metro)   | `CardScreen/index.native.tsx`                      |
| Desktop (Rspack) | `CardScreen/index.tsx`                             |

The bundlers automatically resolve the correct platform-specific implementation.

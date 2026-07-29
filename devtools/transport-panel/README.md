# @devtools/transport-panel

Devtools tool that displays the current transport connection state and message history.

## Responsibility

- Show the transport connection status via a styled pill (`idle`, `connecting`, `open`, `closed`, `error`)
- Display the message exchange history

## Native embedding contract

The native `<TransportPanel />` uses `BottomSheet` from `@ledgerhq/lumen-ui-rnative`, which requires a `BottomSheetModalProvider` somewhere above it in the tree. This is already provided by `@devtools/shell`'s `<DevTools />` root — no additional setup is needed when rendering through the shell.

If you render `<TransportPanel />` outside of `@devtools/shell` (e.g. standalone, tests, Storybook), you must wrap it yourself:

```tsx
import { BottomSheetModalProvider } from "@ledgerhq/lumen-ui-rnative";

<BottomSheetModalProvider>
  <TransportPanel transport={transport} />
</BottomSheetModalProvider>
```

## Package layout

```
transport-panel/
├── src/
│   ├── components/
│   │   ├── TransportStateIndicator/   # status pill
│   │   ├── TransportPanelContent/     # message history content
│   │   ├── HistoryLine/               # single history entry
│   │   └── TransportDebug/            # debug view
│   ├── hooks/                         # useTransportState, useTransportSend, useHistoryLine
│   ├── TransportPanel.web.tsx
│   ├── TransportPanel.native.tsx
│   ├── types.ts
│   ├── index.ts
│   └── index.native.ts
└── package.json
```

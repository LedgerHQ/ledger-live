# @devtools/pay-card

The Card / Pay DevTool. It puts the Card / Pay feature into a given state from one place, in five
sections: **Feature flags**, **Onboarding** (toggle each step done or not-done), **Reset onboarding**,
**Feature tour** (seen state plus a reset) and **Env vars** (the Card backend values, with the
development tenant ready in each input).

## Import boundary

This package is fully self-contained. It never imports from `@devtools/shell`, `@devtools/registry`, or any other tool. All host state and handlers arrive through `PayCardToolProps`, which is built in `@devtools/bindings` (the only bridge between the app and the tool). This keeps the component renderable standalone, outside the shell.

## Public API

```ts
import PayCard, { type PayCardToolProps } from "@devtools/pay-card";
```

- `PayCard` (default export) — the React component rendered by the shell.
- `PayCardToolProps` — the props contract the host (via bindings) must satisfy, with its parts
  `PayCardFlagsProps`, `PayCardOnboardingProps`, `OnboardingStep`, `PayCardEnvProps` and
  `PayCardEnvVar`.
- `usePayCardViewModel` / `PayCardViewModel` — onboarding progress derived from those props, plus
  `toggleStep` and `setAllSteps`.
- `formatId` — turns a step id into a label: `"kyc-check"` → `"Kyc check"`.

## Props contract

```ts
interface PayCardToolProps {
  flags: {
    payTabEnabled: boolean;
    cardParam: boolean;
    ptxCardEnabled: boolean;
    setPayTabEnabled: (value: boolean) => void;
    setCardParam: (value: boolean) => void;
    setPtxCardEnabled: (value: boolean) => void;
  };
  onboarding: {
    steps: readonly {
      id: string;
      label: string;
      done: boolean;
    }[];
    // id "all" applies `done` to every step — the "Reset onboarding" button relies on it
    setStepDone: (id: string, done: boolean) => void;
  };
  hasSeenFeatureTour: boolean;
  resetPayCardFeatureTourSeen: () => void;
  env: {
    // The app reads these values on every request, so `setVar` applies without a restart. Nothing
    // saves them: after a restart the app reads the build's values again.
    vars: readonly {
      key: string;
      // The value the app reads right now.
      value: string;
      // What the input starts with, so one press is enough to change the tenant.
      suggestedValue: string;
    }[];
    setVar: (key: string, value: string) => void;
  };
}
```

## Layout

Platform-specific files use `.web` / `.native` suffixes; the bundler picks the right one. Shared logic lives in suffix-less files.

```
pay-card/
└── src/
    ├── pay-card/          # PayCard.web.tsx / PayCard.native.tsx (default-exported component)
    ├── components/        # Section / row primitives, each with .web/.native variants
    ├── usePayCardViewModel.ts  # shared view model: onboarding progress + step helpers
    ├── types.ts           # PayCardToolProps and its parts
    ├── index.ts           # public exports + `export default PayCard;`
    └── index.native.ts    # native entry point
```

## Styling

DevTools packages rely on the host app's Tailwind build (web) and Lumen `ThemeProvider` (native). The host's `tailwind.config` must include `devtools/**/src/**/*.{ts,tsx}` and extend the Lumen `ledgerLivePreset`.

## Tests

Two jest projects, via `@support/jest-devtools`:

- `pnpm test:web` (`jest.config.js`) — jsdom + `@testing-library/react`. Runs `*.web.test.tsx` and platform-agnostic specs; ignores `*.native.test.*`.
- `pnpm test:native` (`jest.native.config.js`) — `react-native` preset + `@testing-library/react-native`. Runs `*.native.test.{ts,tsx}` only.

Component / themed tests import `@support/jest-devtools/web` or `@support/jest-devtools/native`. Web hook tests that only need `renderHook` keep `@testing-library/react` (no ThemeProvider); native hook tests use `@support/jest-devtools/native`.

`pnpm test` runs both.

## Typecheck

`pnpm typecheck` runs two `tsc` passes (`tsconfig.web.json`, `tsconfig.native.json`), one per platform via `moduleSuffixes`.

# @devtools/pay-card

The Card / Pay DevTool. It puts the Card / Pay feature into a given state from one place.

The shared panel has five sections: **Feature flags**, **Onboarding** (toggle each step done or
not-done), **Reset onboarding**, **Feature tour** (seen state plus a reset) and **Env vars** (the
Card backend values, with the development tenant ready in each input).

The native panel adds **Request verify hint** (seen state plus a reset) and, when the host supplies
navigation, **Quick actions** (Portfolio / Pay tab). It also adds a **Secure browser** section: a
URL field and one button, which opens that URL in the secure browser the hosted login uses. The
host supplies the action, so a host without such a browser shows no section.

When the host builds the `auth` prop, the native panel adds four more sections at the top:
**Auth session** (the stored tokens, or why the secure store refused a read), **Device secure
storage** (read the tokens, damage one, or clear the session), **Send API requests** (renew the
session, or get the user) and **MSW Auth Renewal Mock** (what the mocked
token endpoint answers, plus a count of the renewals). A toast reports what each action answered.

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
  hasSeenReceiveVerifyHint: boolean;
  resetReceiveVerifyHintSeen: () => void;
  onNavigateToPortfolio?: () => void;
  onNavigateToPayTab?: () => void;
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
  // Native only, and optional: absent on a host that does not build the Card session controls,
  // which hides the four auth sections. `PayCardAuthProps` in `src/types.ts` gives the full shape:
  // the session, the action handlers and the mock controls.
  auth?: PayCardAuthProps;
  // Native only, and optional: absent on a host with no secure browser, which hides the section.
  // Answers one line about what came back, and the panel prints it under the button.
  openSecureBrowser?: (url: string) => Promise<string>;
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

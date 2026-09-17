# @devtools/pay-card

The Card / Pay DevTool. It puts the Card / Pay feature into a given state from one place.

The shared panel has: **Card Debug** (a list linking to Card Status / Card interaction, Balance &
Wallets — including **Assets fixtures** (Empty / Loaded / add any currency+network, when MSW is
on) — **Card onboarding** — a full screen showing the real, derived onboarding steps, with
mock-answer toggles when request mocking is on — and Currency Mapping), **Feature flags**, and
**Feature tour** / **Onboarding completed** (seen state plus a reset, each).

The native panel adds **Request verify hint** (seen state plus a reset) and, when the host supplies
navigation, **Quick actions** (Portfolio / Pay tab / Pay contact success / Send success). It also
adds a **Secure browser** section: a URL field and one button, which opens that URL in the secure
browser the hosted login uses. The host supplies the action, so a host without such a browser
shows no section.

When the host builds the `auth` prop, both panels add a **Card session** section: stored tokens,
sign-out, and a user fetch. On Desktop, with `pnpm desktop start:msw`, that section can also sign
in a mock session so Card surfaces work without the hosted login. Native never offers that, because
the session lives in the Keychain.

The native panel then adds three more sections: **Device secure storage** (read the tokens, damage
one, or clear the session), **Send API requests** (renew the session, or get the user) and **MSW
Auth Renewal Mock** (what the mocked token endpoint answers, plus a count of the renewals). A toast
reports what each action answered.

## Import boundary

This package is fully self-contained. It never imports from `@devtools/shell`, `@devtools/registry`, or any other tool. All host state and handlers arrive through `PayCardToolProps`, which is built in `@devtools/bindings` (the only bridge between the app and the tool). This keeps the component renderable standalone, outside the shell.

## Public API

```ts
import PayCard, { type PayCardToolProps } from "@devtools/pay-card";
```

- `PayCard` (default export) — the React component rendered by the shell.
- `PayCardToolProps` — the props contract the host (via bindings) must satisfy, with its part
  `PayCardFlagsProps`.

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
  // The real, derived onboarding status — signals read from getUser/getCardStatus/
  // getCardLinkedWallets, joined onto the step list. Backs the "Card onboarding" screen.
  cardOnboarding: {
    steps: readonly {
      id: string;
      isDone: boolean;
      // False while nothing can answer the step yet (e.g. the purchase step).
      canToggle: boolean;
    }[];
    completedCount: number;
    isFetching: boolean;
    error: string | undefined;
    // The derived status, printed for inspection.
    raw: string;
    refresh: () => void;
    // Sets the mock answer a step reads from (accountVerified/hasCard/walletFunded), or the phone
    // wallet flag directly. A no-op for an id nothing can answer yet.
    setStepDone: (id: string, done: boolean) => void;
    // Clears every mocked answer, handing the endpoints back to the real provider.
    clearMocks: () => void;
    isMockingEnabled: boolean;
  };
  hasSeenFeatureTour: boolean;
  resetPayCardFeatureTourSeen: () => void;
  hasSeenReceiveVerifyHint: boolean;
  resetReceiveVerifyHintSeen: () => void;
  // Whether the card onboarding widget has been permanently dismissed (all steps done + Got it).
  hasCompletedCardOnboarding: boolean;
  resetCardOnboarding: () => void;
  onNavigateToPortfolio?: () => void;
  onNavigateToPayTab?: () => void;
  onNavigateToPaySuccess?: () => void;
  onNavigateToSendSuccess?: () => void;
  // Optional: absent on a host that does not build the Card session controls, which hides them.
  // Desktop uses this for mock sign-in (when request mocking is on) and sign-out. Native uses the
  // same prop for the full session / secure-storage / renewal sections. `PayCardAuthProps` in
  // `src/types.ts` gives the full shape.
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

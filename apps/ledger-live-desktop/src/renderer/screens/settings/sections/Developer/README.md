# Developer Settings (Desktop)

Short guide to decide **which row component to use** in `Settings > Developer`.

## Structure

- Main screen: `tools/index.tsx`
- Generic rows: `components/`
- Tool entries: `tools/`

## Which component should I use?

- `DeveloperInfoRow`

  - Use case: display read-only information (no user action).
  - Example: `User ID`.

- `DeveloperClassicRow`

  - Use case: standard row with `title + desc + control` (usually a simple switch).
  - Example: `AllowDebugAppsToggle`, `EnableThemeConsole`.

- `DeveloperClassicInputRow`

  - Use case: switch that enables conditional controls (input + Apply button, etc.).
  - Key props: `isEnabled`, `onToggle`, `children`.
  - Examples: `CatalogProviderInput`, `CustomCALRefInput`, `ExchangeDeveloperMode`.

- `DeveloperOpenRow`

  - Use case: single button that opens a page/modal/drawer.
  - Key props: `cta`, `onOpen`.
  - Examples: `CustomLockScreenToggle`, `LottieTester`, `BrazeTools`.

- `DeveloperExpandableRow`

  - Use case: `Show/Hide` button that reveals rich inline content.
  - Key props: `desc` (content), `expanded`, `onToggle`.
  - Examples: `FeatureFlagsSettings`, `EnvVariableOverride`, `WalletFeaturesDevTool`.

- `DeveloperActionsRow`
  - Use case: one row with **multiple action buttons** on the right.
  - Key props: `actions` (array of `{ key, label, onClick, appearance?, dataTestId? }`).
  - Examples: `RunLocalAppButton`, `CustomLockScreenTester`, `PostOnboardingHubTester`.

## Quick decision order

1. No action -> `DeveloperInfoRow`
2. One "Open" action -> `DeveloperOpenRow`
3. Show/Hide + collapsible content -> `DeveloperExpandableRow`
4. Switch + conditional controls -> `DeveloperClassicInputRow`
5. Multiple buttons -> `DeveloperActionsRow`
6. Switch-only row -> `DeveloperClassicRow`

## Best practices

- Keep business logic in `tools/` files, not in generic components.
- Apply the MVVM pattern when possible (keep view logic in components, move business/state orchestration to view models/hooks).
- Keep translations (`t(...)`) inside tool components.
- Preserve `data-testid` on row/buttons when needed.
- If a new need does not fit these patterns, add a **new generic component** in `components/` instead of duplicating JSX.

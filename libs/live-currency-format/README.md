# live-currency-format

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Locale-aware currency formatting utilities for Ledger Live. Handles display of crypto and fiat amounts, parsing user input back into BigNumber values, RTL language support, and price formatting. Used across both desktop and mobile UIs wherever a balance, fee, or price must be rendered as a human-readable string.

## What it does

- Formats `BigNumber` crypto/fiat amounts respecting locale decimal separators and grouping
- Parses user-typed currency strings back into `BigNumber` (input sanitization)
- Formats price values (fiat countervalues, market prices)
- Provides RTL utility helpers for correct text direction in Arabic, Hebrew, etc.
- Exposes locale detection utilities used by the formatters

## Key exports / concepts

- `formatCurrencyUnit(unit, value, options)` — main formatting function for any currency unit
- `parseCurrencyUnit(unit, str)` — inverse of format; returns a BigNumber
- `BigNumberToLocaleString` — low-level locale-aware number stringifier
- `sanitizeValueString` — cleans raw user input before parsing
- `formatPrice` / `priceFormat` — countervalue / market price display
- `isRTL` / RTL helpers — direction utilities

## Usage context

Used by both `apps/ledger-live-desktop` and `apps/ledger-live-mobile`, and by `libs/ledger-live-common`, wherever amounts need to be displayed or entered. This is a leaf dependency with no Ledger Live runtime dependencies of its own.

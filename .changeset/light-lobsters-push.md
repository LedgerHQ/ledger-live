---
"ledger-live-desktop": patch
---

Fix half-light / half-dark rendering on the Wallet 4.0 Portfolio when toggling theme via the floating ThemeConsole. The ProductTour dialog's hardcoded `<ThemeProvider colorScheme="dark">` wrapper was applying the `dark` class on `<html>` globally and racing with the root ThemeProvider. The dialog is now scoped via a local `dark` class on `DialogContent` so it stays dark without polluting the global theme.

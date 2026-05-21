---
"live-mobile": patch
---

Fix the APY percentage shown in the Asset Detail Earn banner. The interest rate value is a decimal fraction (e.g. `0.04` for 4%) and was rendered as-is, which made every banner display "0.0% APY". The value is now converted to a percentage before formatting, and the parameterized banner is only shown when the rounded display percentage is greater than zero (the generic banner is used otherwise).

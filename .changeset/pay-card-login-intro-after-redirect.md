---
"@features/flow-pay-card-auth": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(pay-card): save the Card login intro flag after a redirect login

The desktop redirect returns through a route change, which remounts the login screen. The flag that
marks the intro seen was local to the mount that started the login, so desktop never saved it and
kept offering "Get card" after a login. The signed-out desktop screen now shows the heading, the
reason and a single Log in action.

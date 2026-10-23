---
"@shared/app-config": minor
"@devtools/app-config": minor
"@devtools/bindings": minor
"@devtools/registry": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

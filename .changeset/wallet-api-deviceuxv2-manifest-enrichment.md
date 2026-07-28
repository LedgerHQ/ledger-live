---
"live-mobile": minor
---

Enrich the wallet-api Device Intent Executor deviceUxV2 analytics funnel events (deviceflow_started, app_ready, deviceflow_completed, deviceflow_aborted/failed and the drawer close button_clicked) with the calling live-app's manifestId and manifestName. This keeps sourceFlow="wallet_api" while letting dashboards distinguish the originating app (swap, earn, dApp, ...) via a generic analytics-properties bag threaded through the executor.

# @features/platform-agent-intent-entry-points

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Entry points from Ledger Wallet to Agent Intent, shared by desktop and mobile. The Agent Intent screens themselves are owned by another package.

## Exports

- `useAgentIntentEntryPoints()` reads the `agentIntent` flag and returns `{ isNavBarEnabled, isProfileEnabled }`. Both entry points can be on at the same time for A/B testing.
- `getAgentIntentAttributes(flag)` returns `{ isEnabled, entryPoints }` for the app analytics `extraProperties` (identify traits and event properties).
- `ManageAgentsCard` is the "Manage your agents" card of My Wallet. The app passes the labels and `onOpen`.
- `trackManageAgentsClick(page)` tracks the card click as `button_clicked` with `source: "profile"`.
- `AGENT_INTENT_TRACKING_ENTRY` and `AGENT_INTENT_SOURCE` are the tracking values the apps reuse for the nav bar entry point.

## Source contract

Each entry point opens Agent Intent with a `source` (`nav_bar` or `profile`). Every Agent Intent event down the funnel must send that `source` back so the funnel is attributed to its entry point ([tracking plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7678230642/Agent+intent+-+Tracking+Plan)).

# @features/flow-agent-intent-entry-points

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Entry points from Ledger Wallet to Agent Intent, shared by desktop and mobile. The Agent Intent screens themselves are owned by another package.

## Exports

- `useAgentIntentEntryPoints()` reads the `agentIntent` flag and returns `{ isNavBarEnabled, isProfileEnabled, showNewBadge }`. Both entry points can be on at the same time for A/B testing. `showNewBadge` follows the `newBadge` flag param.
- `getAgentIntentAttributes(flag)` returns `{ isEnabled, entryPoints, newBadge }` for the app analytics `extraProperties` (identify traits and event properties).
- `ManageAgentsCard` is the "Manage your agents" card of My Wallet. It shows a "New" tag when `showNewBadge` is true. It resolves its wording through `@shared/i18n` (`agentIntent.manageAgents.title`, `agentIntent.manageAgents.description`, `common.new`), so each consuming app holds these keys in its English catalog. The app passes `onOpen` and `showNewBadge`.
- `trackManageAgentsClick(page, newBadge)` tracks the card click as `button_clicked` with `source: "profile"` and the `newBadge` shown on the card.
- `AGENT_INTENT_TRACKING_ENTRY` and `AGENT_INTENT_SOURCE` are the tracking values the apps reuse for the nav bar entry point.

## Source contract

Each entry point opens Agent Intent with a `source` (`nav_bar` or `profile`). Every Agent Intent event down the funnel must send that `source` back so the funnel is attributed to its entry point ([tracking plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7678230642/Agent+intent+-+Tracking+Plan)).

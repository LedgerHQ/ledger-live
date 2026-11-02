# @features/flow-account-detail-analytics-introduction

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Owns the Account Detail Analytics introduction: confirmed-history eligibility and
installation-wide dismissal. The Account Detail orchestrator keeps its layout and feature gate.

## Exports

| Entry | Content |
| --- | --- |
| `.` | `hasConfirmedAccountHistory(account, isConfirmed)`, `shouldShowAccountAnalyticsIntroduction(status)` and neutral input types |
| `./state` | Dismissal slice, validated restoration and persistence selectors |

The host provides its existing operation confirmation rule. Native or token history qualifies;
pending-only activity or an operation count alone does not. Balance and fiat pricing do not affect
eligibility. Rendering does not consume the introduction; close and CTA do.

Apps register the reducer and persist its projection locally. Dismissal applies to every account
on one installation, with no synchronization between desktop and mobile. Storage integration and
error handling stay in the host; durable dismissal across restarts requires a successful write.

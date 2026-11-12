# @features/flow-account-detail-analytics-notice

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Owns the Account Detail Analytics introduction: confirmed-history eligibility and
installation-wide dismissal and the information Banner on web and native. The Account Detail orchestrator keeps its layout and feature gate.

## Exports

| Entry | Content |
| --- | --- |
| `.` (universal) | `AccountAnalyticsIntroduction` and its neutral props contract, `hasConfirmedAccountHistory(account, isConfirmed)`, `shouldShowAccountAnalyticsIntroduction(status)` and neutral input types |
| `./state` | Dismissal slice, validated restoration and persistence selectors |

The host provides its existing operation confirmation rule. Native or token history qualifies;
pending-only activity or an operation count alone does not. Balance and fiat pricing do not affect
eligibility. Only close consumes the introduction; rendering and the CTA do not.

The introduction shows when the host gate `isEnabled` is on (the `accountDetail` flag
`analyticsBanner` param), the installation is eligible, the account has confirmed history and the
introduction is not dismissed. Eligibility is a one-time snapshot: on the first launch that reads
the persisted state successfully, the host records whether the user had already completed
onboarding with a device (`recordAccountAnalyticsIntroductionEligibility`), and later launches keep
it. A user who onboards after that launch is never eligible, so the introduction targets users who
knew the legacy account page. Reset clears the dismissal and keeps the snapshot.

Apps register the reducer and persist its projection locally. Dismissal applies to every account
on one installation, with no synchronization between desktop and mobile. Storage integration and
error handling stay in the host; durable dismissal across restarts requires a successful write.
On a failed read the host keeps the default state and records no snapshot, so the introduction stays hidden for that session. On a failed
write the dismissal holds for the running session and the introduction can show again after a
restart; the next dismissal writes again.

The single introduction component uses Container → ViewModel → View at `src/`. The host supplies
confirmed history, dismissal state and callbacks; navigation and physical storage stay in the apps.
Web and native share the container and ViewModel; only the View is platform-specific (Lumen
React or Lumen RN Banner). The wording keys go through `@shared/i18n`, and each host catalog
carries `accountDetail.analyticsIntroduction.*` in English.

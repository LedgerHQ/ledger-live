---
"live-mobile": minor
---

Rebuild the LWM notifications prompt QA debug screen: a status hero with a live, step-by-step decision trace explains exactly why the drawer would or wouldn't show for either trigger type, "trigger via production rules" and "force open" let QA see the real drawer for both prompt targets, and new remote-config override controls (feature toggle, Fast QA mode, per-action-event and transaction-alerts-prompt toggles, restore-to-remote) plus user-state simulation (OS permission, app notification toggles, opt-in/opt-out, scenario prep, full reset) make every configuration and state directly testable from the screen.

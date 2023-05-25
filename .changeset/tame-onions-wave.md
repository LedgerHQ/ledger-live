---
"ledger-live-desktop": patch
---

Implementation of a part of the analytics tracking plan for Stax on LLD + analytics dev experience improvement:

- Improved the in-app analytics console of LLD for better readability and ease of use. (start LLD with env variable `ANALYTICS_CONSOLE=1`)
  - pretty printing of event properties
  - optional toggling of the visibility of redundant properties (sent with every event)
  - 3 visibility modes of the console: opaque, transparent, hidden
  - events are visible for longer (now the list of events is just limited in length, previously they would just fade out after a couple of seconds)
  - possibility to filter out "sync*" events
- Improved the tracking of the `source` property, used a similar logic to the one used in LLM. This might be breaking for existing analytics as in some events will have an extra source property where they didn't have one before.
- Tracking plan: sync onboarding: everything was implemented except for the software checks analytics, as this part will be removed to be reimplemented in the Early Security Checks, before the release of Stax.
- Tracking plan: post-onboarding hub
- Tracking plan: custom lock screen

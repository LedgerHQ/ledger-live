---
"live-mobile": minor
---

feat(mobile): Analytics readOnlyMode tracking and test/setup improvements

- Add readOnlyMode to Segment event properties: included in getMandatoryProperties() so every track/screen event carries the current value from state at runtime (no updateIdentify when read-only mode is toggled)

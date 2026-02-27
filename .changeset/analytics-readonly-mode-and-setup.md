---
"live-mobile": minor
---

feat(mobile): Analytics readOnlyMode tracking and test/setup improvements

- Add readOnlyMode to Segment identify and all events; update identify when readOnlyMode changes via store.subscribe
- Jest setup: mock @segment/analytics-react-native with requireActual + _identifyMock, add ANALYTICS_TOKEN/ANALYTICS_LOGS to react-native-config mock, add ~/user default mock
- Add segment.readOnlyMode tests (identify on start and when readOnlyMode toggles)

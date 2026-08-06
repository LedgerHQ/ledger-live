import type { Store } from "@reduxjs/toolkit";
import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import {
  userIdSelector,
  isDummyUserId,
  type IdentitiesState,
} from "@domain/entity-client-identity";
import { shouldIncludeSegmentIdentity } from "./segmentIdentity";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;
  store;

  constructor(store: Store<{ identities: IdentitiesState }>) {
    super();
    this.store = store;
  }

  execute(event: SegmentEvent) {
    const state = this.store.getState();
    if (!shouldIncludeSegmentIdentity(state)) {
      return event;
    }

    const userId = userIdSelector(state);
    if (!isDummyUserId(userId) && event) {
      // eslint-disable-next-line no-param-reassign
      event.userId = userId.exportUserIdForAnalytics();
    }
    return event;
  }
}

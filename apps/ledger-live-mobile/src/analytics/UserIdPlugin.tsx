import type { Store } from "@reduxjs/toolkit";
import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import { userIdSelector, isDummyUserId, type IdentitiesState } from "@ledgerhq/client-ids/store";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;
  store;

  constructor(store: Store<{ identities: IdentitiesState }>) {
    super();
    this.store = store;
  }

  execute(event: SegmentEvent) {
    const state = this.store.getState();
    const userId = userIdSelector(state);
    if (!isDummyUserId(userId) && event) {
      // eslint-disable-next-line no-param-reassign
      event.userId = userId.exportUserIdForAnalytics();
    }
    return event;
  }
}

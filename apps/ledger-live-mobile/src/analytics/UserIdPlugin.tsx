import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import { userIdSelector, isDummyUserId } from "@domain/entity-client-identity";
import type { AppStore } from "~/reducers";
import { shouldIncludeSegmentIdentity } from "./segmentIdentity";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;
  store: AppStore;

  constructor(store: AppStore) {
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

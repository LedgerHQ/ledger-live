import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import { userIdSelector, isDummyUserId } from "@ledgerhq/client-ids/store";
import { store } from "../state-manager/configureStore";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;

  execute(event: SegmentEvent) {
    const state = store.getState();
    const userId = userIdSelector(state);
    if (!isDummyUserId(userId) && event) {
      // eslint-disable-next-line no-param-reassign
      event.userId = userId.exportUserIdForAnalytics();
    }
    return event;
  }
}

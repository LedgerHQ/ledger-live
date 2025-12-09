import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import { getState } from "../context/store";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;

  async execute(event: SegmentEvent) {
    const state = getState();
    const userId = state.identities.userId;

    if (event) {
      // eslint-disable-next-line no-param-reassign
      event.userId = userId.exportUserIdForSegment();
    }
    return event;
  }
}

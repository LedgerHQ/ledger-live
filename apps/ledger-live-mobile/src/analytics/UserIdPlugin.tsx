import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";
import getOrCreateUser from "../user";

export class UserIdPlugin extends Plugin {
  type = PluginType.enrichment;

  async execute(event: SegmentEvent) {
    // FIXME migrate to userIdSelector + exportUserIdForSegment() (equipment_id = segment ID, need to add this method)
    const { user } = await getOrCreateUser();

    if (user && event) {
      // eslint-disable-next-line no-param-reassign
      event.userId = user.id;
    }
    return event;
  }
}

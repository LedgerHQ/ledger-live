import {
  Plugin,
  PluginType,
  UserInfoState,
  SegmentEvent,
  EventType,
} from "@segment/analytics-react-native";
import isEqual from "lodash/isEqual";

export class BrazePlugin extends Plugin {
  type = PluginType.before;
  key = "Appboy";
  private lastSeenTraits: UserInfoState | undefined = undefined;

  execute(event: SegmentEvent): SegmentEvent | undefined {
    //check to see if anything has changed
    //if it hasn't changed disable integration
    if (event.type === EventType.IdentifyEvent) {
      // console.log("LAST SEEN TRAITS", JSON.stringify(this.lastSeenTraits?.traits));
      // console.log("TRAITS", JSON.stringify(event.traits));
      console.log("IS EQUAL", isEqual(this.lastSeenTraits?.traits, event.traits));
      if (
        this.lastSeenTraits?.userId === event.userId &&
        this.lastSeenTraits?.anonymousId === event.anonymousId &&
        isEqual(this.lastSeenTraits?.traits, event.traits)
      ) {
        console.log("DO NOT SEND", JSON.stringify(event.integrations));
        const integrations = event.integrations;

        if (integrations !== undefined) {
          integrations[this.key] = false;
        }
      } else {
        console.log("SEND");
        // TODO : Filter event traits to only send new ones ?
        this.lastSeenTraits = {
          anonymousId: event.anonymousId ?? "",
          userId: event.userId,
          traits: event.traits,
        };
      }
    }
    return event;
  }
}

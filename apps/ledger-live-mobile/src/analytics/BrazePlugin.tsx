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
    if (event.type === EventType.IdentifyEvent) {
      // We don't check for some traits as they are sure to be different every time
      const traits = {
        ...event.traits,
        appTimeToInteractiveMilliseconds: undefined,
        stakingProvidersEnabled: undefined,
      };
      if (
        this.lastSeenTraits?.userId === event.userId &&
        this.lastSeenTraits?.anonymousId === event.anonymousId &&
        isEqual(this.lastSeenTraits?.traits, traits)
      ) {
        const integrations = event.integrations;

        // If the traits didn't changed, disable braze integration
        if (integrations !== undefined) {
          integrations[this.key] = false;
        }
      } else {
        this.lastSeenTraits = {
          anonymousId: event.anonymousId ?? "",
          userId: event.userId,
          traits: traits,
        };
      }
    }
    return event;
  }
}

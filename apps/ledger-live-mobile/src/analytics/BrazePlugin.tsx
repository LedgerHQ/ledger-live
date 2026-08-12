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
      const traits = event.traits ?? {};
      const shouldSkipBrazeDestination = !("braze_external_id" in traits);

      // We don't check for some traits as they are sure to be different every time
      const debouncedTraits = {
        ...traits,
        appTimeToInteractiveMilliseconds: undefined,
        stakingProvidersEnabled: undefined,
      };
      if (
        this.lastSeenTraits?.userId === event.userId &&
        this.lastSeenTraits?.anonymousId === event.anonymousId &&
        isEqual(this.lastSeenTraits?.traits, debouncedTraits)
      ) {
        // If the traits didn't change, disable braze integration
        const integrations = event.integrations ?? {};
        integrations[this.key] = false;
        event.integrations = integrations;
      } else {
        this.lastSeenTraits = {
          anonymousId: event.anonymousId ?? "",
          userId: event.userId,
          traits: debouncedTraits,
        };
      }

      if (shouldSkipBrazeDestination) {
        const integrations = event.integrations ?? {};
        integrations[this.key] = false;
        event.integrations = integrations;
      }
    }
    return event;
  }
}

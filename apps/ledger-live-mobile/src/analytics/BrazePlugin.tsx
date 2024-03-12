import {
  Plugin,
  PluginType,
  UserInfoState,
  SegmentEvent,
  EventType,
} from "@segment/analytics-react-native";

const deepCompare = (obj1: any, obj2: any) => {
  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

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
      console.log("IS EQUAL", deepCompare(this.lastSeenTraits?.traits, event.traits));
      if (
        this.lastSeenTraits?.userId === event.userId &&
        this.lastSeenTraits?.anonymousId === event.anonymousId &&
        deepCompare(this.lastSeenTraits?.traits, event.traits)
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

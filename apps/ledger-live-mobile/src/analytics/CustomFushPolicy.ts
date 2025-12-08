import { EventType, FlushPolicyBase, type SegmentEvent } from "@segment/analytics-react-native";

const IMMEDIATE_FLUSH_EVENTS = ["Page Wallet"];

export class FlushOnScreenEventsPolicy extends FlushPolicyBase {
  start(): void {
    // No initialization needed
  }

  onEvent(event: SegmentEvent): void {
    if (event.type === EventType.TrackEvent && IMMEDIATE_FLUSH_EVENTS.includes(event.event)) {
      this.shouldFlush.value = true;
    }
  }
}

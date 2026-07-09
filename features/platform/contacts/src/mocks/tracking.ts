import type { ContactsTrackingEvent, ContactsTrackingPort } from "../contracts";

export function createMockContactsTrackingPort(
  trackedEvents: ContactsTrackingEvent[],
): ContactsTrackingPort {
  return {
    trackContactsEvent(event: ContactsTrackingEvent): void {
      trackedEvents.push(event);
    },
  };
}

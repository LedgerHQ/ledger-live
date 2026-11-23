import { trackPage, track } from "@shared/analytics";
import type {
  ContactsAnalyticsAdapter,
  ContactsPageEventPayload,
  ContactsTrackEventPayload,
} from "@features/flow-contacts";
import { CONTACTS_ANALYTICS_PLATFORM } from "./constants";
import { mapContactsPageEventToScreenCategory } from "./mapContactsPageEventToScreenCategory";

export function createContactsAnalyticsAdapter(): ContactsAnalyticsAdapter {
  return {
    track: ({ name, properties }) => {
      // Every event's properties, not the generic one: track checks them for sensitive values.
      const props: ContactsTrackEventPayload["properties"] = properties;
      track(name, {
        ...props,
        platform: CONTACTS_ANALYTICS_PLATFORM,
      });
    },
    trackPage: ({ page, properties }) => {
      const props: ContactsPageEventPayload["properties"] = properties;
      void trackPage(
        {
          category: mapContactsPageEventToScreenCategory(page),
          props: {
            ...props,
            platform: CONTACTS_ANALYTICS_PLATFORM,
          },
        },
        { updateRoutes: true, refreshSource: true },
      );
    },
  };
}

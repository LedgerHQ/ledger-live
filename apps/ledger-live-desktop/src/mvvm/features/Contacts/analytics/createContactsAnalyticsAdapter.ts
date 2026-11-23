import type {
  ContactsAnalyticsAdapter,
  ContactsPageEventPayload,
  ContactsTrackEventPayload,
} from "@features/flow-contacts";
import { track, trackPage } from "@shared/analytics";
import { CONTACTS_ANALYTICS_PLATFORM } from "./constants";
import { mapContactsPageEventToScreenCategory } from "./mapContactsPageEventToScreenCategory";

export function createContactsAnalyticsAdapter(): ContactsAnalyticsAdapter {
  return {
    track<T extends ContactsTrackEventPayload["name"]>(payload: ContactsTrackEventPayload<T>) {
      // Every event's properties, not the generic one: track checks them for sensitive values.
      const props: ContactsTrackEventPayload["properties"] = payload.properties;
      track(payload.name, {
        ...props,
        platform: CONTACTS_ANALYTICS_PLATFORM,
      });
    },
    trackPage<T extends ContactsPageEventPayload["page"]>(payload: ContactsPageEventPayload<T>) {
      const { category, name } = mapContactsPageEventToScreenCategory(payload.page);
      const pageProps: ContactsPageEventPayload["properties"] = payload.properties;

      trackPage(
        {
          category,
          name,
          props: {
            ...pageProps,
            platform: CONTACTS_ANALYTICS_PLATFORM,
          },
        },
        { updateRoutes: true, refreshSource: true },
      );
    },
  };
}

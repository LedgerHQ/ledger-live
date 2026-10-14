import { trackPage, track } from "@shared/analytics";
import type { ContactsAnalyticsAdapter } from "@features/flow-contacts";
import { CONTACTS_ANALYTICS_PLATFORM } from "./constants";
import { mapContactsPageEventToScreenCategory } from "./mapContactsPageEventToScreenCategory";

export function createContactsAnalyticsAdapter(): ContactsAnalyticsAdapter {
  return {
    track: ({ name, properties }) => {
      track(name, {
        ...properties,
        platform: CONTACTS_ANALYTICS_PLATFORM,
      });
    },
    trackPage: ({ page, properties }) => {
      void trackPage(
        {
          category: mapContactsPageEventToScreenCategory(page),
          props: {
            ...properties,
            platform: CONTACTS_ANALYTICS_PLATFORM,
          },
        },
        { updateRoutes: true, refreshSource: true },
      );
    },
  };
}

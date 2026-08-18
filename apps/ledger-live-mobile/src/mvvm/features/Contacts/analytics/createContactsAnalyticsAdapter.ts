import type { ContactsAnalyticsAdapter } from "@features/flow-contacts";
import { screen, track } from "~/analytics";
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
      void screen(
        mapContactsPageEventToScreenCategory(page),
        undefined,
        {
          ...properties,
          platform: CONTACTS_ANALYTICS_PLATFORM,
        },
        true,
        true,
      );
    },
  };
}

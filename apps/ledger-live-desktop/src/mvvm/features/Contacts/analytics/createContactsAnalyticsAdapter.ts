import type {
  ContactsAnalyticsAdapter,
  ContactsPageEventPayload,
  ContactsTrackEventPayload,
} from "@features/flow-contacts";
import { track, trackPage } from "~/renderer/analytics/segment";
import { CONTACTS_ANALYTICS_PLATFORM } from "./constants";
import { mapContactsPageEventToScreenCategory } from "./mapContactsPageEventToScreenCategory";

export function createContactsAnalyticsAdapter(): ContactsAnalyticsAdapter {
  return {
    track<T extends ContactsTrackEventPayload["name"]>(payload: ContactsTrackEventPayload<T>) {
      track(payload.name, {
        ...payload.properties,
        platform: CONTACTS_ANALYTICS_PLATFORM,
      });
    },
    trackPage<T extends ContactsPageEventPayload["page"]>(payload: ContactsPageEventPayload<T>) {
      const { category, name } = mapContactsPageEventToScreenCategory(payload.page);

      trackPage(
        category,
        name,
        {
          ...payload.properties,
          platform: CONTACTS_ANALYTICS_PLATFORM,
        },
        true,
        true,
      );
    },
  };
}

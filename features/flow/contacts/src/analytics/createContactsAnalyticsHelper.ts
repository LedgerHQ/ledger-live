import type { ContactsGlobalProperties } from "@features/platform-contacts";
import type {
  ContactsPageEventInputParams,
  ContactsPageEventName,
  ContactsPageEventParams,
  ContactsPageEventPayload,
  ContactsTrackEventInputParams,
  ContactsTrackEventName,
  ContactsTrackEventParams,
  ContactsTrackEventPayload,
} from "./contactsAnalytics.types";

export type ContactsAnalyticsAdapter = Readonly<{
  track: <T extends ContactsTrackEventName>(payload: ContactsTrackEventPayload<T>) => void;
  trackPage: <T extends ContactsPageEventName>(payload: ContactsPageEventPayload<T>) => void;
}>;

export type ContactsAnalyticsHelper = Readonly<{
  trackEvent: <T extends ContactsTrackEventName>(
    eventName: T,
    params: ContactsTrackEventInputParams[T],
  ) => void;
  trackPage: <T extends ContactsPageEventName>(
    pageName: T,
    params: ContactsPageEventInputParams[T],
  ) => void;
  getGlobalProperties: () => ContactsGlobalProperties;
}>;

export function createContactsAnalyticsHelper(
  adapter: ContactsAnalyticsAdapter,
  getGlobalProperties: () => ContactsGlobalProperties,
): ContactsAnalyticsHelper {
  return {
    getGlobalProperties,
    trackEvent(eventName, params) {
      adapter.track({
        name: eventName,
        properties: {
          ...getGlobalProperties(),
          ...params,
        } as ContactsTrackEventParams[typeof eventName],
      });
    },
    trackPage(pageName, params) {
      adapter.trackPage({
        page: pageName,
        properties: {
          ...getGlobalProperties(),
          ...params,
        } as ContactsPageEventParams[typeof pageName],
      });
    },
  };
}

export function createNoopContactsAnalyticsAdapter(): ContactsAnalyticsAdapter {
  return {
    track: () => undefined,
    trackPage: () => undefined,
  };
}

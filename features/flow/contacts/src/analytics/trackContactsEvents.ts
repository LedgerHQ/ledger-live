import type { ContactId } from "@domain/entity-contact";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  type ContactsTrackingButton,
} from "./contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "./createContactsAnalyticsHelper";

export function trackContactsListContactOpen(
  analytics: ContactsAnalyticsHelper,
  contactId: ContactId,
  meContactId: ContactId,
): void {
  analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
    source: CONTACTS_EVENT_SOURCE.LIST,
    button: CONTACTS_TRACKING_BUTTON.contact,
    page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    myContact: contactId === meContactId,
  });
}

export function trackContactsLedgerSyncDismiss(analytics: ContactsAnalyticsHelper): void {
  analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
    source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
    button: CONTACTS_TRACKING_BUTTON.dismiss,
    page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
  });
}

export function trackContactsLedgerSyncActivate(analytics: ContactsAnalyticsHelper): void {
  analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
    source: CONTACTS_EVENT_SOURCE.LEDGER_SYNC_GATE,
    button: CONTACTS_TRACKING_BUTTON.activateLedgerSync,
    page: CONTACTS_PAGE_PROPERTY.LEDGER_SYNC_GATE,
  });
}

export function trackContactsAddAddressClick(
  analytics: ContactsAnalyticsHelper,
  contactId: ContactId,
  meContactId: ContactId,
): void {
  analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
    source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
    button: CONTACTS_TRACKING_BUTTON.addAddress,
    page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    type: contactId === meContactId ? "me" : "other",
  });
}

export function trackContactAddressDetailQuickAction(
  analytics: ContactsAnalyticsHelper,
  button: ContactsTrackingButton,
  asset?: string,
): void {
  analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
    source: CONTACTS_EVENT_SOURCE.QUICK_ACTION,
    button,
    page: CONTACTS_PAGE_PROPERTY.ADDRESS_DETAIL,
    ...(asset ? { asset } : {}),
  });
}

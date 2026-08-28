import type { Contact } from "@domain/entity-contact";
import type { AddContactDialogLifecycleCallbacks } from "@features/flow-contacts-add-contact";
import { useCallback, useMemo } from "react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";

export type ContactsAddContactAnalytics = Readonly<{
  callbacks: AddContactDialogLifecycleCallbacks;
  onSaveSuccess: (contact: Contact) => void;
}>;

/**
 * Builds the Contacts tracking-plan callbacks for the shared Add contact dialog lifecycle so every
 * host (Contacts page, Pay) reports the same events without duplicating the analytics payloads.
 */
export function useContactsAddContactAnalytics(
  analytics: ContactsAnalyticsHelper,
  onSaveSuccess: (contact: Contact) => void,
): ContactsAddContactAnalytics {
  const handleSaveSuccess = useCallback(
    (contact: Contact) => {
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.CONTACT_ADDED, {
        source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
        hasCustomPicture: false,
        flow: CONTACTS_FLOW.CONTACTS,
        page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      });
      onSaveSuccess(contact);
    },
    [analytics, onSaveSuccess],
  );
  const callbacks = useMemo<AddContactDialogLifecycleCallbacks>(
    () => ({
      onOpen: () => {
        analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
          source: CONTACTS_EVENT_SOURCE.LIST,
          button: CONTACTS_TRACKING_BUTTON.addContact,
          page: CONTACTS_PAGE_PROPERTY.CONTACTS,
        });
        analytics.trackPage(CONTACTS_PAGE_EVENTS.ADD_CONTACT, {
          source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
          flow: CONTACTS_FLOW.CONTACTS,
        });
      },
      onConfirm: () => {
        analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
          source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
          button: CONTACTS_TRACKING_BUTTON.saveContact,
          page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
          hasPicture: false,
          flow: CONTACTS_FLOW.CONTACTS,
        });
      },
      onInvalidNameErrorDisplayed: () => {
        analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
          source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
          page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
          errorType: "invalid name",
        });
      },
    }),
    [analytics],
  );

  return { callbacks, onSaveSuccess: handleSaveSuccess };
}

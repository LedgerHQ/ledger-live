import {
  type ContactCreationPort,
  type ContactsAddContactContentLabels,
  type AddContactContentViewModel,
  useAddContactContentViewModel,
} from "@features/flow-contacts-add-contact";
import type { Contact } from "@domain/entity-contact";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "../analytics/contactsAnalytics.types";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";

export type UseAddContactAppAdapterOptions = Readonly<{
  analytics: ContactsAnalyticsHelper;
  contactCreation: ContactCreationPort;
  onSaveSuccess: (contact: Contact) => void;
  labels: ContactsAddContactContentLabels;
}>;

export type AddContactAppAdapterResult = AddContactContentViewModel &
  Readonly<{
    isOpen: boolean;
    labels: ContactsAddContactContentLabels;
    onOpen: () => void;
    onClose: () => void;
  }>;

export function useAddContactAppAdapter({
  analytics,
  contactCreation,
  onSaveSuccess,
  labels,
}: UseAddContactAppAdapterOptions): AddContactAppAdapterResult {
  const hasTrackedInvalidNameError = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
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
  const contentViewModel = useAddContactContentViewModel({
    contactCreation,
    onSaveSuccess: handleSaveSuccess,
  });
  const onClose = useCallback(() => {
    setIsOpen(false);
    contentViewModel.reset();
  }, [contentViewModel]);
  const onOpen = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.LIST,
      button: CONTACTS_TRACKING_BUTTON.addContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACTS,
    });
    analytics.trackPage(CONTACTS_PAGE_EVENTS.ADD_CONTACT, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    setIsOpen(true);
  }, [analytics]);
  const onConfirm = useCallback(async () => {
    if (contentViewModel.invalidNameError) {
      return undefined;
    }

    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      button: CONTACTS_TRACKING_BUTTON.saveContact,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      hasPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    const createdContact = await contentViewModel.onConfirm();
    if (createdContact !== undefined) {
      onClose();
    }
    return createdContact;
  }, [analytics, contentViewModel, onClose]);
  const isNameErrorDisplayed = useMemo(
    () => isOpen && !contentViewModel.isSaving && contentViewModel.invalidNameError !== null,
    [contentViewModel.invalidNameError, contentViewModel.isSaving, isOpen],
  );

  useEffect(() => {
    if (isNameErrorDisplayed && !hasTrackedInvalidNameError.current) {
      hasTrackedInvalidNameError.current = true;
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
        source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
        page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
        errorType: "invalid name",
      });
      return;
    }

    if (!isNameErrorDisplayed) {
      hasTrackedInvalidNameError.current = false;
    }
  }, [analytics, isNameErrorDisplayed]);

  return {
    ...contentViewModel,
    isOpen,
    labels,
    onOpen,
    onClose,
    onConfirm,
  };
}

import {
  type ContactCreationPort,
  type ContactsAddContactDrawerLabels,
  type AddContactDrawerViewModel,
  useAddContactDrawerViewModel,
} from "@features/flow-contacts-add-contact";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
  onSaveSuccess: () => void;
  labels: ContactsAddContactDrawerLabels;
}>;

export type AddContactAppAdapterResult = AddContactDrawerViewModel &
  Readonly<{
    labels: ContactsAddContactDrawerLabels;
    onOpen: () => void;
    onConfirm: () => Promise<void>;
  }>;

export function useAddContactAppAdapter({
  analytics,
  contactCreation,
  onSaveSuccess,
  labels,
}: UseAddContactAppAdapterOptions): AddContactAppAdapterResult {
  const hasTrackedInvalidNameError = useRef(false);
  const handleSaveSuccess = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.CONTACT_ADDED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      hasCustomPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
    });
    onSaveSuccess();
  }, [analytics, onSaveSuccess]);
  const drawerViewModel = useAddContactDrawerViewModel({
    contactCreation,
    onSaveSuccess: handleSaveSuccess,
  });
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
    drawerViewModel.onOpen();
  }, [analytics, drawerViewModel]);
  const onConfirm = useCallback(async () => {
    if (drawerViewModel.invalidNameError) {
      return;
    }

    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      button: CONTACTS_TRACKING_BUTTON.saveContact,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      hasPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    await drawerViewModel.onConfirm();
  }, [analytics, drawerViewModel]);
  const isNameErrorDisplayed = useMemo(
    () =>
      drawerViewModel.isOpen &&
      !drawerViewModel.isSaving &&
      drawerViewModel.invalidNameError !== null,
    [drawerViewModel.invalidNameError, drawerViewModel.isOpen, drawerViewModel.isSaving],
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
    ...drawerViewModel,
    labels,
    onOpen,
    onConfirm,
  };
}

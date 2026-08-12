import {
  addContact,
  contact,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import {
  type ContactCreationPort,
  type ContactsAddContactDialogLabels,
  type ContactsAddContactDialogProps,
  useAddContactDrawerViewModel,
} from "@features/flow-contacts-add-contact";
import {
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useDispatch } from "LLD/hooks/redux";
import { useContactsAnalytics } from "../../analytics";

export function useAddContactDialogAdapter(
  onSaveSuccess: () => void,
): ContactsAddContactDialogProps {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const hasTrackedInvalidNameError = useRef(false);
  const contactCreation = useMemo<ContactCreationPort>(
    () => ({
      createContact: async ({ name }) => {
        const createdContact = contact({
          id: `contact-${uuid()}`,
          isMe: false,
          name,
          addresses: [],
        });

        dispatch(addContact(createdContact));

        return createdContact;
      },
    }),
    [dispatch],
  );
  const handleSaveSuccess = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.CONTACT_ADDED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      hasCustomPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
    });
    onSaveSuccess();
  }, [analytics, onSaveSuccess]);
  const dialogViewModel = useAddContactDrawerViewModel({
    contactCreation,
    onSaveSuccess: handleSaveSuccess,
  });
  const labels = useMemo<ContactsAddContactDialogLabels>(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmName: t("contacts.addContact"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    }),
    [t],
  );
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
    dialogViewModel.onOpen();
  }, [analytics, dialogViewModel]);
  const onConfirm = useCallback(async () => {
    if (dialogViewModel.invalidNameError) {
      return;
    }

    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      button: CONTACTS_TRACKING_BUTTON.saveContact,
      page: CONTACTS_PAGE_PROPERTY.ADD_CONTACT,
      hasPicture: false,
      flow: CONTACTS_FLOW.CONTACTS,
    });
    await dialogViewModel.onConfirm();
  }, [analytics, dialogViewModel]);

  const isNameErrorDisplayed =
    dialogViewModel.isOpen &&
    !dialogViewModel.isSaving &&
    dialogViewModel.invalidNameError !== null;

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
    ...dialogViewModel,
    labels,
    onOpen,
    onConfirm,
  };
}

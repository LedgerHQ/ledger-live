import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import {
  createContactCreationPort,
  useAddContactDialogViewModel,
  type AddContactDialogViewModel,
} from "@features/flow-contacts-add-contact";
import { CONTACTS_EVENT_SOURCE } from "@features/flow-contacts";
import {
  buildContactsGlobalProperties,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useDispatch } from "LLD/hooks/redux";
import { DEFAULT_ADD_NEW_CONTACT_HEADER_STATE } from "LLD/features/Send/context/AddNewContactHeaderContext";
import {
  useSendPrefillAddAddressFlow,
  type SendPrefillAddAddressPhase,
} from "LLD/features/Send/hooks/useSendPrefillAddAddressFlow";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { track, trackPage } from "~/renderer/analytics/segment";

export type AddNewContactAddressPhase = SendPrefillAddAddressPhase;

export type AddNewContactViewModel = AddContactDialogViewModel &
  Readonly<{
    addressPhase: AddNewContactAddressPhase | null;
    isOpeningAddressFlow: boolean;
  }>;

export function useAddNewContactViewModel(): AddNewContactViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("desktop");
  const { addressPhase, isOpeningAddressFlow, startForContact } = useSendPrefillAddAddressFlow({
    idleHeaderState: DEFAULT_ADD_NEW_CONTACT_HEADER_STATE,
    contactType: "new",
  });
  const trackingProperties = useMemo(
    () => ({
      ...getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
      ...buildContactsGlobalProperties({
        ffAddressBookEnabled: isContactsFeatureEnabled,
        contacts,
      }),
    }),
    [contacts, isContactsFeatureEnabled, state.account.account, state.account.parentAccount],
  );
  const contactCreation = useMemo(
    () => createContactCreationPort({ dispatch, generateId: uuid }),
    [dispatch],
  );
  const labels = useMemo(
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
  const onSaveSuccess = useCallback(
    (contact: Contact) => {
      track("contact_added", {
        ...trackingProperties,
        source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
        page: "add contact",
        hasCustomPicture: false,
      });
      void startForContact(contact);
    },
    [startForContact, trackingProperties],
  );
  const callbacks = useMemo(
    () => ({
      onOpen: () => {
        trackPage("Modal send - add contact", null, trackingProperties);
      },
      onConfirm: () => {
        track("button_clicked", {
          button: "confirm name",
          page: "add contact",
          ...trackingProperties,
        });
      },
    }),
    [trackingProperties],
  );
  const contactAdapter = useAddContactDialogViewModel({
    contactCreation,
    labels,
    onSaveSuccess,
    callbacks,
  });
  const { onOpen, onClose } = contactAdapter;
  const trackedNameErrorRef = useRef(contactAdapter.invalidNameError);

  useEffect(() => {
    onOpen();
    return onClose;
  }, [onClose, onOpen]);

  useEffect(() => {
    const error = contactAdapter.invalidNameError;
    if (!error) {
      trackedNameErrorRef.current = null;
      return;
    }
    if (trackedNameErrorRef.current === error) {
      return;
    }
    trackedNameErrorRef.current = error;
    track("error_displayed", {
      source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
      page: "add contact",
      errorType: error === DUPLICATE_CONTACT_NAME_ERROR_NAME ? "duplicate name" : "invalid name",
      ...trackingProperties,
    });
  }, [contactAdapter.invalidNameError, trackingProperties]);

  return {
    ...contactAdapter,
    addressPhase,
    isOpeningAddressFlow,
  };
}

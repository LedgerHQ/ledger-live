import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import { createContactCreationPort } from "@features/flow-contacts-add-contact";
import {
  useContactsAddContactAnalytics,
  useContactsLedgerSyncMutationGuard,
  trackContactsLedgerSyncActivate,
  trackContactsLedgerSyncDismiss,
} from "@features/flow-contacts";
import {
  isContactsLedgerSyncActivationRequired,
  type ContactsLedgerSyncIntroductionDialogProps,
} from "@features/flow-contacts-introduction";
import {
  useContactAddressPickerViewModel,
  type ContactAddressPickerProps,
  type ContactsProps,
} from "@features/flow-pay-contact";
import { useDispatch } from "LLD/hooks/redux";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { useContactsAnalytics } from "LLD/features/Contacts/analytics";
import { useContactsLedgerSyncStatus } from "LLD/features/Contacts/hooks/useContactsLedgerSyncStatus";
import { buildNavigationBackState } from "LLD/utils/navigationBackPath";
import { usePayTabContactOperations } from "./usePayTabContactOperations";
import { renderPayContactAddresses } from "../components/PayContactAddresses";

const noopSelectAddress = () => undefined;

export type UsePayTabContactsResult = Readonly<{
  contacts: ContactsProps;
  ledgerSyncIntroduction: ContactsLedgerSyncIntroductionDialogProps;
  contactAddressPicker: ContactAddressPickerProps;
}>;

export function usePayTabContacts(): UsePayTabContactsResult {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname: payTabPath } = useLocation();
  const analytics = useContactsAnalytics();
  const { openDrawer } = useActivationDrawer();
  const ledgerSyncStatus = useContactsLedgerSyncStatus();
  const { requestMutation, dismissPendingIntent } = useContactsLedgerSyncMutationGuard();
  const operations = usePayTabContactOperations();

  const onAddContactAddress = useCallback(
    (contact: Contact) => {
      navigate(`/contacts?contactId=${encodeURIComponent(contact.id)}&action=add-address`);
    },
    [navigate],
  );
  const { open: openContactAddressPicker, contactAddressPicker } = useContactAddressPickerViewModel(
    {
      onSelectAddress: noopSelectAddress,
      onAddNewAddress: onAddContactAddress,
    },
  );
  const onViewTransactions = useCallback(
    (contact: Contact) => {
      navigate(
        `/history?contactId=${encodeURIComponent(contact.id)}`,
        buildNavigationBackState("historyBackPath", payTabPath),
      );
    },
    [navigate, payTabPath],
  );
  const onContactPress = useCallback(
    (contact: Contact) => openContactAddressPicker(contact),
    [openContactAddressPicker],
  );
  const onViewContact = useCallback(
    (contact: Contact) => {
      navigate(`/contacts?contactId=${encodeURIComponent(contact.id)}`);
    },
    [navigate],
  );
  const [isLedgerSyncIntroductionRequested, setIsLedgerSyncIntroductionRequested] = useState(false);
  const contactCreation = useMemo(
    () => createContactCreationPort({ dispatch, generateId: uuid }),
    [dispatch],
  );
  const { callbacks, onSaveSuccess } = useContactsAddContactAnalytics(analytics, () => undefined);
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
  const onRequestAddContact = useCallback(
    (onAllowed: () => void) => {
      const result = requestMutation({ kind: "addContact" }, ledgerSyncStatus);
      if (result.status === "allowed") {
        onAllowed();
      } else if (result.status === "blocked") {
        setIsLedgerSyncIntroductionRequested(true);
      }
    },
    [ledgerSyncStatus, requestMutation],
  );
  const onActivateLedgerSyncIntroduction = useCallback(() => {
    trackContactsLedgerSyncActivate(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
    openDrawer({ startOnSyncMethod: true });
  }, [analytics, dismissPendingIntent, openDrawer]);
  const onDismissLedgerSyncIntroduction = useCallback(() => {
    trackContactsLedgerSyncDismiss(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
  }, [analytics, dismissPendingIntent]);

  const isLedgerSyncIntroductionOpen =
    isLedgerSyncIntroductionRequested && isContactsLedgerSyncActivationRequired(ledgerSyncStatus);

  return useMemo(
    () => ({
      contacts: {
        addContact: {
          labels,
          contactCreation,
          onRequestAddContact,
          onSaveSuccess,
          callbacks,
        },
        renderAddresses: renderPayContactAddresses,
        onContactPress,
        onViewContact,
        onViewTransactions,
        operations,
      },
      ledgerSyncIntroduction: {
        open: isLedgerSyncIntroductionOpen,
        title: t("contacts.ledgerSyncIntroduction.title"),
        description: t("contacts.ledgerSyncIntroduction.description"),
        activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
        dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
        onActivate: onActivateLedgerSyncIntroduction,
        onDismiss: onDismissLedgerSyncIntroduction,
      },
      contactAddressPicker,
    }),
    [
      t,
      labels,
      contactCreation,
      onRequestAddContact,
      onSaveSuccess,
      callbacks,
      operations,
      onContactPress,
      onViewContact,
      onViewTransactions,
      isLedgerSyncIntroductionOpen,
      onActivateLedgerSyncIntroduction,
      onDismissLedgerSyncIntroduction,
      contactAddressPicker,
    ],
  );
}

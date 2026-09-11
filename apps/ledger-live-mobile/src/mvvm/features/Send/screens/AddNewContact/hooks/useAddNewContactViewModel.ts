import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { v4 as uuid } from "uuid";
import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import { CONTACTS_EVENT_SOURCE } from "@features/flow-contacts";
import {
  createContactCreationPort,
  useAddContactDialogViewModel,
  type AddContactDialogViewModel,
} from "@features/flow-contacts-add-contact";
import type { AddAddressFlowState } from "@features/flow-contacts-add-address";
import {
  buildContactsGlobalProperties,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import type { ContactsDeviceIntentExecutorProps } from "@features/platform-contacts/device";
import {
  useSendPrefillAddAddressFlow,
  type SendPrefillAddAddressPhase,
} from "LLM/features/Send/hooks/useSendPrefillAddAddressFlow";
import { useAddToExistingContactViewModel } from "LLM/features/Send/screens/AddToExistingContact/hooks/useAddToExistingContactViewModel";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { screen, track } from "~/analytics";
import { useDispatch } from "~/context/hooks";
import { resolveKeyboardBottomOffset, useKeyboardVisible } from "~/logic/keyboardVisible";
import { useTranslation } from "~/context/Locale";
import type { AddContactDrawerTrackingPage } from "LLM/features/Send/utils/contactTracking";

export type AddNewContactAddressPhase = SendPrefillAddAddressPhase;

export type AddContactDrawerStep = "chooser" | "contact" | "select" | "name" | "review";

type AddContactDrawerOrigin = "chooser" | "contact" | "select";

export type AddNewContactViewModel = AddContactDialogViewModel &
  Readonly<{
    addressPhase: AddNewContactAddressPhase | null;
    dieProps: ContactsDeviceIntentExecutorProps | undefined;
    isOpeningAddressFlow: boolean;
    keyboardBottomOffset: number;
    drawerStep: AddContactDrawerStep;
    isDrawerOpen: boolean;
    chooserLabels: Readonly<{
      newContact: string;
      existingContact: string;
    }>;
    selectContact: ReturnType<typeof useAddToExistingContactViewModel>;
    onAddNewContact: () => void;
    onAddToExistingContact: () => void;
    onDrawerBack: (() => void) | undefined;
    onDrawerClose: () => void;
  }>;

function resolveDrawerStep(
  origin: AddContactDrawerOrigin | null,
  status: AddAddressFlowState["status"],
): AddContactDrawerStep {
  switch (status) {
    case "namingAddress":
      return "name";
    case "reviewingAddress":
      return "review";
    default:
      return origin ?? "chooser";
  }
}

function resolveOnDrawerBack(
  step: AddContactDrawerStep,
  origin: AddContactDrawerOrigin | null,
  handlers: Readonly<{
    goBackFromAddressPhase: () => void;
    closeDrawer: () => void;
    goBackToChooser: () => void;
  }>,
): (() => void) | undefined {
  switch (step) {
    case "review":
      return handlers.goBackFromAddressPhase;
    case "name":
      return origin === "contact" ? handlers.closeDrawer : handlers.goBackFromAddressPhase;
    case "contact":
    case "select":
      return handlers.goBackToChooser;
    default:
      return undefined;
  }
}

function getDrawerTrackingPage(
  step: AddContactDrawerStep,
  origin: AddContactDrawerOrigin | null,
): AddContactDrawerTrackingPage {
  switch (step) {
    case "contact":
      return "add contact";
    case "select":
      return "select existing contact";
    case "name":
      return "name address";
    case "review":
      return "address signing device";
    default:
      return origin === "select" ? "select existing contact" : "add contact options";
  }
}

export function useAddNewContactViewModel(): AddNewContactViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("mobile");
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const keyboardBottomOffset = resolveKeyboardBottomOffset({
    isKeyboardVisible,
    keyboardHeight,
    platform: Platform.OS,
    version: Platform.Version,
  });
  const [drawerOrigin, setDrawerOrigin] = useState<AddContactDrawerOrigin | null>(null);
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
  const closeAfterSave = useCallback(() => {
    setDrawerOrigin(null);
  }, []);
  const {
    addressPhase,
    dieProps,
    isOpeningAddressFlow,
    startForContact,
    goBackFromAddressPhase,
    closeAddressFlow,
  } = useSendPrefillAddAddressFlow({ onSaved: closeAfterSave });
  const handleSaveSuccess = useCallback(
    async (createdContact: Contact) => {
      track("contact_added", {
        ...trackingProperties,
        source: CONTACTS_EVENT_SOURCE.ADD_CONTACT,
        page: "add contact",
        hasCustomPicture: false,
      });
      await startForContact(createdContact, "new");
    },
    [startForContact, trackingProperties],
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
      confirmName: t("contacts.addContactDrawer.confirmName"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    }),
    [t],
  );
  const callbacks = useMemo(
    () => ({
      onOpen: () => {
        void screen("Modal send - add contact", undefined, trackingProperties);
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
    onSaveSuccess: handleSaveSuccess,
    callbacks,
  });
  const { onOpen: openContactStep, onClose: closeContactStep } = contactAdapter;
  const startForExistingContact = useCallback(
    (contact: Contact) => startForContact(contact, "existing"),
    [startForContact],
  );
  const selectContact = useAddToExistingContactViewModel({
    startForContact: startForExistingContact,
  });
  const { resetSearch } = selectContact;

  const closeDrawer = useCallback(() => {
    closeAddressFlow();
    closeContactStep();
    resetSearch();
    setDrawerOrigin(null);
  }, [closeAddressFlow, closeContactStep, resetSearch]);

  const onOpen = useCallback(() => {
    setDrawerOrigin("chooser");
    void screen("Modal send - add contact options", undefined, trackingProperties);
  }, [trackingProperties]);

  const onAddNewContact = useCallback(() => {
    track("button_clicked", {
      button: "add a new contact",
      page: "add contact options",
      ...trackingProperties,
    });
    setDrawerOrigin("contact");
    openContactStep();
  }, [openContactStep, trackingProperties]);

  const onAddToExistingContact = useCallback(() => {
    track("button_clicked", {
      button: "add to an existing contact",
      page: "add contact options",
      ...trackingProperties,
    });
    setDrawerOrigin("select");
    void screen("Modal send - select existing contact", undefined, trackingProperties);
  }, [trackingProperties]);

  const goBackToChooser = useCallback(() => {
    closeAddressFlow();
    closeContactStep();
    resetSearch();
    setDrawerOrigin("chooser");
  }, [closeAddressFlow, closeContactStep, resetSearch]);

  const drawerStep = resolveDrawerStep(drawerOrigin, addressPhase?.state.status ?? "closed");
  const isDrawerOpen =
    dieProps?.enabled !== true &&
    (drawerOrigin !== null || isOpeningAddressFlow || addressPhase !== null);
  const onDrawerBack = resolveOnDrawerBack(drawerStep, drawerOrigin, {
    goBackFromAddressPhase,
    closeDrawer,
    goBackToChooser,
  });
  const onDrawerClose = useCallback(() => {
    track("button_clicked", {
      button: "close",
      page: getDrawerTrackingPage(drawerStep, drawerOrigin),
      ...trackingProperties,
    });
    closeDrawer();
  }, [closeDrawer, drawerOrigin, drawerStep, trackingProperties]);
  const trackedNameErrorRef = useRef(contactAdapter.invalidNameError);

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
    isSaving: contactAdapter.isSaving || isOpeningAddressFlow,
    onOpen,
    onClose: closeDrawer,
    addressPhase,
    dieProps,
    isOpeningAddressFlow,
    keyboardBottomOffset,
    drawerStep,
    isDrawerOpen,
    chooserLabels: {
      newContact: t("send.newSendFlow.addContact.newContact"),
      existingContact: t("send.newSendFlow.addContact.existingContact"),
    },
    selectContact,
    onAddNewContact,
    onAddToExistingContact,
    onDrawerBack,
    onDrawerClose,
  };
}

import { useCallback, useState } from "react";
import { Platform } from "react-native";
import type { Contact } from "@domain/entity-contact";
import type { AddAddressFlowState } from "@features/flow-contacts-add-address";
import type { ContactsDeviceIntentExecutorProps } from "@features/platform-contacts/device";
import { useContactsAddContactDrawerAdapter } from "LLM/features/Contacts/screens/ContactsPage/hooks/useContactsAddContactDrawerAdapter";
import {
  useSendPrefillAddAddressFlow,
  type SendPrefillAddAddressPhase,
} from "LLM/features/Send/hooks/useSendPrefillAddAddressFlow";
import { useAddToExistingContactViewModel } from "LLM/features/Send/screens/AddToExistingContact/hooks/useAddToExistingContactViewModel";
import { resolveKeyboardBottomOffset, useKeyboardVisible } from "~/logic/keyboardVisible";
import { useTranslation } from "~/context/Locale";

export type AddNewContactAddressPhase = SendPrefillAddAddressPhase;

export type AddContactDrawerStep = "chooser" | "contact" | "select" | "name" | "review";

type AddContactDrawerOrigin = "chooser" | "contact" | "select";

export type AddNewContactViewModel = ReturnType<typeof useContactsAddContactDrawerAdapter> &
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

export function useAddNewContactViewModel(): AddNewContactViewModel {
  const { t } = useTranslation();
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
      await startForContact(createdContact);
    },
    [startForContact],
  );
  const contactAdapter = useContactsAddContactDrawerAdapter(handleSaveSuccess);
  const { onOpen: openContactStep, onClose: closeContactStep } = contactAdapter;
  const selectContact = useAddToExistingContactViewModel({ startForContact });
  const { resetSearch } = selectContact;

  const closeDrawer = useCallback(() => {
    closeAddressFlow();
    closeContactStep();
    resetSearch();
    setDrawerOrigin(null);
  }, [closeAddressFlow, closeContactStep, resetSearch]);

  const onOpen = useCallback(() => {
    setDrawerOrigin("chooser");
  }, []);

  const onAddNewContact = useCallback(() => {
    setDrawerOrigin("contact");
    openContactStep();
  }, [openContactStep]);

  const onAddToExistingContact = useCallback(() => {
    setDrawerOrigin("select");
  }, []);

  const goBackToChooser = useCallback(() => {
    closeAddressFlow();
    closeContactStep();
    resetSearch();
    setDrawerOrigin("chooser");
  }, [closeAddressFlow, closeContactStep, resetSearch]);

  const drawerStep = resolveDrawerStep(drawerOrigin, addressPhase?.state.status ?? "closed");
  /**
   * The Device Intent Executor is a queued drawer too: this one has to give up its slot
   * while the intent runs, or the executor waits in the queue behind it and never shows.
   */
  const isDrawerOpen =
    dieProps?.enabled !== true &&
    (drawerOrigin !== null || isOpeningAddressFlow || addressPhase !== null);
  const onDrawerBack = resolveOnDrawerBack(drawerStep, drawerOrigin, {
    goBackFromAddressPhase,
    closeDrawer,
    goBackToChooser,
  });

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
    onDrawerClose: closeDrawer,
  };
}

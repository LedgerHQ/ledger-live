import React, { useState } from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import { AddContactView } from "LLM/features/Send/screens/AddContact/AddContactView";
import { SelectContactStep } from "LLM/features/Send/screens/AddToExistingContact/SelectContactStep";
import useLedgerSyncEntryPointViewModel from "LLM/features/LedgerSyncEntryPoint/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { ContactNameStep } from "./components/ContactNameStep";
import { WalletSyncStep } from "./components/WalletSyncStep";
import { useAddNewContactAddressScreens } from "./hooks/useAddNewContactAddressScreens";
import type {
  AddContactDrawerStep,
  AddNewContactViewModel,
} from "./hooks/useAddNewContactViewModel";

const CONTENT_BOTTOM_SPACING = 24;

const FLOW_OPTIONS = {
  snapPoints: "fullWithOffset",
} as const satisfies QueuedDrawerFlowOptions;

const CHOOSER_STEP_OPTIONS = {
  enableDynamicSizing: true,
  enablePanDownToClose: true,
} as const satisfies QueuedDrawerFlowOptions;

const CONTACT_STEP_OPTIONS = {
  enablePanDownToClose: true,
  hasBackButton: true,
} as const satisfies QueuedDrawerFlowOptions;

const SELECT_STEP_OPTIONS = {
  hasBackButton: true,
  enablePanDownToClose: true,
} as const satisfies QueuedDrawerFlowOptions;

const WALLET_SYNC_STEP_OPTIONS = {
  enableDynamicSizing: true,
} as const satisfies QueuedDrawerFlowOptions;

export type AddNewContactViewProps = AddNewContactViewModel;

function AddContactChooserStep({
  newContactLabel,
  existingContactLabel,
  onAddNewContact,
  onAddToExistingContact,
}: Readonly<{
  newContactLabel: string;
  existingContactLabel: string;
  onAddNewContact: () => void;
  onAddToExistingContact: () => void;
}>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <BottomSheetView
      testID="send-add-contact-step"
      style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
    >
      <Box lx={{ gap: "s8" }}>
        <BottomSheetHeader />
        <AddContactView
          newContactLabel={newContactLabel}
          existingContactLabel={existingContactLabel}
          onAddNewContact={onAddNewContact}
          onAddToExistingContact={onAddToExistingContact}
        />
      </Box>
    </BottomSheetView>
  );
}

export function AddNewContactView({
  addressPhase,
  isOpeningAddressFlow,
  keyboardBottomOffset,
  drawerStep,
  isDrawerOpen,
  chooserLabels,
  selectContact,
  onAddNewContact,
  onAddToExistingContact,
  onDrawerBack,
  onDrawerClose,
  ...contactDrawer
}: AddNewContactViewProps) {
  const [skipWalletSync, setSkipWalletSync] = useState(false);
  const addressScreens = useAddNewContactAddressScreens({
    addressPhase,
    bottomOffset: keyboardBottomOffset,
  });
  const {
    shouldDisplayEntryPoint,
    entryPointComponent,
    openActivationDrawer,
    isActivationDrawerVisible,
    closeActivationDrawer,
    onClickEntryPoint,
  } = useLedgerSyncEntryPointViewModel({
    entryPoint: EntryPoint.sendFlow,
    page: "SendFlow",
  });

  const WalletSyncButton = entryPointComponent;

  function handleOnWalletSyncPress() {
    onClickEntryPoint({ page: "SendFlow" });
    onDrawerClose();
    openActivationDrawer();
  }

  function handleOnSkipWalletSyncPress() {
    setSkipWalletSync(true);
  }

  function handleOnDrawerClose() {
    setSkipWalletSync(false);
    onDrawerClose();
  }

  const screens: QueuedDrawerFlowScreenRegistry<"walletSync" | AddContactDrawerStep> = {
    walletSync: {
      content: (
        <WalletSyncStep
          WalletSyncButton={WalletSyncButton}
          onWalletSyncPress={handleOnWalletSyncPress}
          onSkipWalletSyncPress={handleOnSkipWalletSyncPress}
        />
      ),
      options: WALLET_SYNC_STEP_OPTIONS,
    },
    chooser: {
      content: (
        <AddContactChooserStep
          newContactLabel={chooserLabels.newContact}
          existingContactLabel={chooserLabels.existingContact}
          onAddNewContact={onAddNewContact}
          onAddToExistingContact={onAddToExistingContact}
        />
      ),
      options: CHOOSER_STEP_OPTIONS,
    },
    contact: {
      content: (
        <ContactNameStep
          {...contactDrawer}
          bottomOffset={keyboardBottomOffset}
          isVisible={isDrawerOpen}
        />
      ),
      options: CONTACT_STEP_OPTIONS,
    },
    select: {
      content: (
        <SelectContactStep
          title={selectContact.labels.title}
          viewModel={selectContact.listViewModel}
          labels={selectContact.labels}
          meAvatarSrc={selectContact.meAvatarSrc}
          searchQuery={selectContact.searchQuery}
          onSearchQueryChange={selectContact.onSearchQueryChange}
          onOpenContact={selectContact.onSelectContact}
          onAddContact={onAddNewContact}
          isOpeningAddressFlow={isOpeningAddressFlow}
        />
      ),
      options: SELECT_STEP_OPTIONS,
    },
    ...addressScreens,
  };

  return (
    <>
      <QueuedDrawerFlow
        currentStep={shouldDisplayEntryPoint && !skipWalletSync ? "walletSync" : drawerStep}
        defaultOptions={shouldDisplayEntryPoint && !skipWalletSync ? {} : FLOW_OPTIONS}
        isOpen={isDrawerOpen}
        onBack={onDrawerBack}
        onClose={handleOnDrawerClose}
        screens={screens}
        testID="send-add-new-contact-drawer"
      />
      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isActivationDrawerVisible}
        handleClose={closeActivationDrawer}
      />
    </>
  );
}

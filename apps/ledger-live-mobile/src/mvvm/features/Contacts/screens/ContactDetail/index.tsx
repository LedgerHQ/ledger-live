import React from "react";
import { ContactDetailView } from "@features/flow-contacts";
import { ContactsAddAddressFlowDrawer } from "./components/ContactsAddAddressFlowDrawer";
import { ContactAddressDetailActionsSheets } from "./components/ContactAddressDetailActionsSheets";
import { ContactAddressDetailDialogSheet } from "./components/ContactAddressDetailDialogSheet";
import { ContactDetailEditDeleteSheets } from "./components/ContactDetailEditDeleteSheets";
import { ContactsLedgerSyncActivationDrawer } from "LLM/features/Contacts/components/ContactsLedgerSyncActivationDrawer";
import { ContactsLedgerSyncIntroductionSheet } from "LLM/features/Contacts/components/ContactsLedgerSyncIntroductionSheet";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import { useContactDetailNavigationViewModel } from "./hooks/useContactDetailNavigationViewModel";
import { useContactDetailScreenViewModel } from "./useContactDetailScreenViewModel";

export function ContactDetailScreen(): React.JSX.Element | null {
  const viewModel = useContactDetailScreenViewModel();
  const onOpenActionsMenu =
    viewModel.status === "ready" ? viewModel.editDeleteFlow.onOpenActionsMenu : undefined;

  useContactDetailNavigationViewModel(onOpenActionsMenu);

  if (viewModel.status === "redirecting") {
    return null;
  }

  return (
    <>
      <ContactDetailView {...viewModel.pageProps} />
      {viewModel.addAddressFlowState.status !== "closed" ? (
        <ContactsAddAddressFlowDrawer {...viewModel.addAddressFlowProps} />
      ) : null}
      <ContactAddressDetailDialogSheet
        {...viewModel.addressDetailDialog}
        isActionSheetOpen={viewModel.isAddressDetailActionSheetOpen}
      />
      <ContactAddressDetailActionsSheets
        deleteSheet={viewModel.addressDetailActions.deleteSheet}
        renameSheet={viewModel.addressDetailActions.renameSheet}
        signerMismatchSheet={viewModel.addressDetailActions.signerMismatchSheet}
      />
      <ContactDetailEditDeleteSheets {...viewModel.editDeleteFlow} />
      <ContactsLedgerSyncIntroductionSheet {...viewModel.ledgerSyncIntroduction} />
      <ContactsLedgerSyncActivationDrawer {...viewModel.ledgerSyncActivationDrawer} />
      {viewModel.dieProps === undefined ? null : (
        <DeviceIntentExecutorLWM sourceFlow="contacts" {...viewModel.dieProps} />
      )}
    </>
  );
}

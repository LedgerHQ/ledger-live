import React from "react";
import { ContactDetailView } from "@features/flow-contacts";
import { TrackScreen } from "~/analytics";
import { ContactsAddAddressFlowDrawer } from "./components/ContactsAddAddressFlowDrawer";
import { ContactAddressDetailDialogSheet } from "./components/ContactAddressDetailDialogSheet";
import { useContactDetailScreenViewModel } from "./useContactDetailScreenViewModel";

export function ContactDetailScreen(): React.JSX.Element | null {
  const viewModel = useContactDetailScreenViewModel();

  if (viewModel.status === "redirecting") {
    return null;
  }

  return (
    <>
      <TrackScreen category="Contacts" />
      <ContactDetailView {...viewModel.pageProps} />
      {viewModel.addAddressFlowState.status !== "closed" ? (
        <ContactsAddAddressFlowDrawer {...viewModel.addAddressFlowProps} />
      ) : null}
      <ContactAddressDetailDialogSheet {...viewModel.addressDetailDialog} />
    </>
  );
}

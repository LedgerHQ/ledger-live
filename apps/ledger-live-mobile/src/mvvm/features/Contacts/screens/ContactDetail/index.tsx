import React from "react";
import { ContactDetailView } from "@features/flow-contacts";
import { TrackScreen } from "~/analytics";
import { ContactsAddAddressEntryDrawerSheet } from "./components/ContactsAddAddressEntryDrawerSheet";
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
      <ContactsAddAddressEntryDrawerSheet
        isOpen={viewModel.addAddressEntryProps !== null}
        entryProps={viewModel.addAddressEntryProps}
        onBack={viewModel.onCloseAddAddress}
      />
    </>
  );
}

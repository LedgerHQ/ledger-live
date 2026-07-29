import React from "react";
import { ContactsAddAddressFlowDrawerView } from "./ContactsAddAddressFlowDrawerView";
import type { ContactsAddAddressFlowDrawerProps } from "./types";
import { useContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";

export function ContactsAddAddressFlowDrawer(
  props: ContactsAddAddressFlowDrawerProps,
): React.JSX.Element {
  const viewModel = useContactsAddAddressFlowDrawerViewModel(props);
  return <ContactsAddAddressFlowDrawerView {...viewModel} />;
}

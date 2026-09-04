import React from "react";
import { ContactsView } from "./ContactsView.native";
import { useContactsViewModel } from "./useContactsViewModel.native";
import type { ContactsNativeProps } from "../../types";

export function Contacts(props: ContactsNativeProps): React.JSX.Element {
  const viewModel = useContactsViewModel(props);

  return <ContactsView {...viewModel} />;
}

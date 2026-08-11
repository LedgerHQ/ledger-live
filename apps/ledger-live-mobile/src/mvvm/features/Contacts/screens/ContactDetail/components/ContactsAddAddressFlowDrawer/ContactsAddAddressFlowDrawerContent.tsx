import React from "react";
import type { ModularDrawerFlowRenderProps } from "LLM/features/ModularDrawer";
import { ContactsAddAddressFlowContentView } from "./ContactsAddAddressFlowContentView";
import { useContactsAddAddressFlowContentViewModel } from "./useContactsAddAddressFlowContentViewModel";
import type { ContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";

type ContactsAddAddressFlowDrawerContentProps = Readonly<{
  viewModel: ContactsAddAddressFlowDrawerViewModel;
  currencyShell: ModularDrawerFlowRenderProps;
}>;

export function ContactsAddAddressFlowDrawerContent({
  viewModel,
  currencyShell,
}: ContactsAddAddressFlowDrawerContentProps): React.JSX.Element {
  const contentViewModel = useContactsAddAddressFlowContentViewModel({
    viewModel,
    currencyShell,
  });

  return <ContactsAddAddressFlowContentView {...contentViewModel} />;
}

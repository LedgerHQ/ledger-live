import React from "react";
import { ModularDrawerFlow } from "LLM/features/ModularDrawer";
import { ContactsAddAddressFlowDrawerContent } from "./ContactsAddAddressFlowDrawerContent";
import type { ContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";

export function ContactsAddAddressFlowDrawerView(
  viewModel: ContactsAddAddressFlowDrawerViewModel,
): React.JSX.Element {
  return (
    <ModularDrawerFlow {...viewModel.currencySelection.flowProps}>
      {currencyShell => (
        <ContactsAddAddressFlowDrawerContent viewModel={viewModel} currencyShell={currencyShell} />
      )}
    </ModularDrawerFlow>
  );
}

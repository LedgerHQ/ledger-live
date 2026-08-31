import React from "react";
import { ModularDrawerFlow } from "LLM/features/ModularDrawer";
import { ContactsAddAddressFlowDrawerContent } from "./ContactsAddAddressFlowDrawerContent";
import type { ContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";
import { UnsupportedSelectionSheet } from "./UnsupportedSelectionSheet";

export function ContactsAddAddressFlowDrawerView(
  viewModel: ContactsAddAddressFlowDrawerViewModel,
): React.JSX.Element {
  return (
    <>
      <ModularDrawerFlow {...viewModel.currencySelection.flowProps}>
        {currencyShell => (
          <ContactsAddAddressFlowDrawerContent
            viewModel={viewModel}
            currencyShell={currencyShell}
          />
        )}
      </ModularDrawerFlow>
      <UnsupportedSelectionSheet
        explanation={viewModel.currencySelection.unsupportedItemExplanation}
        onClose={viewModel.currencySelection.dismissUnsupportedItemExplanation}
      />
    </>
  );
}

import React from "react";
import { ModularDrawerFlow } from "LLM/features/ModularDrawer";
import { ContactsAddAddressFlowDrawerContent } from "./ContactsAddAddressFlowDrawerContent";
import type { ContactsAddAddressFlowDrawerViewModel } from "./useContactsAddAddressFlowDrawerViewModel";
import { UnsupportedSelectionTooltipSheet } from "./UnsupportedSelectionTooltipSheet";

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
      <UnsupportedSelectionTooltipSheet
        tooltip={viewModel.currencySelection.unsupportedItemTooltip}
        onClose={viewModel.currencySelection.dismissUnsupportedItemTooltip}
      />
    </>
  );
}

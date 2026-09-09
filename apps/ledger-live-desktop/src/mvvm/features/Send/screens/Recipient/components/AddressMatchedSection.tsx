import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import type { AddressMatchedSectionViewModel } from "../hooks/useAddressMatchedSectionViewModel";
import { AddressListItem } from "./AddressListItem";
import { RecentHistoryWarningCard } from "./RecentHistoryWarningCard";
import { RecipientCard } from "./RecipientCard";

type AddressMatchedSectionProps = Readonly<{
  viewModel: AddressMatchedSectionViewModel;
}>;

export function AddressMatchedSection({ viewModel }: AddressMatchedSectionProps) {
  if (!viewModel.isVisible || !viewModel.suggestion) {
    return null;
  }

  const { suggestion } = viewModel;

  return (
    <div className="flex w-full min-w-0 flex-col">
      {viewModel.showHeader && (
        <Subheader className="mb-12">
          <SubheaderRow>
            <SubheaderTitle data-testid="send-address-matched-title">
              {viewModel.addressMatchedLabel}
            </SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      )}
      <div className="flex flex-col mb-12 -mt-8">
        {suggestion.kind === "recipient-card" ? (
          <RecipientCard
            recipient={suggestion.recipient}
            description={suggestion.description}
            contact={suggestion.contact}
            isReady={suggestion.isReady}
            showActions={suggestion.showActions}
            hasAddressBook={suggestion.hasAddressBook}
            addressBookUnsupportedLabel={suggestion.addressBookUnsupportedLabel}
            addContactLabel={suggestion.addContactLabel}
            sendLabel={suggestion.sendLabel}
            onSend={suggestion.onSend}
            onAddContact={suggestion.onAddContact}
            onUnsupportedNetwork={suggestion.onUnsupportedNetwork}
          />
        ) : (
          <AddressListItem
            address={suggestion.address}
            name={suggestion.name}
            description={suggestion.description}
            onSelect={suggestion.onSelect}
            showSendTo
            isLedgerAccount={suggestion.isLedgerAccount}
            disabled={suggestion.disabled}
            hideDescription={suggestion.hideDescription}
            testId="send-matched-address-button"
          />
        )}

        {viewModel.showFirstInteractionWarning && <RecentHistoryWarningCard />}
      </div>
    </div>
  );
}

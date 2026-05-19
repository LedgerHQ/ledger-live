import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AssetDetailSection } from "../AssetDetailSection";
import { AddressList } from "./components/AddressList";
import { useAddressListViewModel } from "./hooks/useAddressListViewModel";

export type AddressListSectionProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function AddressListSection({ distributionItem }: AddressListSectionProps) {
  const viewModel = useAddressListViewModel(distributionItem);

  return (
    <AssetDetailSection
      title={viewModel.sectionTitle}
      actionLabel={viewModel.sectionActionLabel}
      onActionClick={viewModel.onAddAddress}
      actionTestId="asset-detail-add-address"
    >
      <AddressList
        sortedAccounts={viewModel.sortedAccounts}
        lookupParentAccount={viewModel.lookupParentAccount}
        onAccountClick={viewModel.onAccountClick}
      />
    </AssetDetailSection>
  );
}

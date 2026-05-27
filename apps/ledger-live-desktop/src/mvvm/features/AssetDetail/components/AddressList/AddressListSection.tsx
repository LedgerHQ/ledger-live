import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AssetDetailSection } from "../AssetDetailSection";
import { AllAddressesDialog } from "./components/AllAddressesDialog";
import { AddressList } from "./components/AddressList";
import { useAddressListViewModel } from "./hooks/useAddressListViewModel";

type AddressListSectionProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function AddressListSection({ distributionItem }: AddressListSectionProps) {
  const viewModel = useAddressListViewModel(distributionItem);

  const seeAllProps = viewModel.shouldShowSeeAll
    ? {
        showSeeAll: true as const,
        itemCount: viewModel.addressCount,
        onSeeAllClick: viewModel.onSeeAll,
        seeAllTestId: "asset-detail-addresses-see-all",
      }
    : { showSeeAll: false as const };

  return (
    <>
      <AssetDetailSection
        title={viewModel.sectionTitle}
        actionLabel={viewModel.sectionActionLabel}
        onActionClick={viewModel.onAddAddress}
        actionTestId="asset-detail-add-address"
        {...seeAllProps}
      >
        <AddressList
          sortedAccounts={viewModel.previewAccounts}
          lookupParentAccount={viewModel.lookupParentAccount}
          onAccountClick={viewModel.onAccountClick}
        />
      </AssetDetailSection>

      <AllAddressesDialog
        open={viewModel.allAddressesDialog.open}
        title={viewModel.allAddressesDialog.title}
        description={viewModel.allAddressesDialog.description}
        sortedAccounts={viewModel.sortedAccounts}
        lookupParentAccount={viewModel.lookupParentAccount}
        onAccountClick={viewModel.onAccountClick}
        onOpenChange={viewModel.allAddressesDialog.onOpenChange}
      />
    </>
  );
}

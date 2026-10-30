import React from "react";
import { SectionHeader } from "LLD/features/AssetDetail/components/SectionHeader";

type Props = Readonly<{
  title: string;
  addAssetLabel?: string;
  onAddAsset?: () => void;
}>;

export const AssetsSectionHeaderView = ({ title, addAssetLabel, onAddAsset }: Props) => (
  <SectionHeader
    title={title}
    actionLabel={addAssetLabel}
    onActionClick={onAddAsset}
    actionTestId="account-detail-add-asset"
  />
);

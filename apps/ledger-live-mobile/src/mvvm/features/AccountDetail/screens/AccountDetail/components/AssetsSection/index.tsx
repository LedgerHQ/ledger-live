import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AssetsSectionView } from "./AssetsSectionView";
import { useAssetsSectionViewModel } from "./useAssetsSectionViewModel";

type Props = Readonly<{ account: Account }>;

export function AssetsSection({ account }: Props) {
  const { isVisible, ...viewModel } = useAssetsSectionViewModel(account);

  if (!isVisible) return null;

  return <AssetsSectionView {...viewModel} />;
}

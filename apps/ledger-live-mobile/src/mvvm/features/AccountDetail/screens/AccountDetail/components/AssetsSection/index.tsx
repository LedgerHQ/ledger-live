import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AssetsSectionView } from "./AssetsSectionView";
import { useAssetsSectionViewModel } from "./useAssetsSectionViewModel";

type Props = Readonly<{ account: Account }>;

export function AssetsSection({ account }: Props) {
  return <AssetsSectionView {...useAssetsSectionViewModel(account)} />;
}

import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { AssetsSectionHeaderView } from "./AssetsSectionHeaderView";
import { useAddAssetViewModel } from "./useAddAssetViewModel";

type Props = Readonly<{ account: Account }>;

type WithFamilyProps = Props & Readonly<{ title: string; addAssetLabel: string }>;

// Reads the family, which loads on demand: split out so the title shows while it loads.
const HeaderWithAddAsset = ({ account, title, addAssetLabel }: WithFamilyProps) => {
  const { isVisible, onAddAsset } = useAddAssetViewModel(account);

  return (
    <AssetsSectionHeaderView
      title={title}
      addAssetLabel={isVisible ? addAssetLabel : undefined}
      onAddAsset={onAddAsset}
    />
  );
};

export const AssetsSectionHeader = ({ account }: Props) => {
  const { t } = useTranslation();
  const title = t("accountDetail.assets.title");

  return (
    <Suspense fallback={<AssetsSectionHeaderView title={title} />}>
      <HeaderWithAddAsset
        account={account}
        title={title}
        addAssetLabel={t("accountDetail.assets.add")}
      />
    </Suspense>
  );
};

import React, { memo, useState } from "react";
import { Observable } from "rxjs";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { SelectAccountFlowContainer, SelectorContent, AccountSelectionStep } from "./components";
import MemoizedSelectAssetFlow from "../SelectAssetFlow";
import { Header } from "../Header/Header";
import { FlowStep, NavigationDirection } from "../Header/navigation";

type SelectAccountDrawerProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  currencies: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const SelectAccountFlow = memo((props: SelectAccountDrawerProps) => {
  const { t } = useTranslation();
  const [selectedAsset, setSelectedAsset] = useState<undefined | CryptoOrTokenCurrency>();

  const onAssetSelected = (asset: CryptoOrTokenCurrency) => {
    setSelectedAsset(asset);
  };

  if (!selectedAsset) {
    return <MemoizedSelectAssetFlow onAssetSelected={onAssetSelected} {...props} />;
  }

  return (
    <SelectAccountFlowContainer>
      <Header
        title={t("modularAssetDrawer.assetFlow.account")}
        navDirection={NavigationDirection.FORWARD}
        navKey={FlowStep.SELECT_ACCOUNT}
        onBackClick={() => setSelectedAsset(undefined)}
      />
      <SelectorContent>
        <AccountSelectionStep {...props} asset={selectedAsset} source="source" flow="flow" />
      </SelectorContent>
    </SelectAccountFlowContainer>
  );
});

SelectAccountFlow.displayName = "SelectAccountFlow";

import React, { memo, useState } from "react";
import { Observable } from "rxjs";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { SelectAccountFlowContainer, SelectorContent, AccountSelectionStep } from "./components";
import SelectAssetFlow from "../SelectAssetFlow";
import { Header } from "../Header";
import { FlowStep, NavigationDirection } from "../Header/navigation";

type SelectAccountDrawerProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  currencies: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const SelectAccountFlow = memo((props: SelectAccountDrawerProps) => {
  const { t } = useTranslation();
  const [selectedAsset, setSelectedAsset] = useState<undefined | CryptoOrTokenCurrency>(() => {
    if (props.currencies.length === 1) {
      return props.currencies[0];
    }

    return undefined;
  });

  if (!selectedAsset) {
    return <SelectAssetFlow onAssetSelected={setSelectedAsset} {...props} />;
  }

  return (
    <SelectAccountFlowContainer>
      <Header
        title={t("modularAssetDrawer.assetFlow.account")}
        navDirection={NavigationDirection.FORWARD}
        navKey={FlowStep.SELECT_ACCOUNT}
        onBackClick={() => setSelectedAsset(undefined)}
        showBackButton={props.currencies.length > 1}
      />
      <SelectorContent>
        <AccountSelectionStep {...props} asset={selectedAsset} source="source" flow="flow" />
      </SelectorContent>
    </SelectAccountFlowContainer>
  );
});

SelectAccountFlow.displayName = "SelectAccountFlow";

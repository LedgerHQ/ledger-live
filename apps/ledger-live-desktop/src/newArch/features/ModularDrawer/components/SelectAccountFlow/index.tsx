import React, { memo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

import { SelectAccountFlowContainer, SelectorContent, Header } from "./components";
import { SelectAccount } from "../SelectAccount";
import MemoizedSelectAssetFlow from "../SelectAssetFlow";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { NavigationDirection } from "../SelectAssetFlow/useSelectAssetFlow";

type SelectAccountDrawerProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  currencies: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

function SelectAccountFlow(props: SelectAccountDrawerProps) {
  const [selectedAsset, setSelectedAsset] = useState<undefined | CryptoOrTokenCurrency>();

  const onAssetSelected = (asset: CryptoOrTokenCurrency) => {
    setSelectedAsset(asset);
  };

  if (!selectedAsset)
    return <MemoizedSelectAssetFlow onAssetSelected={onAssetSelected} {...props} />;

  return (
    <SelectAccountFlowContainer>
      <Header
        ticker={selectedAsset.ticker}
        navDirection={NavigationDirection.FORWARD} // TODO this import should be moved
        onBackClick={() => setSelectedAsset(undefined)}
      />
      <SelectorContent>
        <SelectAccount {...props} asset={selectedAsset} source="source" flow="flow" />
      </SelectorContent>
    </SelectAccountFlowContainer>
  );
}

export default memo(SelectAccountFlow);

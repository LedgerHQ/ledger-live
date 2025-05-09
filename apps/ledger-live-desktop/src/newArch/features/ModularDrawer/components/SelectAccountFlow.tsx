import React, { useState } from "react";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import MemoizedSelectAssetFlow from "./SelectAssetFlow";
import { SelectAccount } from "./SelectAccount";
import styled from "styled-components";

type SelectAccountDrawerProps = {
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  currencies: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export function SelectAccountFlow(props: SelectAccountDrawerProps) {
  const [selectedAsset, setSelectedAsset] = useState<undefined | CryptoOrTokenCurrency>();

  const onAssetSelected = (asset: CryptoOrTokenCurrency) => {
    setSelectedAsset(asset);
  };

  if (!selectedAsset) {
    return (
      <SelectorContent>
        <MemoizedSelectAssetFlow onAssetSelected={onAssetSelected} {...props} />
      </SelectorContent>
    );
  }

  return (
    <SelectorContent>
      <SelectAccount {...props} asset={selectedAsset} source="source" flow="flow" />
    </SelectorContent>
  );
}

const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: 0px 16px 0px;
  height: 100%;
`;

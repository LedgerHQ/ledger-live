import React from "react";
import styled from "styled-components";
import { AddAccountButton } from "./components/AddAccountButton";
import { SelectAccountList } from "./components/List";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { useDetailedAccounts } from "../../hooks/useDetailedAccounts";
import { Observable } from "rxjs";

type Props = {
  asset: CryptoOrTokenCurrency;
  source: string;
  flow: string;
  accounts$?: Observable<WalletAPIAccount[]>;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
};

export const AccountSelection = ({ asset, source, flow, accounts$, onAccountSelected }: Props) => {
  const { detailedAccounts, accounts, onAddAccountClick } = useDetailedAccounts(
    asset,
    flow,
    accounts$,
  );

  return (
    <>
      <AddAccountContainer>
        <AddAccountButton onAddAccountClick={onAddAccountClick} />
      </AddAccountContainer>
      <SelectAccountList
        source={source}
        flow={flow}
        accounts={accounts}
        detailedAccounts={detailedAccounts}
        onAccountSelected={onAccountSelected}
      />
    </>
  );
};

export const AddAccountContainer = styled.div`
  display: flex;
  padding: 0 0 16px 0;
  flex: 0 1 auto;
  margin-left: 8px;
  margin-right: 8px;
`;

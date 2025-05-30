import React from "react";
import { Observable } from "rxjs";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CardButton } from "@ledgerhq/react-ui/pre-ldls/index";
import { Icons } from "@ledgerhq/react-ui/index";

import { SelectAccount } from "./SelectAccount";
import { useDetailedAccounts } from "../hooks/useDetailedAccounts";
import { AddAccountContainer } from "./StyledComponents";

type Props = {
  asset: CryptoOrTokenCurrency;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  source: string;
  flow: string;
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const AccountSelectionStep = ({
  asset,
  accounts$,
  onAccountSelected,
  source,
  flow,
}: Props) => {
  const { detailedAccounts, accounts, onAddAccountClick } = useDetailedAccounts(
    asset,
    flow,
    accounts$,
  );
  const { t } = useTranslation();

  return (
    <>
      <AddAccountContainer>
        <CardButton
          onClick={onAddAccountClick}
          title={t("drawers.selectAccount.addAccount")}
          iconRight={<Icons.Plus size="S" />}
          variant="dashed"
        />
      </AddAccountContainer>
      <SelectAccount
        detailedAccounts={detailedAccounts}
        accounts={accounts}
        onAccountSelected={onAccountSelected}
        source={source}
        flow={flow}
      />
    </>
  );
};

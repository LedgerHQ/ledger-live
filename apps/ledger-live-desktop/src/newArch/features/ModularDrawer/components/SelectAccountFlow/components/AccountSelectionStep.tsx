import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { SelectAccount } from "../../SelectAccount";
import { useDetailedAccounts } from "../hooks/useDetailedAccounts";
import { CardButton } from "@ledgerhq/react-ui/pre-ldls/index";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui/index";
import { track } from "~/renderer/analytics/segment";
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
  const detailedAccounts = useDetailedAccounts(asset, accounts$);
  const { t } = useTranslation();

  const onAddAccountClick = () => {
    // TODO: To be implemented in LIVE-17272
    track("button_clicked", {
      button: "Add a new account",
      page: "Modular Account Selection",
      flow,
    });
  };

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
        onAccountSelected={onAccountSelected}
        source={source}
        flow={flow}
      />
    </>
  );
};

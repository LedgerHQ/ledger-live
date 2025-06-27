import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useAccountFormatter } from "../AccountsAdded/hooks";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/index";
import { ActionsContainer } from "./components";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

interface Props {
  account: Account;
  currency: CryptoCurrency;
}

const FundAccount = ({ account, currency }: Props) => {
  const formattedAccount = useAccountFormatter()(account);

  return (
    <>
      <AccountItem account={formattedAccount} />
      <ActionsContainer account={account} currencyId={currency.id} />
    </>
  );
};

export default FundAccount;

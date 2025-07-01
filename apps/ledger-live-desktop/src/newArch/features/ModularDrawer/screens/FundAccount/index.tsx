import React from "react";
import { Account } from "@ledgerhq/types-live";
import { useAccountFormatter } from "../AccountsAdded/hooks";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/index";
import { ActionsContainer } from "./components";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";

interface Props {
  account: Account;
  currency: CryptoCurrency;
  source: string;
}

const FundAccount = ({ account, currency, source }: Props) => {
  const formattedAccount = useAccountFormatter()(account);

  return (
    <>
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS}
        flow={ADD_ACCOUNT_FLOW_NAME}
        source={source}
      />
      <AccountItem account={formattedAccount} />
      <ActionsContainer account={account} currencyId={currency.id} />
    </>
  );
};

export default FundAccount;

import { Flex } from "@ledgerhq/react-ui/index";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";
import { useAccountFormatter } from "../AccountsAdded/hooks";
import { ActionsContainer } from "./components";

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
      <Flex width="100%" alignItems="center" marginBottom={24}>
        <AccountItem account={formattedAccount} />
      </Flex>
      <ActionsContainer account={account} currencyId={currency.id} />
    </>
  );
};

export default FundAccount;

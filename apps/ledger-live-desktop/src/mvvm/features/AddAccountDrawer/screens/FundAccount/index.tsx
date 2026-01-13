import { Flex } from "@ledgerhq/react-ui/index";
import { FormattedAccountItem } from "../../components/FormattedAccountItem";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import { ADD_ACCOUNT_FLOW_NAME, ADD_ACCOUNT_PAGE_NAME } from "../../analytics/addAccount.types";
import { useAccountFormatter } from "../AccountsAdded/hooks";
import { ActionsContainer } from "./components";
import { useSelector } from "LLD/hooks/redux";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";

interface Props {
  account: Account;
  currency: CryptoCurrency;
}

const FundAccount = ({ account, currency }: Props) => {
  const source = useSelector(modularDrawerSourceSelector);
  const formattedAccount = useAccountFormatter()(account);

  return (
    <>
      <TrackAddAccountScreen
        page={ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS}
        flow={ADD_ACCOUNT_FLOW_NAME}
        source={source}
      />
      <Flex width="100%" alignItems="center" marginBottom={24}>
        <FormattedAccountItem account={formattedAccount} />
      </Flex>
      <ActionsContainer account={account} currencyId={currency.id} />
    </>
  );
};

export default FundAccount;

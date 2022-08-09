import React, { ReactNode } from "react";
import {
  isAccountEmpty,
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import {
  AccountLike,
  Account,
  Currency,
} from "@ledgerhq/live-common/types/index";
import { ValueChange } from "@ledgerhq/live-common/portfolio/v2/types";
import { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";

import { Box } from "@ledgerhq/native-ui";
import { isNFTActive } from "@ledgerhq/live-common/nft/index";

import { Colors } from "react-native/Libraries/NewAppScreen";
import { useTheme } from "styled-components/native";
import Header from "./Header";
import AccountGraphCard from "../../components/AccountGraphCard";
import SubAccountsList from "./SubAccountsList";
import NftCollectionsList from "./NftCollectionsList";
import CompoundSummary from "../Lending/Account/CompoundSummary";
import CompoundAccountBodyHeader from "../Lending/Account/AccountBodyHeader";
import perFamilyAccountHeader from "../../generated/AccountHeader";
import perFamilyAccountSubHeader from "../../generated/AccountSubHeader";
import perFamilyAccountBodyHeader from "../../generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "../../generated/AccountBalanceSummaryFooter";
import {
  FabAccountActions,
  FabAccountMainActionsComponent,
} from "../../components/FabActions";

const renderAccountSummary = (
  account: AccountLike,
  parentAccount: Account,
  compoundSummary: CompoundAccountSummary,
) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  const footers = [];

  if (compoundSummary && account.type === "TokenAccount") {
    footers.push(
      <CompoundSummary
        key="compoundSummary"
        account={account}
        compoundSummary={compoundSummary}
      />,
    );
  }

  if (AccountBalanceSummaryFooter)
    footers.push(
      <AccountBalanceSummaryFooter
        account={account}
        key="accountbalancesummary"
      />,
    );
  if (!footers.length) return null;
  return footers;
};

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  countervalueAvailable: boolean;
  useCounterValue: boolean;
  range: any;
  history: any;
  countervalueChange: ValueChange;
  cryptoChange: ValueChange;
  counterValueCurrency: Currency;
  onAccountPress: () => void;
  onSwitchAccountCurrency: () => void;
  compoundSummary?: CompoundAccountSummary;
  onAccountCardLayout: any;
};

export function getListHeaderComponents({
  account,
  parentAccount,
  countervalueAvailable,
  useCounterValue,
  range,
  history,
  countervalueChange,
  cryptoChange,
  counterValueCurrency,
  onAccountPress,
  onSwitchAccountCurrency,
  compoundSummary,
  onAccountCardLayout,
}: Props): {
  listHeaderComponents: ReactNode[];
  stickyHeaderIndices?: number[];
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const { colors } = useTheme();

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];

  const AccountSubHeader =
    perFamilyAccountSubHeader[mainAccount.currency.family];

  const stickyHeaderIndices = empty ? [] : [4];

  return {
    listHeaderComponents: [
      !empty && (
        <Box onLayout={onAccountCardLayout}>
          <AccountGraphCard
            account={account}
            range={range}
            history={history}
            useCounterValue={shouldUseCounterValue}
            valueChange={
              shouldUseCounterValue ? countervalueChange : cryptoChange
            }
            countervalueAvailable={countervalueAvailable}
            counterValueCurrency={counterValueCurrency}
            renderAccountSummary={renderAccountSummary(
              account,
              parentAccount,
              compoundSummary,
            )}
            onSwitchAccountCurrency={onSwitchAccountCurrency}
            countervalueChange={countervalueChange}
            counterValueUnit={counterValueCurrency.units[0]}
            cryptoCurrencyUnit={getAccountUnit(account)}
          />
        </Box>
      ),
      <Box bg={colors.background.main}>
        <Header accountId={account.id} />
      </Box>,
      !!AccountSubHeader && (
        <Box bg={colors.background.main}>
          <AccountSubHeader />
        </Box>
      ),
      !empty && !!AccountHeader && (
        <Box bg={colors.background.main}>
          <AccountHeader account={account} parentAccount={parentAccount} />
        </Box>
      ),
      !empty && (
        <Box px={6} py={6} bg={colors.background.main}>
          <FabAccountMainActionsComponent
            account={account}
            parentAccount={parentAccount}
          />
        </Box>
      ),
      ...(!empty && AccountBodyHeader
        ? [
            <Box bg={colors.background.main}>
              <AccountBodyHeader
                account={account}
                parentAccount={parentAccount}
              />
            </Box>,
          ]
        : []),
      ...(!empty
        ? [
            <Box py={3} mb={8}>
              <FabAccountActions
                account={account}
                parentAccount={parentAccount}
              />
            </Box>,
          ]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <Box mx={6} mb={8} pb={6}>
              <SubAccountsList
                accountId={account.id}
                onAccountPress={onAccountPress}
                parentAccount={account}
                useCounterValue={shouldUseCounterValue}
              />
            </Box>,
          ]
        : []),
      ...(!empty && account.type === "Account" && isNFTActive(account.currency)
        ? [<NftCollectionsList account={account} />]
        : []),
      ...(compoundSummary &&
      account &&
      account.type === "TokenAccount" &&
      parentAccount
        ? [
            <CompoundAccountBodyHeader
              account={account}
              parentAccount={parentAccount}
              compoundSummary={compoundSummary}
            />,
          ]
        : []),
    ],
    stickyHeaderIndices,
  };
}

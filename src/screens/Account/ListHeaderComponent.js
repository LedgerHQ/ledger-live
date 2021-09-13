// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import {
  isAccountEmpty,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import type {
  Unit,
  AccountLike,
  Account,
  Currency,
} from "@ledgerhq/live-common/lib/types";
import type { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";

import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Header from "./Header";
import AccountGraphCard from "../../components/AccountGraphCard";
import Touchable from "../../components/Touchable";
import TransactionsPendingConfirmationWarning from "../../components/TransactionsPendingConfirmationWarning";
import type { Item } from "../../components/Graph/types";
import SubAccountsList from "./SubAccountsList";
import CompoundSummary from "../Lending/Account/CompoundSummary";
import CompoundAccountBodyHeader from "../Lending/Account/AccountBodyHeader";
import perFamilyAccountHeader from "../../generated/AccountHeader";
import perFamilyAccountBodyHeader from "../../generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "../../generated/AccountBalanceSummaryFooter";
import { normalize } from "../../helpers/normalizeSize";
import FabActions from "../../components/FabActions";
import { NoCountervaluePlaceholder } from "../../components/CounterValue.js";

const renderAccountSummary = (
  account,
  parentAccount,
  compoundSummary,
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
  return footers;
};

type HeaderTitleProps = {
  useCounterValue?: boolean,
  cryptoCurrencyUnit: Unit,
  counterValueUnit: Unit,
  item: Item,
};

const renderListHeaderTitle = (
  account,
  countervalueAvailable,
  onSwitchAccountCurrency,
) => ({
  useCounterValue,
  cryptoCurrencyUnit,
  counterValueUnit,
  item,
}: HeaderTitleProps) => {
  const items = [
    { unit: cryptoCurrencyUnit, value: item.value },
    // $FlowFixMe
    { unit: counterValueUnit, value: item.countervalue },
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue) {
    items.reverse();
  }

  return (
    <Touchable
      event="SwitchAccountCurrency"
      eventProperties={{ useCounterValue: shouldUseCounterValue }}
      onPress={countervalueAvailable ? onSwitchAccountCurrency : undefined}
    >
      <View style={styles.balanceContainer}>
        <View style={styles.warningWrapper}>
          <LText style={styles.balanceText} semiBold>
            <CurrencyUnitValue
              {...items[0]}
              disableRounding
              joinFragmentsSeparator=" "
            />
          </LText>
          <TransactionsPendingConfirmationWarning maybeAccount={account} />
        </View>
        <LText style={styles.balanceSubText} color="smoke" semiBold>
          {/* $FlowFixMe */}
          {typeof items[1]?.value === "number" ? (
            <CurrencyUnitValue {...items[1]} disableRounding />
          ) : (
            <NoCountervaluePlaceholder />
          )}
        </LText>
      </View>
    </Touchable>
  );
};

type Props = {
  account: ?AccountLike,
  parentAccount: ?Account,
  countervalueAvailable: boolean,
  useCounterValue: boolean,
  range: *,
  history: *,
  countervalueChange: ValueChange,
  cryptoChange: ValueChange,
  counterValueCurrency: Currency,
  onAccountPress: () => void,
  onSwitchAccountCurrency: () => void,
  compoundSummary?: ?CompoundAccountSummary,
  isCollapsed: boolean,
  setIsCollapsed: (v: boolean) => void,
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
  isCollapsed,
  setIsCollapsed,
}: Props): {
  listHeaderComponents: React$Node[],
  stickyHeaderIndices?: number[],
} {
  if (!account)
    return { listHeaderComponents: [], stickyHeaderIndices: undefined };

  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];

  return {
    listHeaderComponents: [
      <Header accountId={account.id} />,
      ...(!empty && AccountHeader
        ? [<AccountHeader account={account} parentAccount={parentAccount} />]
        : []),

      ...(empty
        ? []
        : [
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
              renderTitle={renderListHeaderTitle(
                account,
                countervalueAvailable,
                onSwitchAccountCurrency,
              )}
              renderAccountSummary={renderAccountSummary(
                account,
                parentAccount,
                compoundSummary,
              )}
            />,
          ]),

      ...(!empty
        ? [
            <View style={[styles.stickySection]}>
              <FabActions account={account} parentAccount={parentAccount} />
            </View>,
          ]
        : []),

      ...(!empty && AccountBodyHeader
        ? [
            <AccountBodyHeader
              account={account}
              parentAccount={parentAccount}
            />,
          ]
        : []),
      ...(!empty && account.type === "Account" && account.subAccounts
        ? [
            <SubAccountsList
              accountId={account.id}
              onAccountPress={onAccountPress}
              parentAccount={account}
              isCollapsed={isCollapsed}
              onToggle={() => setIsCollapsed(!isCollapsed)}
            />,
          ]
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
    stickyHeaderIndices: empty ? [] : AccountHeader ? [3] : [2],
  };
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
    zIndex: 1000,
  },
  balanceContainer: {
    alignItems: "flex-start",
    height: 44,
  },
  balanceText: {
    fontSize: normalize(21),
    paddingBottom: 4,
    flexWrap: "wrap",
  },
  balanceSubText: {
    fontSize: normalize(16),
  },
  warningWrapper: {
    display: "flex",
    flexDirection: "row",
  },
  stickySection: { width: "100%", height: 56 },
});

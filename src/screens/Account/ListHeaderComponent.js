// @flow

import React, { useState, memo } from "react";
import { StyleSheet, View } from "react-native";
import {
  isAccountEmpty,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import type {
  Unit,
  AccountLike,
  Account,
  ValueChange,
} from "@ledgerhq/live-common/lib/types";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";

import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Header from "./Header";
import AccountActions from "./AccountActions";
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

const renderAccountSummary = (
  account,
  parentAccount,
  compoundSummary,
) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  const footers = [];

  if (compoundSummary) {
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
  useCounterValue: boolean,
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
    countervalueAvailable && item.countervalue
      ? { unit: counterValueUnit, value: item.countervalue }
      : null,
  ];

  const shouldUseCounterValue = countervalueAvailable && useCounterValue;
  if (shouldUseCounterValue && item.countervalue) {
    items.reverse();
  }

  return (
    <Touchable
      event="SwitchAccountCurrency"
      eventProperties={{ useCounterValue: shouldUseCounterValue }}
      onPress={countervalueAvailable ? onSwitchAccountCurrency : undefined}
    >
      <View style={styles.balanceContainer}>
        {items[0] ? (
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
        ) : null}
        {items[1] ? (
          <LText style={styles.balanceSubText} color="smoke" semiBold>
            <CurrencyUnitValue {...items[1]} disableRounding />
          </LText>
        ) : null}
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
  counterValueCurrency: Unit,
  onAccountPress: () => void,
  onSwitchAccountCurrency: () => void,
  compoundSummary?: ?CompoundAccountSummary,
};

function ListHeaderComponent({
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
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  if (!account) return null;
  const mainAccount = getMainAccount(account, parentAccount);

  const empty = isAccountEmpty(account);
  const shouldUseCounterValue = countervalueAvailable && useCounterValue;

  const AccountHeader = perFamilyAccountHeader[mainAccount.currency.family];
  const AccountBodyHeader =
    perFamilyAccountBodyHeader[mainAccount.currency.family];

  return (
    <View style={styles.header}>
      <Header accountId={account.id} />

      {!empty && AccountHeader ? (
        <AccountHeader account={account} parentAccount={parentAccount} />
      ) : null}

      {empty ? null : (
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
        />
      )}
      {empty ? null : (
        <AccountActions account={account} parentAccount={parentAccount} />
      )}

      {!empty && AccountBodyHeader ? (
        <AccountBodyHeader account={account} parentAccount={parentAccount} />
      ) : null}
      {!empty && account.type === "Account" && account.subAccounts ? (
        <SubAccountsList
          accountId={account.id}
          onAccountPress={onAccountPress}
          parentAccount={account}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      ) : null}
      {compoundSummary ? (
        <CompoundAccountBodyHeader
          account={account}
          parentAccount={parentAccount}
          compoundSummary={compoundSummary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
  },
  balanceContainer: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: normalize(21),
    paddingBottom: 4,
    lineHeight: 24,
    flexWrap: "wrap",
  },
  balanceSubText: {
    fontSize: normalize(16),
  },
  warningWrapper: {
    display: "flex",
    flexDirection: "row",
  },
});

export default memo<Props>(ListHeaderComponent);

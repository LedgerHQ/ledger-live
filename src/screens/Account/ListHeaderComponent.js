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
} from "@ledgerhq/live-common/lib/types";

import LText from "../../components/LText";
import colors from "../../colors";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Header from "./Header";
import AccountActions from "./AccountActions";
import AccountGraphCard from "../../components/AccountGraphCard";
import Touchable from "../../components/Touchable";
import TransactionsPendingConfirmationWarning from "../../components/TransactionsPendingConfirmationWarning";
import type { Item } from "../../components/Graph/types";
import SubAccountsList from "./SubAccountsList";
import perFamilyAccountHeader from "../../generated/AccountHeader";
import perFamilyAccountBodyHeader from "../../generated/AccountBodyHeader";
import perFamilyAccountBalanceSummaryFooter from "../../generated/AccountBalanceSummaryFooter";

const renderAccountSummary = (account, parentAccount) => () => {
  const mainAccount = getMainAccount(account, parentAccount);
  const AccountBalanceSummaryFooter =
    perFamilyAccountBalanceSummaryFooter[mainAccount.currency.family];

  if (AccountBalanceSummaryFooter)
    return <AccountBalanceSummaryFooter account={account} />;
  return null;
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
            <LText style={styles.balanceText} tertiary>
              <CurrencyUnitValue {...items[0]} disableRounding />
            </LText>
            <TransactionsPendingConfirmationWarning maybeAccount={account} />
          </View>
        ) : null}
        {items[1] ? (
          <LText style={styles.balanceSubText} tertiary>
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
  countervalueChange: () => void,
  cryptoChange: () => void,
  counterValueCurrency: Unit,
  onAccountPress: () => void,
  onSwitchAccountCurrency: () => void,
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
          renderAccountSummary={renderAccountSummary(account, parentAccount)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "column",
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 22,
    paddingBottom: 4,
    color: colors.darkBlue,
  },
  balanceSubText: {
    fontSize: 16,
    color: colors.smoke,
  },
  warningWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
});

export default memo<Props>(ListHeaderComponent);

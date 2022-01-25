// @flow

import React, { useCallback, useState, useMemo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import type { ClosedLoanHistory } from "@ledgerhq/live-common/lib/compound/types";
import {
  getAccountName,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account/helpers";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CurrencyIcon from "../../../components/CurrencyIcon";
import CounterValue from "../../../components/CounterValue";
import DelegationDrawer from "../../../components/DelegationDrawer";
import Circle from "../../../components/Circle";
import Compound, { compoundColor } from "../../../icons/Compound";
import { useLocale } from "../../../context/Locale";
import { rgba } from "../../../colors";

type RowProps = {
  item: ClosedLoanHistory,
};

export default function ClosedLoansRow({ item }: RowProps) {
  const {
    account,
    parentAccount,
    endDate,
    interestsEarned,
    amountSupplied,
  } = item;
  const { token } = account;
  const { colors } = useTheme();
  const name = getAccountName(parentAccount || account);
  const accountName = getAccountName(account);
  const currency = getAccountCurrency(account);
  const totalRedeemed = amountSupplied.plus(interestsEarned);

  const [isOpened, setIsOpened] = useState(false);

  const onOpenDrawer = useCallback(() => setIsOpened(true), []);
  const onCloseDrawer = useCallback(() => setIsOpened(false), []);

  const { locale } = useLocale();

  const data = useMemo(
    () => [
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.account" />
        ),
        Component: <LText semiBold>{name}</LText>,
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.amountRedeemed" />
        ),
        Component: (
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={totalRedeemed}
              showCode
            />
          </LText>
        ),
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.interestEarned" />
        ),
        Component: (
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={interestsEarned}
              showCode
            />
          </LText>
        ),
      },
      {
        label: (
          <Trans i18nKey="transfer.lending.dashboard.activeAccount.endDate" />
        ),
        Component: (
          <LText semiBold>
            {endDate.toLocaleDateString(locale, { dateStyle: "long" })}
          </LText>
        ),
      },
    ],
    [name, token.units, totalRedeemed, interestsEarned, endDate, locale],
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={onOpenDrawer}
      >
        <CurrencyIcon radius={100} currency={token} size={32} />
        <View style={styles.currencySection}>
          <LText
            numberOfLines={1}
            semiBold
            style={styles.subTitle}
            color="grey"
          >
            {name}
          </LText>
          <LText numberOfLines={1} semiBold style={styles.title}>
            {accountName}
          </LText>
        </View>
        <View style={[styles.currencySection, styles.alignEnd]}>
          <LText semiBold>
            <CurrencyUnitValue
              unit={token.units[0]}
              value={amountSupplied}
              showCode
            />
          </LText>
          <LText style={styles.subTitle} color="grey">
            <CounterValue
              currency={token}
              value={amountSupplied}
              disableRounding
              fontSize={3}
              showCode
              alwaysShowSign={false}
            />
          </LText>
        </View>
      </TouchableOpacity>
      <DelegationDrawer
        isOpen={isOpened}
        onClose={onCloseDrawer}
        account={account}
        icon={<CurrencyIcon size={62} radius={62} currency={currency} />}
        ValidatorImage={() => (
          <Circle size={62} bg={rgba(compoundColor, 0.2)}>
            <Compound size={62 * 0.55} />
          </Circle>
        )}
        amount={amountSupplied}
        data={data}
        actions={[]}
        undelegation
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 8,
    height: 70,
  },
  currencySection: { paddingHorizontal: 8, flex: 1 },
  alignEnd: {
    alignItems: "flex-end",
  },
  title: {
    lineHeight: 17,
    fontSize: 14,
  },
  subTitle: {
    lineHeight: 15,
    fontSize: 12,
  },
  currencyIconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

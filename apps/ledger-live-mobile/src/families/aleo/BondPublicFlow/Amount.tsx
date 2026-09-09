import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans } from "~/context/Locale";
import { Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { useSelector } from "~/context/hooks";
import { accountScreenSelector } from "~/reducers/accounts";
import { isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { AleoBondAmountTooLow } from "@ledgerhq/live-common/families/aleo/errors";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  MIN_BOND_AMOUNT,
  MIN_DELEGATOR_STAKE_MICROCREDITS,
  MICROCREDITS_PER_CREDIT,
} from "@ledgerhq/live-common/families/aleo/constants";
import { TrackScreen } from "~/analytics";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<BondPublicFlowParamList, ScreenName.AleoBondPublicAmount>
>;

export default function Amount({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const aleoAccount = account as AleoAccount;
  const unit = aleoAccount.currency.units[0];
  const spendable = aleoAccount.aleoResources?.transparentBalance ?? aleoAccount.spendableBalance;
  const isFirstBond = aleoAccount.aleoResources?.bondedValidator == null;
  const minAmount = isFirstBond
    ? new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS)
    : new BigNumber(MIN_BOND_AMOUNT);
  const minAmountDisplay = isFirstBond
    ? MIN_DELEGATOR_STAKE_MICROCREDITS / MICROCREDITS_PER_CREDIT
    : MIN_BOND_AMOUNT / MICROCREDITS_PER_CREDIT;

  const [amount, setAmount] = useState<BigNumber>(BigNumber(0));

  const maxAmount = BigNumber.max(0, spendable);
  const amountError =
    amount.gt(0) && amount.lt(minAmount)
      ? new AleoBondAmountTooLow(undefined, { minAmount: `${minAmountDisplay} ALEO` })
      : amount.gt(maxAmount)
        ? new NotEnoughBalance()
        : null;

  const onMax = useCallback(() => setAmount(maxAmount), [maxAmount]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.AleoBondPublicSummary, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      validatorAddress: route.params.validatorAddress,
      amount: amount.toFixed(0),
    });
  }, [navigation, route.params, amount]);

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen category="BondPublicFlow" name="Amount" flow="bond" currency="aleo" />
      <View style={styles.content}>
        <View style={styles.alert}>
          <Alert type="hint">
            <Trans i18nKey="aleo.bond.amount.privateAlert" />
          </Alert>
        </View>
        <AmountInput
          account={aleoAccount}
          value={amount}
          onChange={setAmount}
          error={amountError}
        />
        <View style={styles.balanceRow}>
          <Text variant="small" color="neutral.c70">
            <Trans i18nKey="aleo.bond.amount.available" />{" "}
            <CurrencyUnitValue unit={unit} value={spendable} />
          </Text>
          <Button type="main" title={<Trans i18nKey="common.max" />} onPress={onMax} size="small" />
        </View>
        <View style={styles.minimumRow}>
          <Text variant="small" color="neutral.c70">
            <Trans i18nKey="aleo.bond.amount.minimum" values={{ amount: minAmountDisplay }} />
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          type="main"
          title={<Trans i18nKey="common.continue" />}
          onPress={onContinue}
          containerStyle={styles.button}
          disabled={amount.lte(0) || !!amountError}
          event="AleoBondAmountContinue"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  alert: { marginBottom: 16 },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  minimumRow: { marginTop: 12 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  button: { alignSelf: "stretch" },
});

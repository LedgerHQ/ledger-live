import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import type { Transaction as TezosTransaction } from "@ledgerhq/live-common/families/tezos/types";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useState } from "react";
import { Keyboard, StyleSheet, Switch, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import Alert from "~/components/Alert";
import Button from "~/components/Button";
import CancelButton from "~/components/CancelButton";
import RetryButton from "~/components/RetryButton";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import KeyboardView from "~/components/KeyboardView";
import AmountInput from "~/screens/SendFunds/AmountInput";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { TezosUnstakeFlowParamList } from "./types";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<TezosUnstakeFlowParamList, ScreenName.TezosUnstakeAmount>;

export default function UnstakeAmount() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(account?.type === "Account", "tezos account required");

  const bridge = useAccountBridge<TezosTransaction>(account, parentAccount);
  const unit = useAccountUnit(account);
  const { stakedBalance } = useTezosStakingInfo(account);

  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction<TezosTransaction>(bridge, () => {
      const tx = bridge.createTransaction(account);
      return {
        account,
        parentAccount,
        transaction: bridge.updateTransaction(tx, { mode: "unstake" }),
      };
    });

  invariant(transaction, "transaction must be defined");

  const onChange = useCallback(
    (amount: BigNumber) => {
      setTransaction(bridge.updateTransaction(transaction, { amount }));
    },
    [bridge, transaction, setTransaction],
  );

  const toggleUseAllAmount = useCallback(() => {
    setTransaction(
      bridge.updateTransaction(transaction, { useAllAmount: !transaction.useAllAmount }),
    );
  }, [bridge, transaction, setTransaction]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.TezosUnstakeSelectDevice, {
      ...route.params,
      accountId: account.id,
      transaction,
      status,
    });
  }, [navigation, route.params, account.id, transaction, status]);

  const blur = useCallback(() => Keyboard.dismiss(), []);

  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);
  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
    if (parent) parent.goBack();
  }, [navigation]);
  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, bridge, transaction]);

  const { useAllAmount } = transaction;
  const { amount } = status;

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <TrackScreen
        category="TezosUnstakeFlow"
        name="Amount"
        flow="stake"
        action="unstake"
        currency="xtz"
      />
      <KeyboardView style={styles.container}>
        <Alert type="primary" title={t("tezos.unstake.flow.amount.unbondingNotice")} />
        <TouchableWithoutFeedback onPress={blur}>
          <View style={styles.amountWrapper}>
            <AmountInput
              account={account}
              editable={!useAllAmount}
              onChange={onChange}
              value={amount}
              error={amount.eq(0) && (bridgePending || !useAllAmount) ? null : status.errors.amount}
              warning={status.warnings.amount}
              testID="tezos-unstake-amount-input"
            />
            <View style={styles.bottomWrapper}>
              <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
                <LText semiBold style={styles.feeValue}>
                  <CurrencyUnitValue showCode unit={unit} value={status.estimatedFees} />
                </LText>
              </SummaryRow>
              <View style={styles.available}>
                <View style={styles.availableLeft}>
                  <Text color="neutral.c70">
                    <Trans i18nKey="tezos.unstake.flow.amount.staked" />
                  </Text>
                  <Text fontWeight="semiBold" color="neutral.c70">
                    <CurrencyUnitValue showCode unit={unit} value={stakedBalance} />
                  </Text>
                </View>
                <View style={styles.availableRight}>
                  <Text color="neutral.c70" style={styles.maxLabel}>
                    <Trans i18nKey="send.amount.useMax" />
                  </Text>
                  <Switch
                    style={styles.switch}
                    value={useAllAmount ?? false}
                    onValueChange={toggleUseAllAmount}
                  />
                </View>
              </View>
              <View style={styles.continueWrapper}>
                <Button
                  event="TezosUnstakeAmountContinue"
                  type="primary"
                  title={
                    <Trans
                      i18nKey={
                        bridgePending
                          ? "send.amount.loadingNetwork"
                          : "tezos.unstake.flow.amount.cta"
                      }
                    />
                  }
                  onPress={onContinue}
                  disabled={!!status.errors.amount || bridgePending}
                  testID="tezos-unstake-amount-continue"
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardView>
      <GenericErrorBottomModal
        error={bridgeErr}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton containerStyle={styles.button} onPress={onBridgeErrorCancel} />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  amountWrapper: {
    flex: 1,
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
    marginBottom: 16,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  maxLabel: {
    marginRight: 4,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  switch: {
    opacity: 0.99,
  },
  // 14 matches SummaryRow's title size so the label and amount share a baseline.
  feeValue: {
    fontSize: 14,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
});

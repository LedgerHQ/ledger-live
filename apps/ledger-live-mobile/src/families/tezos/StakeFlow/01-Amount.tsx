import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { isAwaitingDelegation, useDelegation } from "@ledgerhq/live-common/families/tezos/react";
import type { Transaction as TezosTransaction } from "@ledgerhq/live-common/families/tezos/types";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Linking,
  StyleSheet,
  Switch,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
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
import { urls } from "~/utils/urls";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { TezosStakeFlowParamList } from "./types";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import {
  AWAIT_DELEGATION_POLL_INTERVAL_MS,
  AWAIT_DELEGATION_SYNC_PRIORITY,
  MAX_AWAIT_DELEGATION_POLLS,
} from "./constants";

type Props = StackNavigatorProps<TezosStakeFlowParamList, ScreenName.TezosStakeAmount>;

export default function StakeAmount() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(account?.type === "Account", "tezos account required");

  const bridge = useAccountBridge<TezosTransaction>(account, parentAccount);
  const unit = useAccountUnit(account);
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);

  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction<TezosTransaction>(bridge, () => {
      const tx = bridge.createTransaction(account);
      return {
        account,
        parentAccount,
        transaction: bridge.updateTransaction(tx, { mode: "stake" }),
      };
    });

  invariant(transaction, "transaction must be defined");

  // The delegation just signed may not have propagated yet; poll until it has so the stake
  // estimate stops failing with MustDelegateBeforeStaking, then reveal the amount field.
  const delegation = useDelegation(account);
  const awaitingDelegation = isAwaitingDelegation(delegation, transaction);
  const [awaitTimedOut, setAwaitTimedOut] = useState(false);
  const syncDispatch = useBridgeSync();

  useEffect(() => {
    if (!awaitingDelegation) {
      setAwaitTimedOut(false);
      return;
    }
    let attempts = 0;
    const dispatchSync = () => {
      syncDispatch({
        type: "SYNC_ONE_ACCOUNT",
        priority: AWAIT_DELEGATION_SYNC_PRIORITY,
        accountId: account.id,
        reason: "tezos-stake-await-delegation",
      });
      attempts += 1;
    };
    dispatchSync();
    const id = setInterval(() => {
      if (attempts >= MAX_AWAIT_DELEGATION_POLLS) {
        clearInterval(id);
        setAwaitTimedOut(true);
        return;
      }
      dispatchSync();
    }, AWAIT_DELEGATION_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [awaitingDelegation, account.id, syncDispatch]);

  useEffect(() => {
    let cancelled = false;
    bridge.estimateMaxSpendable({ account, parentAccount, transaction }).then(estimate => {
      if (cancelled) return;
      setMaxSpendable(estimate);
    });
    return () => {
      cancelled = true;
    };
  }, [bridge, account, parentAccount, transaction]);

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
    navigation.navigate(ScreenName.TezosStakeSelectDevice, {
      ...route.params,
      accountId: account.id,
      transaction,
      status,
    });
  }, [navigation, route.params, account.id, transaction, status]);

  const learnMore = useCallback(() => Linking.openURL(urls.delegation), []);
  const blur = useCallback(() => Keyboard.dismiss(), []);

  // While the delegation is still propagating, the estimate fails by design; don't surface it as an error.
  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(
    () => setBridgeErr(awaitingDelegation ? null : bridgeError),
    [bridgeError, awaitingDelegation],
  );
  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
    if (parent) parent.goBack();
  }, [navigation]);
  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, bridge, transaction]);

  if (awaitingDelegation && !awaitTimedOut) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <TrackScreen
          category="TezosStakeFlow"
          name="Amount Pending Delegation"
          flow="stake"
          action="stake"
          currency="xtz"
        />
        <Flex flex={1} alignItems="center" justifyContent="center" px={6}>
          <InfiniteLoader size={40} />
          <Text variant="body" fontWeight="medium" color="neutral.c70" mt={6} textAlign="center">
            {t("tezos.stake.flow.amount.awaitingDelegation")}
          </Text>
        </Flex>
      </SafeAreaView>
    );
  }

  const { useAllAmount } = transaction;
  const { amount } = status;

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <TrackScreen
        category="TezosStakeFlow"
        name="Amount"
        flow="stake"
        action="stake"
        currency="xtz"
      />
      <KeyboardView style={styles.container}>
        <Alert
          type="primary"
          title={t("tezos.stake.flow.amount.disclaimer")}
          onLearnMore={learnMore}
        />
        <TouchableWithoutFeedback onPress={blur}>
          <View style={styles.amountWrapper}>
            <AmountInput
              account={account}
              editable={!useAllAmount}
              onChange={onChange}
              value={amount}
              error={amount.eq(0) && (bridgePending || !useAllAmount) ? null : status.errors.amount}
              warning={status.warnings.amount}
              testID="tezos-stake-amount-input"
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
                    <Trans i18nKey="send.amount.available" />
                  </Text>
                  {maxSpendable ? (
                    <Text fontWeight="semiBold" color="neutral.c70">
                      <CurrencyUnitValue showCode unit={unit} value={maxSpendable} />
                    </Text>
                  ) : null}
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
                  event="TezosStakeAmountContinue"
                  type="primary"
                  title={
                    <Trans
                      i18nKey={
                        bridgePending ? "send.amount.loadingNetwork" : "tezos.stake.flow.amount.cta"
                      }
                    />
                  }
                  onPress={onContinue}
                  disabled={!!status.errors.amount || bridgePending}
                  testID="tezos-stake-amount-continue"
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

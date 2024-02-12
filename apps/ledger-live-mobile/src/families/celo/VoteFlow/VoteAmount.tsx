import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Switch,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import CurrencyInput from "~/components/CurrencyInput";
import TranslatedError from "~/components/TranslatedError";
import SendRowsFee from "../SendRowsFee";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { CeloVoteFlowParamList } from "./types";

type Props = BaseComposite<StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteAmount>>;

export default function VoteAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account?.type === "Account", "must be account");

  const [maxSpendable, setMaxSpendable] = useState(0);

  const bridge = getAccountBridge(account);

  const { transaction, setTransaction, status, bridgePending } = useBridgeTransaction(() => {
    return {
      account,
      transaction: {
        ...route.params.transaction,
        amount: new BigNumber(route.params.amount ?? 0),
        mode: "vote",
      },
    };
  });

  invariant(transaction, "transaction must be defined");

  useEffect(() => {
    let cancelled = false;
    bridge.estimateMaxSpendable({ account, transaction }).then(estimate => {
      if (cancelled) return;
      setMaxSpendable(estimate.toNumber());
    });

    return () => {
      cancelled = true;
    };
  }, [transaction, setMaxSpendable, bridge, account]);

  const onChange = (amount: BigNumber) => {
    setTransaction(bridge.updateTransaction(transaction, { amount }));
  };

  const toggleUseAllAmount = () => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        useAllAmount: !transaction.useAllAmount,
      }),
    );
  };

  const onContinue = () => {
    navigation.navigate(ScreenName.CeloVoteSummary, {
      ...route.params,
      amount: status.amount,
    });
  };

  const blur = useCallback(() => Keyboard.dismiss(), []);

  const { useAllAmount } = transaction;
  const { amount } = status;
  const unit = getAccountUnit(account);
  const error = amount.eq(0) || bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");

  return (
    <>
      <TrackScreen category="VoteFlow" name="Amount" flow="stake" action="vote" currency="celo" />
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={[styles.root, { backgroundColor: colors.background }]}>
              <View style={styles.wrapper}>
                <CurrencyInput
                  editable={!useAllAmount}
                  isActive
                  onChange={onChange}
                  unit={unit}
                  value={amount}
                  renderRight={
                    <LText
                      semiBold
                      style={[styles.currency]}
                      color={error ? "alert" : warning ? "orange" : "grey"}
                    >
                      {unit.code}
                    </LText>
                  }
                  style={styles.inputContainer}
                  inputStyle={[
                    styles.inputStyle,
                    warning && { color: colors.orange },
                    error && { color: colors.alert },
                  ]}
                  hasError={!!error}
                  hasWarning={!!warning}
                />
                <LText
                  style={[styles.fieldStatus]}
                  color={error ? "alert" : warning ? "orange" : "darkBlue"}
                  numberOfLines={2}
                >
                  <TranslatedError error={error || warning} />
                </LText>
              </View>
              <View style={styles.bottomWrapper}>
                <View style={styles.available}>
                  <View style={styles.availableLeft}>
                    <LText>
                      <Trans i18nKey="celo.vote.flow.steps.amount.available" />
                    </LText>
                    <LText semiBold>
                      {maxSpendable ? (
                        <CurrencyUnitValue showCode unit={unit} value={maxSpendable} />
                      ) : (
                        "-"
                      )}
                    </LText>
                  </View>
                  {typeof useAllAmount === "boolean" ? (
                    <View style={styles.availableRight}>
                      <LText style={styles.maxLabel}>
                        <Trans i18nKey="celo.vote.flow.steps.amount.max" />
                      </LText>
                      <Switch
                        style={styles.switch}
                        value={useAllAmount}
                        onValueChange={toggleUseAllAmount}
                      />
                    </View>
                  ) : null}
                </View>
                <SendRowsFee
                  account={account}
                  transaction={transaction}
                  navigation={navigation}
                  route={route}
                />
                <View style={styles.continueWrapper}>
                  <Button
                    event="CeloVoteAmountContinue"
                    type="primary"
                    title={
                      <Trans
                        i18nKey={!bridgePending ? "common.continue" : "send.amount.loadingNetwork"}
                      />
                    }
                    onPress={onContinue}
                    disabled={!!status.errors.amount || bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
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
    flexGrow: 0,
    alignItems: "stretch",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexBasis: 75,
  },
  inputStyle: {
    flex: 0,
    flexShrink: 1,
    textAlign: "center",
  },
  currency: {
    fontSize: 32,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
  switch: {
    opacity: 0.99,
  },
});

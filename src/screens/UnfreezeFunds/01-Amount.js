/* @flow */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import i18next from "i18next";

import type { NavigationScreenProp } from "react-navigation";
import type { Account, Transaction } from "@ledgerhq/live-common/lib/types";

import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import { accountAndParentScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import StepHeader from "../../components/StepHeader";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import TranslatedError from "../../components/TranslatedError";
import Info from "../../icons/Info";
import CheckBox from "../../components/CheckBox";
import Bandwidth from "../../icons/Bandwidth";
import Bolt from "../../icons/Bolt";

const forceInset = { bottom: "always" };

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
};

const UnfreezeAmount = ({ account, navigation }: Props) => {
  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);

  const { tronResources } = account;
  invariant(tronResources, "tron resources expected");

  const {
    frozen: { bandwidth, energy },
  } = tronResources;

  const UnfreezeBandwidth = BigNumber((bandwidth && bandwidth.amount) || 0);
  const canUnfreezeBandwidth = UnfreezeBandwidth.gt(0);

  const UnfreezeEnergy = BigNumber((energy && energy.amount) || 0);
  const canUnfreezeEnergy = UnfreezeEnergy.gt(0);

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "unfreeze",
      resource: UnfreezeBandwidth.gt(0) ? "BANDWIDTH" : "ENERGY",
    });

    return { account, transaction };
  });

  const resource =
    transaction && transaction.resource ? transaction.resource : "";

  const onContinue = useCallback(() => {
    navigation.navigate("UnfreezeConnectDevice", {
      accountId: account.id,
      transaction,
      status,
    });
  }, [account, navigation, transaction, status]);

  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [bridge, setTransaction, transaction]);

  const onChangeResource = useCallback(
    (resource: string) => {
      setTransaction(bridge.updateTransaction(transaction, { resource }));
    },
    [bridge, transaction, setTransaction],
  );

  const error = useMemo(() => {
    const e = Object.values(status.errors)[0];
    return e instanceof Error ? e : null;
  }, [status.errors]);
  const warning = status.warnings.amount;

  return (
    <>
      <TrackScreen category="UnfreezeFunds" name="Amount" />
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <View style={styles.container}>
          <View style={styles.wrapper}>
            <LText style={styles.label}>
              <Trans i18nKey="unfreeze.amount.title" />
            </LText>

            <TouchableOpacity
              style={styles.selectCard}
              disabled={!canUnfreezeBandwidth}
              onPress={() => onChangeResource("BANDWIDTH")}
            >
              <Bandwidth
                size={16}
                color={!canUnfreezeBandwidth ? colors.grey : colors.darkBlue}
              />
              <LText
                semiBold
                style={[
                  styles.selectCardLabel,
                  !canUnfreezeBandwidth ? styles.disabledLabel : {},
                ]}
              >
                <Trans i18nKey="account.bandwidth" />
              </LText>
              <LText
                semiBold
                style={[
                  styles.frozenAmount,
                  !canUnfreezeBandwidth ? styles.disabledLabel : {},
                ]}
              >
                <CurrencyUnitValue unit={unit} value={UnfreezeBandwidth} />
              </LText>
              <CheckBox isChecked={resource === "BANDWIDTH"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectCard}
              disabled={!canUnfreezeEnergy}
              onPress={() => onChangeResource("ENERGY")}
            >
              <Bolt
                size={16}
                color={!canUnfreezeEnergy ? colors.grey : colors.darkBlue}
              />
              <LText
                semiBold
                style={[
                  styles.selectCardLabel,
                  !canUnfreezeEnergy ? styles.disabledLabel : {},
                ]}
              >
                <Trans i18nKey="account.energy" />
              </LText>
              <LText
                semiBold
                style={[
                  styles.frozenAmount,
                  !canUnfreezeEnergy ? styles.disabledLabel : {},
                ]}
              >
                <CurrencyUnitValue unit={unit} value={UnfreezeEnergy} />
              </LText>
              <CheckBox isChecked={resource === "ENERGY"} />
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <Info size={16} color={colors.live} />
              <LText style={styles.infoText} numberOfLines={3}>
                <Trans
                  i18nKey="unfreeze.amount.info"
                  values={{ resource: (resource || "").toLowerCase() }}
                />
              </LText>
            </View>

            <LText
              style={[error ? styles.error : styles.warning]}
              numberOfLines={2}
            >
              <TranslatedError error={error || warning} />
            </LText>
          </View>

          <View style={styles.bottomWrapper}>
            <View style={styles.continueWrapper}>
              <Button
                event="UnfreezeAmountContinue"
                type="primary"
                title={
                  <Trans
                    i18nKey={
                      !bridgePending
                        ? "common.continue"
                        : "unfreeze.amount.loadingNetwork"
                    }
                  />
                }
                onPress={onContinue}
                disabled={!!error || bridgePending}
                pending={bridgePending}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeError}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
};

UnfreezeAmount.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("unfreeze.stepperHeader.selectAmount")}
      subtitle={i18next.t("unfreeze.stepperHeader.stepRange", {
        currentStep: "1",
        totalSteps: "3",
      })}
    />
  ),
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  container: { flex: 1 },
  label: {
    fontSize: 14,
    color: colors.grey,
    paddingVertical: 8,
  },
  selectCard: {
    padding: 16,
    borderRadius: 4,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 6,
    elevation: 1,
  },
  selectCardLabel: { marginLeft: 16 },
  disabledLabel: { color: colors.grey },
  frozenAmount: { flex: 1, textAlign: "right", marginRight: 16 },
  infoSection: {
    flexDirection: "row",
    backgroundColor: colors.lightLive,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: { color: colors.live, marginLeft: 16, flex: 1 },
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
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  wrapper: {
    flex: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "flex-start",
  },
  error: {
    color: colors.alert,
    fontSize: 14,
    textAlign: "center",
  },
  warning: {
    color: colors.orange,
    fontSize: 14,
    textAlign: "center",
  },
});

export default connect(accountAndParentScreenSelector)(UnfreezeAmount);

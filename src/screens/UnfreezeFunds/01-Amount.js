/* @flow */
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Account, Transaction } from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import TranslatedError from "../../components/TranslatedError";
import Info from "../../icons/Info";
import CheckBox from "../../components/CheckBox";
import Bandwidth from "../../icons/Bandwidth";
import Bolt from "../../icons/Bolt";
import ClockIcon from "../../icons/Clock";
import DateFromNow from "../../components/DateFromNow";

/** @TODO move this to common */
const getUnfreezeData = (
  account: Account,
): {
  unfreezeBandwidth: BigNumber,
  unfreezeEnergy: BigNumber,
  canUnfreezeBandwidth: boolean,
  canUnfreezeEnergy: boolean,
  bandwidthExpiredAt: Date,
  energyExpiredAt: Date,
} => {
  const { tronResources } = account;
  const {
    frozen: { bandwidth, energy },
  } = tronResources || {};

  /** ! expiredAt should always be set with the amount if not this will disable the field by default ! */
  const { amount: bandwidthAmount, expiredAt: bandwidthExpiredAt } =
    bandwidth || {};
  // eslint-disable-next-line no-underscore-dangle
  const _bandwidthExpiredAt = +new Date(bandwidthExpiredAt);

  const { amount: energyAmount, expiredAt: energyExpiredAt } = energy || {};
  // eslint-disable-next-line no-underscore-dangle
  const _energyExpiredAt = +new Date(energyExpiredAt);

  const unfreezeBandwidth = BigNumber(bandwidthAmount || 0);
  const canUnfreezeBandwidth =
    unfreezeBandwidth.gt(0) && Date.now() > _bandwidthExpiredAt;

  const unfreezeEnergy = BigNumber(energyAmount || 0);
  const canUnfreezeEnergy =
    unfreezeEnergy.gt(0) && Date.now() > _energyExpiredAt;

  return {
    unfreezeBandwidth,
    unfreezeEnergy,
    canUnfreezeBandwidth,
    canUnfreezeEnergy,
    bandwidthExpiredAt,
    energyExpiredAt,
  };
};

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

export default function UnfreezeAmount({ route }: Props) {
  const { account: accountLike, parentAccount } = useSelector(
    accountScreenSelector(route),
  );
  if (!accountLike) {
    return null;
  }
  const account = getMainAccount(accountLike, parentAccount);
  return <UnfreezeAmountInner account={account} />;
}

type InnerProps = {
  account: Account,
};

function UnfreezeAmountInner({ account }: InnerProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);

  const { tronResources } = account;
  invariant(tronResources, "tron resources expected");

  const {
    unfreezeBandwidth,
    unfreezeEnergy,
    canUnfreezeBandwidth,
    canUnfreezeEnergy,
    bandwidthExpiredAt,
    energyExpiredAt,
  } = useMemo(() => getUnfreezeData(account), [account]);

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
      resource: canUnfreezeBandwidth ? "BANDWIDTH" : "ENERGY",
    });

    return { account, transaction };
  });

  const resource =
    transaction && transaction.resource ? transaction.resource : "";

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.UnfreezeSelectDevice, {
      accountId: account.id,
      transaction,
      status,
    });
  }, [account, navigation, transaction, status]);

  const [bridgeErr, setBridgeErr] = useState(bridgeError);

  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
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
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <View style={styles.container}>
          <View style={styles.wrapper}>
            <LText style={styles.label} color="grey">
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
              <View style={styles.selectCardLabelContainer}>
                <LText
                  semiBold
                  color={!canUnfreezeBandwidth ? "grey" : "darkBlue"}
                >
                  <Trans i18nKey="account.bandwidth" />
                </LText>
                {unfreezeBandwidth.gt(0) && !canUnfreezeBandwidth ? (
                  <View style={styles.timeWarn}>
                    <ClockIcon color={colors.grey} size={12} />
                    <LText style={styles.timeLabel} semiBold color="grey">
                      <DateFromNow date={+bandwidthExpiredAt} />
                    </LText>
                  </View>
                ) : null}
              </View>
              <LText
                semiBold
                style={[styles.frozenAmount]}
                color={!canUnfreezeBandwidth ? "grey" : "darkBlue"}
              >
                <CurrencyUnitValue unit={unit} value={unfreezeBandwidth} />
              </LText>
              <CheckBox isChecked={resource === "BANDWIDTH"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectCard, { backgroundColor: colors.card }]}
              disabled={!canUnfreezeEnergy}
              onPress={() => onChangeResource("ENERGY")}
            >
              <Bolt
                size={16}
                color={!canUnfreezeEnergy ? colors.grey : colors.darkBlue}
              />
              <View style={styles.selectCardLabelContainer}>
                <LText
                  semiBold
                  color={!canUnfreezeEnergy ? "grey" : "darkBlue"}
                >
                  <Trans i18nKey="account.energy" />
                </LText>
                {unfreezeEnergy.gt(0) && !canUnfreezeEnergy ? (
                  <View
                    style={[
                      styles.timeWarn,
                      { backgroundColor: colors.lightFog },
                    ]}
                  >
                    <ClockIcon color={colors.grey} size={12} />
                    <LText style={styles.timeLabel} semiBold color="grey">
                      <DateFromNow date={+energyExpiredAt} />
                    </LText>
                  </View>
                ) : null}
              </View>
              <LText
                semiBold
                style={[styles.frozenAmount]}
                color={!canUnfreezeEnergy ? "grey" : "darkBlue"}
              >
                <CurrencyUnitValue unit={unit} value={unfreezeEnergy} />
              </LText>
              <CheckBox isChecked={resource === "ENERGY"} />
            </TouchableOpacity>

            <View
              style={[
                styles.infoSection,
                { backgroundColor: colors.lightLive },
              ]}
            >
              <Info size={16} color={colors.live} />
              <LText style={styles.infoText} numberOfLines={3} color="live">
                <Trans
                  i18nKey="unfreeze.amount.info"
                  values={{ resource: (resource || "").toLowerCase() }}
                />
              </LText>
            </View>

            <LText
              style={[styles.error]}
              numberOfLines={2}
              color={error ? "alert" : "orange"}
            >
              <TranslatedError error={error || warning} />
            </LText>
          </View>

          <View style={styles.bottomWrapper}>
            <View style={styles.continueWrapper}>
              <Button
                event="UnfreezeAmountContinue"
                type="primary"
                title={<Trans i18nKey="common.continue" />}
                onPress={onContinue}
                disabled={!!error || bridgePending}
                pending={bridgePending}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeErr}
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
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  container: { flex: 1 },
  label: {
    fontSize: 14,
    paddingVertical: 8,
  },
  selectCard: {
    paddingHorizontal: 16,
    height: 55,
    borderRadius: 4,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 6,
    elevation: 1,
  },
  selectCardLabelContainer: { marginLeft: 8 },
  frozenAmount: { flex: 1, textAlign: "right", marginRight: 16 },
  infoSection: {
    flexShrink: 1,
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  infoText: { marginLeft: 16, flex: 1 },
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
    fontSize: 14,
    textAlign: "center",
  },
  timeWarn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 4,

    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  timeLabel: {
    marginLeft: 4,
    fontSize: 11,
    lineHeight: 16,
  },
});

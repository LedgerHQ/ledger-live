/* @flow */
import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import invariant from "invariant";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Button from "../../components/Button";
import ToggleButton from "../../components/ToggleButton";
import KeyboardView from "../../components/KeyboardView";
import RetryButton from "../../components/RetryButton";
import CancelButton from "../../components/CancelButton";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import CurrencyInput from "../../components/CurrencyInput";
import TranslatedError from "../../components/TranslatedError";
import InfoModal from "../../modals/Info";
import Info from "../../icons/Info";
import BandwidthIcon from "../../icons/Bandwidth";
import EnergyIcon from "../../icons/Energy";

const forceInset = { bottom: "always" };

const options = [
  {
    value: "BANDWIDTH",
    label: <Trans i18nKey="account.bandwidth" />,
  },
  {
    value: "ENERGY",
    label: <Trans i18nKey="account.energy" />,
  },
];

const infoModalData = [
  {
    Icon: () => <BandwidthIcon size={18} />,
    title: <Trans i18nKey="tron.info.bandwidth.title" />,
    description: <Trans i18nKey="tron.info.bandwidth.description" />,
  },
  {
    Icon: () => <EnergyIcon size={18} />,
    title: <Trans i18nKey="tron.info.energy.title" />,
    description: <Trans i18nKey="tron.info.energy.description" />,
  },
];

const getDecimalPart = (value: BigNumber, magnitude: number) =>
  value.minus(value.modulo(10 ** magnitude));

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

export default function FreezeAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account && account.type === "Account", "account is required");

  const bridge = getAccountBridge(account, undefined);

  const defaultUnit = getAccountUnit(account);
  const { spendableBalance } = account;

  const [selectedRatio, selectRatio] = useState();

  const [infoModalOpen, setInfoModalOpen] = useState();

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "freeze",
      resource: "BANDWIDTH",
    });

    return { account, transaction };
  });

  const onChange = useCallback(
    (amount, keepRatio) => {
      if (!amount.isNaN()) {
        if (!keepRatio) selectRatio();
        setTransaction(
          bridge.updateTransaction(transaction, {
            amount: getDecimalPart(amount, defaultUnit.magnitude),
          }),
        );
      }
    },
    [setTransaction, transaction, bridge, defaultUnit],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.FreezeSelectDevice, {
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
  }, [setTransaction, transaction, bridge]);

  const blur = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);

  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);

  const onRatioPress = useCallback(
    value => {
      blur();
      selectRatio(value);
      onChange(value, true);
    },
    [blur, onChange],
  );

  const onChangeResource = useCallback(
    (resource: string) => {
      setTransaction(bridge.updateTransaction(transaction, { resource }));
    },
    [bridge, transaction, setTransaction],
  );

  /** show amount ratio buttons only if we can ratio the available assets to 25% or less */
  const showAmountRatio = useMemo(
    () => spendableBalance.gt(BigNumber(4 * 10 ** defaultUnit.magnitude)),
    [spendableBalance, defaultUnit],
  );

  const amountButtons = useMemo(
    () =>
      showAmountRatio && [
        {
          label: "25%",
          value: spendableBalance.multipliedBy(0.25),
        },
        {
          label: "50%",
          value: spendableBalance.multipliedBy(0.5),
        },
        {
          label: "75%",
          value: spendableBalance.multipliedBy(0.75),
        },
        {
          label: "100%",
          value: spendableBalance,
        },
      ],
    [showAmountRatio, spendableBalance],
  );

  if (!account || !transaction) return null;

  const { amount } = status;
  const unit = getAccountUnit(account);

  const resource = transaction.resource || "";

  const error = amount.eq(0) || bridgePending ? null : status.errors.amount;
  const warning = status.warnings.amount;

  return (
    <>
      <TrackScreen category="FreezeFunds" name="Amount" />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <KeyboardView style={styles.container}>
          <View style={styles.topContainer}>
            <ToggleButton
              value={resource}
              options={options}
              onChange={onChangeResource}
            />
          </View>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.root}>
              <TouchableOpacity onPress={openInfoModal} style={styles.info}>
                <LText semiBold style={styles.infoLabel} color="grey">
                  <Trans i18nKey="freeze.amount.infoLabel" />
                </LText>
                <Info size={16} color={colors.grey} />
              </TouchableOpacity>
              <View style={styles.wrapper}>
                <CurrencyInput
                  editable
                  isActive
                  onChange={onChange}
                  unit={unit}
                  value={amount}
                  autoFocus
                  style={styles.inputContainer}
                  inputStyle={styles.inputStyle}
                  hasError={!!error}
                  hasWarning={!!warning}
                />
                <LText
                  style={[styles.error]}
                  color={error ? "alert" : "orange"}
                  numberOfLines={2}
                >
                  <TranslatedError error={error || warning} />
                </LText>
              </View>
              {amountButtons && amountButtons.length > 0 && (
                <View style={styles.amountRatioContainer}>
                  {amountButtons.map(({ value, label }, key) => (
                    <TouchableOpacity
                      style={[
                        styles.amountRatioButton,
                        selectedRatio === value
                          ? {
                              backgroundColor: colors.live,
                              borderColor: colors.live,
                            }
                          : { borderColor: colors.grey },
                      ]}
                      key={key}
                      onPress={() => onRatioPress(value)}
                    >
                      <LText
                        style={[styles.amountRatioLabel]}
                        color={selectedRatio === value ? "white" : "grey"}
                      >
                        {label}
                      </LText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.bottomWrapper}>
                <View style={styles.available}>
                  <LText semiBold style={styles.availableAmount} color="grey">
                    <Trans i18nKey="freeze.amount.available" />
                  </LText>
                  <LText semiBold style={styles.availableAmount} color="grey">
                    <CurrencyUnitValue
                      showCode
                      unit={unit}
                      value={getDecimalPart(
                        account.spendableBalance,
                        defaultUnit.magnitude,
                      )}
                    />
                  </LText>
                </View>
                <View style={styles.continueWrapper}>
                  <Button
                    event="FreezeAmountContinue"
                    type="primary"
                    title={<Trans i18nKey="common.continue" />}
                    onPress={onContinue}
                    disabled={!!status.errors.amount || bridgePending}
                    pending={bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>

      <InfoModal
        isOpened={!!infoModalOpen}
        onClose={closeInfoModal}
        data={infoModalData}
      />

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
  },
  topContainer: { paddingHorizontal: 32, flexShrink: 1 },
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
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  availableAmount: {
    marginHorizontal: 3,
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
    flexShrink: 1,
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
  amountRatioContainer: {
    flexGrow: 1,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  amountRatioButton: {
    height: 24,
    borderRadius: 4,
    borderWidth: 1,

    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  amountRatioLabel: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
  inputContainer: { flexBasis: 75 },
  inputStyle: { flex: 1, flexShrink: 1, textAlign: "center" },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  info: {
    flexShrink: 1,
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { marginRight: 10 },
});

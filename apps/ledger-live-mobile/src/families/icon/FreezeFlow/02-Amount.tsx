import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { defaultIISSContractAddress } from "@ledgerhq/live-common/families/icon/logic";
import { Text } from "@ledgerhq/native-ui";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Keyboard, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import CancelButton from "../../../components/CancelButton";
import CurrencyInput from "../../../components/CurrencyInput";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import GenericErrorBottomModal from "../../../components/GenericErrorBottomModal";
import KeyboardView from "../../../components/KeyboardView";
import LText from "../../../components/LText";
import RetryButton from "../../../components/RetryButton";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import TranslatedError from "../../../components/TranslatedError";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import { localeSelector } from "../../../reducers/settings";
import { IconFreezeFlowParamList } from "./type";

const getDecimalPart = (value: BigNumber, magnitude: number) =>
  value.minus(value.modulo(10 ** magnitude));

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<IconFreezeFlowParamList, ScreenName.IconFreezeAmount>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function IconFreezeAmount({ navigation, route }: NavigatorProps) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  invariant(account && account.type === "Account", "account is required");

  const bridge = getAccountBridge(account, undefined);

  const defaultUnit = getAccountUnit(account);
  const { spendableBalance, iconResources } = account as IconAccount;
  const totalSpendableBalance = spendableBalance.plus(iconResources.unstake);
  const [selectedRatio, selectRatio] = useState();


  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const t = bridge.createTransaction(account);

      const transaction = bridge.updateTransaction(t, {
        mode: "freeze",
        recipient: defaultIISSContractAddress()
      });

      return { account, transaction };
    });


  const onChange = useCallback(
    (amount: BigNumber, keepRatio?: boolean) => {
      if (!amount.isNaN()) {
        if (!keepRatio) selectRatio(undefined);
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
    navigation.navigate(ScreenName.IconFreezeSelectDevice, {
      accountId: account.id,
      transaction,
      status,
    });
  }, [account, navigation, transaction, status]);

  const [bridgeErr, setBridgeErr] = useState(bridgeError);

  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
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

  const onRatioPress = useCallback(
    value => {
      blur();
      selectRatio(value);
      onChange(value, true);
    },
    [blur, onChange],
  );

  /** show amount ratio buttons only if we can ratio the available assets to 25% or less */
  const showAmountRatio = useMemo(
    () => totalSpendableBalance.gt(BigNumber(4 * 10 ** defaultUnit.magnitude)),
    [spendableBalance, defaultUnit, totalSpendableBalance],
  );

  const amountButtons = useMemo(
    () =>
      showAmountRatio && [
        {
          label: "25%",
          value: totalSpendableBalance.multipliedBy(0.25),
        },
        {
          label: "50%",
          value: totalSpendableBalance.multipliedBy(0.5),
        },
        {
          label: "75%",
          value: totalSpendableBalance.multipliedBy(0.75),
        },
        {
          label: "100%",
          value: totalSpendableBalance,
        },
      ],
    [showAmountRatio, spendableBalance, totalSpendableBalance],
  );

  if (!account || !transaction) return null;

  const { amount } = status;
  const unit = getAccountUnit(account);

  const error = amount.eq(0) || bridgePending ? null : status.errors.amount;
  const warning = status.warnings.amount;

  return (
    <>
      <TrackScreen category="IconFreezeFlow" name="Amount" />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.root}>
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
                  <Text variant={"paragraph"} mr={3}>
                    <Trans i18nKey="icon.account.availableBalance" />
                  </Text>
                  <Text variant={"paragraph"} fontWeight={"semiBold"}>
                    <CurrencyUnitValue
                      showCode
                      unit={unit}
                      value={getDecimalPart(
                        totalSpendableBalance,
                        defaultUnit.magnitude,
                      )}
                    />
                  </Text>
                </View>
                <View style={styles.continueWrapper}>
                  <Button
                    event="FreezeAmountContinue"
                    type={"main"}
                    onPress={onContinue}
                    disabled={!!status.errors.amount || bridgePending}
                  // pending={bridgePending}
                  >
                    <Trans i18nKey="common.continue" />
                  </Button>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
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
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
    paddingVertical: 8,
    marginBottom: 8,
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
});

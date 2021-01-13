/* @flow */
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import type {
  Transaction,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  findCompoundToken,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/lib/currencies";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { rgba } from "../../../../colors";
import { ScreenName, NavigatorName } from "../../../../const";
import { TrackScreen } from "../../../../analytics";
import LText from "../../../../components/LText";
import Button from "../../../../components/Button";
import RetryButton from "../../../../components/RetryButton";
import CancelButton from "../../../../components/CancelButton";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";
import Circle from "../../../../components/Circle";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import Compound, { compoundColor } from "../../../../icons/Compound";
import LinkedIcons from "../../../../icons/LinkedIcons";
import Plus from "../../../../icons/Plus";
import ArrowRight from "../../../../icons/ArrowRight";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import LendingWarnings from "../../shared/LendingWarnings";
import { discreetModeSelector } from "../../../../reducers/settings";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  parentId: string,
  currency: TokenCurrency,
  transaction?: Transaction,
};

export default function SendAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { currency, transaction: tx } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(
    account && account.type === "TokenAccount",
    "token account required",
  );

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const bridge = getAccountBridge(account, parentAccount);
    const ctoken = findCompoundToken(account.token);

    // $FlowFixMe
    const t = bridge.createTransaction(account);

    const transaction =
      tx ||
      bridge.updateTransaction(t, {
        recipient: ctoken?.contractAddress || "",
        mode: "erc20.approve",
        useAllAmount: true,
        gasPrice: null,
        userGasLimit: null,
        subAccountId: account.id,
      });

    return { account, parentAccount, transaction };
  });

  invariant(transaction, "transaction required");

  const { amount } = transaction;
  const { spendableBalance } = account;
  const name = parentAccount?.name;
  const unit = getAccountUnit(account);

  const formattedAmount =
    amount &&
    formatCurrencyUnit(unit, amount, {
      showAllDigits: false,
      disableRounding: false,
      showCode: true,
      discreet,
    });

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.LendingEnableSummary, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      currentNavigation: ScreenName.LendingEnableSummary,
      nextNavigation: ScreenName.LendingEnableSelectDevice,
      overrideAmountLabel: transaction?.useAllAmount
        ? t("transfer.lending.enable.enable.noLimit", {
            assetName: currency.name,
          })
        : formattedAmount,
      hideTotal: true,
    });
  }, [
    transaction,
    navigation,
    route.params,
    account.id,
    parentAccount,
    t,
    currency.name,
    formattedAmount,
  ]);

  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    if (!transaction) return;
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  const navigateAdvanced = useCallback(() => {
    navigation.navigate(NavigatorName.LendingEnableFlow, {
      screen: ScreenName.LendingEnableAmountAdvanced,
      params: {
        ...route.params,
        transaction,
      },
    });
  }, [navigation, route.params, transaction]);

  return (
    <>
      <TrackScreen
        category="Lend Approve"
        name="step 1"
        eventProperties={{ currencyName: currency.name }}
      />
      <LendingWarnings />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <View style={styles.container}>
          <LinkedIcons
            left={
              <View style={styles.currencyIconContainer}>
                <CurrencyIcon size={62} radius={62} currency={currency} />
                <LText
                  style={[
                    styles.balanceLabel,
                    {
                      backgroundColor: colors.lightFog,
                    },
                  ]}
                  color="grey"
                  semiBold
                  numberOfLines={1}
                >
                  <CurrencyUnitValue
                    showCode
                    unit={unit}
                    value={spendableBalance}
                  />
                </LText>
              </View>
            }
            center={<Plus size={12} color={colors.live} />}
            right={
              <Circle size={62} bg={rgba(compoundColor, 0.2)}>
                <Compound size={62 * 0.55} />
              </Circle>
            }
          />
          <View style={styles.summaryRow}>
            <Trans
              i18nKey="transfer.lending.enable.enable.summary"
              values={{
                contractName: t("transfer.lending.enable.enable.contractName", {
                  currencyName: currency.ticker,
                }),
                accountName: name,
                amount:
                  amount && amount.gt(0)
                    ? t("transfer.lending.enable.enable.limit", {
                        amount: formattedAmount,
                      })
                    : t("transfer.lending.enable.enable.noLimit", {
                        assetName: currency.name,
                      }),
              }}
            >
              <LText semiBold style={styles.label} />
              <LText
                numberOfLines={1}
                semiBold
                style={[
                  styles.liveLabel,
                  { backgroundColor: colors.lightLive },
                ]}
                color="live"
              />
            </Trans>
          </View>
        </View>
        <View style={styles.bottomWrapper}>
          <TouchableOpacity
            onPress={navigateAdvanced}
            style={[styles.advancedButton, { borderColor: colors.lightFog }]}
          >
            <LText semiBold style={styles.advancedLabel} color="live">
              <Trans i18nKey="transfer.lending.enable.enable.advanced" />
            </LText>
            <ArrowRight color={colors.live} size={16} />
          </TouchableOpacity>
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
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    alignItems: "stretch",
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  balanceLabel: {
    position: "absolute",
    bottom: -28,
    height: 20,
    lineHeight: 20,
    borderRadius: 4,
    width: "auto",
    flexGrow: 1,
    fontSize: 11,
    paddingHorizontal: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 54,
  },
  label: {
    fontSize: 16,
    lineHeight: 19,
    marginVertical: 8,
  },
  liveLabel: {
    fontSize: 16,
    borderRadius: 4,
    paddingHorizontal: 4,
    height: 24,
    lineHeight: 24,
    marginVertical: 8,
  },
  currencyIconContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  advancedButton: {
    width: "100%",
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  advancedLabel: {
    fontSize: 13,
  },
});

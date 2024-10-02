import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type {
  CardanoAccount,
  CardanoDelegation,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { Text, Box } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { rgba } from "../../../colors";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CardanoUndelegationFlowParamList } from "./types";
import TranslatedError from "~/components/TranslatedError";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import RetryButton from "~/components/RetryButton";
import CancelButton from "~/components/CancelButton";

type Props = StackNavigatorProps<
  CardanoUndelegationFlowParamList,
  ScreenName.CardanoUndelegationSummary
>;

export default function UndelegationSummary({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account must be defined");

  const { cardanoResources } = account as CardanoAccount;
  const currentDelegation = cardanoResources.delegation as CardanoDelegation;
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, undefined);

  const { transaction, status, bridgePending, bridgeError, setTransaction } = useBridgeTransaction(
    () => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(mainAccount);

        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "undelegate",
          }),
        };
      }

      return { account, transaction: tx };
    },
  );

  const displayError = useMemo(() => {
    return status.errors.amount ? status.errors.amount : "";
  }, [status]);
  const displayWarning = useMemo(() => {
    return status.warnings.feeTooHigh ? status.warnings.feeTooHigh : "";
  }, [status]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CardanoUndelegationSelectDevice, {
      accountId: account.id,
      parentId: parentAccount?.id || undefined,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

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
    const bridge = getAccountBridge(account, parentAccount);
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, account, parentAccount, transaction]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="Summary" />

      <View style={styles.body}>
        <View style={styles.delegatingAccount}>
          <Circle size={64} bg={rgba(color, 0.2)}>
            <CurrencyIcon size={32} currency={currency} />
          </Circle>
          <AccountBalanceTag account={account} />
        </View>

        <View style={styles.summary}>
          <SummaryWords currentDelegation={currentDelegation} account={account} status={status} />
        </View>
      </View>
      <View style={styles.footer}>
        {displayError ? (
          <Box>
            <Text fontSize={13} color="red">
              <TranslatedError error={displayError} field="title" />
            </Text>
          </Box>
        ) : (
          <></>
        )}
        {displayWarning ? (
          <Box>
            <Text fontSize={13} color="orange">
              <TranslatedError error={displayWarning} field="title" />
            </Text>
          </Box>
        ) : (
          <></>
        )}
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || Object.keys(status.errors).length > 0}
          pending={bridgePending}
        />
      </View>
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
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  poolCircle: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  delegatingAccount: {
    paddingTop: 26,
    alignItems: "center",
  },
  accountBalanceTag: {
    marginTop: 8,
    borderRadius: 4,
    padding: 4,
    alignItems: "center",
  },
  accountBalanceTagText: {
    fontSize: 11,
  },
  accountName: {
    maxWidth: 180,
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  // DataField
  summarySection: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    width: "100%",
  },
  labelText: {
    paddingRight: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  valueWrapper: {
    alignItems: "flex-end",
  },
  valueText: {
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

function SummaryWords({
  account,
  status,
}: {
  account: AccountLike;
  currentDelegation: CardanoDelegation;
  status: TransactionStatus;
}) {
  const unit = useAccountUnit(account);
  const { t } = useTranslation();
  const { colors } = useTheme();

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  return (
    <>
      <View style={styles.summarySection}>
        <LText style={styles.labelText} color="smoke">
          {t("cardano.undelegation.undelegationMessage")}
        </LText>
        <View
          style={[
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.lightFog,
              width: "100%",
              marginVertical: 10,
            },
          ]}
        />
        <DataField
          label={t("cardano.delegation.networkFees")}
          Component={
            <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
              {formatCurrencyUnit(unit, new BigNumber(status.estimatedFees), formatConfig)}
            </LText>
          }
        />

        <DataField
          label={t("cardano.delegation.stakeKeyRegistrationDepositRefund")}
          Component={
            <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
              {formatCurrencyUnit(unit, new BigNumber(2000000), formatConfig)}
            </LText>
          }
        />
      </View>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = useAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View style={[styles.accountBalanceTag, { backgroundColor: colors.border }]}>
      <Text
        fontWeight="semiBold"
        numberOfLines={1}
        style={styles.accountBalanceTagText}
        color="smoke"
      >
        <CurrencyUnitValue showCode unit={unit} value={account.balance} />
      </Text>
    </View>
  );
};

type FieldType = {
  label: ReactNode;
  Component: ReactNode;
};

function DataField({ label, Component }: FieldType) {
  return (
    <View style={styles.row}>
      <View>
        <LText numberOfLines={1} style={styles.labelText} color="smoke">
          {label}
        </LText>
      </View>

      <View style={styles.valueWrapper}>{Component}</View>
    </View>
  );
}

import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import CurrencyInput from "~/components/CurrencyInput";
import LText from "~/components/LText";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingAmount
  >
>;

export default function StakingAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const tx = route.params.transaction;
      if (!tx) {
        const t = bridge.createTransaction(mainAccount);
        return {
          account,
          transaction: bridge.updateTransaction(t, {
            type: "create_neuron",
          }),
        };
      }
      return { account, transaction: tx };
    },
  );

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "internet_computer", "transaction internet_computer");

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          amount,
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onUseMax = useCallback(() => {
    const maxAmount = mainAccount.spendableBalance.minus(ICP_FEES);
    if (maxAmount.gt(0)) {
      onChangeAmount(maxAmount);
    }
  }, [mainAccount.spendableBalance, onChangeAmount]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerStakingSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [account.id, navigation, parentAccount?.id, route.params.source, status, transaction]);

  const error =
    transaction.amount.eq(0) || bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  const minStakingFormatted = useMemo(() => {
    return formatCurrencyUnit(unit, new BigNumber(ICP_MIN_STAKING_AMOUNT), {
      showCode: true,
      disableRounding: true,
    });
  }, [unit]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Staking"
        name="Amount"
        screen="Amount"
        flow="stake"
        action="staking"
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.amountSection}>
          <Text variant="h5" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.staking.flow.steps.amount.amountLabel" />
          </Text>
          <CurrencyInput
            unit={unit}
            value={transaction.amount}
            onChange={onChangeAmount}
            inputStyle={styles.inputStyle}
            hasError={!!error}
          />
          <TouchableOpacity onPress={onUseMax} style={styles.maxButton}>
            <Text color={colors.primary} fontWeight="semiBold">
              <Trans i18nKey="icp.staking.flow.steps.amount.useMax" />
            </Text>
          </TouchableOpacity>
          <Text variant="small" color="neutral.c70" mt={2}>
            <Trans
              i18nKey="icp.staking.flow.steps.amount.minAmount"
              values={{ amount: minStakingFormatted }}
            />
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <LText
          style={styles.fieldStatus}
          color={error ? "alert" : warning ? "orange" : "darkBlue"}
          numberOfLines={3}
        >
          <TranslatedError error={error || warning} />
        </LText>
        <Button
          type="main"
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors || transaction.amount.eq(0)}
          pending={bridgePending}
          testID="icp-staking-amount-continue"
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  amountSection: {
    marginBottom: 32,
  },
  inputStyle: {
    fontSize: 32,
    fontWeight: "600",
  },
  maxButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
  },
  delaySection: {
    flex: 1,
  },
  delayPresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  delayPreset: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
});

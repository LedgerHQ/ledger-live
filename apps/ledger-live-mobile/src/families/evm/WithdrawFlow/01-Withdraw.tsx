/* eslint-disable @typescript-eslint/consistent-type-assertions */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import TranslatedError from "~/components/TranslatedError";
import ValidatorImage from "~/families/evm/shared/ValidatorImage";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { EvmWithdrawFlowParamList } from "./types";

type Navigation = StackNavigatorProps<EvmWithdrawFlowParamList, ScreenName.EvmWithdrawConfirmation>;

function Withdraw() {
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  invariant(account.type === "Account", "account must be of type Account");

  const { unbonding } = route.params;
  const validatorName =
    unbonding.validator?.name ?? unbonding.validatorName ?? unbonding.validatorAddress;
  const unit = useAccountUnit(account);
  const bridge = useAccountBridge<GenericTransaction>(account);

  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(bridge, () => {
    // STUB (LIVE-31683): bridge has no "withdraw" mode yet — self-send so the flow
    // runs end-to-end. Replace with `mode: "withdraw"` once coin-evm supports it.
    const base = bridge.updateTransaction(bridge.createTransaction(account), {
      recipient: account.freshAddress,
    });
    const withdrawTx = bridge.updateTransaction(base, {
      mode: "send",
      recipient: account.freshAddress,
      // Minimal self-send: the matured amount is still locked until the real withdraw
      // call (LIVE-31683), so sending it would hit NotEnoughBalance. 1 wei keeps the
      // stub flow usable (user only covers fees).
      amount: new BigNumber(1),
      useAllAmount: false,
    });
    return { account, parentAccount: undefined, transaction: withdrawTx as unknown as Transaction };
  });

  invariant(transaction, "transaction required");

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.EvmWithdrawSelectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      transaction: transaction as unknown as Transaction,
      status: status as TransactionStatus,
    });
  }, [navigation, route.params.accountId, route.params.parentId, transaction, status]);

  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0];

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen
        category="EvmWithdraw"
        name="Withdraw"
        flow="stake"
        action="withdraw"
        currency={account.currency.ticker}
      />
      <View style={styles.body}>
        <Flex mb={32}>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            fontSize={24}
            textAlign="center"
            mb={3}
            adjustsFontSizeToFit
          >
            <CurrencyUnitValue showCode unit={unit} value={unbonding.amount} />
          </Text>
          <Text textAlign="center" color="smoke">
            <CounterValue
              currency={account.currency}
              value={unbonding.amount}
              alwaysShowSign={false}
              withPlaceholder
              showCode
            />
          </Text>
        </Flex>
        <Flex flexDirection="row" alignItems="center" justifyContent="center" columnGap={2} mb={8}>
          <ValidatorImage isLedger={false} name={validatorName} size={32} />
          <Text numberOfLines={1} fontWeight="semiBold" fontSize={14}>
            {validatorName}
          </Text>
        </Flex>
        <Alert type="info" title={<Trans i18nKey="evm.withdraw.flow.steps.withdraw.warning" />} />
      </View>
      <View style={styles.footer}>
        {error ? (
          <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
            <TranslatedError error={error} />
          </Text>
        ) : null}
        <Button
          event="EvmWithdrawContinue"
          type="primary"
          title={<Trans i18nKey="evm.withdraw.flow.steps.withdraw.cta" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
        />
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
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});

export default Withdraw;

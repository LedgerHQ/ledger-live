/* eslint-disable @typescript-eslint/consistent-type-assertions */
import invariant from "invariant";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text } from "@ledgerhq/native-ui";
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
import type { EvmClaimRewardsFlowParamList } from "./types";

type Props = StackNavigatorProps<EvmClaimRewardsFlowParamList, ScreenName.EvmClaimRewardsClaim>;

function ClaimRewardsClaim({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  invariant(account.type === "Account", "account must be of type Account");

  const { validator, value } = route.params;
  const unit = useAccountUnit(account);
  const bridge = useAccountBridge<GenericTransaction>(account);

  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(bridge, () => {
    const base = bridge.updateTransaction(bridge.createTransaction(account), {
      recipient: account.freshAddress,
    });
    const claimTx = bridge.updateTransaction(base, {
      mode: "claimReward",
      valAddress: validator.validatorAddress,
      amount: value,
    });
    return { account, parentAccount: undefined, transaction: claimTx as unknown as Transaction };
  });

  invariant(transaction, "transaction required");

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.EvmClaimRewardsSelectDevice, {
      ...route.params,
      transaction: transaction as unknown as Transaction,
      status: status as TransactionStatus,
    });
  }, [navigation, route.params, transaction, status]);

  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0] ?? status.warnings.claimRewardsFee;

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen
        category="EvmClaimRewards"
        name="Claim"
        flow="stake"
        action="claim_rewards"
        currency={account.currency.ticker}
      />
      <View style={styles.body}>
        <Flex mb={32}>
          <Text fontWeight="semiBold" textAlign="center" color="smoke" mb={3}>
            <Trans i18nKey="evm.claimRewards.flow.steps.claim.youEarned" />
          </Text>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            fontSize={24}
            textAlign="center"
            mb={3}
            adjustsFontSizeToFit
          >
            <CurrencyUnitValue showCode unit={unit} value={value} />
          </Text>
          <Text textAlign="center" color="smoke">
            <CounterValue
              currency={account.currency}
              value={value}
              alwaysShowSign={false}
              withPlaceholder
              showCode
            />
          </Text>
        </Flex>
        <Text fontWeight="semiBold" textAlign="center" color="smoke" mb={2}>
          <Trans i18nKey="evm.claimRewards.flow.steps.claim.byDelegationAssetsTo" />
        </Text>
        <Flex flexDirection="row" alignItems="center" justifyContent="center" columnGap={2} mb={8}>
          <ValidatorImage isLedger={false} name={validator.name} size={32} />
          <Text numberOfLines={1} fontWeight="semiBold" fontSize={14}>
            {validator.name}
          </Text>
        </Flex>
        <Text fontWeight="semiBold" textAlign="center">
          <Trans i18nKey="evm.claimRewards.flow.steps.claim.description" />
        </Text>
      </View>
      <View style={styles.footer}>
        {error ? (
          <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
            <TranslatedError error={error} />
          </Text>
        ) : null}
        <Button
          event="EvmClaimRewardsClaimContinue"
          type="primary"
          title={<Trans i18nKey="evm.claimRewards.flow.steps.claim.cta" />}
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

export default ClaimRewardsClaim;

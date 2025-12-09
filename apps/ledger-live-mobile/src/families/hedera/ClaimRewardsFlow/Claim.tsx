import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { AccountBridge } from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { Transaction } from "@ledgerhq/live-common/families/hedera/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { useAccountUnit } from "~/hooks";
import type { HederaClaimRewardsFlowParamList } from "./types";
import ValidatorIcon from "~/families/hedera/shared/ValidatorIcon";
import CounterValue from "~/components/CounterValue";
import { useAccountScreen } from "~/hooks/useAccountScreen";

type Props = StackNavigatorProps<
  HederaClaimRewardsFlowParamList,
  ScreenName.HederaClaimRewardsClaim
>;

function ClaimRewardsClaim({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const { selectedDelegation } = route.params;
  const unit = useAccountUnit(account);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
    });

    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "hedera", "transaction hedera");

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.HederaClaimRewardsSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [transaction, status, route.params, navigation]);

  const hasErrors = Object.keys(status.errors).length > 0;
  const error = Object.values(status.errors)[0] ?? status.warnings.claimRewardsFee;

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen
        category="ClaimRewardsFlow"
        name="Claim"
        flow="stake"
        action={HEDERA_TRANSACTION_MODES.ClaimRewards}
        currency="hedera"
      />
      <View style={styles.body}>
        <View style={styles.amount}>
          <View>
            <Flex mb={32}>
              <Text fontWeight="semiBold" textAlign="center" color="smoke" mb={3}>
                <Trans i18nKey="hedera.claimRewards.steps.claim.earned" />
              </Text>
              <Text
                fontWeight="semiBold"
                numberOfLines={1}
                fontSize={24}
                textAlign="center"
                mb={3}
                adjustsFontSizeToFit
              >
                <CurrencyUnitValue showCode unit={unit} value={selectedDelegation.pendingReward} />
              </Text>
              <Text textAlign="center" color="smoke">
                <CounterValue
                  currency={account.currency}
                  value={selectedDelegation.pendingReward}
                  alwaysShowSign={false}
                  withPlaceholder
                  showCode
                />
              </Text>
            </Flex>
            <Text fontWeight="semiBold" textAlign="center" color="smoke" mb={2}>
              <Trans i18nKey="hedera.claimRewards.steps.claim.delegatingTo" />
            </Text>
            <Flex
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              columnGap={2}
              mb={8}
            >
              <ValidatorIcon size={32} validator={selectedDelegation.validator} />
              <Text numberOfLines={1} fontWeight="semiBold" fontSize={14}>
                {selectedDelegation.validator.name}
              </Text>
            </Flex>
            <Text fontWeight="semiBold" textAlign="center" mb={4}>
              <Trans i18nKey="hedera.claimRewards.steps.claim.description" />
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        {error && (
          <Text color="alert" fontWeight="semiBold" textAlign="center" mb={6}>
            <TranslatedError error={error} />
          </Text>
        )}
        <Button
          event="ClaimContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
          testID="hedera-claim-continue-button"
        />
      </View>
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
  },
  amount: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});

export default ClaimRewardsClaim;

import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import noop from "lodash/noop";
import invariant from "invariant";
import { useTheme } from "styled-components/native";
import { Button, Text } from "@ledgerhq/native-ui";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  getClaimableStakingBalance,
  isAleoAccount,
} from "@ledgerhq/live-common/families/aleo/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { TrackScreen } from "~/analytics";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import TranslatedError from "~/components/TranslatedError";
import Alert from "~/components/Alert";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AleoClaimUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoClaimUnbondFlowParamList, ScreenName.AleoClaimUnbondAmount>
>;

export default function Amount({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const mainAccount = getMainAccount(account, parentAccount ?? null);
  const unit = useAccountUnit(account);
  const claimable = getClaimableStakingBalance(account);

  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);

  const { transaction, status, bridgePending, bridgeError } = useBridgeTransaction(bridge, () => {
    const created = bridge.createTransaction(mainAccount);
    // The program only accepts the signing account as its own staker.
    const prepared = bridge.updateTransaction(created, {
      mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
      recipient: mainAccount.freshAddress,
    });

    return {
      account,
      parentAccount: parentAccount ?? undefined,
      transaction: prepared,
    };
  });

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.AleoClaimUnbondSelectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      // The screen renders nothing until the bridge transaction exists, so it is set here.
      transaction: transaction as AleoTransaction,
      status,
      source: route.params.source,
    });
  }, [navigation, route.params, status, transaction]);

  if (!transaction) return null;

  const error = bridgePending
    ? null
    : (status.errors.amount ?? getFirstStatusError(status, "errors"));
  const warning = getFirstStatusError(status, "warnings");
  const continueDisabled = bridgePending || !!bridgeError || Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="ClaimUnbondFlow"
        name="Amount"
        flow="claim"
        action="claiming"
        currency="aleo"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.alert}>
          <Alert type="hint" testID="aleo-claim-info-banner">
            <Trans i18nKey="aleo.claim.amount.info" />
          </Alert>
        </View>
        <Text variant="small" color="neutral.c70" mb={3}>
          <Trans i18nKey="aleo.claim.amount.claimableLabel" />
        </Text>
        <View style={styles.amountInputHeightGuard} pointerEvents="none">
          <AmountInput
            account={account}
            value={claimable}
            onChange={noop}
            editable={false}
            error={error}
            warning={warning}
            testID="aleo-claim-amount-input"
          />
        </View>
        <View style={styles.spacer} />
        <View style={[styles.details, { borderTopColor: colors.neutral.c30 }]}>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="send.summary.fees" />
            </Text>
            <Text
              variant="small"
              fontWeight="semiBold"
              color="neutral.c100"
              testID="aleo-claim-fees-value"
            >
              {bridgePending ? (
                "-"
              ) : (
                <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {bridgeError && (
          <Text variant="small" color="error.c60" textAlign="center" mb={3}>
            <TranslatedError error={bridgeError} />
          </Text>
        )}
        <Button
          type="main"
          size="large"
          onPress={onContinue}
          disabled={continueDisabled}
          pending={bridgePending}
          testID="aleo-claim-amount-continue"
        >
          {t("common.continue")}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  alert: {
    marginBottom: 16,
  },
  amountInputHeightGuard: {
    flexShrink: 1,
    minHeight: 160,
  },
  spacer: {
    flexGrow: 1,
  },
  details: {
    marginVertical: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
});

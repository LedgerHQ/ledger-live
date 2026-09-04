import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { MIN_NEURON_STAKE } from "@ledgerhq/live-common/families/internet_computer/consts";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useEffect, useState } from "react";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import AmountInput from "~/screens/SendFunds/AmountInput";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { toBigNumber } from "../amounts";
import ActionFooter from "../components/ActionFooter";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerStakingFlowParamList,
  ScreenName.InternetComputerStakingAmount
>;

/**
 * How much to lock into the new neuron. There is no recipient step: prepareTransaction derives the
 * neuron's governance subaccount, and the nonce it stores there doubles as the transfer memo.
 */
export default function StakingAmount({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const unit = useAccountUnit(icpAccount);
  const bridge = useAccountBridge<Transaction>(icpAccount);
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);

  const { transaction, updateTransaction, status, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => ({
      account: icpAccount,
      transaction: route.params.transaction,
    }));

  useEffect(() => {
    if (!transaction) return;
    let cancelled = false;
    bridge
      .estimateMaxSpendable({ account: icpAccount, transaction })
      .then(estimate => {
        if (!cancelled) setMaxSpendable(estimate);
      })
      // The figure is a hint beside the input and the bridge validates the amount regardless, so a
      // failed estimate just leaves the hint unrendered rather than faulting the screen.
      .catch((error: Error) => console.warn("[ICP] max spendable estimate failed", error));
    return () => {
      cancelled = true;
    };
  }, [bridge, icpAccount, transaction]);

  const onChange = useCallback(
    (amount: BigNumber) => updateTransaction(tx => ({ ...tx, amount })),
    [updateTransaction],
  );

  const onContinue = useCallback(
    () =>
      navigation.navigate(ScreenName.InternetComputerStakingSelectDevice, {
        ...route.params,
        accountId: icpAccount.id,
        transaction: transaction as Transaction,
        status,
      }),
    [icpAccount.id, navigation, route.params, status, transaction],
  );

  const amount = transaction?.amount ?? new BigNumber(0);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Staking ICP Flow"
        name="Amount"
        flow="stake"
        action="create_neuron"
        currency={icpAccount.currency.id}
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <AmountInput
            account={icpAccount}
            onChange={onChange}
            value={amount}
            error={amount.gt(0) ? status.errors.amount : null}
            warning={status.warnings.amount}
            testID="icp-staking-amount-input"
          />
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="small" color="neutral.c70">
              {t("internetComputer.stakingFlow.amount.minimum")}
            </Text>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70">
              <CurrencyUnitValue
                disableRounding
                showCode
                unit={unit}
                value={toBigNumber(BigInt(MIN_NEURON_STAKE))}
              />
            </Text>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="small" color="neutral.c70">
              {t("send.amount.available")}
            </Text>
            {maxSpendable ? (
              <Text variant="small" fontWeight="semiBold" color="neutral.c70">
                {/* Unrounded, like every bound in these flows: at six significant digits a max of
                    12.34567891 ICP displays as 12.3457, and typing back the figure shown is then
                    rejected for exceeding the balance. */}
                <CurrencyUnitValue disableRounding showCode unit={unit} value={maxSpendable} />
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={onContinue}
        canContinue={amount.gt(0)}
        pristineField={amount.eq(0) ? "amount" : undefined}
      />
    </SafeAreaView>
  );
}

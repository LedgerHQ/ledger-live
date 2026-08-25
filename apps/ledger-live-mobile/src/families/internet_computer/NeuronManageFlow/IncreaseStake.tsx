import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import React, { useCallback, useEffect, useState } from "react";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import AmountInput from "~/screens/SendFunds/AmountInput";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import ActionFooter from "../components/ActionFooter";
import { useNeuronAction } from "./useNeuronAction";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronIncreaseStake
>;

/**
 * Tops up an existing neuron. This is a ledger transfer, not a governance call, so it needs an
 * amount — but unlike a send there is no recipient to pick: prepareTransaction derives the neuron's
 * own governance subaccount. That is why it lives here rather than entering the send flow.
 */
export default function IncreaseStake({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, transaction, updateTransaction, status, bridgePending, continueToDevice } =
    useNeuronAction(navigation, route);
  const unit = useAccountUnit(account);
  const bridge = useAccountBridge<Transaction>(account);
  const [maxSpendable, setMaxSpendable] = useState<BigNumber | null>(null);

  useEffect(() => {
    if (!transaction) return;
    let cancelled = false;
    bridge.estimateMaxSpendable({ account, transaction }).then(estimate => {
      if (!cancelled) setMaxSpendable(estimate);
    });
    return () => {
      cancelled = true;
    };
  }, [account, bridge, transaction]);

  const onChange = useCallback(
    (amount: BigNumber) => updateTransaction(tx => ({ ...tx, amount })),
    [updateTransaction],
  );

  const amount = transaction?.amount ?? new BigNumber(0);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="IncreaseStake"
        flow="stake"
        action="increase_stake"
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <Text variant="body" color="neutral.c70">
            {t("internetComputer.manageNeuronFlow.increaseStake.description")}
          </Text>
          <AmountInput
            account={account}
            onChange={onChange}
            value={amount}
            error={amount.gt(0) ? status.errors.amount : null}
            warning={status.warnings.amount}
            testID="icp-increase-stake-amount-input"
          />
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="small" color="neutral.c70">
              {t("send.amount.available")}
            </Text>
            {maxSpendable ? (
              <Text variant="small" fontWeight="semiBold" color="neutral.c70">
                <CurrencyUnitValue disableRounding showCode unit={unit} value={maxSpendable} />
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        canContinue={amount.gt(0)}
        pristineField={amount.eq(0) ? "amount" : undefined}
      />
    </SafeAreaView>
  );
}

import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { Unit } from "@domain/entity-currency-unit";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { makeChangeTrustTransaction } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenSettings>
>;

// AmountInput groups thousands with spaces, which parseCurrencyUnit reads as NaN
function parseLimit(unit: Unit, text: string) {
  return parseCurrencyUnit(unit, text.replaceAll(" ", ""));
}

export function useSettingsViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { token } = route.params;

  const bridge = useAccountBridge<Transaction>(account);
  const { transaction, updateTransaction, status, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => ({
      account,
      transaction: makeChangeTrustTransaction(bridge, account, token, new BigNumber(0), true),
    }));

  const [isMaximum, setIsMaximum] = useState(false);
  const [limitText, setLimitText] = useState("");
  const [isMaxLimitInfoOpen, setIsMaxLimitInfoOpen] = useState(false);

  const updateLimit = useCallback(
    (limit: BigNumber) => updateTransaction(tx => bridge.updateTransaction(tx, { amount: limit })),
    [bridge, updateTransaction],
  );

  const unit = token.units[0];

  const onChangeUseMax = useCallback(
    (useMax: boolean) => {
      setIsMaximum(useMax);
      if (useMax) {
        updateLimit(MAX_TRUST_LIMIT);
        return;
      }

      updateLimit(parseLimit(unit, limitText));
    },
    [limitText, unit, updateLimit],
  );

  const isRippling = transaction?.noRipple === false;

  const onChangeRippling = useCallback(
    (isChecked: boolean) => {
      updateTransaction(tx => bridge.updateTransaction(tx, { noRipple: !isChecked }));
    },
    [bridge, updateTransaction],
  );

  const onChangeLimitText = useCallback(
    (text: string) => {
      setLimitText(text);
      updateLimit(parseLimit(unit, text));
    },
    [unit, updateLimit],
  );

  const onContinue = useCallback(() => {
    if (!transaction) return;

    navigation.navigate(ScreenName.XrpAddTokenReview, {
      token,
      accountId: account.id,
      settings: { limit: transaction.amount, isMaximum, isRippling },
    });
  }, [account.id, isMaximum, isRippling, navigation, token, transaction]);

  const hasLimitZero = Object.values(status.errors).some(e => e.name === "XrpTrustLimitZero");

  return {
    token,
    maxLimit: MAX_TRUST_LIMIT,
    isMaximum,
    limitText: isMaximum ? MAX_TRUST_LIMIT.shiftedBy(-unit.magnitude).toFixed() : limitText,
    isRippling,
    onChangeUseMax,
    onChangeLimitText,
    onContinue,
    onChangeRippling,
    isMaxLimitInfoOpen,
    onOpenMaxLimitInfo: () => setIsMaxLimitInfoOpen(true),
    onCloseMaxLimitInfo: () => setIsMaxLimitInfoOpen(false),
    isLimitErrorVisible: hasLimitZero && limitText !== "",
    isContinueDisabled: bridgePending || hasLimitZero,
    isContinueLoading: bridgePending,
  };
}

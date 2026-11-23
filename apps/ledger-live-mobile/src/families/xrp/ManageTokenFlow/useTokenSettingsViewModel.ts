import { useCallback, useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { makeChangeTrustTransaction } from "../utils";
import { useSignTokenEdit } from "./useSignTokenEdit";
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>;

const ZERO_LIMIT = new BigNumber(0);

export function useTokenSettingsViewModel() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { account: tokenAccount, parentAccount } = useAccountScreen(route);
  invariant(tokenAccount?.type === "TokenAccount" && parentAccount, "xrp: token account required");

  const { token } = tokenAccount;
  const unit = token.units[0];

  const xrpTokenAccount = tokenAccount as XrpTokenAccount;
  const { xrpResources } = xrpTokenAccount;
  // Undefined when the limit is unknown: that is not a limit of 0
  const storedLimit = xrpResources?.limit;
  const storedIsRippling = xrpResources?.isRippling ?? false;

  const bridge = useAccountBridge<Transaction>(parentAccount);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account: parentAccount,
      transaction: makeChangeTrustTransaction(
        bridge,
        parentAccount,
        token,
        storedLimit ?? ZERO_LIMIT,
        !storedIsRippling,
      ),
    };
  });
  const { transaction, updateAccount, updateTransaction, status, bridgePending, bridgeError } =
    bridgeTransaction;
  const bridgeAccount = bridgeTransaction.account;

  useEffect(() => {
    if (bridgeAccount === parentAccount) return;

    updateAccount(parentAccount);
    updateTransaction(tx => ({ ...tx }));
  }, [bridgeAccount, parentAccount, updateAccount, updateTransaction]);

  const confirmedBalanceLimit = route.params.balanceLimit;
  useEffect(() => {
    if (!confirmedBalanceLimit) return;

    updateTransaction(tx =>
      bridge.updateTransaction(tx, { amount: new BigNumber(confirmedBalanceLimit.limit) }),
    );
  }, [bridge, confirmedBalanceLimit, updateTransaction]);

  const limit = transaction?.amount ?? storedLimit ?? ZERO_LIMIT;
  const isMaximum = isMaxTrustLimit(limit);
  const isRippling = transaction?.noRipple === false;
  const [isRipplingSheetOpen, setIsRipplingSheetOpen] = useState(false);

  const onEditLimit = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenBalanceLimit, {
      balanceLimit: { limit: limit.toFixed(), isMaximum },
      accountId: tokenAccount.id,
      parentId: parentAccount.id,
    });
  }, [isMaximum, limit, navigation, parentAccount.id, tokenAccount.id]);

  const onChangeRippling = useCallback(
    (value: boolean) => {
      updateTransaction(tx => bridge.updateTransaction(tx, { noRipple: !value }));
      setIsRipplingSheetOpen(false);
    },
    [bridge, updateTransaction],
  );

  const onOpenRipplingSheet = useCallback(() => setIsRipplingSheetOpen(true), []);
  const onCloseRipplingSheet = useCallback(() => setIsRipplingSheetOpen(false), []);

  const signTokenEdit = useSignTokenEdit({
    navigation,
    parentAccount,
    tokenAccount: xrpTokenAccount,
    transaction,
  });

  const hasChanged = !limit.eq(storedLimit ?? ZERO_LIMIT) || isRippling !== storedIsRippling;

  const statusErrors = Object.values(status.errors);
  // Before any edit the bridge judges the stored trust line, which is not the user's doing.
  // While it is pending, the status still describes the previous transaction.
  const shownStatusErrors = hasChanged && !bridgePending ? statusErrors : [];
  const isSignFlowRunning = signTokenEdit.isSigning || signTokenEdit.isBroadcasting;

  return {
    accountId: parentAccount.id,
    isRippling,
    isRipplingSheetOpen,
    onEditLimit,
    onChangeRippling,
    onOpenRipplingSheet,
    onCloseRipplingSheet,
    signTokenEdit,
    errors: [...(bridgeError ? [bridgeError] : []), ...shownStatusErrors],
    ripplingText: t(isRippling ? "xrp.rippling.activated" : "xrp.rippling.deactivated"),
    isCurrentLimitZero: !!storedLimit?.isZero(),
    isContinueDisabled:
      !hasChanged || bridgePending || statusErrors.length > 0 || isSignFlowRunning,
    isContinueLoading: bridgePending || signTokenEdit.isBroadcasting,
    limitText: isMaximum
      ? t("xrp.tokenSettings.maximum")
      : formatCurrencyUnit(unit, limit, { showCode: true, locale }),
  };
}

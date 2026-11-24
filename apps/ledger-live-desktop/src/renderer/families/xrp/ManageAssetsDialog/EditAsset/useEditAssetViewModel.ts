import BigNumber from "bignumber.js";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  makeChangeTrustTransaction,
  toTrustLineFields,
} from "@ledgerhq/live-common/families/xrp/tokens";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import { useSignatureSteps } from "../../components/Signature/useSignatureSteps";
import { useTrustSettings } from "../../components/TrustSettings/useTrustSettings";

export function useEditAssetViewModel(account: Account, tokenAccount: XrpTokenAccount) {
  const currentLimit = tokenAccount.xrpResources?.limit ?? new BigNumber(0);
  const isCurrentlyRippling = Boolean(tokenAccount.xrpResources?.isRippling);

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account,
      parentAccount: undefined,
      transaction: makeChangeTrustTransaction(bridge, account, toTrustLineFields(tokenAccount)),
    };
  });
  const { transaction, updateTransaction, status, bridgePending, bridgeError } = bridgeTransaction;

  const signature = useSignatureSteps(account, transaction, status);
  const trustSettings = useTrustSettings({
    bridge,
    transaction,
    updateTransaction,
    status,
    bridgePending,
    unit: tokenAccount.token.units[0],
    balance: tokenAccount.balance,
  });

  const isLimitChanged = !trustSettings.limit.eq(currentLimit);
  const isRipplingChanged = trustSettings.isRippling !== isCurrentlyRippling;
  const isChanged = isLimitChanged || isRipplingChanged;
  const isStatusShown = isChanged && !bridgePending;
  const statusError = isStatusShown ? Object.values(status.errors)[0] : undefined;
  const error = bridgeError ?? statusError;

  return {
    signature,
    trustSettings,
    error,
    isCurrentLimitZero: currentLimit.isZero(),
    isContinueDisabled: !isChanged || Boolean(error) || bridgePending,
  };
}

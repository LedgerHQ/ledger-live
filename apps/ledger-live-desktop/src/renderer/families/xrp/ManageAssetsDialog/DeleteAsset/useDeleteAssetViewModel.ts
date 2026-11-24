import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import { buildSwapNavigationState } from "LLD/features/Market/utils/swapNavigation";
import { useSignatureSteps } from "../../components/Signature/useSignatureSteps";
import { makeOptOutTransaction } from "../../utils";

function getFeeMinimum(error: Error | undefined): string | undefined {
  if (error?.name !== "NotEnoughSpendableBalance" || !("minimumAmount" in error)) return undefined;

  return typeof error.minimumAmount === "string" ? error.minimumAmount : undefined;
}

export function useDeleteAssetViewModel(
  account: Account,
  tokenAccount: XrpTokenAccount,
  onClose: () => void,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFeeErrorShown, setIsFeeErrorShown] = useState(false);

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account,
      parentAccount: undefined,
      transaction: makeOptOutTransaction(bridge, account, tokenAccount),
    };
  });
  const { transaction, status, bridgePending, bridgeError } = bridgeTransaction;

  const signature = useSignatureSteps(account, transaction, status);

  const feeMinimum = getFeeMinimum(status.errors.amount);
  const refusal = feeMinimum ? undefined : Object.values(status.errors)[0];
  const error = bridgeError ?? refusal;

  const onContinue = () => {
    if (feeMinimum) {
      setIsFeeErrorShown(true);
      return;
    }

    signature.onStart();
  };

  const onSwap = () => {
    navigate("/swap", {
      state: buildSwapNavigationState({
        account,
        defaultCurrency: account.currency,
        fromPath: location.pathname,
      }),
    });
    onClose();
  };

  return {
    signature,
    error,
    feeMinimum,
    bridgePending,
    onSwap,
    onContinue,
    isFeeErrorShown,
    isContinueDisabled: Boolean(error) || bridgePending,
  };
}

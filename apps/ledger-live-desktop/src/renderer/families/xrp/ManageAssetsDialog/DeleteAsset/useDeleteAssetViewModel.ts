import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { makeOptOutTransaction } from "../../AddTokenModal/Body";
import { useSignatureSteps } from "../Signature/useSignatureSteps";

export function useDeleteAssetViewModel(account: Account, tokenAccount: TokenAccount) {
  const bridge = useAccountBridge<Transaction>(account, undefined);
  const { transaction, status, bridgePending } = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account,
      parentAccount: undefined,
      transaction: makeOptOutTransaction(bridge, account, tokenAccount),
    };
  });

  const signature = useSignatureSteps(account, transaction, status);

  return {
    signature,
    bridgePending,
    hasBalanceLeft: tokenAccount.balance.gt(0),
  };
}

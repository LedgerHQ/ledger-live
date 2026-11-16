import BigNumber from "bignumber.js";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { makeChangeTrustTransaction } from "../../AddTokenModal/Body";
import { getXrpResources } from "../../utils";
import { useSignatureSteps } from "../../components/Signature/useSignatureSteps";
import { useTrustSettings } from "../../components/TrustSettings/useTrustSettings";

export function useEditAssetViewModel(account: Account, tokenAccount: TokenAccount) {
  const xrpResources = getXrpResources(tokenAccount);
  const currentLimit = xrpResources?.limit ?? new BigNumber(0);
  const isCurrentlyRippling = Boolean(xrpResources?.isRippling);

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const { transaction, updateTransaction, status, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      return {
        account,
        parentAccount: undefined,
        transaction: makeChangeTrustTransaction(bridge, account, tokenAccount),
      };
    });
  const signature = useSignatureSteps(account, transaction, status);
  const trustSettings = useTrustSettings({
    bridge,
    transaction,
    updateTransaction,
    status,
    currentLimit,
    unit: tokenAccount.token.units[0],
    balance: tokenAccount.balance,
  });

  const isLimitChanged = !trustSettings.limit.eq(currentLimit);
  const isRipplingChanged = trustSettings.isRippling !== isCurrentlyRippling;

  return {
    signature,
    trustSettings,
    bridgePending,
    isContinueDisabled: !(isLimitChanged || isRipplingChanged) || bridgePending,
  };
}

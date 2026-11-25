import BigNumber from "bignumber.js";
import { useLocation, useNavigate } from "react-router";
import { getAddressExplorer, getDefaultExplorerView } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import {
  getDefaultTrustLimit,
  getMinimumAmount,
  makeChangeTrustTransaction,
} from "@ledgerhq/live-common/families/xrp/tokens";
import type { Account } from "@ledgerhq/types-live";
import { buildSwapNavigationState } from "LLD/features/Market/utils/swapNavigation";
import { useSignatureSteps } from "../../components/Signature/useSignatureSteps";
import { useTrustSettings } from "../../components/TrustSettings/useTrustSettings";

const ZERO = new BigNumber(0);

export function useReviewAssetViewModel(
  account: Account,
  token: TokenCurrency,
  onClose: () => void,
) {
  const navigate = useNavigate();
  const location = useLocation();

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    const transaction = makeChangeTrustTransaction(bridge, account, {
      token,
      limit: getDefaultTrustLimit(token),
    });

    return { account, transaction, parentAccount: undefined };
  });

  const { transaction, updateTransaction, status, bridgePending, bridgeError } = bridgeTransaction;

  const signature = useSignatureSteps(account, transaction, status);
  const trustSettings = useTrustSettings({
    bridge,
    transaction,
    updateTransaction,
    status,
    bridgePending,
    unit: token.units[0],
    balance: ZERO,
  });
  const issuerFee = useGetIssuerFeeQuery(token, { refetchOnReconnect: true });

  const isIou = token.tokenType === "iou";
  const statusError = bridgePending ? undefined : Object.values(status.errors)[0];
  const error = bridgeError ?? statusError;
  const minimumAmount = getMinimumAmount(error);
  const isNotActivated = error?.name === "XrpAccountNotActivated";
  const isIssuerFeeLoaded = typeof issuerFee.data === "string";
  const isReady = !bridgePending && isIssuerFeeLoaded;

  const onSwap = () => {
    onClose();
    navigate("/swap", {
      state: buildSwapNavigationState({
        account,
        defaultCurrency: account.currency,
        fromPath: location.pathname,
      }),
    });
  };

  return {
    isIou,
    error,
    signature,
    trustSettings,
    issuerFee,
    minimumAmount,
    isNotActivated,
    onSwap,
    bridgePending,
    networkFee: status.estimatedFees,
    isContinueDisabled: !isReady || Boolean(error),
    explorerUrl: getAddressExplorer(
      getDefaultExplorerView(account.currency),
      token.contractAddress,
    ),
  };
}

export type ReviewAssetViewModel = ReturnType<typeof useReviewAssetViewModel>;

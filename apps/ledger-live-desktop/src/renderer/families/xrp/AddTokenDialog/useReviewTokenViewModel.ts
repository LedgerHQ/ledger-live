import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { makeChangeTrustTransaction, toAssetFields } from "../AddTokenModal/Body";
import { useSignatureSteps } from "../components/Signature/useSignatureSteps";
import { useTrustSettings } from "../components/TrustSettings/useTrustSettings";
import { formatIssuerFee, getLockedReserve } from "../utils";

export function useReviewTokenViewModel(account: Account, token: TokenCurrency) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const isIou = token.tokenType === "iou";

  const bridge = useAccountBridge<Transaction>(account, undefined);
  const { transaction, updateTransaction, status, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const addTransaction = bridge.updateTransaction(
        makeChangeTrustTransaction(bridge, account, undefined),
        { ...toAssetFields(token), amount: isIou ? MAX_TRUST_LIMIT : new BigNumber(0) },
      );

      return { account, parentAccount: undefined, transaction: addTransaction };
    });
  const signature = useSignatureSteps(account, transaction, status);
  const trustSettings = useTrustSettings({
    bridge,
    transaction,
    updateTransaction,
    status,
    unit: token.units[0],
    balance: new BigNumber(0),
  });

  const issuerFee = useGetIssuerFeeQuery(token);
  const getTransferFee = () => {
    if (issuerFee.isLoading) return undefined;
    if (typeof issuerFee.data !== "string") {
      return t("xrp.addToken.steps.review.issuerFeeUnavailable");
    }

    return t("xrp.addTokenDialog.transferFeeValue", {
      fee: formatIssuerFee(issuerFee.data, locale),
    });
  };

  return {
    isIou,
    signature,
    trustSettings,
    bridgePending,
    transferFee: getTransferFee(),
    networkFee: status.estimatedFees ?? new BigNumber(0),
    lockedAmount: getLockedReserve(status, account.currency.units[0]),
    shortAccountAddress: formatAddress(account.freshAddress),
    shortIssuer: formatAddress(token.contractAddress),
    isContinueDisabled: bridgePending || (isIou && trustSettings.hasLimitError),
  };
}

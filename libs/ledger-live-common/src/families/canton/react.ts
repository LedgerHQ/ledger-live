import { useCallback } from "react";
import { getCurrencyBridge } from "../../bridge";
import { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

export type UseCantonAcceptOrRejectOfferOptions = {
  currency: CryptoCurrency;
  account: Account;
  partyId: string;
};

export type TransferInstructionParams = {
  contractId: string;
  deviceId: string;
  reason?: string;
};

export type TransferInstructionType =
  | "accept-transfer-instruction"
  | "reject-transfer-instruction"
  | "withdraw-transfer-instruction";

export function useCantonAcceptOrRejectOffer({
  currency,
  account,
  partyId,
}: UseCantonAcceptOrRejectOfferOptions) {
  const cantonBridge = getCurrencyBridge(currency) as CantonCurrencyBridge;

  const transferInstruction = useCallback(
    (
      { contractId, deviceId, reason }: TransferInstructionParams,
      type: TransferInstructionType,
    ) => {
      return cantonBridge.transferInstruction(
        currency,
        deviceId,
        account,
        partyId,
        contractId,
        type,
        reason,
      );
    },
    [cantonBridge, currency, account, partyId],
  );

  return transferInstruction;
}

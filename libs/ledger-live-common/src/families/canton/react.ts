import { useCallback, useState, useEffect } from "react";
import { getCurrencyBridge } from "../../bridge";
import { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { createTransferInstruction } from "@ledgerhq/coin-canton/bridge/acceptOffer";
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
      const instruction = createTransferInstruction(type, contractId, reason);
      return cantonBridge.transferInstruction(currency, deviceId, account, partyId, instruction);
    },
    [cantonBridge, currency, account, partyId],
  );

  return transferInstruction;
}

export const getRemainingTime = (diff: number): string => {
  if (diff <= 0) {
    return "";
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let format = "";
  if (days > 0) format += `${days}d `;
  if (hours > 0) format += `${hours}h `;
  if (minutes > 0) format += `${minutes}m `;
  format += `${seconds}s`;

  return format.trim();
};

export const useTimeRemaining = (expiresAtMicros = 0, isExpired = false): string => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (expiresAtMicros <= 0 || isExpired) {
      setTimeRemaining("");
      return;
    }

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = expiresAtMicros / 1000;
      const diff = expiresAt - now;

      setTimeRemaining(getRemainingTime(diff));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAtMicros, isExpired]);

  return timeRemaining;
};

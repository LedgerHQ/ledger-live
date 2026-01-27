import { isCantonAccount } from "@ledgerhq/coin-canton";
import { createTransferInstruction } from "@ledgerhq/coin-canton/bridge/acceptOffer";
import { CantonAccount, CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { getParentAccount } from "@ledgerhq/coin-framework/account/helpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrencyBridge } from "../../bridge";

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

  const startIndex = days > 0 ? 0 : hours > 0 ? 1 : minutes > 0 ? 2 : 3;
  const units = [
    [days, "d"],
    [hours, "h"],
    [minutes, "m"],
    [seconds, "s"],
  ] as const;

  return units
    .slice(startIndex)
    .map(([value, suffix]) => `${value.toString().padStart(2, "0")}${suffix}`)
    .join(" ");
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

type TransferProposal = {
  sender: string;
  amount: string;
  expires_at_micros: number;
};

type CantonTokenAccountLike = AccountLike & {
  cantonResources?: { pendingTransferProposals?: TransferProposal[] };
};

const hasCantonResources = (
  account: AccountLike,
): account is CantonAccount | CantonTokenAccountLike => {
  if (account.type === "Account") {
    return isCantonAccount(account);
  }

  return "cantonResources" in account && !!account.cantonResources;
};

/**
 * Hook to calculate withdrawable balance from expired outgoing offers.
 * Withdrawable balance is the sum of amounts from offers the user sent that have expired.
 */
export const useWithdrawableBalance = (account: AccountLike, accounts: Account[]): BigNumber => {
  return useMemo(() => {
    if (!hasCantonResources(account)) return new BigNumber(0);

    const proposals = account.cantonResources?.pendingTransferProposals ?? [];

    // For token accounts, use parent account's xpub; for main accounts, use account's xpub
    const parentAccount = getParentAccount(account, accounts);
    const mainAccount = parentAccount ?? account;
    const accountXpub = "xpub" in mainAccount ? (mainAccount.xpub as string) ?? "" : "";
    const currentTime = Date.now();

    return proposals.reduce((sum, proposal) => {
      const isOutgoing = proposal.sender === accountXpub;
      const isExpired = currentTime > proposal.expires_at_micros / 1000;
      if (isOutgoing && isExpired) {
        return sum.plus(new BigNumber(proposal.amount));
      }
      return sum;
    }, new BigNumber(0));
  }, [account, accounts]);
};

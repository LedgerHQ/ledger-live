import { useCallback, useState, useEffect, useMemo } from "react";
import { getCurrencyBridge } from "../../bridge";
import { CantonCurrencyBridge, CantonAccount } from "@ledgerhq/coin-canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton";
import coinConfig from "@ledgerhq/coin-canton/config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import BigNumber from "bignumber.js";

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
  const transferInstruction = useCallback(
    async (
      { contractId, deviceId, reason }: TransferInstructionParams,
      type: TransferInstructionType,
    ) => {
      const cantonBridge = (await getCurrencyBridge(currency)) as CantonCurrencyBridge;
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
    [currency, account, partyId],
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
  instrument_id: string;
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
 *
 * The parent Canton account aggregates pending proposals across native + tokens,
 * so we filter to the displayed account's own instrument before summing — mixing
 * native and token amounts would produce a meaningless figure when rendered with
 * the parent's native unit.
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

    // Restrict to the instrument this account renders amounts in: native for the
    // parent Canton account, the token's instrument_id for a token sub-account.
    const isParent = account.type === "Account";
    const nativeInstrumentId = isParent
      ? coinConfig.getCoinConfig(mainAccount.currency.id).nativeInstrumentId
      : undefined;
    const matchesAccountInstrument = (instrumentId: string): boolean => {
      if (isParent) return instrumentId === nativeInstrumentId;
      // Token sub-account: its cantonResources is already filtered per-token at
      // sync time (see buildSubAccounts), so any proposal that landed here is
      // for the right instrument.
      return true;
    };

    return proposals.reduce((sum, proposal) => {
      const isOutgoing = proposal.sender === accountXpub;
      const isExpired = currentTime > proposal.expires_at_micros / 1000;
      if (isOutgoing && isExpired && matchesAccountInstrument(proposal.instrument_id)) {
        return sum.plus(new BigNumber(proposal.amount));
      }
      return sum;
    }, new BigNumber(0));
  }, [account, accounts]);
};

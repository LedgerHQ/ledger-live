import { useCallback, useState, useEffect, useMemo } from "react";
import { getCurrencyBridge } from "../../bridge";
import { CantonCurrencyBridge, CantonAccount } from "@ledgerhq/coin-canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton";
import { getCalTokensCached } from "@ledgerhq/coin-canton/network/gateway";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import { instrumentKey, nativeInstrumentMatcher, type InstrumentTokens } from "./proposalSorting";

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

export type TimeRemaining = {
  timeRemaining: string;
  isExpired: boolean;
};

const EXPIRED: TimeRemaining = { timeRemaining: "", isExpired: true };

const computeTimeRemaining = (expiresAtMicros: number, isExpired: boolean): TimeRemaining => {
  const diff = expiresAtMicros / 1000 - Date.now();
  if (isExpired || diff <= 0) return EXPIRED;
  return { timeRemaining: getRemainingTime(diff), isExpired: false };
};

/**
 * Live countdown to an offer's expiry. `isExpired` flips on the tick that crosses the deadline,
 * so a screen left open never keeps offering an action the gateway will refuse.
 * @param expiresAtMicros expiry as epoch microseconds; 0 (unknown) counts as expired, as on the gateway
 * @param isExpired expiry already known to the caller
 */
export const useTimeRemaining = (expiresAtMicros = 0, isExpired = false): TimeRemaining => {
  const [state, setState] = useState(() => computeTimeRemaining(expiresAtMicros, isExpired));

  useEffect(() => {
    const initial = computeTimeRemaining(expiresAtMicros, isExpired);
    setState(initial);
    if (initial.isExpired) return;

    const interval = setInterval(() => {
      const next = computeTimeRemaining(expiresAtMicros, isExpired);
      setState(next);
      if (next.isExpired) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAtMicros, isExpired]);

  return state;
};

type TransferProposal = {
  sender: string;
  amount: string;
  expires_at_micros: number;
  instrument_id: string;
  instrument_admin: string;
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

const NO_TOKENS: InstrumentTokens = new Map();

// Exact order: localeCompare ties canonically equal ids, making the key order-dependent.
const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : Number(a > b));

async function findOfferTokens(
  currencyId: string,
  instrumentIds: readonly string[],
): Promise<InstrumentTokens> {
  const wanted = new Set(instrumentIds);
  const calTokens = await getCalTokensCached(currencyId);
  const matches = [...calTokens].filter(([, tokenIdentifier]) => wanted.has(tokenIdentifier));
  const found = await Promise.all(
    matches.map(async ([tokenId, tokenIdentifier]) => ({
      tokenIdentifier,
      token: await getCryptoAssetsStore().findTokenById(tokenId),
    })),
  );
  const tokens = new Map<string, TokenCurrency>();
  for (const { tokenIdentifier, token } of found) {
    if (token?.contractAddress) {
      tokens.set(instrumentKey(tokenIdentifier, token.contractAddress), token);
    }
  }
  return tokens;
}

/**
 * The CAL tokens of a Canton account's offers, keyed by instrument id and admin, so an offer
 * resolves even when its token sub-account is missing. Empty while loading or when CAL fails.
 */
export const useCantonOfferTokens = (account: Account): InstrumentTokens => {
  const proposals = isCantonAccount(account)
    ? (account.cantonResources?.pendingTransferProposals ?? [])
    : [];
  const instrumentIds = [...new Set(proposals.map(p => p.instrument_id))].sort(byCodeUnit);
  const key = JSON.stringify([account.currency.id, instrumentIds]);
  const [loaded, setLoaded] = useState<{ key: string; tokens: InstrumentTokens } | null>(null);

  useEffect(() => {
    const [currencyId, ids]: [string, string[]] = JSON.parse(key);
    if (ids.length === 0) return;
    let isStale = false;
    const settle = (tokens: InstrumentTokens) => {
      if (!isStale) setLoaded({ key, tokens });
    };
    findOfferTokens(currencyId, ids).then(settle, () => settle(NO_TOKENS));
    return () => {
      isStale = true;
    };
  }, [key]);

  // A map loaded for other offers or another currency must not price these.
  return loaded?.key === key ? loaded.tokens : NO_TOKENS;
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
    const accountXpub = "xpub" in mainAccount ? ((mainAccount.xpub as string) ?? "") : "";
    const currentTime = Date.now();

    // Restrict to the instrument this account renders amounts in: native CC (id and DSO admin)
    // for the parent Canton account. A token sub-account's cantonResources is already
    // filtered per token at sync time (see buildSubAccounts).
    const matchesAccountInstrument =
      account.type === "Account" ? nativeInstrumentMatcher(account) : () => true;

    return proposals.reduce((sum, proposal) => {
      const isOutgoing = proposal.sender === accountXpub;
      const isExpired = currentTime > proposal.expires_at_micros / 1000;
      if (
        isOutgoing &&
        isExpired &&
        matchesAccountInstrument(proposal.instrument_id, proposal.instrument_admin)
      ) {
        return sum.plus(new BigNumber(proposal.amount));
      }
      return sum;
    }, new BigNumber(0));
  }, [account, accounts]);
};

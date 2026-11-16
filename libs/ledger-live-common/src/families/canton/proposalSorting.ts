import { isCantonAccount } from "@ledgerhq/coin-canton";
import type { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../config";

type ProposalInstrument = { instrument_id: string; instrument_admin: string };

export type ResolvedInstrument = {
  unit: Unit;
  /** Absent for an unknown instrument, which has no countervalue. */
  currency?: Account["currency"] | TokenAccount["token"];
  isUnknown: boolean;
};

/** CAL tokens keyed by {@link instrumentKey}. */
export type InstrumentTokens = ReadonlyMap<string, TokenCurrency>;

// The gateway encodes every instrument's amounts as integers with 38 decimals.
const GATEWAY_AMOUNT_MAGNITUDE = 38;

export const instrumentKey = (instrumentId: string, instrumentAdmin: string): string =>
  JSON.stringify([instrumentId, instrumentAdmin]);

// Bidi and invisible direction marks can reorder an issuer-chosen id on screen.
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
export const withoutBidiControls = (text: string): string => text.replace(BIDI_CONTROLS, "");

/**
 * Whether an instrument on the parent Canton account is native CC: the native instrument id,
 * issued by the DSO party sync stored on the account. Until sync stores it, nothing is native.
 */
export const nativeInstrumentMatcher = (
  parentAccount: Account,
): ((instrumentId: string, instrumentAdmin: string) => boolean) => {
  const nativeAdmin = isCantonAccount(parentAccount)
    ? parentAccount.cantonResources?.nativeInstrumentAdmin
    : undefined;
  if (!nativeAdmin) return () => false;
  const { nativeInstrumentId } = getCurrencyConfiguration<CantonCoinConfig>(
    parentAccount.currency.id,
  );
  return (instrumentId, instrumentAdmin) =>
    instrumentId === nativeInstrumentId && instrumentAdmin === nativeAdmin;
};

/**
 * Resolve a Canton proposal's instrument, by id and admin, to how it is shown: native CC, a CAL
 * token (from the sub-accounts' tokens and proposals, which sync matches by admin, else from
 * `calTokens`), or an unknown instrument, coded `unknownCode` since its issuer picks its id.
 */
export const buildInstrumentResolver = (
  parentAccount: Account,
  unknownCode: string,
  calTokens: InstrumentTokens = new Map(),
): ((instrumentId: string, instrumentAdmin: string) => ResolvedInstrument) => {
  const isNative = nativeInstrumentMatcher(parentAccount);
  const tokens = new Map<string, ResolvedInstrument>();
  for (const sub of parentAccount.subAccounts ?? []) {
    if (sub.type !== "TokenAccount") continue;
    const token: ResolvedInstrument = {
      unit: sub.token.units[0],
      currency: sub.token,
      isUnknown: false,
    };
    // The token's CAL metadata survives a restart; the sub-account's proposals come back only with sync.
    const tokenIdentifier = "tokenIdentifier" in sub.token ? sub.token.tokenIdentifier : undefined;
    if (typeof tokenIdentifier === "string" && tokenIdentifier && sub.token.contractAddress) {
      tokens.set(instrumentKey(tokenIdentifier, sub.token.contractAddress), token);
    }
    const subProposals =
      (sub as { cantonResources?: { pendingTransferProposals?: ProposalInstrument[] } })
        .cantonResources?.pendingTransferProposals ?? [];
    for (const p of subProposals) {
      tokens.set(instrumentKey(p.instrument_id, p.instrument_admin), token);
    }
  }
  return (instrumentId, instrumentAdmin) => {
    if (isNative(instrumentId, instrumentAdmin)) {
      const { currency } = parentAccount;
      return { unit: currency.units[0], currency, isUnknown: false };
    }
    const key = instrumentKey(instrumentId, instrumentAdmin);
    const subAccountToken = tokens.get(key);
    if (subAccountToken) return subAccountToken;
    const calToken = calTokens.get(key);
    if (calToken) {
      return { unit: calToken.units[0], currency: calToken, isUnknown: false };
    }
    return {
      unit: { name: instrumentId, code: unknownCode, magnitude: GATEWAY_AMOUNT_MAGNITUDE },
      isUnknown: true,
    };
  };
};

/**
 * Comparator for the pending-offers list: group offers of the same instrument and admin together
 * (alphabetical by instrumentId, then admin), and within one put the soonest-expiring on top.
 */
export const byTokenAndDate = <
  T extends { instrumentId: string; instrumentAdmin: string; expiresAtMicros: number },
>(
  a: T,
  b: T,
): number =>
  a.instrumentId.localeCompare(b.instrumentId) ||
  a.instrumentAdmin.localeCompare(b.instrumentAdmin) ||
  a.expiresAtMicros - b.expiresAtMicros;

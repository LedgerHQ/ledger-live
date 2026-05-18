import type BigNumber from "bignumber.js";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type TraderMode = "single" | "multi";

export type TraderAssetId = "BTC" | "ETH";

export type TraderOpKind = "IN" | "OUT" | "FEES";

export type TraderOpRow = {
  id: string;
  kind: TraderOpKind;
  /** Major units (e.g. "0.5" for 0.5 ETH). Parsed via `parseBn`. */
  amount: string;
  /** USD per major unit at the op's date. UI input — what the user typed. */
  priceUsd: string;
  /** ISO date (YYYY-MM-DD) — matches `<input type="date">` value. */
  date: string;
};

/** Editable fields of an op row (everything but the stable id). */
export type TraderOpInput = Omit<TraderOpRow, "id">;

/** UI-managed state for one editable trader account (single or multi mode). */
export type TraderAccountState = {
  id: string;
  assetId: TraderAssetId;
  /** Latest USD price used as the `latest` countervalue. UI input. */
  currentPriceUsd: string;
  rows: TraderOpRow[];
};

type AssetDescriptorBase = {
  id: TraderAssetId;
  ticker: string;
  /** Default `latest` price used when no rows define one yet (major fiat units). */
  defaultLatestPrice: string;
  /** Sane default amount for newly added rows (major asset units). */
  defaultAmount: string;
  /** Sane default price for newly added rows (major fiat units). */
  defaultPrice: string;
  /** 10^magnitude — atomic scale (SAT/WEI). */
  atomicScale: BigNumber;
};

export type AssetDescriptor =
  | (AssetDescriptorBase & { isToken: false; currency: CryptoCurrency })
  | (AssetDescriptorBase & { isToken: true; currency: TokenCurrency });

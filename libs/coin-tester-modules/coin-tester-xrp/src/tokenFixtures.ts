import BigNumber from "bignumber.js";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import { XRP } from "./fixtures";

/** coin-xrp scales every IOU amount by 1e38 */
const IOU_MAGNITUDE = 38;

export function toIouAmount(value: string): BigNumber {
  return new BigNumber(value).shiftedBy(IOU_MAGNITUDE);
}

/** The 40-hex form of a 3-character currency code, lowercase as in a CAL id: it sits at bytes 12–14 */
function toCurrencyHex(code: string): string {
  if (code.length !== 3) throw new Error(`only 3-character currency codes are supported: ${code}`);

  return "00".repeat(12) + Buffer.from(code, "ascii").toString("hex") + "00".repeat(5);
}

/** A CAL entry for an IOU. `code` is the currency as coin-xrp reports it: a 3-character code keeps its case. */
export function makeIouToken(code: string, issuer: string): TokenCurrency {
  return {
    id: TokenCurrencyIdSchema.parse(`${XRP.id}/iou/${toCurrencyHex(code)}:${issuer.toLowerCase()}`),
    type: "TokenCurrency",
    contractAddress: issuer,
    tokenIdentifier: code,
    parentCurrencyId: CryptoCurrencyIdSchema.parse(XRP.id),
    tokenType: "iou",
    name: code,
    ticker: code,
    delisted: false,
    disableCountervalue: true,
    units: [{ name: code, code, magnitude: IOU_MAGNITUDE }],
  };
}

/** A CAL entry for an MPT issuance. Its magnitude is the issuance's `AssetScale`. */
export function makeMptToken({
  issuanceId,
  issuer,
  ticker,
  assetScale,
}: {
  issuanceId: string;
  issuer: string;
  ticker: string;
  assetScale: number;
}): TokenCurrency {
  return {
    id: TokenCurrencyIdSchema.parse(
      `${XRP.id}/mpt/${issuanceId.toLowerCase()}:${issuer.toLowerCase()}`,
    ),
    type: "TokenCurrency",
    contractAddress: issuer,
    tokenIdentifier: issuanceId,
    parentCurrencyId: CryptoCurrencyIdSchema.parse(XRP.id),
    tokenType: "mpt",
    name: ticker,
    ticker,
    delisted: false,
    disableCountervalue: true,
    units: [{ name: ticker, code: ticker, magnitude: assetScale }],
  };
}

/**
 * Replaces the crypto-assets store with a stub that knows only `tokens`. A lookup returns a
 * token only when network, issuer and reference are equal to its own, case included.
 */
export function installTokenStore(tokens: TokenCurrency[]): void {
  setCryptoAssetsStore({
    findTokenByAddressInCurrency: async (address, currencyId, tokenIdentifier) => {
      return tokens.find(token => {
        if (token.parentCurrencyId !== currencyId) return false;
        if (token.contractAddress !== address) return false;

        return token.tokenIdentifier === tokenIdentifier;
      });
    },
    findTokenById: async (id: string) => tokens.find(token => token.id === id),
    getTokensSyncHash: async () => "",
  });
}

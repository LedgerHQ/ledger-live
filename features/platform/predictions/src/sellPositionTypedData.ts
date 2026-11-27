import { z } from "zod";
import type { PredictionsTypedData, TypedDataField } from "./typedData";
import {
  expiration,
  fieldsMatching,
  ORDER_DOMAIN_FIELDS,
  orderDomain,
  typedDataJson,
  uint256,
} from "./orderTypedData.internals";

// MoonPay's schema: https://docs.swaps.xyz/prediction-market-reference/polymarket-signing
const SELL_POSITION_FIELDS: readonly TypedDataField[] = [
  { name: "proxyWallet", type: "string" },
  { name: "tokenID", type: "string" },
  { name: "side", type: "string" },
  { name: "orderType", type: "string" },
  { name: "tickSize", type: "string" },
  { name: "negRisk", type: "bool" },
  { name: "amount", type: "uint256" },
  { name: "slippage", type: "uint256" },
  { name: "dstTokenAddress", type: "string" },
  { name: "dstTokenChainId", type: "string" },
  { name: "dstWalletAddress", type: "string" },
  { name: "expiration", type: "uint256" },
];

/**
 * Polymarket USD, Polymarket's collateral on Polygon: proceeds stay in the Predictions balance.
 * https://polygonscan.com/address/0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB
 */
const PUSD_ADDRESS = "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

const isSameAddress = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();

/**
 * Only MoonPay's sale authorization, with its proceeds sent in pUSD back to the trading wallet it
 * sells from, so the sale prompt can't send them anywhere else.
 */
const sellPositionTypedDataSchema = z.strictObject({
  domain: orderDomain("BoxPolymarketSellPosition"),
  types: z.strictObject({
    EIP712Domain: fieldsMatching(ORDER_DOMAIN_FIELDS),
    SellPosition: fieldsMatching(SELL_POSITION_FIELDS),
  }),
  primaryType: z.literal("SellPosition"),
  message: z
    .strictObject({
      proxyWallet: address,
      tokenID: z.string().regex(/^\d+$/),
      side: z.literal("SELL"),
      // The sheet only describes all-or-nothing sales: anything else would sign what it doesn't show.
      orderType: z.literal("FOK"),
      tickSize: z.string().min(1),
      negRisk: z.boolean(),
      // Shares, scaled to 6 decimals.
      amount: uint256.refine(value => BigInt(value) > 0n, { message: "Nothing to sell" }),
      slippage: uint256,
      dstTokenAddress: address.refine(value => isSameAddress(value, PUSD_ADDRESS), {
        message: "Proceeds must be paid in pUSD",
      }),
      dstTokenChainId: z.literal("137"),
      dstWalletAddress: address,
      expiration,
    })
    .refine(message => isSameAddress(message.dstWalletAddress, message.proxyWallet), {
      message: "Proceeds must go to the trading wallet",
    }),
}) satisfies z.ZodType<PredictionsTypedData, unknown>;

export const sellPositionTypedDataJsonSchema = typedDataJson.pipe(sellPositionTypedDataSchema);

/** Proceeds sent to the signing account itself would leave the Predictions balance. */
export function checkSaleSignedBy(typedData: PredictionsTypedData, signerAddress: string): void {
  sellPositionTypedDataSchema
    .refine(sale => !isSameAddress(sale.message.proxyWallet, signerAddress), {
      message: "Proceeds must stay in the trading wallet, not go to the account",
    })
    .parse(typedData);
}

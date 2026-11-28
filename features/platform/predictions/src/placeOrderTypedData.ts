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
const PLACE_ORDER_FIELDS: readonly TypedDataField[] = [
  { name: "tokenID", type: "string" },
  { name: "side", type: "string" },
  { name: "orderType", type: "string" },
  { name: "amount", type: "uint256" },
  { name: "tickSize", type: "string" },
  { name: "negRisk", type: "bool" },
  { name: "slippage", type: "uint256" },
  { name: "expiration", type: "uint256" },
];

/** Only MoonPay's order authorization, so the order prompt can't be used to sign anything else. */
const placeOrderTypedDataSchema = z.strictObject({
  domain: orderDomain("BoxPolymarketPlaceOrder"),
  types: z.strictObject({
    EIP712Domain: fieldsMatching(ORDER_DOMAIN_FIELDS),
    PlaceOrder: fieldsMatching(PLACE_ORDER_FIELDS),
  }),
  primaryType: z.literal("PlaceOrder"),
  message: z.strictObject({
    tokenID: z.string().regex(/^\d+$/),
    // The sheet only describes all-or-nothing buys: anything else would sign what it doesn't show.
    side: z.literal("BUY"),
    orderType: z.literal("FOK"),
    amount: uint256,
    tickSize: z.string().min(1),
    negRisk: z.boolean(),
    slippage: uint256,
    expiration,
  }),
}) satisfies z.ZodType<PredictionsTypedData, unknown>;

export const placeOrderTypedDataJsonSchema = typedDataJson.pipe(placeOrderTypedDataSchema);

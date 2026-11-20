import { z } from "zod";
import type { PredictionsTypedData, TypedDataField } from "./typedData";

const PLACE_ORDER_DOMAIN_FIELDS: readonly TypedDataField[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
];

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

const fieldsMatching = (expected: readonly TypedDataField[]) =>
  z
    .array(z.strictObject({ name: z.string(), type: z.string() }))
    .refine(
      fields =>
        fields.length === expected.length &&
        fields.every(
          (field, index) =>
            field.name === expected[index].name && field.type === expected[index].type,
        ),
      { message: "Unexpected EIP-712 fields" },
    );

const UINT256_LIMIT = 2n ** 256n;

// JSON has no bigint: the live app sends uint256 values as decimal strings.
const uint256 = z.union([
  z
    .string()
    .regex(/^\d+$/)
    // Piped, so BigInt only ever gets a decimal string: a refine would still run after the regex
    // failed, and BigInt would throw instead of the schema refusing the value.
    .pipe(
      z.string().refine(value => BigInt(value) < UINT256_LIMIT, {
        message: "Too large for a uint256",
      }),
    ),
  z.number().int().nonnegative(),
]);

/** MoonPay refuses an order signed more than this ahead of its expiration. */
const MAX_AUTHORIZATION_SECONDS = 300;

// The message has no nonce: the expiration is what keeps a signed order from being replayed later.
const expiration = uint256.refine(
  value => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = Number(value);
    return expiresAt > nowSeconds && expiresAt <= nowSeconds + MAX_AUTHORIZATION_SECONDS;
  },
  { message: `The order must expire within ${MAX_AUTHORIZATION_SECONDS} seconds` },
);

/**
 * Only the order authorization MoonPay executes, so the order prompt can't be used to sign anything
 * else: same domain, type and fields, in the same order.
 */
const placeOrderTypedDataSchema = z.strictObject({
  domain: z.strictObject({
    name: z.literal("BoxPolymarketPlaceOrder"),
    version: z.literal("1"),
    chainId: z.union([z.literal(137), z.literal("137")]).transform(() => 137),
  }),
  types: z.strictObject({
    EIP712Domain: fieldsMatching(PLACE_ORDER_DOMAIN_FIELDS),
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

/** The EIP-712 JSON string the live app sends, parsed and checked as a place order authorization. */
export const placeOrderTypedDataJsonSchema = z
  .string()
  .transform((json, context) => {
    try {
      return JSON.parse(json) as unknown;
    } catch {
      context.addIssue({ code: "custom", message: "The typed data isn't JSON" });
      return z.NEVER;
    }
  })
  .pipe(placeOrderTypedDataSchema);

/**
 * Whether the order already expired, e.g. on a retry minutes after the live app asked: MoonPay would
 * refuse its signature.
 */
export function isPlaceOrderExpired({ message }: PredictionsTypedData, nowMs: number): boolean {
  return Number(message.expiration) <= Math.floor(nowMs / 1000);
}

/** The USD amount the user pays, as signed: MoonPay's `amount` is scaled to 6 decimals. */
export function placeOrderAmountUsd({ message }: PredictionsTypedData): number {
  return Number(message.amount) / 1_000_000;
}

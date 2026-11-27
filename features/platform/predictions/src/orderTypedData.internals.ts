import { z } from "zod";
import type { PredictionsTypedData, TypedDataField } from "./typedData";

export const ORDER_DOMAIN_FIELDS: readonly TypedDataField[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
];

export const fieldsMatching = (expected: readonly TypedDataField[]) =>
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

export const orderDomain = (name: string) =>
  z.strictObject({
    name: z.literal(name),
    version: z.literal("1"),
    chainId: z.union([z.literal(137), z.literal("137")]).transform(() => 137),
  });

const UINT256_LIMIT = 2n ** 256n;

// JSON has no bigint: the live app sends uint256 values as decimal strings.
export const uint256 = z.union([
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
export const expiration = uint256.refine(
  value => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = Number(value);
    return expiresAt > nowSeconds && expiresAt <= nowSeconds + MAX_AUTHORIZATION_SECONDS;
  },
  { message: `The signature must expire within ${MAX_AUTHORIZATION_SECONDS} seconds` },
);

export const typedDataJson = z.string().transform((json, context) => {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    context.addIssue({ code: "custom", message: "The typed data isn't JSON" });
    return z.NEVER;
  }
});

export function isOrderExpired({ message }: PredictionsTypedData, nowMs: number): boolean {
  return Number(message.expiration) <= Math.floor(nowMs / 1000);
}

import { z } from "zod";

/**
 * The partner's signed attestation of the top-up. `payload` is what the device renders and
 * `signature` is what it checks against the partner key CAL endorsed, so neither is decoded here.
 */
export const ExchangeProviderSignatureSchema = z.object({
  payload: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * `sellId` names the fund order, not a sale — the transaction manager shares one response shape
 * across sell and fund.
 */
export const FundRemitResponseSchema = z.object({
  sellId: z.string().min(1),
  payinAddress: z.string().min(1),
  providerSig: ExchangeProviderSignatureSchema,
});

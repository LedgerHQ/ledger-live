import { z } from "zod";
import { ExchangeProviderSignatureSchema, FundRemitResponseSchema } from "./schema";

export type ExchangeProviderSignature = z.infer<typeof ExchangeProviderSignatureSchema>;

export type FundRemitResponse = z.infer<typeof FundRemitResponseSchema>;

export type FundRemitRequest = {
  /** Optional: the transaction manager accepts a remit without one. */
  readonly quoteId?: string;
  readonly provider: string;
  /** Ledger currency ids, as the user's account reports them. */
  readonly fromCurrency: string;
  readonly toCurrency: string;
  /** The user's own address on the funding account. */
  readonly refundAddress: string;
  readonly amountFrom: number;
  readonly amountTo: number;
  /** The `device_transaction_id` returned by `startExchange`, which binds the payload to this device. */
  readonly nonce: string;
};

export type FundOutcomeRequest = {
  readonly quoteId: string;
  readonly provider: string;
};

export type FundCancelRequest = FundOutcomeRequest & {
  readonly statusCode: string;
  readonly errorMessage: string;
};

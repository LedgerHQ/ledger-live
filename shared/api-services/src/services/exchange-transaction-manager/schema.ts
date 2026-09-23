import { z } from "zod";

export const ExchangeTransactionManagerApiExtraSchema = z.object({
  exchangeTransactionManagerApiBaseUrl: z.string().url(),
  ledgerClientVersion: z.string().min(1),
});

import type { z } from "zod";
import type { ExchangeTransactionManagerApiExtraSchema } from "./schema";

export type ExchangeTransactionManagerApiExtra = z.infer<
  typeof ExchangeTransactionManagerApiExtraSchema
>;

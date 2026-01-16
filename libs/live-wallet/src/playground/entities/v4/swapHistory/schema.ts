import { z } from "zod";

import { CryptoOrTokenCurrencySchema } from "../../external/currency/schema";
import { BigNumberSchema } from "../../external/bignumber/schema";

export const SwapOperationSchema = z.object({
  provider: z.string(),
  swapId: z.string(),
  status: z.string(),
  receiverAccountId: z.string(),
  tokenId: z.string().optional(),
  fromCurrency: CryptoOrTokenCurrencySchema.optional(),
  toCurrency: CryptoOrTokenCurrencySchema.optional(),
  operationId: z.string(),
  fromAmount: BigNumberSchema,
  toAmount: BigNumberSchema,
});

export const SwapHistoryByAccountSchema = z.record(z.string(), z.array(SwapOperationSchema));

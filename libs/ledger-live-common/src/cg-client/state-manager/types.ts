import { z } from "zod";

export enum GcDataTags {
  Coins = "Coins",
  CounterCurrencies = "CounterCurrencies",
}

// --- Zod Schemas ---

export const MarketCoinSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
});

export const SupportedCoinsSchema = z.array(MarketCoinSchema);

export const SupportedCounterCurrenciesSchema = z.array(z.string().min(1));

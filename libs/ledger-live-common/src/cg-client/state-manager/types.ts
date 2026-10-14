import { z } from "zod";

export enum GcDataTags {
  CounterCurrencies = "CounterCurrencies",
}

// --- Zod Schemas ---

export const SupportedCounterCurrenciesSchema = z.array(z.string().min(1));

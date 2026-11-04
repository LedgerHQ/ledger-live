import { z } from "zod";
import type { AnalyticsInitialSelection } from "../types";

const initialSelectionSchema = z.object({
  accountId: z.string().min(1),
  currencyId: z.string().min(1),
});

export function parseAnalyticsInitialSelection(
  value: unknown,
): AnalyticsInitialSelection | undefined {
  const result = initialSelectionSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

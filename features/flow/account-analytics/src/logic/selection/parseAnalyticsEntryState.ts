import { z } from "zod";
import type { AnalyticsInitialSelection } from "../../types";

const analyticsEntryStateSchema = z.object({
  accountAnalytics: z.object({
    metric: z.literal("balance"),
    accountId: z.string().min(1),
    currencyId: z.string().min(1),
  }),
});

export function parseAnalyticsEntryState(state: unknown): AnalyticsInitialSelection | undefined {
  const result = analyticsEntryStateSchema.safeParse(state);
  if (!result.success) return undefined;
  const { accountId, currencyId } = result.data.accountAnalytics;
  return { accountId, currencyId };
}

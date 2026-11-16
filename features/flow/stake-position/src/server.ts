import { customWrapper } from "@ledgerhq/wallet-api-server";
import { z } from "zod";
import type { StakePositionOpenParams, StakePositionResult } from "./types";

const walletApiValue = z.string().trim().min(1).max(128);

const openParamsSchema = z.object({
  accountId: walletApiValue,
  positionId: walletApiValue,
  validatorAddress: walletApiValue,
  rewards: z.unknown().optional(),
});

const BASE_UNITS = /^\d{1,30}$/;

/** Keeps `rewards` only as a whole number of base units: a display value never blocks the call. */
export function sanitizeRewards(rawRewards: unknown): string | undefined {
  if (typeof rawRewards !== "string") return undefined;
  const rewards = rawRewards.trim();
  return BASE_UNITS.test(rewards) ? rewards : undefined;
}

export type StakePositionUiHooks = Readonly<{
  "position.open": (params: StakePositionOpenParams) => Promise<StakePositionResult>;
}>;

export const handlers = ({ uiHooks }: { uiHooks: StakePositionUiHooks }) => ({
  "custom.stake.position.open": customWrapper<
    z.input<typeof openParamsSchema>,
    StakePositionResult
  >(async rawParams => {
    // A ZodError reaches the live app as INVALID_PARAMS.
    const { rewards, ...ids } = openParamsSchema.parse(rawParams);
    return uiHooks["position.open"]({ ...ids, rewards: sanitizeRewards(rewards) });
  }),
});

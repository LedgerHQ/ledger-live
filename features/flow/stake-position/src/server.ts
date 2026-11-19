import { customWrapper } from "@ledgerhq/wallet-api-server";
import { z } from "zod";
import type { StakePositionOpenParams, StakePositionOpenResult } from "./types";

const walletApiValue = z.string().trim().min(1).max(128);

// `z.object` drops the keys it does not know, so a caller still sending the former `rewards` or
// `validatorAddress` keeps working.
const openParamsSchema = z.object({
  accountId: walletApiValue,
  positionId: walletApiValue,
});

export type StakePositionUiHooks = Readonly<{
  "position.open": (params: StakePositionOpenParams) => Promise<StakePositionOpenResult>;
}>;

export const handlers = ({ uiHooks }: { uiHooks: StakePositionUiHooks }) => ({
  "custom.stake.position.open": customWrapper<
    z.input<typeof openParamsSchema>,
    StakePositionOpenResult
  >(async rawParams => {
    // A ZodError reaches the live app as INVALID_PARAMS.
    return uiHooks["position.open"](openParamsSchema.parse(rawParams));
  }),
});

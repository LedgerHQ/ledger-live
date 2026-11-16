import { AccountAssetStatusSchema } from "@domain/entity-account-status";
import type { MockReader } from "../families/types";
import { MockAssetStatusQueryError } from "../errors";

/** No asset of a mock account needs an activation. */
export const assetStatus: MockReader<"assetStatus"> = (_context, query) => {
  if (!query) throw new MockAssetStatusQueryError("assetStatus needs an assetId");
  return AccountAssetStatusSchema.parse({ assetId: query.assetId, status: { gate: null } });
};

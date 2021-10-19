import { AccountId } from "@hashgraph/sdk";
import type { HederaResourcesRaw, HederaResources } from "./types";

export function toHederaResourcesRaw(
  r: HederaResources
): HederaResourcesRaw {
  const { accountId } = r;
  return {
    accountId: accountId.toString(),
  };
}

export function fromHederaResourcesRaw(
  r: HederaResourcesRaw
): HederaResources {
  const { accountId } = r;
  return {
    accountId: AccountId.fromString(accountId),
  };
}

import type { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
import { AccountReceiveSchema, type AccountReceive } from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** Its on-chain address exists once onboarded and is not derived from a path: the device confirms it. */
export default function concordiumAccountReceive(account: ConcordiumAccount): AccountReceive {
  if (!account.concordiumResources.isOnboarded) return { status: "onboardingRequired" };
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    status: "ready",
    address: account.freshAddress,
    verification: path && { type: "addressConfirmation", path, address: account.freshAddress },
  });
}

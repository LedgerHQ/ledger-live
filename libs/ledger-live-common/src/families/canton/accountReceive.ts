import type { CantonAccount } from "@ledgerhq/coin-canton/types";
import { AccountReceiveSchema, type AccountReceive } from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** Receives on its party id, held in `xpub` once onboarded; the device shows the address of its key. */
export default function cantonAccountReceive(account: CantonAccount): AccountReceive {
  if (!account.cantonResources.isOnboarded || !account.xpub) {
    return { status: "onboardingRequired" };
  }
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    status: "ready",
    address: account.xpub,
    verification: path && { type: "address", path, address: account.freshAddress },
  });
}

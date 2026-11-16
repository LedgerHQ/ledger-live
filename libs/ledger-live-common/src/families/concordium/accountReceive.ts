import type { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
import {
  AccountReceiveSchema,
  ReceiveAddressUnknownError,
  type AccountReceive,
} from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** Its on-chain address exists once its credential is deployed; the device confirms it, not derives it. */
export default function concordiumAccountReceive(account: ConcordiumAccount): AccountReceive {
  if (!account.concordiumResources.isOnboarded) {
    throw new ReceiveAddressUnknownError(`${account.id} has no on-chain address yet`);
  }
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    address: account.freshAddress,
    verification: { type: "addressConfirmation", path, address: account.freshAddress },
  });
}

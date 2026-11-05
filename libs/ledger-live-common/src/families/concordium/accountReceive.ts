import type { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
import {
  AccountReceiveSchema,
  ReceiveAddressUnknownError,
  type AccountReceive,
} from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** `freshAddress` is the on-chain address once its credential is deployed, not derived from a path: the device confirms it. */
export default function concordiumAccountReceive(account: ConcordiumAccount): AccountReceive {
  if (!account.concordiumResources.isOnboarded) {
    throw new ReceiveAddressUnknownError(`${account.id} has no on-chain address yet`);
  }
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    address: account.freshAddress,
    verification: path && { type: "addressConfirmation", path, address: account.freshAddress },
  });
}

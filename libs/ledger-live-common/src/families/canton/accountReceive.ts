import type { CantonAccount } from "@ledgerhq/coin-canton/types";
import {
  AccountReceiveSchema,
  ReceiveAddressUnknownError,
  type AccountReceive,
} from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** Receives on its party id, held in `xpub` once allocated; the device shows the address of its key. */
export default function cantonAccountReceive(account: CantonAccount): AccountReceive {
  if (!account.xpub) throw new ReceiveAddressUnknownError(`${account.id} has no party id yet`);
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    address: account.xpub,
    verification: path && { type: "address", path, address: account.freshAddress },
  });
}

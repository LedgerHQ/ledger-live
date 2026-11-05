import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import { AccountReceiveSchema, type AccountReceive } from "@domain/entity-account-receive";
import { freshAddressDevicePath } from "../../account/accountReceive";

/** The device cannot derive the account id: it confirms the key, held in `seedIdentifier`. */
export default function hederaAccountReceive(account: HederaAccount): AccountReceive {
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    status: "ready",
    address: account.freshAddress,
    verification:
      path && account.seedIdentifier
        ? { type: "publicKey", path, publicKey: account.seedIdentifier }
        : undefined,
  });
}

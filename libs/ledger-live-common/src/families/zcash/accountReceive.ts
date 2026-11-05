import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import {
  AccountReceiveSchema,
  ReceivePathUnknownError,
  type AccountReceive,
} from "@domain/entity-account-receive";
import { defaultAccountReceive, freshAddressDevicePath } from "../../account/accountReceive";
import { isZcashShieldedEnabled } from "../../bridge/zcashRouting";

/** The ZIP-32 account path `m/32h/<coin>h/<account>h`, where the device derives the shielded address. */
function zip32AccountPath(account: ZcashAccount): string {
  const [, , coinType, accountIndex] = freshAddressDevicePath(account).split("/");
  if (!coinType || !accountIndex) {
    throw new ReceivePathUnknownError(`${account.id} has no ZIP-32 account path`);
  }
  return `m/32h/${coinType}/${accountIndex}`;
}

/** The transparent address, plus the shielded one once the shielded engine derived it. */
export default function zcashAccountReceive(account: ZcashAccount): AccountReceive {
  const shieldedAddress = account.privateInfo?.shieldedAddress;
  if (!isZcashShieldedEnabled() || !shieldedAddress) return defaultAccountReceive(account);
  return AccountReceiveSchema.parse({
    ...defaultAccountReceive(account),
    shielded: {
      address: shieldedAddress,
      verification: {
        type: "shieldedAddress",
        path: zip32AccountPath(account),
        address: shieldedAddress,
      },
    },
  });
}

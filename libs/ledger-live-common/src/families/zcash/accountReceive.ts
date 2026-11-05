import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { AccountReceiveSchema, type AccountReceive } from "@domain/entity-account-receive";
import { defaultAccountReceive, freshAddressDevicePath } from "../../account/accountReceive";
import { isZcashShieldedEnabled } from "../../bridge/zcashRouting";

/** The ZIP-32 account path `m/32h/<coin>h/<account>h`: the device derives the shielded address there, not at the leaf. */
function zip32AccountPath(account: ZcashAccount): string | undefined {
  const [, , coinType, accountIndex] = freshAddressDevicePath(account)?.split("/") ?? [];
  return coinType && accountIndex ? `m/32h/${coinType}/${accountIndex}` : undefined;
}

/** The transparent fresh address, and the shielded one while the shielded engine runs and derived it. */
export default function zcashAccountReceive(account: ZcashAccount): AccountReceive {
  const shieldedAddress = account.privateInfo?.shieldedAddress;
  if (!isZcashShieldedEnabled() || !shieldedAddress) return defaultAccountReceive(account);
  const path = zip32AccountPath(account);
  return AccountReceiveSchema.parse({
    ...defaultAccountReceive(account),
    shielded: {
      address: shieldedAddress,
      verification: path && { type: "address", path, address: shieldedAddress },
    },
  });
}

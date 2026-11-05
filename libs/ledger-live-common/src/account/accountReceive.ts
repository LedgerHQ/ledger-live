import type { Account } from "@ledgerhq/types-live";
import { DerivationPathSchema, type DerivationPath } from "@domain/entity-account-descriptor";
import { AccountReceiveSchema, type AccountReceive } from "@domain/entity-account-receive";
import { toDescriptorPath } from "./accountDescriptor";

/** The path the device is asked at, unless the account has none it can read. */
export function freshAddressDevicePath(
  account: Pick<Account, "freshAddressPath">,
): DerivationPath | undefined {
  if (!account.freshAddressPath) return undefined;
  const parsed = DerivationPathSchema.safeParse(toDescriptorPath(account.freshAddressPath));
  return parsed.success ? parsed.data : undefined;
}

/** Receives on `freshAddress`, which the device shows at `freshAddressPath`. */
export function defaultAccountReceive(account: Account): AccountReceive {
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    address: account.freshAddress,
    verification: path && { type: "address", path, address: account.freshAddress },
  });
}

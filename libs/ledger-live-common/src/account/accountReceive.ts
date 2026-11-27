import type { Account } from "@ledgerhq/types-live";
import {
  AccountReceiveSchema,
  ReceiveAddressUnknownError,
  ReceivePathUnknownError,
  type AccountReceive,
} from "@domain/entity-account-receive";
import { LegacyDerivationPathSchema, type DerivationPath } from "@domain/entity-derivation";
import { redactAccountId } from "./accountDescriptor";

/** The path the device is asked at: throws rather than leave the address unverified. */
export function freshAddressDevicePath(
  account: Pick<Account, "id" | "freshAddressPath">,
): DerivationPath {
  const parsed = LegacyDerivationPathSchema.safeParse(account.freshAddressPath);
  if (!account.freshAddressPath || !parsed.success) {
    throw new ReceivePathUnknownError(
      `${redactAccountId(account.id)} has no device path to verify it at`,
    );
  }
  return parsed.data;
}

/** Receives on `freshAddress`, which the device shows at `freshAddressPath`. */
export function defaultAccountReceive(account: Account): AccountReceive {
  if (!account.freshAddress) {
    throw new ReceiveAddressUnknownError(`${redactAccountId(account.id)} has no address`);
  }
  const path = freshAddressDevicePath(account);
  return AccountReceiveSchema.parse({
    address: account.freshAddress,
    verification: { type: "address", path, address: account.freshAddress },
  });
}

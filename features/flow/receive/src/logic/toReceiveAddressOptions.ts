import type { AccountReceive, ReceiveAddress } from "@domain/entity-account-receive";

/** `shielded`: the second address of a Zcash account, whose received funds stay private. */
export type ReceiveAddressOptionId = "transparent" | "shielded";

/** An address the account receives on, with its own verification and memo. */
export type ReceiveAddressOption = ReceiveAddress & Readonly<{ id: ReceiveAddressOptionId }>;

/** The addresses the user can receive on: the account's, then its shielded one when it has one. */
export function toReceiveAddressOptions({
  shielded,
  ...transparent
}: AccountReceive): readonly ReceiveAddressOption[] {
  const options: ReceiveAddressOption[] = [{ id: "transparent", ...transparent }];
  if (shielded) options.push({ id: "shielded", ...shielded });
  return options;
}

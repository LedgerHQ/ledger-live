import type { AccountReceive, ReceiveAddress } from "@domain/entity-account-receive";

export type ReceiveAddressOptionId = "transparent" | "shielded";

export type ReceiveAddressOption = ReceiveAddress & Readonly<{ id: ReceiveAddressOptionId }>;

export function toReceiveAddressOptions({
  shielded,
  ...transparent
}: AccountReceive): readonly ReceiveAddressOption[] {
  const options: ReceiveAddressOption[] = [{ id: "transparent", ...transparent }];
  if (shielded) options.push({ id: "shielded", ...shielded });
  return options;
}

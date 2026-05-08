import type { BitcoinAccount, BitcoinAccountRaw } from "../../types";

export type { ZcashPrivateInfo, ZcashPrivateInfoRaw } from "@ledgerhq/zcash-shielded/types";

export type ZcashAccount = BitcoinAccount & {
  privateInfo?: import("@ledgerhq/zcash-shielded/types").ZcashPrivateInfo;
};

export type ZcashAccountRaw = BitcoinAccountRaw & {
  privateInfo?: import("@ledgerhq/zcash-shielded/types").ZcashPrivateInfoRaw;
};

export function isZcashAccount(a: BitcoinAccount): a is ZcashAccount {
  return "privateInfo" in a && a.currency.id === "zcash";
}

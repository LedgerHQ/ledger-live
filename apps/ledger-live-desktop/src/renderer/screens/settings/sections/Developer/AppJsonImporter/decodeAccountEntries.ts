import type { Account, AccountUserData } from "@ledgerhq/types-live";
import accountModel from "~/helpers/accountModel";
import type { AccountRawEntry } from "./types";

export async function decodeAccountRawEntries(
  rawAccounts: AccountRawEntry[],
): Promise<[Account, AccountUserData][]> {
  const decoded: [Account, AccountUserData][] = [];
  for (const raw of rawAccounts) {
    try {
      decoded.push(await accountModel.decode(raw));
    } catch (_e) {
      // skip unsupported/unknown currencies (e.g. testnets)
    }
  }
  return decoded;
}

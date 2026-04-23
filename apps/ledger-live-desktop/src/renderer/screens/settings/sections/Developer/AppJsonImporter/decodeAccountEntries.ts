import type { Account, AccountUserData } from "@ledgerhq/types-live";
import accountModel from "~/helpers/accountModel";
import type { AccountRawEntry, FailedAccountEntry } from "./types";

export type DecodeResult = {
  decoded: [Account, AccountUserData][];
  failed: FailedAccountEntry[];
};

export async function decodeAccountRawEntries(
  rawAccounts: AccountRawEntry[],
): Promise<DecodeResult> {
  const decoded: [Account, AccountUserData][] = [];
  const failed: FailedAccountEntry[] = [];

  for (const raw of rawAccounts) {
    try {
      decoded.push(await accountModel.decode(raw));
    } catch (e) {
      const currencyId = raw.data?.currencyId ?? "unknown";
      const accountName = raw.data?.name;
      const reason = e instanceof Error ? e.message : "Unknown error";
      failed.push({ currencyId, accountName, reason });
    }
  }

  return { decoded, failed };
}

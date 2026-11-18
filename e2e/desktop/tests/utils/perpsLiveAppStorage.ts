import { readFile } from "fs/promises";
import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

export const getPerpsLiveAppStorage =
  (account: Account) =>
  async ({ userdataFile }: { userdataFile: string }) => {
    const { data } = JSON.parse(await readFile(userdataFile, "utf-8"));
    const accountId = data.accounts
      .map((entry: { data: { id: string } }) => entry.data.id)
      .find((id: string) => id.split(":")[2] === account.currency.id);
    if (!accountId) throw new Error(`No ${account.currency.id} account in ${userdataFile}`);
    return {
      firstTimeDone: "true",
      globalDisclaimer: JSON.stringify({ hasAccepted: true }),
      hip3Disclaimer: JSON.stringify({ hasAccepted: true }),
      currentAccountId: getWalletApiIdFromAccountId(accountId),
    };
  };

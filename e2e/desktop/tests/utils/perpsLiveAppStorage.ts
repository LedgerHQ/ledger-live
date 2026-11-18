import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { getAccountAddress } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

export const getPerpsLiveAppStorage = (account: Account) => async () => {
  const address = await getAccountAddress(account);
  const accountId = `js:2:${account.currency.id}:${address}:`;
  return {
    firstTimeDone: "true",
    globalDisclaimer: JSON.stringify({ hasAccepted: true }),
    hip3Disclaimer: JSON.stringify({ hasAccepted: true }),
    currentAccountId: getWalletApiIdFromAccountId(accountId),
  };
};

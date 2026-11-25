import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { getSavedAccountId } from "tests/utils/userdata";

export const getPerpsLiveAppStorage =
  (account: Account, { hip3 = false }: { hip3?: boolean } = {}) =>
  async ({ userdataFile }: { userdataFile: string }) => ({
    firstTimeDone: "true",
    globalDisclaimer: JSON.stringify({ hasAccepted: true }),
    hip3Disclaimer: JSON.stringify({ hasAccepted: true }),
    ...(hip3 ? { perpsFeatureFlagOverrides: JSON.stringify({ ptxPerpsHip3: true }) } : {}),
    currentAccountId: getWalletApiIdFromAccountId(await getSavedAccountId(userdataFile, account)),
  });

import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { getSavedAccountId } from "tests/utils/userdata";

export const getPerpsLiveAppStorage =
  (account: Account, { featureFlags = {} }: { featureFlags?: Record<string, boolean> } = {}) =>
  async ({ userdataFile }: { userdataFile: string }) => ({
    firstTimeDone: "true",
    globalDisclaimer: JSON.stringify({ hasAccepted: true }),
    hip3Disclaimer: JSON.stringify({ hasAccepted: true }),
    ...(Object.keys(featureFlags).length > 0
      ? { perpsFeatureFlagOverrides: JSON.stringify(featureFlags) }
      : {}),
    currentAccountId: getWalletApiIdFromAccountId(await getSavedAccountId(userdataFile, account)),
  });

import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";
import { LKRP_APPLICATION_ID } from "./constants";

export function createLkrpSdk(memberName = "wallet-cli") {
  return getSdk(
    process.env.WALLET_CLI_MOCK === "1",
    {
      applicationId: LKRP_APPLICATION_ID,
      name: memberName,
      apiBaseUrl: getEnv("TRUSTCHAIN_API_PROD"),
    },
    withDevice,
  );
}

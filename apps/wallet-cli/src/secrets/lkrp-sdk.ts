import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";
import { ENCRYPTION_CLI_APPLICATION_ID } from "./constants";

export function createLkrpSdk(memberName = "wallet-cli") {
  return getSdk(
    !!process.env.MOCK,
    {
      applicationId: ENCRYPTION_CLI_APPLICATION_ID,
      name: memberName,
      apiBaseUrl: getEnv("TRUSTCHAIN_API_PROD"),
    },
    withDevice,
  );
}

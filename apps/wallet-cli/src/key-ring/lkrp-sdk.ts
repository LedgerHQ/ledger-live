import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { AgentIntentEnvironment } from "@ledgerhq/agent-intent-sdk";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getEnv } from "@shared/env";
import {
  AGENT_INTENT_TRUSTCHAIN_URLS,
  LEDGER_SYNC_APPLICATION_ID,
  LKRP_APPLICATION_ID,
} from "./constants";

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

export const refuseAgentDevice: WithDevice = () => () => {
  throw new Error("Ledger Sync unexpectedly requested a device in software-only agent mode.");
};

/** Software-only Ledger Sync (App-16) SDK authenticating as an Agent Intent agent key. */
export function createAgentLedgerSyncSdk(environment: AgentIntentEnvironment) {
  return getSdk(
    false,
    {
      applicationId: LEDGER_SYNC_APPLICATION_ID,
      name: "wallet-cli agent-intent",
      apiBaseUrl: AGENT_INTENT_TRUSTCHAIN_URLS[environment],
    },
    refuseAgentDevice,
  );
}

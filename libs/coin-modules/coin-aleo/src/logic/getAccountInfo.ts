import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getRecordScannerStatusOrThrow } from "../network/utils";
import type { AleoAccountInfo, AleoCoinConfig } from "../types";

/** One `POST /scanner/{network}/status` call for a live `provableId`. Never registers (ADR-046). */
export async function getAccountInfo(
  config: AleoCoinConfig,
  provableId: string,
): Promise<AccountInfo> {
  const status = await getRecordScannerStatusOrThrow(config, provableId);

  const accountInfo: AleoAccountInfo = {
    type: "aleo",
    synced: status.synced,
    percentage: status.percentage,
    startHeight: status.sync_start_height,
    scannedHeight: status.synced_up_to,
  };
  return accountInfo;
}

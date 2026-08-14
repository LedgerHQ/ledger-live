import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getRecordScannerStatusOrThrow } from "../network/utils";
import type { AleoAccountInfo, AleoCoinConfig } from "../types";

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
    // synced_up_to is null until the scanner has made progress past sync_start_height
    scannedHeight: status.synced_up_to ?? status.sync_start_height,
  };
  return accountInfo;
}

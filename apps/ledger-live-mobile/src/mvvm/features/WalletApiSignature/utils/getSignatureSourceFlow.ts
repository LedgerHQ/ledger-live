import { WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import type { SourceFlow } from "LLM/components/DeviceIntentExecutor";

export function getSignatureSourceFlow(manifestId: string): SourceFlow {
  return manifestId === WC_ID ? "wallet_connect" : "wallet_api";
}

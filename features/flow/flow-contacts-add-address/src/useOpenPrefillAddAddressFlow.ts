import type { OpenPrefillAddAddressParams, OpenPrefillAddAddressResult } from "./prefillAddAddress";
import { requestPrefillAddAddressFlow } from "./prefillAddAddressFlowStore";

export function useOpenPrefillAddAddressFlow(): (
  params: OpenPrefillAddAddressParams,
) => Promise<OpenPrefillAddAddressResult> {
  return requestPrefillAddAddressFlow;
}

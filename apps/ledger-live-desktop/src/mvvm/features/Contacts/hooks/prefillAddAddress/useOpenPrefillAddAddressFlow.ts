import { useCallback } from "react";
import type {
  OpenPrefillAddAddressParams,
  OpenPrefillAddAddressResult,
} from "@features/flow-contacts";
import { requestPrefillAddAddressFlow } from "./prefillAddAddressFlowStore";

/**
 * Public entry point for Send and other consumers to open the prefilled Add Address flow.
 * Requires PrefillAddAddressFlowRoot to be mounted.
 */
export function useOpenPrefillAddAddressFlow(): (
  params: OpenPrefillAddAddressParams,
) => Promise<OpenPrefillAddAddressResult> {
  return useCallback(
    (params: OpenPrefillAddAddressParams) => requestPrefillAddAddressFlow(params),
    [],
  );
}

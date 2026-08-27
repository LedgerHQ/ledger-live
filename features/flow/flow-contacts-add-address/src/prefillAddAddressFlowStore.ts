import type { OpenPrefillAddAddressParams, OpenPrefillAddAddressResult } from "./prefillAddAddress";

type PrefillAddAddressFlowListener = (
  params: OpenPrefillAddAddressParams,
) => Promise<OpenPrefillAddAddressResult>;

let listener: PrefillAddAddressFlowListener | null = null;

export function setPrefillAddAddressFlowListener(
  nextListener: PrefillAddAddressFlowListener | null,
): void {
  listener = nextListener;
}

export function requestPrefillAddAddressFlow(
  params: OpenPrefillAddAddressParams,
): Promise<OpenPrefillAddAddressResult> {
  if (listener === null) {
    return Promise.resolve({ status: "unavailable" });
  }

  return listener(params);
}

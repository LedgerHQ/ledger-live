import type {
  OpenPrefillAddAddressParams,
  OpenPrefillAddAddressResult,
} from "@features/flow-contacts";

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
    return Promise.reject(new Error("PrefillAddAddressFlowRoot is not mounted"));
  }

  return listener(params);
}

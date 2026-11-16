import { filter, map, type Observable } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  type BindingSigningEvent,
  type PredictionsTypedData,
} from "@features/platform-predictions";
import {
  runSignTypedDataEvm,
  type SignTypedDataEvmRunState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm";
import type { Account } from "@ledgerhq/types-live";

function toSigningEvent(state: SignTypedDataEvmRunState): BindingSigningEvent | null {
  switch (state.type) {
    case "loading-context":
      return null;
    case "awaiting-confirmation":
    case "signing":
      return { type: "awaiting-confirmation" };
    case "signed":
      return { type: "signed", signature: state.signatureHex };
    case "failed":
      throw state.error;
  }
}

/**
 * On the Ethereum app the executor opened. A refusal is a `UserRefusedOnDevice`, a disabled blind
 * signing an `EthAppPleaseEnableContractData`.
 */
export function signBindingTypedData(
  connection: DeviceConnectionResult,
  account: Account,
  typedData: PredictionsTypedData,
): Observable<BindingSigningEvent> {
  return runSignTypedDataEvm(
    connection,
    typedData,
    account.freshAddressPath,
    "Predictions account binding",
  ).pipe(
    map(toSigningEvent),
    filter((event): event is BindingSigningEvent => event !== null),
  );
}

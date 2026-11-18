import { filter, map, type Observable } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  SIGNING_ERROR_LABELS,
  type PredictionsSigningEvent,
  type PredictionsSigningPurpose,
  type PredictionsTypedData,
} from "@features/platform-predictions";
import {
  runSignTypedDataEvm,
  type SignTypedDataEvmRunState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm";
import type { Account } from "@ledgerhq/types-live";

function toSigningEvent(state: SignTypedDataEvmRunState): PredictionsSigningEvent | null {
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
export function signPredictionsTypedData(
  connection: DeviceConnectionResult,
  account: Account,
  typedData: PredictionsTypedData,
  purpose: PredictionsSigningPurpose,
): Observable<PredictionsSigningEvent> {
  return runSignTypedDataEvm(
    connection,
    typedData,
    account.freshAddressPath,
    SIGNING_ERROR_LABELS[purpose],
  ).pipe(
    map(toSigningEvent),
    filter((event): event is PredictionsSigningEvent => event !== null),
  );
}

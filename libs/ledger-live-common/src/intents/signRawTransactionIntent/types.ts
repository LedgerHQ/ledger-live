import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { SignTransactionIntentJobState } from "../signTransactionIntent/types";

/** Raw hex-encoded transaction bytes to pass directly to the device (no Transaction crafting). */
export type SignRawTransactionIntentInput = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  /** Raw hex string passed straight to bridge.signRawOperation — e.g. Tronify's `raw_data_hex`. */
  transaction: string;
}>;

/** Reuse signTransactionIntent's job states — the events emitted by signRawOperation are identical
 * SignOperationEvents; the combined signature in state.signed.signedOperation.signature carries
 * the device bytes alongside the echoed raw_data_hex prefix (see combine.ts). */
export type SignRawTransactionIntentJobState = SignTransactionIntentJobState;

export type SignRawTransactionIntentDefinition = IntentDefinition<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput
>;

export type SignRawTransactionIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    SignRawTransactionIntentJobState,
    SignRawTransactionIntentInput,
    ExtraProps
  >;

export type SignRawTransactionIntent<ExtraProps = undefined> = Intent<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput,
  ExtraProps
>;

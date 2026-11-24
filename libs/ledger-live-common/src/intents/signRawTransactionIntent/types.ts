import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { SignTransactionIntentJobState } from "../signTransactionIntent/types";

export type SignRawTransactionIntentInput = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  /** Hex transaction bytes, passed as is to bridge.signRawOperation. */
  transaction: string;
  /** Passed to bridge.signRawOperation: Bitcoin finalizes the PSBT only when it is set. */
  broadcast?: boolean;
  /** Live app the signature is made for: the bridge attributes its transaction events to it. */
  manifestId?: string;
}>;

/** Same states as signTransactionIntent: signRawOperation emits the same SignOperationEvents. */
export type SignRawTransactionIntentJobState = SignTransactionIntentJobState;

/** The job reports the signed operation as its result. */
export type SignRawTransactionIntentDefinition = IntentDefinition<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput,
  SignedOperation
>;

export type SignRawTransactionIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    SignRawTransactionIntentJobState,
    SignRawTransactionIntentInput,
    ExtraProps,
    SignedOperation
  >;

export type SignRawTransactionIntent<ExtraProps = undefined> = Intent<
  SignRawTransactionIntentJobState,
  SignRawTransactionIntentInput,
  ExtraProps,
  SignedOperation
>;

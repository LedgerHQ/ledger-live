import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { SignTransactionIntentJobState } from "../signTransactionIntent/types";

export type SignRawTransactionIntentInput = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  /** Hex transaction bytes, passed as is to bridge.signRawOperation. */
  transaction: string;
}>;

/** Same states as signTransactionIntent: signRawOperation emits the same SignOperationEvents. */
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

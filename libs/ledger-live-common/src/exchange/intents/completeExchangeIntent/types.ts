import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "../../../coin-modules/transaction-types";
import type { RateTypes } from "@ledgerhq/hw-app-exchange";
import type { TerminalSignOperationState } from "../../../intents/signTransactionIntent";
import type { Exchange } from "../../types";

export type CompleteExchangeIntentInput = Readonly<{
  /** The hw-app-exchange exchange type (`ExchangeType` of the wallet-api: swap, sell or fund). */
  exchangeType: number;
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  rateType?: RateTypes;
  /** Whether the network fees are sponsored, which the swap terms mention. */
  sponsored?: boolean;
}>;

/**
 * How the exchange ended on the device, reported once through `onResult`. A refusal carries the
 * `error` the Exchange app answered, which keeps the step it happened on; a refusal of the
 * signature has none. A failure carries `deviceModelId` when the Exchange app confirmation failed,
 * and not when the signature did.
 */
export type CompleteExchangeIntentResult =
  | Readonly<{ status: "signed"; signedOperation: SignedOperation }>
  | Readonly<{ status: "refused"; error?: Error }>
  | Readonly<{ status: "failed"; error: Error; deviceModelId?: DeviceModelId }>;

/**
 * The Exchange app confirmation, then the signature of the coin app it hands over to.
 *
 * `refused` and `error` end the job: the nonce is spent, so the exchange has to start again
 * from the live app rather than retry here.
 */
export type CompleteExchangeIntentJobState =
  | { type: "preparing"; deviceModelId: DeviceModelId }
  | {
      type: "awaiting-confirmation";
      deviceModelId: DeviceModelId;
      exchangeType: number;
      provider: string;
      sponsored: boolean;
      estimatedFees: string;
    }
  | { type: "confirmed" }
  | TerminalSignOperationState;

export type CompleteExchangeIntentDefinition = IntentDefinition<
  CompleteExchangeIntentJobState,
  CompleteExchangeIntentInput,
  CompleteExchangeIntentResult
>;

export type CompleteExchangeIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    CompleteExchangeIntentJobState,
    CompleteExchangeIntentInput,
    ExtraProps,
    CompleteExchangeIntentResult
  >;

export type CompleteExchangeIntent<ExtraProps = undefined> = Intent<
  CompleteExchangeIntentJobState,
  CompleteExchangeIntentInput,
  ExtraProps,
  CompleteExchangeIntentResult
>;

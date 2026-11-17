import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";

export type ShowExchangeErrorIntentInput = Readonly<{
  error: Error;
  /** The swap provider, when the failure happened on a swap. */
  provider?: string;
  /** The device the Exchange app confirmation failed on, when that is where it failed. */
  deviceModelId?: DeviceModelId;
  /** Currencies of the swap, for analytics. */
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
}>;

/**
 * Shows how an exchange ended badly. It is the last intent of a flow: it does no device work, it
 * only lets the executor that is already open tell the user.
 *
 * - `error`: the exchange failed.
 * - `incompatible-device`: the device cannot do this swap, so retrying with it is pointless.
 */
export type ShowExchangeErrorIntentJobState =
  | { type: "error"; error: Error }
  | {
      type: "incompatible-device";
      provider: string;
      deviceModelId: DeviceModelId;
      sourceCurrencyId?: string;
      targetCurrencyId?: string;
    };

export type ShowExchangeErrorIntentDefinition = IntentDefinition<
  ShowExchangeErrorIntentJobState,
  ShowExchangeErrorIntentInput
>;

export type ShowExchangeErrorIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    ShowExchangeErrorIntentJobState,
    ShowExchangeErrorIntentInput,
    ExtraProps
  >;

export type ShowExchangeErrorIntent<ExtraProps = undefined> = Intent<
  ShowExchangeErrorIntentJobState,
  ShowExchangeErrorIntentInput,
  ExtraProps
>;

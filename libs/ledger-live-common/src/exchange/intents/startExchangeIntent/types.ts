import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "../../../hw/actions/types";
import type { Exchange } from "../../types";

export type StartExchangeIntentInput = Readonly<{
  /** The hw-app-exchange exchange type (`ExchangeType` of the wallet-api: swap, sell or fund). */
  exchangeType: number;
  provider?: string;
  /** Only used to name the coin app the exchange will sign with, for analytics. */
  exchange?: Partial<Exchange>;
}>;

/**
 * How the start ended, reported once through `onResult`. `started` carries what the host needs
 * to carry on: the nonce, and the context that analytics report later.
 */
export type StartExchangeIntentResult =
  | Readonly<{
      status: "started";
      nonce: string;
      device: Device;
      exchangeAppVersion?: string;
      signingAppName?: string;
      /** The installed version of the signing app, when the device listed its apps. */
      signingAppVersion?: string;
    }>
  | Readonly<{ status: "failed"; error: Error; device: Device }>;

export type StartExchangeIntentJobState =
  | { type: "starting"; deviceModelId: DeviceModelId }
  | { type: "nonce-ready"; nonce: string }
  | { type: "error"; error: Error };

export type StartExchangeIntentDefinition = IntentDefinition<
  StartExchangeIntentJobState,
  StartExchangeIntentInput,
  StartExchangeIntentResult
>;

export type StartExchangeIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    StartExchangeIntentJobState,
    StartExchangeIntentInput,
    ExtraProps,
    StartExchangeIntentResult
  >;

export type StartExchangeIntent<ExtraProps = undefined> = Intent<
  StartExchangeIntentJobState,
  StartExchangeIntentInput,
  ExtraProps,
  StartExchangeIntentResult
>;

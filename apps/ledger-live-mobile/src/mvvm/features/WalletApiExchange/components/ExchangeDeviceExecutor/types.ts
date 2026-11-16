import type {
  CompleteExchangeIntentInput,
  CompleteExchangeIntentJobState,
  CompleteExchangeIntentPlatformDefinition,
  CompleteExchangeIntentResult,
  ShowExchangeErrorIntentInput,
  ShowExchangeErrorIntentJobState,
  ShowExchangeErrorIntentPlatformDefinition,
  StartExchangeIntentInput,
  StartExchangeIntentJobState,
  StartExchangeIntentPlatformDefinition,
  StartExchangeIntentResult,
} from "@ledgerhq/live-common/exchange/intents/index";
import type { Intent } from "@features/platform-device-intent";

/** The platform definitions the drawer builds its intents from. Tests inject mock ones. */
export type ExchangeIntentDefinitions = Readonly<{
  start: StartExchangeIntentPlatformDefinition;
  complete: CompleteExchangeIntentPlatformDefinition;
  error: ShowExchangeErrorIntentPlatformDefinition;
}>;

/**
 * The executor runs one intent at a time and the drawer swaps it from phase to phase, so its
 * props are typed on the union of them.
 */
export type ExchangeDeviceIntent = Intent<
  StartExchangeIntentJobState | CompleteExchangeIntentJobState | ShowExchangeErrorIntentJobState,
  StartExchangeIntentInput | CompleteExchangeIntentInput | ShowExchangeErrorIntentInput,
  undefined,
  StartExchangeIntentResult | CompleteExchangeIntentResult | undefined
>;

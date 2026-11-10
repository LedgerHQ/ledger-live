import type { Job } from "@features/platform-device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";
import type { ShowExchangeErrorIntentInput, ShowExchangeErrorIntentJobState } from "./types";

const THORSWAP_PROVIDER = "thorswap";

/** ThorSwap cannot run on a Nano S: its payload does not fit the app. */
function isIncompatibleDevice(provider: string, deviceModelId: DeviceModelId): boolean {
  return provider.toLowerCase() === THORSWAP_PROVIDER && deviceModelId === DeviceModelId.nanoS;
}

export function getShowExchangeErrorState({
  error,
  provider,
  deviceModelId,
  sourceCurrencyId,
  targetCurrencyId,
}: ShowExchangeErrorIntentInput): ShowExchangeErrorIntentJobState {
  if (provider && deviceModelId && isIncompatibleDevice(provider, deviceModelId)) {
    return {
      type: "incompatible-device",
      provider,
      deviceModelId,
      ...(sourceCurrencyId ? { sourceCurrencyId } : {}),
      ...(targetCurrencyId ? { targetCurrencyId } : {}),
    };
  }

  return { type: "error", error };
}

/** Emits the state at once and completes: there is nothing to wait for on the device. */
export const showExchangeErrorIntentJob: Job<
  ShowExchangeErrorIntentJobState,
  ShowExchangeErrorIntentInput
> = ({ input }) => of(getShowExchangeErrorState(input));

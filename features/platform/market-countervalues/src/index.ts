export * from "./hooks/countervaluesHooks";
export * from "./hooks/useGetCounterValueIdsPolling";
export * from "./hooks/useUsdToFiatRate";
export * from "./state/middleware";
export * from "./state/reducer";
export * from "./state/slice";
export * from "./utils/haveSameTrackingPairs";
export * from "./utils/setCountervaluesLogger";

// MEASUREMENT BUILD ONLY, NEVER MERGE. These local exports shadow the hooks re-exported above, so
// every consumer of the package gets the counted version.
import * as Hooks from "./hooks/countervaluesHooks";
import { probeHook } from "./utils/internals/renderProbe";

export {
  CountervaluesProbeProfiler,
  probeAssetValues,
  useProbeInstance,
} from "./utils/internals/renderProbe";

type SendAmount = ReturnType<typeof Hooks.useSendAmount>;

// useSendAmount returns a new object and a new BigNumber on every render: compare by member.
function sameSendAmount(a: SendAmount, b: SendAmount): boolean {
  return (
    a.fiatAmount.isEqualTo(b.fiatAmount) &&
    a.fiatUnit === b.fiatUnit &&
    a.calculateCryptoAmount === b.calculateCryptoAmount
  );
}

export const useCountervaluesState = probeHook(
  "useCountervaluesState",
  Hooks.useCountervaluesState,
  Object.is,
  Hooks.useCountervaluesState,
);
export const useCountervaluesCache = probeHook(
  "useCountervaluesCache",
  Hooks.useCountervaluesCache,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useCountervaluesPolling = probeHook(
  "useCountervaluesPolling",
  Hooks.useCountervaluesPolling,
);
export const useCountervaluesLoadStatus = probeHook(
  "useCountervaluesLoadStatus",
  Hooks.useCountervaluesLoadStatus,
);
export const useCalculate = probeHook(
  "useCalculate",
  Hooks.useCalculate,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useCalculateCountervalueCallback = probeHook(
  "useCalculateCountervalueCallback",
  Hooks.useCalculateCountervalueCallback,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useSendAmount = probeHook(
  "useSendAmount",
  Hooks.useSendAmount,
  sameSendAmount,
  Hooks.useCountervaluesCache,
);

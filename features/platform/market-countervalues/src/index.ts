export * from "./CountervaluesProvider";
export * from "./countervaluesSlice";
export * from "./setCountervaluesLogger";
export * from "./useGetCounterValueIdsPolling";
export * from "./useUsdToFiatRate";

// MEASUREMENT BUILD ONLY, NEVER MERGE. These local exports shadow the hooks re-exported above, so
// every consumer of the package gets the counted version.
import * as Hooks from "./CountervaluesProvider";
import { probeHook } from "./internals/renderProbe";

export { CountervaluesProbeProfiler } from "./internals/renderProbe";

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
);
export const useCountervaluesPolling = probeHook(
  "useCountervaluesPolling",
  Hooks.useCountervaluesPolling,
);
export const useCountervaluesUserSettings = probeHook(
  "useCountervaluesUserSettings",
  Hooks.useCountervaluesUserSettings,
);
export const useCalculate = probeHook("useCalculate", Hooks.useCalculate);
export const useCalculateCountervalueCallback = probeHook(
  "useCalculateCountervalueCallback",
  Hooks.useCalculateCountervalueCallback,
);
export const useSendAmount = probeHook("useSendAmount", Hooks.useSendAmount, sameSendAmount);

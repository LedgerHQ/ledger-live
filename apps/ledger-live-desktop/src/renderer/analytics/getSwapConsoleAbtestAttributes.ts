import type { Feature, Features } from "@shared/feature-flags";

type SwapConsoleAbtestFlag = Feature<Features["lwdSwapConsoleAbtest"]["params"]> | null | undefined;

export function getSwapConsoleAbtestAttributes(swapConsoleAbtestFlag: SwapConsoleAbtestFlag) {
  return {
    isEnabled: swapConsoleAbtestFlag?.enabled ?? false,
    console: swapConsoleAbtestFlag?.params?.console ?? true,
    quickAction: swapConsoleAbtestFlag?.params?.quickAction ?? false,
  };
}

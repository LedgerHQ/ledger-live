import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { HyperliquidSignIntentInput } from "@features/platform-hyperliquid-sign-intent";

export function buildHyperliquidSignIntentInput(
  signOnSession: PerpsSignRequest["signOnSession"],
): HyperliquidSignIntentInput {
  return {
    signOnSession: async ({ dmk, sessionId, connectedDevice }) => {
      const { signatures } = await signOnSession({
        dmk,
        sessionId,
        deviceModelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
      });
      return signatures;
    },
  };
}

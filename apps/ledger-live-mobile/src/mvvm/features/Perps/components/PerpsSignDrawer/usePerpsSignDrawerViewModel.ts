import { useMemo } from "react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useHyperliquidSignOrchestration } from "@features/platform-intent-hyperliquid-sign/react";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { hyperliquidSignIntentLWMDefinition } from "../../deviceIntents/hyperliquidSignIntent/intentLWMDefinition";

type Props = Readonly<{
  request: PerpsSignRequest;
  manifestId: string;
  manifestName: string;
  onClose: () => void;
}>;

export function usePerpsSignDrawerViewModel({ request, manifestId, manifestName, onClose }: Props) {
  const orchestration = useHyperliquidSignOrchestration({
    request,
    platformDefinition: hyperliquidSignIntentLWMDefinition,
    buildDeviceInitializationInput,
    onClose,
  });

  const analyticsProperties = useMemo(
    () => ({ manifestId, manifestName }),
    [manifestId, manifestName],
  );

  return {
    ...orchestration,
    analyticsProperties,
  };
}

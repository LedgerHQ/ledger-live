import { useMemo } from "react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useHyperliquidSignOrchestration } from "@features/platform-intent-hyperliquid-sign/react";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { hyperliquidSignIntentLWDDefinition } from "../../deviceIntents/hyperliquidSignIntent/intentLWDDefinition";

export type PerpsSignManifest = Readonly<{
  manifestId: string;
  manifestName?: string;
}>;

type Props = Readonly<{
  request: PerpsSignRequest;
  manifest?: PerpsSignManifest;
  onClose: () => void;
}>;

export function usePerpsSignExecutorViewModel({ request, manifest, onClose }: Props) {
  const orchestration = useHyperliquidSignOrchestration({
    request,
    platformDefinition: hyperliquidSignIntentLWDDefinition,
    buildDeviceInitializationInput,
    onClose,
  });

  const analyticsProperties = useMemo(
    () =>
      manifest
        ? { manifestId: manifest.manifestId, manifestName: manifest.manifestName }
        : undefined,
    [manifest],
  );

  return {
    ...orchestration,
    analyticsProperties,
  };
}

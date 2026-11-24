import { useEffect, useMemo, useState } from "react";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { useHyperliquidSignOrchestration } from "@features/platform-intent-hyperliquid-sign/react";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { hyperliquidSignIntentLWMDefinition } from "../../deviceIntents/hyperliquidSignIntent/intentLWMDefinition";

type Props = Readonly<{
  request: PerpsSignRequest;
  manifestId: string;
  manifestName: string;
  isOpen: boolean;
  onClose: () => void;
  onDismissed: () => void;
}>;

export function usePerpsSignDrawerViewModel({
  request,
  manifestId,
  manifestName,
  isOpen,
  onClose,
  onDismissed,
}: Props) {
  const orchestration = useHyperliquidSignOrchestration({
    request,
    platformDefinition: hyperliquidSignIntentLWMDefinition,
    buildDeviceInitializationInput,
    onClose,
  });

  const [hasMountedExecutor, setHasMountedExecutor] = useState(false);
  if (isOpen && orchestration.deviceInitializationInput !== null && !hasMountedExecutor) {
    setHasMountedExecutor(true);
  }

  useEffect(() => {
    if (!isOpen && !hasMountedExecutor) {
      onDismissed();
    }
  }, [isOpen, hasMountedExecutor, onDismissed]);

  const analyticsProperties = useMemo(
    () => ({ manifestId, manifestName }),
    [manifestId, manifestName],
  );

  return {
    ...orchestration,
    deviceInitializationInput:
      hasMountedExecutor || isOpen ? orchestration.deviceInitializationInput : null,
    analyticsProperties,
  };
}

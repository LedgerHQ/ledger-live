import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useFeatureFlagsToolProps } from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";
import { useDevToolsRelay } from "./useDevToolsRelay";

export function useDevToolsScreenViewModel() {
  const navigate = useNavigate();
  const featureFlagsToolProps = useFeatureFlagsToolProps();
  const { wire, wireState } = useDevToolsRelay();

  const config: DevToolsConfig = useMemo(
    () => [{ id: "feature-flags", config: featureFlagsToolProps }],
    [featureFlagsToolProps],
  );

  const onClose = useCallback(() => navigate(-1), [navigate]);

  return {
    config,
    onClose,
    transport: wire.transport,
    hubUrl: wireState.hubUrl,
    setHubUrl: wire.setHubUrl,
    role: wireState.role,
  };
}

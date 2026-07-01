import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useFeatureFlagsToolProps } from "@devtools/bindings";
import type { DevToolsConfig } from "@devtools/shell";

export function useDevToolsScreenViewModel(): {
  config: DevToolsConfig;
  onClose: () => void;
} {
  const navigate = useNavigate();
  const featureFlagsToolProps = useFeatureFlagsToolProps();

  const config: DevToolsConfig = useMemo(
    () => [{ id: "feature-flags", config: featureFlagsToolProps }],
    [featureFlagsToolProps],
  );

  const onClose = useCallback(() => navigate(-1), [navigate]);

  return { config, onClose };
}

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  liveConfigOverridesSelector,
  setAllLiveConfigOverrides,
  setLiveConfigOverride,
} from "@shared/live-config-overrides";
import type { DevToolsConfig } from "@devtools/registry";

type CoinConfigToolProps = Extract<DevToolsConfig[number], { id: "coin-config" }>["config"];

export interface UseCoinConfigToolPropsInput {
  /** Every LiveConfig key, e.g. `Object.keys(LiveConfig.instance.config)`. */
  keys: readonly string[];
  /** What LiveConfig resolves for a key, e.g. `LiveConfig.getValueByKey`. */
  getValueByKey: (key: string) => unknown;
  /** The value the LiveConfig schema declares for a key, e.g. `LiveConfig.getDefaultValueByKey`. */
  getDefaultValueByKey: (key: string) => unknown;
}

/**
 * Builds the coin-config tool's props from the `liveConfigOverrides` slice
 * (`@shared/live-config-overrides`). The host passes the LiveConfig reads, and the slice's
 * middleware applies each override to LiveConfig.
 */
export function useCoinConfigToolProps({
  keys,
  getValueByKey,
  getDefaultValueByKey,
}: UseCoinConfigToolPropsInput): CoinConfigToolProps {
  const dispatch = useDispatch();
  const overrides = useSelector(liveConfigOverridesSelector);
  const sortedKeys = useMemo(() => [...keys].sort((a, b) => a.localeCompare(b)), [keys]);

  const actions = useMemo(
    () => ({
      setOverride: (key: string, value: unknown) => dispatch(setLiveConfigOverride({ key, value })),
      clearOverride: (key: string) => dispatch(setLiveConfigOverride({ key, value: undefined })),
      clearAllOverrides: () => dispatch(setAllLiveConfigOverrides({})),
    }),
    [dispatch],
  );

  return useMemo(
    () => ({
      keys: sortedKeys,
      overrides,
      getResolvedValue: getValueByKey,
      getDefaultValue: getDefaultValueByKey,
      ...actions,
    }),
    [sortedKeys, overrides, getValueByKey, getDefaultValueByKey, actions],
  );
}

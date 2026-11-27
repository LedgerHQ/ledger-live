import { useCallback, useMemo } from "react";
import {
  applyRegionUpdate,
  type RegionSettingsPort,
  type RegionSettingsValues,
  type RegionSideEffects,
  type RegionUpdate,
} from "@features/flow-settings-general";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setLocale } from "~/renderer/actions/settings";
import { localeSelector } from "~/renderer/reducers/settings";

/** The Region part of the settings port, built from the desktop store. */
export function useRegionSettingsAdapter(): RegionSettingsPort {
  const dispatch = useDispatch();
  const region = useSelector(localeSelector);

  const values = useMemo<RegionSettingsValues>(() => ({ region }), [region]);
  const effects = useMemo<RegionSideEffects>(
    () => ({ setRegion: locale => dispatch(setLocale(locale)) }),
    [dispatch],
  );
  const setValue = useCallback(
    (update: RegionUpdate) => applyRegionUpdate(effects, update),
    [effects],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}

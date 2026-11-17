import { useCallback, useMemo } from "react";
import type { DevToolsConfig } from "@devtools/shell";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { shouldShowNightlyLayer } from "LLD/components/NightlyLayer/utils/shouldShowNightlyLayer";
import { setHideNightlyLayer } from "~/renderer/actions/settings";
import { hideNightlyLayerSelector } from "~/renderer/reducers/settings";
import { copy } from "./copy";

type DevSettingsToolProps = Extract<DevToolsConfig[number], { id: "dev-settings" }>["config"];

/** Binds the dev-settings devtool to the desktop settings it toggles. */
export function useDevSettingsTool(): DevSettingsToolProps {
  const dispatch = useDispatch();
  const isNightlyLayerHidden = useSelector(hideNightlyLayerSelector);
  const isNightlyBuild = shouldShowNightlyLayer(__PRERELEASE__, __CHANNEL__);

  const onHideNightlyLayerChange = useCallback(
    (isOn: boolean) => {
      dispatch(setHideNightlyLayer(isOn));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      toggles: [
        {
          id: "hide-nightly-layer",
          label: copy.hideNightlyLayer.label,
          description: copy.hideNightlyLayer.description,
          isOn: isNightlyLayerHidden,
          lockedReason: isNightlyBuild ? null : copy.hideNightlyLayer.lockedReason,
          onChange: onHideNightlyLayerChange,
        },
      ],
    }),
    [isNightlyLayerHidden, isNightlyBuild, onHideNightlyLayerChange],
  );
}

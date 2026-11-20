import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DevToolsConfig } from "@devtools/shell";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { shouldShowNightlyLayer } from "LLD/components/NightlyLayer/utils/shouldShowNightlyLayer";
import { setHideNightlyLayer } from "~/renderer/actions/settings";
import { hideNightlyLayerSelector } from "~/renderer/reducers/settings";

type AppTogglesToolProps = Extract<DevToolsConfig[number], { id: "app-toggles" }>["config"];

/** Binds the app-toggles devtool to the desktop settings it toggles. */
export function useAppTogglesTool(): AppTogglesToolProps {
  const { t } = useTranslation();
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
          label: t("settings.developer.devTools.appToggles.hideNightlyLayer.label"),
          description: t("settings.developer.devTools.appToggles.hideNightlyLayer.description"),
          isOn: isNightlyLayerHidden,
          lockedReason: isNightlyBuild
            ? null
            : t("settings.developer.devTools.appToggles.hideNightlyLayer.lockedReason"),
          onChange: onHideNightlyLayerChange,
        },
      ],
    }),
    [t, isNightlyLayerHidden, isNightlyBuild, onHideNightlyLayerChange],
  );
}

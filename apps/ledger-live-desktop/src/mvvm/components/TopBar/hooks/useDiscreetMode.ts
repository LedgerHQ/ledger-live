import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { EyeCross, Eye } from "@ledgerhq/lumen-ui-react/symbols";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { setDiscreetMode } from "~/renderer/actions/settings";
import { useTranslation } from "react-i18next";

export const useDiscreetMode = (): {
  handleDiscreet: () => void;
  discreetIcon: typeof EyeCross | typeof Eye;
  tooltip: string;
} => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const discreetMode = useSelector(discreetModeSelector);
  const discreetIcon = useMemo(() => (discreetMode ? EyeCross : Eye), [discreetMode]);

  const handleDiscreet = useCallback(() => {
    track("button_clicked", {
      button: "Discreet mode",
      toggle: !discreetMode ? "ON" : "OFF",
    });
    dispatch(setDiscreetMode(!discreetMode));
  }, [dispatch, discreetMode]);

  return {
    handleDiscreet,
    discreetIcon,
    tooltip: t("settings.discreet"),
  };
};

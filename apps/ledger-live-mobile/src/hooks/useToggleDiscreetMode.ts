import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { setDiscreetMode } from "~/actions/settings";
import { track } from "~/analytics";

interface UseToggleDiscreetModeResult {
  readonly discreetMode: boolean;
  readonly toggleDiscreetMode: () => void;
}

export function useToggleDiscreetMode(): UseToggleDiscreetModeResult {
  const discreetMode = useSelector(discreetModeSelector);
  const dispatch = useDispatch();

  const toggleDiscreetMode = useCallback(() => {
    track("button_clicked", {
      button: "Discreet mode",
      toggle: discreetMode ? "OFF" : "ON",
    });
    dispatch(setDiscreetMode(!discreetMode));
  }, [discreetMode, dispatch]);

  return {
    discreetMode,
    toggleDiscreetMode,
  };
}

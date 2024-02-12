import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { setTheme } from "~/actions/settings";
import FloatingDebugButton from "./FloatingDebugButton";
import { useSettings } from "~/hooks";

const DebugTheme = () => {
  const { theme } = useSettings();
  const isDark = theme === "dark";
  const render = useEnv("DEBUG_THEME");
  const dispatch = useDispatch();

  const toggleTheme = useCallback(() => {
    dispatch(setTheme(isDark ? "light" : "dark"));
  }, [isDark, dispatch]);

  const toggleDebugThemeVisibility = useCallback(() => {
    setEnv("DEBUG_THEME", !render);
  }, [render]);

  return render ? (
    <FloatingDebugButton
      onPress={toggleTheme}
      onLongPress={toggleDebugThemeVisibility}
      Icon={IconsLegacy.LightbulbMedium}
    />
  ) : null;
};

export default DebugTheme;

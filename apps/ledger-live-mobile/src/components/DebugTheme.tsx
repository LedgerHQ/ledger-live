import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-common/env";
import { Icons } from "@ledgerhq/native-ui";
import { themeSelector } from "../reducers/settings";
import { setTheme } from "../actions/settings";
import FloatingDebugButton from "./FloatingDebugButton";

const DebugTheme = () => {
  const currentTheme = useSelector(themeSelector);
  const isDark = currentTheme === "dark";
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
      Icon={Icons.LightbulbMedium}
    />
  ) : null;
};

export default DebugTheme;

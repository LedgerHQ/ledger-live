import React, { useCallback } from "react";
import { StyleSheet } from "react-native";

import { useAppUninstallNeedsDeps } from "@ledgerhq/live-common/lib/apps/react";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { useTheme } from "@react-navigation/native";
import Trash from "../../../icons/Trash";
import Touchable from "../../../components/Touchable";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  setAppUninstallWithDependencies: ({ dependents: App[], app: App }) => void,
};

const AppUninstallButton = ({
  app,
  state,
  dispatch,
  setAppUninstallWithDependencies,
}: Props) => {
  const { colors } = useTheme();
  const { name } = app;

  const needsDependencies = useAppUninstallNeedsDeps(state, app);

  const uninstallApp = useCallback(() => {
    if (needsDependencies && setAppUninstallWithDependencies)
      setAppUninstallWithDependencies(needsDependencies);
    else dispatch({ type: "uninstall", name });
  }, [needsDependencies, setAppUninstallWithDependencies, dispatch, name]);

  return (
    <Touchable
      activeOpacity={0.5}
      style={styles.uninstallButton}
      onPress={uninstallApp}
      event="ManagerAppUninstall"
      eventProperties={{ appName: name }}
      disabled={state.updateAllQueue.length > 0}
    >
      <Trash
        size={18}
        color={state.updateAllQueue.length > 0 ? colors.fog : colors.grey}
      />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  uninstallButton: {
    width: 44,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AppUninstallButton;

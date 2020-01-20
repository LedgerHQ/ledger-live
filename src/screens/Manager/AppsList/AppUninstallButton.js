import React, { useCallback, useContext, useMemo } from "react";
import { StyleSheet } from "react-native";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { ManagerContext } from "../shared";
import Trash from "../../../icons/Trash";
import colors from "../../../colors";
import Touchable from "../../../components/Touchable";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
};

const AppUninstallButton = ({ app, state, dispatch }: Props) => {
  const { setAppUninstallWithDependencies } = useContext(ManagerContext);
  const { installed, apps } = state;
  const { name } = app;

  const needsDependencies = useMemo(
    () =>
      apps
        .filter(a => installed.some(i => i.name === a.name))
        .some(({ dependencies }) => dependencies.includes(name)),
    [apps, installed, name],
  );

  const uninstallApp = useCallback(() => {
    if (needsDependencies) setAppUninstallWithDependencies(app);
    else dispatch({ type: "uninstall", name });
  }, [needsDependencies, setAppUninstallWithDependencies, dispatch, name, app]);

  return (
    <Touchable
      activeOpacity={0.5}
      style={styles.uninstallButton}
      onPress={uninstallApp}
      event="ManagerAppUninstall"
      eventProperties={{ appName: name }}
    >
      <Trash size={18} color={colors.grey} />
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

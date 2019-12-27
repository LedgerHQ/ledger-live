import React, { memo, useCallback, useContext } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { ManagerContext } from "../Manager";
import Trash from "../../../icons/Trash";
import colors from "../../../colors";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
};

const AppUninstallButton = ({ app, state, dispatch }: Props) => {
  const { setAppUninstallWithDependencies } = useContext(ManagerContext);
  const { installed, apps } = state;
  const { name } = app;

  const needsDependencies = apps
    .filter(a => installed.some(i => i.name === a.name))
    .some(({ dependencies }) => dependencies.includes(name));

  const uninstallApp = useCallback(() => {
    if (needsDependencies) setAppUninstallWithDependencies(app);
    else dispatch({ type: "uninstall", name });
  }, [needsDependencies, setAppUninstallWithDependencies, dispatch, name, app]);

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      style={styles.uninstallButton}
      onPress={uninstallApp}
    >
      <Trash size={16} color={colors.grey} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uninstallButton: {
    width: 38,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(AppUninstallButton);

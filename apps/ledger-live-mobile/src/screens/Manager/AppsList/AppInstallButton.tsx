import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import manager from "@ledgerhq/live-common/manager/index";

import type { App } from "@ledgerhq/types-live";
import type { Action, State } from "@ledgerhq/live-common/apps/index";
import { useAppInstallNeedsDeps } from "@ledgerhq/live-common/apps/react";
import styled from "styled-components/native";
import { Icons, Box } from "@ledgerhq/native-ui";
import { hasInstalledAnyAppSelector } from "../../../reducers/settings";
import { installAppFirstTime } from "../../../actions/settings";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  notEnoughMemoryToInstall: boolean;
  setAppInstallWithDependencies: (_: { app: App; dependencies: App[] }) => void;
  storageWarning: (_: string) => void;
};

const ButtonContainer = styled(Box).attrs({
  width: 48,
  height: 48,
  borderWidth: 1,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
})``;

export default function AppInstallButton({
  app,
  state,
  dispatch: dispatchProps,
  notEnoughMemoryToInstall,
  setAppInstallWithDependencies,
  storageWarning,
}: Props) {
  const dispatch = useDispatch();
  const hasInstalledAnyApp = useSelector(hasInstalledAnyAppSelector);
  const canBeInstalled = useMemo(() => manager.canHandleInstall(app), [app]);

  const { name } = app;
  const { updateAllQueue } = state;

  const needsDependencies = useAppInstallNeedsDeps(state, app);

  const disabled = useMemo(
    () => !canBeInstalled || updateAllQueue.length > 0,
    [canBeInstalled, updateAllQueue.length],
  );

  const installApp = useCallback(() => {
    if (disabled) return;
    if (notEnoughMemoryToInstall) {
      storageWarning(name);
      return;
    }
    if (needsDependencies && setAppInstallWithDependencies) {
      setAppInstallWithDependencies(needsDependencies);
    } else {
      dispatchProps({ type: "install", name });
    }
    if (!hasInstalledAnyApp) {
      dispatch(installAppFirstTime(true));
    }
  }, [
    disabled,
    dispatch,
    dispatchProps,
    name,
    needsDependencies,
    setAppInstallWithDependencies,
    hasInstalledAnyApp,
    notEnoughMemoryToInstall,
    storageWarning,
  ]);

  return (
    <TouchableOpacity onPress={installApp}>
      <ButtonContainer borderColor="neutral.c30">
        {canBeInstalled ? (
          <Icons.PlusMedium size={18} color="neutral.c100" />
        ) : null}
      </ButtonContainer>
    </TouchableOpacity>
  );
}

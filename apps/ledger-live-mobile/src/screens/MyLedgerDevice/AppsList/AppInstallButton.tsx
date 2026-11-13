import { track } from "@shared/analytics";
import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import manager from "@ledgerhq/live-common/manager/index";

import type { App } from "@ledgerhq/types-live";
import type { State } from "@ledgerhq/live-common/apps/index";
import { useAppInstallNeedsDeps } from "@ledgerhq/live-common/apps/react";
import styled from "styled-components/native";
import { IconsLegacy, Box } from "@ledgerhq/native-ui";
import { useSetAppsWithDependenciesToInstallUninstall } from "../AppsInstallUninstallWithDependenciesContext";

type Props = {
  app: App;
  state: State;
  notEnoughMemoryToInstall: boolean;
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
  notEnoughMemoryToInstall,
  storageWarning,
}: Props) {
  const canBeInstalled = useMemo(() => manager.canHandleInstall(app), [app]);

  const { name } = app;
  const { updateAllQueue } = state;

  const needsDependencies = useAppInstallNeedsDeps(state, app);

  const { setAppWithDependenciesToInstall, installApp: installAppWithDisclaimer } =
    useSetAppsWithDependenciesToInstallUninstall();

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

    track(`${name.replace(/\s/g, "").toLowerCase()}_installed`, {
      installType: "manager",
    });

    if (needsDependencies) {
      setAppWithDependenciesToInstall(needsDependencies);
    } else {
      installAppWithDisclaimer(app);
    }
  }, [
    app,
    disabled,
    name,
    needsDependencies,
    setAppWithDependenciesToInstall,
    installAppWithDisclaimer,
    notEnoughMemoryToInstall,
    storageWarning,
  ]);

  return (
    <TouchableOpacity onPress={installApp} testID={`app-${name}-notInstalled`}>
      <ButtonContainer borderColor="neutral.c30">
        {canBeInstalled ? <IconsLegacy.PlusMedium size={18} color="neutral.c100" /> : null}
      </ButtonContainer>
    </TouchableOpacity>
  );
}

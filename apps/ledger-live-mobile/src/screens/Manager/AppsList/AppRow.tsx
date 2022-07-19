import React, { memo, useMemo, useCallback } from "react";

import { App } from "@ledgerhq/live-common/types/manager";

import { State, Action } from "@ledgerhq/live-common/apps/index";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/apps/react";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";
import ByteSize from "../../../components/ByteSize";

type Props = {
  app: App;
  state: State;
  dispatch: (action: Action) => void;
  isInstalledView: boolean;
  setAppInstallWithDependencies: (params: {
    app: App;
    dependencies: App[];
  }) => void;
  setAppUninstallWithDependencies: (params: {
    dependents: App[];
    app: App;
  }) => void;
  setStorageWarning: () => void;
  managerTabs: any;
  optimisticState: State;
};

const RowContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingVertical: 14,
  height: 64,
})``;

const LabelContainer = styled(Flex).attrs({
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: "40%",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingHorizontal: 12,
})``;

const VersionContainer = styled(Flex).attrs({
  borderWidth: 1,
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 4,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 2,
})``;

const AppRow = ({
  app,
  state,
  dispatch,
  isInstalledView,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  optimisticState,
}: Props) => {
  const { name, bytes, version: appVersion, displayName } = app;
  const { installed, deviceInfo } = state;

  const isInstalled = useMemo(() => installed.find(i => i.name === name), [
    installed,
    name,
  ]);

  const version = (isInstalled && isInstalled.version) || appVersion;
  const availableVersion =
    (isInstalled && isInstalled.availableVersion) || appVersion;

  const notEnoughMemoryToInstall = useNotEnoughMemoryToInstall(
    optimisticState,
    name,
  );

  const onSizePress = useCallback(() => setStorageWarning(name), [
    setStorageWarning,
    name,
  ]);

  return (
    <RowContainer>
      <AppIcon app={app} size={48} />
      <LabelContainer>
        <Text
          numberOfLines={1}
          variant="body"
          fontWeight="semiBold"
          color="neutral.c100"
        >
          {displayName}
        </Text>
        <VersionContainer borderColor="neutral.c40">
          <Text
            numberOfLines={1}
            variant="tiny"
            color="neutral.c80"
            fontWeight="semiBold"
          >
            <Trans i18nKey="ApplicationVersion" values={{ version }} />
            {isInstalled && !isInstalled.updated && (
              <>
                {" "}
                <Trans
                  i18nKey="manager.appList.versionNew"
                  values={{
                    newVersion:
                      availableVersion !== version
                        ? ` ${availableVersion}`
                        : "",
                  }}
                />
              </>
            )}
          </Text>
        </VersionContainer>
      </LabelContainer>
      <Text variant="body" fontWeight="medium" color="neutral.c70" my={3}>
        <ByteSize
          value={bytes}
          deviceModel={state.deviceModel}
          firmwareVersion={deviceInfo.version}
        />
      </Text>
      <AppStateButton
        app={app}
        state={state}
        dispatch={dispatch}
        notEnoughMemoryToInstall={notEnoughMemoryToInstall}
        isInstalled={!!isInstalled}
        isInstalledView={isInstalledView}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        storageWarning={onSizePress}
      />
    </RowContainer>
  );
};

export default memo(AppRow);

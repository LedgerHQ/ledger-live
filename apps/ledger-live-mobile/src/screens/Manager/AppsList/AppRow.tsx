import React, { memo, useMemo, useCallback } from "react";

import { App } from "@ledgerhq/types-live";

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { State, Action } from "@ledgerhq/live-common/apps/index";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/apps/react";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import manager from "@ledgerhq/live-common/manager/index";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";
import ByteSize from "~/components/ByteSize";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  setStorageWarning: (value: string | null) => void;
  optimisticState: State;
};

const RowContainer = styled(Flex).attrs((p: { disabled?: boolean }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingVertical: 14,
  height: 64,
  opacity: p.disabled ? 0.2 : 1,
}))<{ disabled?: boolean }>``;

const LabelContainer = styled(Flex).attrs({
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: "50%",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  paddingHorizontal: 12,
})``;

export default memo(function AppRow({
  app,
  state,
  dispatch,
  setStorageWarning,
  optimisticState,
}: Props) {
  const { name: appName, version: appVersion, displayName, authorName } = app;
  const { installed, deviceInfo, deviceModel } = state;
  const canBeInstalled = useMemo(() => manager.canHandleInstall(app), [app]);

  const installedApp = useMemo(
    () => installed.find(({ name }) => name === appName),
    [appName, installed],
  );

  const curVersion = installedApp?.version || appVersion;
  const nextVersion = installedApp?.availableVersion ?? "";

  const notEnoughMemoryToInstall = useNotEnoughMemoryToInstall(optimisticState, appName);

  const onSizePress = useCallback(() => setStorageWarning(appName), [setStorageWarning, appName]);

  const appBytes = useMemo(
    () => (installedApp?.blocks || 0) * deviceModel.getBlockSize(deviceInfo.version) || app.bytes,
    [app.bytes, deviceInfo.version, deviceModel, installedApp?.blocks],
  );

  const { enabled: displayAppDeveloperName } = useFeature("myLedgerDisplayAppDeveloperName") ?? {};

  return (
    <RowContainer
      disabled={!installedApp && !canBeInstalled}
      testID={`manager-app-row-${app.name}`}
    >
      <AppIcon app={app} size={48} />
      <LabelContainer>
        <Text numberOfLines={1} variant="body" fontWeight="semiBold" color="neutral.c100" mb={2}>
          {displayName}
        </Text>
        <Flex flexDirection={"row"} alignItems={"center"} justifyContent="flex-start">
          <Tag uppercase={false}>
            <Trans i18nKey="ApplicationVersion" values={{ version: curVersion }} />
            {installedApp && !installedApp.updated && (
              <>
                {" "}
                <Trans
                  i18nKey="manager.appList.versionNew"
                  values={{
                    newVersion: nextVersion,
                  }}
                />
              </>
            )}
          </Tag>
          {authorName && displayAppDeveloperName ? (
            <Text
              variant="small"
              fontWeight="medium"
              color="neutral.c70"
              pl={3}
              flexShrink={1}
              numberOfLines={1}
            >
              {authorName}
            </Text>
          ) : null}
        </Flex>
      </LabelContainer>
      <Text variant="body" fontWeight="medium" color="neutral.c80" my={3}>
        <ByteSize value={appBytes} deviceModel={deviceModel} firmwareVersion={deviceInfo.version} />
      </Text>
      <AppStateButton
        app={app}
        state={state}
        dispatch={dispatch}
        notEnoughMemoryToInstall={notEnoughMemoryToInstall}
        isInstalled={!!installedApp}
        storageWarning={onSizePress}
      />
    </RowContainer>
  );
});

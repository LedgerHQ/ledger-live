import React, { memo, useMemo, useCallback } from "react";

import { App } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { State, Action } from "@ledgerhq/live-common/apps/index";
import { useNotEnoughMemoryToInstall } from "@ledgerhq/live-common/apps/react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";
import ByteSize from "../../../components/ByteSize";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  setAppInstallWithDependencies: (_: { app: App; dependencies: App[] }) => void;
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
  setStorageWarning: (value: string | null) => void;
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
  flexBasis: "35%",
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
  flexShrink: 1,
  flexBasis: "15%",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 2,
})``;

const AppRow = ({
  app,
  state,
  dispatch,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  setStorageWarning,
  optimisticState,
}: Props) => {
  const appAuthorNameFeature = useFeature("appAuthorName");
  const { name, bytes, version: appVersion, displayName, authorName } = app;
  const { installed, deviceInfo } = state;
  const { t } = useTranslation();

  const isInstalled = useMemo(
    () => installed.find(i => i.name === name),
    [installed, name],
  );

  const developedBy = authorName || t("manager.appList.thirdParty");

  const version = (isInstalled && isInstalled.version) || appVersion;
  const availableVersion =
    (isInstalled && isInstalled.availableVersion) || appVersion;

  const notEnoughMemoryToInstall = useNotEnoughMemoryToInstall(
    optimisticState,
    name,
  );

  const onSizePress = useCallback(
    () => setStorageWarning(name),
    [setStorageWarning, name],
  );

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
        {appAuthorNameFeature?.enabled && (
           <Text variant="tiny" fontWeight="medium" color="neutral.c70">
             {`${t('manager.appList.developedBy')} ${developedBy}`}
           </Text>
         )}
      </LabelContainer>
      <VersionContainer borderColor="neutral.c40" mx={3}>
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
      <VersionContainer borderColor="neutral.c40">
        <Text
            numberOfLines={1}
            variant="tiny"
            color="neutral.c80"
            fontWeight="semiBold">
          <ByteSize
            value={bytes}
            deviceModel={state.deviceModel}
            firmwareVersion={deviceInfo.version}
          />
        </Text>
      </VersionContainer>
      <AppStateButton
        app={app}
        state={state}
        dispatch={dispatch}
        notEnoughMemoryToInstall={notEnoughMemoryToInstall}
        isInstalled={!!isInstalled}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        storageWarning={onSizePress}
      />
    </RowContainer>
  );
};

export default memo(AppRow);

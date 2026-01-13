import React, { useCallback, useContext, useEffect, useState } from "react";
import { Flex, Icons, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";
import { AppBlocker } from "../AppBlocker";
import { version as LLD_VERSION } from "../../../../../../package.json";
import os from "os";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import styled from "styled-components";
import { useFirebaseRemoteConfig } from "~/renderer/components/FirebaseRemoteConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import ButtonV3 from "~/renderer/components/ButtonV3";

const platformsNames: Record<string, "windows" | "linux" | "macOS"> = {
  win32: "windows",
  darwin: "macOS",
  linux: "linux",
  freebsd: "linux",
};

const Circle = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  display: inline-flex;
  background-color: ${p => p.theme.colors.error.c60};
`;

const Spacer = styled.div`
  width: 8px;
`;

export function AppVersionBlocker({ children }: { children: React.ReactNode }) {
  const { config: remoteConfig, lastFetchTime } = useFirebaseRemoteConfig();
  const [configLlMinVersion, setConfigLLMinVersion] = useState(
    LiveConfig.getValueByKey("config_ll_min_version"),
  );
  useEffect(() => {
    setConfigLLMinVersion(LiveConfig.getValueByKey("config_ll_min_version"));
  }, [lastFetchTime, remoteConfig]);
  const { shouldUpdate } = useAppVersionBlockCheck({
    appKey: "lld",
    appVersion: LLD_VERSION,
    platform: platformsNames[os.platform()],
    getConfigValue: () => configLlMinVersion,
  });
  const updaterContext = useContext(UpdaterContext);
  const urlLive = useLocalizedUrl(urls.liveHome);

  const onPressDownload = useCallback(() => {
    if (updaterContext?.status === "error") {
      openURL(urlLive);
    } else {
      updaterContext?.quitAndInstall();
    }
  }, [updaterContext, urlLive]);

  return (
    <AppBlocker
      blocked={shouldUpdate}
      IconComponent={() => (
        <Circle>
          {updaterContext?.status === "error" ? (
            <Icons.Close size="S" color="primary" data-testID="error-icon" />
          ) : (
            <Icons.CloudDownload size="S" color="primary" data-testID="cloud-download-icon" />
          )}
        </Circle>
      )}
      TitleComponent={() => (
        <Text variant="bodyLineHeight" color="neutral.c100" fontSize={24} marginTop={24}>
          <Trans
            i18nKey={
              updaterContext?.status === "error"
                ? "versionBlocking.errorTitle"
                : "versionBlocking.title"
            }
          />
        </Text>
      )}
      DescriptionComponent={() => (
        <Text
          variant="body"
          fontSize={14}
          color="neutral.c70"
          marginTop={16}
          maxWidth={365}
          textAlign="center"
        >
          <Trans
            i18nKey={
              updaterContext?.status === "error"
                ? "versionBlocking.errorDescription"
                : "versionBlocking.description"
            }
          />
        </Text>
      )}
      CTAComponent={() => (
        <ButtonV3
          size="medium"
          variant="main"
          fontSize={24}
          onClick={onPressDownload}
          isLoading={["downloading-update", "download-progress"].includes(
            updaterContext?.status || "",
          )}
          alignSelf="center"
          minWidth={105}
          marginTop={12}
        >
          {["download-progress", "downloading-update"].includes(updaterContext?.status || "") ? (
            <Flex flexDirection="row" alignItems="center">
              <InfiniteLoader size={16} color="neutral.c30" />
              <Spacer />
              <Trans
                i18nKey="versionBlocking.downloadProgress"
                values={{
                  progress: updaterContext?.downloadProgress,
                }}
              />
            </Flex>
          ) : updaterContext?.status === "error" ? (
            <Trans i18nKey="versionBlocking.downloadOnLedger" />
          ) : (
            <Trans i18nKey="versionBlocking.restart" />
          )}
        </ButtonV3>
      )}
    >
      {children}
    </AppBlocker>
  );
}

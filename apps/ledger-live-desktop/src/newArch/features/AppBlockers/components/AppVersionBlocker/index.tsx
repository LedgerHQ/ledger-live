import React, { useCallback, useContext, useEffect, useState } from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";
import { AppBlocker } from "../AppBlocker/index";
import { version as LLD_VERSION } from "../../../../../../package.json";
import os from "os";
import { UpdaterContext } from "~/renderer/components/Updater/UpdaterContext";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import styled from "styled-components";
import { useFirebaseRemoteConfig } from "~/renderer/components/FirebaseRemoteConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import Button from "~/renderer/components/ButtonV3";

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
          <Icons.CloudDownload size="S" color="primary" data-testID="cloud-download-icon" />
        </Circle>
      )}
      TitleComponent={() => (
        <Text variant="bodyLineHeight" color="neutral.c100" fontSize={24} marginTop={24}>
          <Trans i18nKey="versionBlocking.title" />
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
          <Trans i18nKey="versionBlocking.description" />
        </Text>
      )}
      CTAComponent={() => (
        <Flex flexDirection="column">
          {updaterContext?.status === "download-progress" ? (
            <Text
              variant="body"
              fontSize={14}
              color="neutral.c70"
              marginTop={16}
              textAlign="justify"
            >
              <Trans i18nKey="update.downloadInProgress" />{" "}
              <Trans
                i18nKey="update.downloadProgress"
                values={{
                  progress: updaterContext?.downloadProgress,
                }}
              />
            </Text>
          ) : null}
          <Button
            size="medium"
            variant="main"
            onClick={onPressDownload}
            disabled={["downloading-update", "download-progress"].includes(
              updaterContext?.status || "",
            )}
            alignSelf="center"
            width={105}
            marginTop={12}
          >
            <Trans i18nKey="versionBlocking.update" />
          </Button>
        </Flex>
      )}
    >
      {children}
    </AppBlocker>
  );
}

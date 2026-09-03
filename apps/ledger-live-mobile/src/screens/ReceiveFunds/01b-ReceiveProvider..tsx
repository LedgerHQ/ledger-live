import React from "react";

import { ScreenName } from "~/const";

import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useManifestWithSessionId } from "@ledgerhq/live-common/hooks/useManifestWithSessionId";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { getNoahGoToURL, type NoahAuthPath } from "@features/flow-pay-bank-transfer";
import WebRecievePlayer from "~/components/WebReceivePlayer";
import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useSelector } from "~/context/hooks";
import { analyticsEnabledSelector, languageSelector } from "~/reducers/settings";

export default function ReceiveProvider(
  props: StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveProvider>,
) {
  const { manifestId, noahAuth } = props?.route?.params ?? {};
  let authPath: NoahAuthPath | undefined;
  if (noahAuth === "createAccount") {
    authPath = "/auth/signup";
  }
  if (noahAuth === "logIn") {
    authPath = "/auth/signin";
  }
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;
  const shareAnalytics = useSelector(analyticsEnabledSelector);
  const lang = useSelector(languageSelector);
  const { manifest: manifestWithSessionId, loading: sessionIdLoading } = useManifestWithSessionId({
    manifest,
    shareAnalytics,
  });
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const goToURL = getNoahGoToURL(manifestWithSessionId?.url.toString(), authPath, { lang });

  return manifestWithSessionId ? (
    <WebRecievePlayer
      key={goToURL ?? "catalog"}
      manifest={manifestWithSessionId}
      inputs={goToURL ? { goToURL } : undefined}
    />
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading || sessionIdLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={new Error("App not found")} />
      )}
    </Flex>
  );
}

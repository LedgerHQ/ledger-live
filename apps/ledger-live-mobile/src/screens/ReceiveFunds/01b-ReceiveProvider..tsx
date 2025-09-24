import React from "react";

import { ScreenName } from "~/const";

import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import WebRecievePlayer from "~/components/WebReceivePlayer";
import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

export default function ReceiveProvider(
  props: StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveProvider>,
) {
  // 1. grab the manifestId from the route params
  const { manifestId } = props?.route?.params ?? {};

  // 2. get the manifest
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;

  // Below can be used for loading
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  return manifest ? (
    <WebRecievePlayer manifest={manifest} />
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={new Error("App not found")} />
      )}
    </Flex>
  );
}

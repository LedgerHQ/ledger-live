import semver from "semver";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import React, { useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { WebView as WebViewV2 } from "./WebViewV2";
import { WebView } from "./WebView";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

const ledgerRecoverIds = [
  "protect",
  "protect-preprod",
  "protect-prod",
  "protect-sit",
];

const WebViewWrapper = ({ manifest, inputs }: Props) => {
  const isManifestOfLedgerRecover = useMemo(
    () => ledgerRecoverIds.includes(manifest.id),
    [manifest.id],
  );
  const navigation = useNavigation();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isManifestOfLedgerRecover) {
      return navigation.addListener("beforeRemove", event => {
        event.preventDefault();
      });
    }
  }, [isManifestOfLedgerRecover, navigation]);

  if (semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return (
      <WebViewV2
        manifest={manifest}
        inputs={inputs}
        hideHeader={isManifestOfLedgerRecover}
      />
    );
  }
  return <WebView manifest={manifest} inputs={inputs} />;
};

export default WebViewWrapper;

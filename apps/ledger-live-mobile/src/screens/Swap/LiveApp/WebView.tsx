import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { flattenAccountsSelector } from "~/reducers/accounts";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: React.Dispatch<React.SetStateAction<WebviewState>>;
};

export function WebView({ manifest, setWebviewState }: Props) {
  const accounts = useSelector(flattenAccountsSelector);

  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customHandlers = useMemo(
    () => ({
      ...loggerHandlers,
      ...customPTXHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customPTXHandlers],
  );

  return (
    <Web3AppWebview
      manifest={manifest}
      customHandlers={customHandlers}
      onStateChange={setWebviewState}
    />
  );
}

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { type RefObject } from "react";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import {
  WebviewAPI,
  WebviewProps,
  WebviewState,
  WebviewLoader,
} from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { PerpsLoader } from "LLD/features/Perps/components/PerpsLoader";
import type { PerpsWebviewInputs } from "../PerpsApp/usePerpsAppViewModel";

export type PerpsWebProps = {
  manifest: LiveAppManifest;
  inputs: PerpsWebviewInputs;
  webviewAPIRef: RefObject<WebviewAPI | null>;
  webviewState: WebviewState;
  onStateChange: WebviewProps["onStateChange"];
  enablePlatformDevTools: boolean;
  isEmbedded?: boolean;
  Loader?: WebviewLoader;
};

export const PerpsWebView = ({
  manifest,
  inputs,
  webviewAPIRef,
  webviewState,
  onStateChange,
  enablePlatformDevTools,
  Loader = PerpsLoader,
}: PerpsWebProps) => {
  return (
    <>
      {enablePlatformDevTools && (
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
      )}

      <div className="flex w-full flex-1 flex-col">
        <Web3AppWebview
          manifest={manifest}
          inputs={{
            ...inputs,
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          Loader={Loader}
        />
      </div>
    </>
  );
};

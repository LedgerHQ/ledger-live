import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar, TopBarConfig } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "../WebPTXPlayer/CustomHandlers";
import { useCurrentAccountHistDB } from "~/renderer/screens/platform/v2/hooks";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useACRECustomHandlers } from "./CustomHandlers";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

export const Wrapper = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;

export type WebPlatformPlayerConfig = {
  topBarConfig?: TopBarConfig;
};

type Props = {
  onClose?: () => void;
  config?: WebPlatformPlayerConfig;
} & WebviewProps;

export default function WebPlatformPlayer({ manifest, inputs, onClose, config, ...props }: Props) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const accounts = useSelector(flattenAccountsSelector);
  const customACREHandlers = useACRECustomHandlers(manifest, accounts);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      ...customACREHandlers,
      ...customPTXHandlers,
    };
  }, [customACREHandlers, customPTXHandlers]);

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);
    props.onStateChange?.(state);
  };

  const currentAccountHistDb: CurrentAccountHistDB = useCurrentAccountHistDB();

  return (
    <Container>
      <Wrapper>
        <TopBar
          manifest={manifest}
          onClose={onClose}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
          config={config?.topBarConfig}
          currentAccountHistDb={currentAccountHistDb}
        />
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers}
          currentAccountHistDb={currentAccountHistDb}
        />
      </Wrapper>
    </Container>
  );
}

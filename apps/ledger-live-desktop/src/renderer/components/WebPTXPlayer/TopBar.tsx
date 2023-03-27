import React, { RefObject, useCallback, useEffect, useRef, useMemo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { rgba } from "~/renderer/styles/helpers";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";

import Box, { Tabbable } from "~/renderer/components/Box";

import ArrowRight from "~/renderer/icons/ArrowRight";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

import { useSelector } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { WebviewState, WebviewAPI } from "../Web3AppWebview/types";
import Spinner from "../Spinner";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const ItemContainer: ThemedComponent<{
  "data-e2e"?: string;
  isInteractive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  justifyContent?: string;
  hidden?: boolean;
}> = styled(Tabbable).attrs(p => ({
  padding: 1,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))`
  -webkit-app-region: no-drag;
  height: 24px;
  position: relative;
  cursor: ${p => (p.isInteractive ? "pointer" : "initial")};
  pointer-events: ${p => (p.disabled ? "none" : "unset")};
  user-select: none;
  transition: opacity ease-out 100ms;
  opacity: ${p => (p.hidden ? "0" : "1")};

  margin-right: 16px;
  &:last-child {
    margin-right: 0;
  }

  > * + * {
    margin-left: 8px;
  }

  &:hover {
    color: ${p => (p.disabled ? "" : p.theme.colors.palette.text.shade100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.05))};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.1))};
  }
`;

const ItemContent = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  font-size: 14px;
  line-height: 20px;
`;

export const Separator = styled.div`
  margin-right: 16px;
  height: 15px;
  width: 1px;
  background: ${p => p.theme.colors.palette.divider};
`;

const RightContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ml: "auto",
}))``;

export type Props = {
  icon?: boolean;
  manifest: LiveAppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
};

export const TopBar = ({ manifest, webviewAPIRef, webviewState }: Props) => {
  const lastMatchingURL = useRef<string | null>(null);

  const isWhitelistedDomain = useMemo(() => {
    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [manifest.url, webviewState.url]);

  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onOpenDevTools = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.openDevTools();
  }, [webviewAPIRef]);

  const onBackToMatchingURL = useCallback(async () => {
    const webview = safeGetRefValue(webviewAPIRef);
    const url = safeGetRefValue(lastMatchingURL);

    await webview.loadURL(url);
    webview.clearHistory();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  useEffect(() => {
    if (isWhitelistedDomain) {
      lastMatchingURL.current = webviewState.url;
    }
  }, [isWhitelistedDomain, webviewState.url]);

  const isLoading = useDebounce(webviewState.loading, 100);

  return (
    <Container>
      {!isWhitelistedDomain ? (
        <ItemContainer isInteractive onClick={onBackToMatchingURL}>
          <ArrowRight flipped size={16} />
          <ItemContent>
            <Trans i18nKey="common.backToMatchingURL" values={{ appName: manifest.name }} />
          </ItemContent>
        </ItemContainer>
      ) : null}
      <ItemContainer isInteractive onClick={handleReload}>
        <IconReload size={16} />
        <ItemContent>
          <Trans i18nKey="common.sync.refresh" />
        </ItemContent>
      </ItemContainer>
      {enablePlatformDevTools ? (
        <>
          <Separator />
          <ItemContainer isInteractive onClick={onOpenDevTools}>
            <LightBulb size={16} />
            <ItemContent>
              <Trans i18nKey="common.sync.devTools" />
            </ItemContent>
          </ItemContainer>
        </>
      ) : null}
      <RightContainer>
        <ItemContainer hidden={!isLoading}>
          <Spinner isRotating size={16} data-test-id="web-ptx-player-topbar-activity-indicator" />
        </ItemContainer>
      </RightContainer>
    </Container>
  );
};

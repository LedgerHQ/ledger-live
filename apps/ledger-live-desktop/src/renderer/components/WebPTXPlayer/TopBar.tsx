import React, { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { useHistory, useRouteMatch } from "react-router";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { rgba } from "~/renderer/styles/helpers";
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
import { track } from "~/renderer/analytics/segment";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const ItemContainer = styled(Tabbable).attrs(p => ({
  padding: 1,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))<{
  "data-e2e"?: string;
  isInteractive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  justifyContent?: string;
  hidden?: boolean;
}>`
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
  const history = useHistory();
  const match = useRouteMatch();
  const { localStorage } = window;

  const isInternalApp = useMemo(() => {
    if (!INTERNAL_APP_IDS.includes(manifest.id)) {
      return false;
    }

    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [manifest.id, manifest.url, webviewState.url]);

  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const onOpenDevTools = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.openDevTools();
  }, [webviewAPIRef]);

  const onBackToMatchingURL = useCallback(async () => {
    const manifestId = localStorage.getItem("manifest-id") || "";

    if (manifestId) {
      const flowName = localStorage.getItem("flow-name") || "";

      track("button_clicked2", {
        button: ["buy", "sell"].includes(flowName) ? "back to quote" : "back to liveapp",
        provider: manifestId,
        flow: flowName,
      });

      history.replace({
        pathname: "/exchange",
        search: `?referrer=isExternal`,
        state: {
          mode: flowName,
        },
      });
    } else {
      const currentHostname = new URL(webviewState.url).hostname;
      const webview = safeGetRefValue(webviewAPIRef);
      const safeUrl = safeGetRefValue(lastMatchingURL);
      const url = new URL(safeUrl);
      const urlParams = new URLSearchParams(url.searchParams);
      const flowName = urlParams.get("liveAppFlow");

      track("button_clicked2", {
        button: flowName === "compare_providers" ? "back to quote" : "back to liveapp",
        provider: currentHostname,
        flow: flowName,
      });

      await webview.loadURL(safeUrl);
      webview.clearHistory();
    }
  }, [localStorage, history, webviewAPIRef, webviewState.url]);

  const getButtonLabel = useCallback(() => {
    const lastScreen = localStorage.getItem("last-screen") || "";

    return lastScreen === "compare_providers" ? "Quote" : manifest.name;
  }, [localStorage, manifest]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  useEffect(() => {
    if (isInternalApp) {
      const url = safeUrl(webviewState.url);
      const manifestId = url ? url.searchParams.get("goToManifest") : undefined;

      if (url && manifestId) {
        const goToURL = url.searchParams.get("goToURL");

        if (goToURL) {
          localStorage.setItem("manifest-id", manifestId);
          localStorage.setItem("flow-name", url.searchParams.get("flowName") || "buy");
          localStorage.setItem("last-screen", url.searchParams.get("lastScreen") || "");

          history.replace(`${match.url}/${manifestId}?goToURL=${goToURL}`);
        }
      } else {
        lastMatchingURL.current = webviewState.url;
      }
    }
  }, [localStorage, history, isInternalApp, match.url, webviewState.url]);

  const isLoading = useDebounce(webviewState.loading, 100);

  return (
    <Container>
      {!isInternalApp ? (
        <ItemContainer isInteractive onClick={onBackToMatchingURL}>
          <ArrowRight flipped size={16} />
          <ItemContent>
            <Trans i18nKey="common.backToMatchingURL" values={{ appName: getButtonLabel() }} />
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

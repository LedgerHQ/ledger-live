// @flow

import { WebviewTag } from "electron";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { rgba } from "~/renderer/styles/helpers";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";

import Box, { Tabbable } from "~/renderer/components/Box";

import ArrowRight from "~/renderer/icons/ArrowRight";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";

import { useSelector } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";

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
  cursor: pointer;
  pointer-events: ${p => (p.disabled ? "none" : "unset")};

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

export type Props = {
  manifest: LiveAppManifest;
  webview: WebviewTag;
};

export const TopBar = ({ manifest, webview }: Props) => {
  const lastMatchingURL = useRef("");
  const [isMatchingURL, setIsMatchingURL] = useState(true);

  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onOpenDevTools = useCallback(() => {
    if (webview) {
      webview.openDevTools();
    }
  }, [webview]);

  const onBackToMatchingURL = useCallback(async () => {
    if (webview) {
      await webview.loadURL(lastMatchingURL.current);
      webview.clearHistory();
    }
  }, [webview]);

  const handleReload = useCallback(() => {
    if (webview) {
      webview.reloadIgnoringCache();
    }
  }, [webview]);

  const handleDidNavigate = useCallback(() => {
    if (webview) {
      const url = webview.getURL();
      const manifestHostname = new URL(manifest.url).hostname;
      const isOriginUrl = url.includes(manifestHostname);
      if (isOriginUrl) {
        lastMatchingURL.current = url; // WARN: last Web3App URL can't auto redirect to an external URL. If so this will create a loop when navigating back.
      }
      setIsMatchingURL(isOriginUrl);
    }
  }, [webview, manifest]);

  useEffect(() => {
    if (webview) {
      webview.addEventListener("did-navigate", handleDidNavigate);
      webview.addEventListener("did-navigate-in-page", handleDidNavigate);
      webview.addEventListener("dom-ready", handleDidNavigate);

      return () => {
        webview.removeEventListener("did-navigate", handleDidNavigate);
        webview.removeEventListener("did-navigate-in-page", handleDidNavigate);
        webview.removeEventListener("dom-ready", handleDidNavigate);
      };
    }
  }, [handleDidNavigate, webview]);

  return (
    <Container>
      {!isMatchingURL && (
        <ItemContainer isInteractive onClick={onBackToMatchingURL}>
          <ArrowRight flipped size={16} />
          <ItemContent>
            <Trans i18nKey="common.backToMatchingURL" values={{ appName: manifest.name }} />
          </ItemContent>
        </ItemContainer>
      )}{" "}
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
    </Container>
  );
};

// @flow

import { WebviewTag } from "electron";
import React, { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { rgba } from "~/renderer/styles/helpers";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";

import Box, { Tabbable } from "~/renderer/components/Box";

import ArrowRight from "~/renderer/icons/ArrowRight";
import IconClose from "~/renderer/icons/Cross";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";

import { useDispatch, useSelector } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import LiveAppIcon from "./LiveAppIcon";

import { openPlatformAppInfoDrawer } from "~/renderer/actions/UI";

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const TitleContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ff: "Inter|SemiBold",
}))`
  margin-right: 16px;
  color: ${p =>
    p.theme.colors.palette.type === "dark" ? p.theme.colors.white : p.theme.colors.black};

  > * + * {
    margin-left: 8px;
  }
`;

const RightContainer = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
  ml: "auto",
}))``;

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

export type TopBarConfig = {
  shouldDisplayName?: boolean;
  shouldDisplayInfo?: boolean;
  shouldDisplayClose?: boolean;
  shouldDisplayNavigation?: boolean;
};

export type Props = {
  icon?: boolean;
  manifest: LiveAppManifest;
  onClose?: () => void;
  config?: TopBarConfig;
  webview: WebviewTag;
};

export const TopBar = ({ manifest, onClose, config = {}, webview }: Props) => {
  const { name, icon } = manifest;

  const {
    shouldDisplayName = true,
    shouldDisplayInfo = true,
    shouldDisplayClose = !!onClose,
    shouldDisplayNavigation = false,
  } = config;

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const dispatch = useDispatch();

  const handleDidNavigate = useCallback(() => {
    setCanGoBack(webview.canGoBack());
    setCanGoForward(webview.canGoForward());
  }, [webview]);

  useEffect(() => {
    /**
     * Handle webview navigation events.
     * The two events are complementary to enccompass the webview's navigation
     *
     * `did-navigate` is emitted when a navigation is done. But this event is not
     * emitted for in-page navigations, such as clicking anchor links or updating
     * the window.location.hash.
     * That's why we use did-navigate-in-page event for this purpose.
     * cf. doc bellow:
     *
     * https://www.electronjs.org/docs/latest/api/webview-tag#event-did-navigate
     * https://www.electronjs.org/docs/latest/api/webview-tag#event-did-navigate-in-page
     */

    if (shouldDisplayNavigation) {
      webview.addEventListener("did-navigate", handleDidNavigate);
      webview.addEventListener("did-navigate-in-page", handleDidNavigate);

      return () => {
        webview.removeEventListener("did-navigate", handleDidNavigate);
        webview.removeEventListener("did-navigate-in-page", handleDidNavigate);
      };
    }
  }, [handleDidNavigate, webview, shouldDisplayNavigation]);

  const handleReload = useCallback(() => {
    if (webview) {
      webview.reloadIgnoringCache();
    }
  }, [webview]);

  const onClick = useCallback(() => {
    dispatch(openPlatformAppInfoDrawer({ manifest }));
  }, [manifest, dispatch]);

  const onOpenDevTools = useCallback(() => {
    webview.openDevTools();
  }, [webview]);

  const onGoBack = useCallback(() => {
    webview.goBack();
  }, [webview]);

  const onGoForward = useCallback(() => {
    webview.goForward();
  }, [webview]);

  return (
    <Container>
      {shouldDisplayName ? (
        <>
          <TitleContainer>
            <LiveAppIcon name={name} icon={icon || undefined} size={20} />
            <ItemContent data-test-id="live-app-title">{name}</ItemContent>
          </TitleContainer>
          <Separator />
        </>
      ) : null}
      <ItemContainer isInteractive onClick={handleReload}>
        <IconReload size={16} />
        <ItemContent>
          <Trans i18nKey="common.sync.refresh" />
        </ItemContent>
      </ItemContainer>
      {shouldDisplayNavigation ? (
        <>
          <ItemContainer disabled={!canGoBack} isInteractive onClick={onGoBack}>
            <ArrowRight flipped size={16} />
          </ItemContainer>
          <ItemContainer disabled={!canGoForward} isInteractive onClick={onGoForward}>
            <ArrowRight size={16} />
          </ItemContainer>
        </>
      ) : null}
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
      {shouldDisplayInfo || shouldDisplayClose ? (
        <RightContainer>
          {shouldDisplayInfo && (
            <ItemContainer isInteractive onClick={onClick}>
              <IconInfoCircle size={16} />
            </ItemContainer>
          )}

          {shouldDisplayClose && (
            <ItemContainer isInteractive onClick={onClose}>
              <IconClose size={16} />
            </ItemContainer>
          )}
        </RightContainer>
      ) : null}
    </Container>
  );
};

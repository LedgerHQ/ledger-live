import React, { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { rgba } from "~/renderer/styles/helpers";
import Box, { Tabbable } from "~/renderer/components/Box";
import ArrowRight from "~/renderer/icons/ArrowRight";
import LightBulb from "~/renderer/icons/LightBulb";
import IconReload from "~/renderer/icons/UpdateCircle";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { useSelector } from "LLD/hooks/redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { WebviewState, WebviewAPI } from "../Web3AppWebview/types";
import Spinner from "../Spinner";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { track } from "~/renderer/analytics/segment";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";
import Switch from "../Switch";
import { Icons } from "@ledgerhq/react-ui/index";
import Input from "~/renderer/components/Input";
import { MobileView } from "~/renderer/hooks/useMobileView";

/** When Back fails (refs not ready), redirect to this path if location.state has the key set. */
const BACK_FALLBACK_ROUTES: Record<string, string> = {
  fromCardLanding: "/card-new-wallet",
};

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object";
}

const Container = styled(Box).attrs(() => ({
  horizontal: true,
  grow: 0,
  alignItems: "center",
}))`
  padding: 10px 16px;
  background-color: ${p => p.theme.colors?.background.card};
  border-bottom: 1px solid ${p => p.theme.colors?.neutral.c30};
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
    color: ${p => (p.disabled ? "" : p.theme.colors?.neutral.c100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors?.opacityDefault.c10, 0.05))};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors?.opacityDefault.c10, 0.1))};
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
  background: ${p => p.theme.colors?.divider};
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
  webviewAPIRef: RefObject<WebviewAPI | null>;
  webviewState: WebviewState;
  mobileView: MobileView;
  setMobileView?: React.Dispatch<React.SetStateAction<MobileView>>;
};

export const TopBar = ({
  manifest,
  webviewAPIRef,
  webviewState,
  mobileView,
  setMobileView,
}: Props) => {
  const { t } = useTranslation();
  const lastMatchingURL = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { localStorage } = window;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

  const isInternalApp = useMemo(() => {
    if (!internalAppIds.includes(manifest.id)) {
      return false;
    }

    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [manifest.id, manifest.url, webviewState.url, internalAppIds]);

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

      // Extract base path from current location (remove appId segment)
      const pathParts = location.pathname.split("/");
      pathParts.pop(); // Remove the appId
      const pathname = pathParts.join("/") || "/";
      navigate(`${pathname}?referrer=isExternal`, {
        state: {
          mode: flowName,
        },
      });
    } else {
      try {
        const currentHostname = new URL(webviewState.url).hostname;
        const webview = safeGetRefValue(webviewAPIRef);
        const safeUrlValue = safeGetRefValue(lastMatchingURL);
        const url = new URL(safeUrlValue);
        const urlParams = new URLSearchParams(url.searchParams);
        const flowName = urlParams.get("liveAppFlow");

        track("button_clicked2", {
          button: flowName === "compare_providers" ? "back to quote" : "back to liveapp",
          provider: currentHostname,
          flow: flowName,
        });

        await webview.loadURL(safeUrlValue);
        webview.clearHistory();
      } catch {
        // Refs not ready: redirect using BACK_FALLBACK_ROUTES if state matches
        const state = isRecord(location.state) ? location.state : null;
        const matchedKey = state ? Object.keys(BACK_FALLBACK_ROUTES).find(key => state[key]) : null;
        const fallbackPath = matchedKey ? BACK_FALLBACK_ROUTES[matchedKey] : null;
        if (fallbackPath) {
          navigate(fallbackPath);
        }
      }
    }
  }, [localStorage, navigate, location.pathname, location.state, webviewAPIRef, webviewState.url]);

  const getButtonLabel = useCallback(() => {
    const lastScreen = localStorage.getItem("last-screen") || "";

    const screenMap: {
      [key: string]: string;
    } = {
      compare_providers: t("common.quote"),
      card: t("card.backToCard"),
    };

    return screenMap[lastScreen] || manifest.name;
  }, [localStorage, manifest, t]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const toggleMobileView = useCallback(async () => {
    setMobileView?.(prev => ({ ...prev, display: !prev.display }));
  }, [setMobileView]);

  const updateMobileWidth = useCallback(
    async (width: number) => {
      setMobileView?.(prev => ({ ...prev, width: width > 0 ? width : 355 }));
    },
    [setMobileView],
  );

  useEffect(() => {
    if (isInternalApp) {
      const url = safeUrl(webviewState.url);
      const manifestId = url ? url.searchParams.get("goToManifest") : undefined;

      if (url && manifestId) {
        const goToURL = url.searchParams.get("goToURL");

        if (goToURL) {
          localStorage.setItem("manifest-id", manifestId);
          localStorage.setItem("flow-name", url.searchParams.get("flowName") || "buy");
          localStorage.setItem(
            "last-screen",
            url.searchParams.get("lastScreen") || url.searchParams.get("flowName") || "",
          );

          navigate(`${location.pathname}/${manifestId}?goToURL=${goToURL}`);
        }
      } else {
        lastMatchingURL.current = webviewState.url;
      }
    }
  }, [localStorage, navigate, isInternalApp, location.pathname, webviewState.url]);

  const isLoading = useDebounce(webviewState.loading, 100);

  if (!enablePlatformDevTools && isInternalApp) {
    return null;
  }

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
          <Separator />
          <ItemContainer isInteractive onClick={toggleMobileView} style={{ marginRight: 0 }}>
            <Icons.Desktop size="S" />
            <ItemContent>
              <Switch isChecked={mobileView.display}></Switch>
            </ItemContent>
            <Icons.Mobile size="S" />
          </ItemContainer>
          {mobileView.display && (
            <Box style={{ marginRight: 16 }}>
              <Input
                small
                value={`${mobileView.width}` || ""}
                onChange={(e: string) => {
                  const value = parseInt(e, 10) || 0;
                  updateMobileWidth?.(value);
                }}
                onBlur={() => {
                  if (!mobileView.width) {
                    updateMobileWidth?.(355);
                  }
                }}
                style={{ width: 30, textAlign: "center" }}
                maxLength={4}
              />
            </Box>
          )}
        </>
      ) : null}
      <RightContainer>
        <ItemContainer hidden={!isLoading}>
          <Spinner isRotating size={16} data-testid="web-ptx-player-topbar-activity-indicator" />
        </ItemContainer>
      </RightContainer>
    </Container>
  );
};

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { Link, useHistory, useLocation, PromptProps } from "react-router-dom";
import { Transition } from "react-transition-group";
import styled from "styled-components";
import { useDeviceHasUpdatesAvailable } from "@ledgerhq/live-common/manager/useDeviceHasUpdatesAvailable";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Icons, Tag as TagComponent } from "@ledgerhq/react-ui";
import { accountsSelector, starredAccountsSelector } from "~/renderer/reducers/accounts";
import {
  sidebarCollapsedSelector,
  lastSeenDeviceSelector,
  featureFlagsButtonVisibleSelector,
  overriddenFeatureFlagsSelector,
} from "~/renderer/reducers/settings";
import { isNavigationLocked } from "~/renderer/reducers/application";
import { openModal } from "~/renderer/actions/modals";
import { setSidebarCollapsed } from "~/renderer/actions/settings";
import useExperimental from "~/renderer/hooks/useExperimental";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { darken } from "~/renderer/styles/helpers";
import { SideBarList, SideBarListItem } from "~/renderer/components/SideBar";
import Box from "~/renderer/components/Box";
import Space from "~/renderer/components/Space";
import UpdateDot from "~/renderer/components/Updater/UpdateDot";
import { Dot } from "~/renderer/components/Dot";
import Stars from "~/renderer/components/Stars";
import { BAANX_APP_ID } from "~/renderer/screens/card/CardPlatformApp";
import TopGradient from "./TopGradient";
import Hide from "./Hide";
import { track } from "~/renderer/analytics/segment";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import RecoverStatusDot from "~/renderer/components/MainSideBar/RecoverStatusDot";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

type Location = Parameters<Exclude<PromptProps["message"], string>>[0];

const MAIN_SIDEBAR_WIDTH = 230;

const MAX_STARRED_ACCOUNTS_DISPLAYED_IN_SMALL_SCREEN = 3;
const STARRED_ACCOUNT_ITEM_HEIGHT = 55;

const TagText = styled.div.attrs<{ collapsed?: boolean }>(p => ({
  style: {
    opacity: p.collapsed ? 1 : 0,
  },
}))<{ collapsed?: boolean }>`
  margin-left: ${p => p.theme.space[3]}px;
  transition: opacity 0.2s;
`;
const Tag = styled(Link)`
  display: flex;
  justify-self: flex-end;
  justify-content: flex-start;
  align-items: center;
  font-family: "Inter";
  font-weight: bold;
  font-size: 10px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  margin: 0px 16px 12px;
  color: ${p => p.theme.colors.neutral.c100};
  background-color: ${p => p.theme.colors.opacityPurple.c10};
  text-decoration: none;
  cursor: pointer;
  border: solid 1px rgba(0, 0, 0, 0);

  &:hover {
    background-color: ${p => darken(p.theme.colors.opacityDefault.c10, 0.05)};
    border-color: ${p => p.theme.colors.wallet};
  }
`;

const CustomTag = styled(TagComponent)`
  border-radius: 6px;
  padding: 2px 6px 2px 6px;
`;

const collapserSize = 24;
const collapsedWidth = 15 * 4 + 16; // 15 * 4 margins + 16 icon size

const Collapser = styled(Box).attrs(() => ({
  alignItems: "center",
  justifyContent: "center",
}))<{
  collapsed?: boolean;
}>`
  position: absolute;
  top: ${48 - collapserSize / 2}px;
  left: ${p => (p.collapsed ? collapsedWidth : MAIN_SIDEBAR_WIDTH) - collapserSize / 2}px;

  width: ${collapserSize}px;
  height: ${collapserSize}px;

  cursor: pointer;
  border-radius: 50%;
  background: linear-gradient(
      ${p => p.theme.colors.opacityDefault.c05} 0%,
      ${p => p.theme.colors.opacityDefault.c05} 100%
    ),
    ${p => p.theme.colors.background.default};
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${p => p.theme.colors.opacityDefault.c05};
  transition: all 0.5s;
  z-index: 100;

  &:hover {
    background: linear-gradient(
        ${p => p.theme.colors.opacityDefault.c10} 0%,
        ${p => p.theme.colors.opacityDefault.c10} 100%
      ),
      ${p => p.theme.colors.background.default};
  }

  & > * {
    transform: ${p => (p.collapsed ? "" : "rotate(180deg)")};
    margin-left: ${p => (p.collapsed ? "" : "-2px")};
    transition: transform 0.5s;
  }
`;
const Separator = styled(Box).attrs(() => ({
  mx: 4,
}))`
  height: 1px;
  background: ${p => p.theme.colors.neutral.c40};
`;
const sideBarTransitionStyles = {
  entering: {
    flexBasis: MAIN_SIDEBAR_WIDTH,
  },
  entered: {
    flexBasis: MAIN_SIDEBAR_WIDTH,
  },
  exiting: {
    flexBasis: collapsedWidth,
  },
  exited: {
    flexBasis: collapsedWidth,
  },
};
const enableTransitions = () =>
  document.body &&
  setTimeout(
    () => document.body && document.body.classList.remove("stop-container-transition"),
    500,
  );
const disableTransitions = () =>
  document.body && document.body.classList.add("stop-container-transition");
const sideBarTransitionSpeed = 500;
const SideBar = styled(Box).attrs(() => ({
  relative: true,
}))`
  flex: 0 0 auto;
  width: auto;
  background: linear-gradient(
      ${p => p.theme.colors.opacityDefault.c05} 0%,
      ${p => p.theme.colors.opacityDefault.c05} 100%
    ),
    ${p => p.theme.colors.background.default};
  transition: flex ${sideBarTransitionSpeed}ms;
  will-change: flex;
  transform: translate3d(0, 0, 10);

  & > ${Collapser} {
    opacity: 0;
  }

  &:hover {
    > ${Collapser} {
      opacity: 1;
    }
  }
`;
const SideBarScrollContainer = styled(Box)`
  overflow-y: scroll;
  overflow-x: hidden;

  flex: 1;

  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;

const TagContainerExperimental = ({ collapsed }: { collapsed: boolean }) => {
  const isExperimental = useExperimental();

  const { t } = useTranslation();
  return isExperimental ? (
    <Tag
      data-testid="drawer-experimental-button"
      to={{
        pathname: "/settings/experimental",
      }}
      onClick={() => setTrackingSource("sidebar")}
    >
      <Icons.Experiment size="S" color="primary.c80" />
      <TagText collapsed={collapsed}>{t("common.experimentalFeature")}</TagText>
    </Tag>
  ) : null;
};
const TagContainerFeatureFlags = ({ collapsed }: { collapsed: boolean }) => {
  const isFeatureFlagsButtonVisible = useSelector(featureFlagsButtonVisibleSelector);
  const overriddenFeatureFlags = useSelector(overriddenFeatureFlagsSelector);
  const { t } = useTranslation();
  return isFeatureFlagsButtonVisible || Object.keys(overriddenFeatureFlags).length !== 0 ? (
    <Tag
      data-testid="drawer-feature-flags-button"
      to={{
        pathname: "/settings/developer",
        state: {
          shouldOpenFeatureFlags: true,
        },
      }}
      onClick={() => setTrackingSource("sidebar")}
    >
      <Icons.Switch2 size="S" color="primary.c80" />
      <TagText collapsed={collapsed}>{t("common.featureFlags")}</TagText>
    </Tag>
  ) : null;
};

// Check if the selected tab is a Live-App under discovery tab
const checkLiveAppTabSelection = (location: Location, liveAppPaths: Array<string>) =>
  liveAppPaths.find((liveTab: string) => location?.pathname?.includes(liveTab));

const MainSideBar = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const earnLabel = useGetStakeLabelLocaleBased();
  const manifest = useRemoteLiveAppManifest(BAANX_APP_ID);
  const isCardDisabled = !manifest;

  /** redux navigation locked state */
  const navigationLocked = useSelector(isNavigationLocked);
  const collapsed = useSelector(sidebarCollapsedSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const noAccounts = useSelector(accountsSelector).length === 0;
  const totalStarredAccounts = useSelector(starredAccountsSelector).length;
  const displayBlueDot = useDeviceHasUpdatesAvailable(lastSeenDevice);

  const referralProgramConfig = useFeature("referralProgramDesktopSidebar");
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);

  const handleCollapse = useCallback(() => {
    dispatch(setSidebarCollapsed(!collapsed));
  }, [dispatch, collapsed]);
  const push = useCallback(
    (pathname: string) => {
      if (location.pathname === pathname) return;
      setTrackingSource("sidebar");
      history.push({
        pathname,
      });
    },
    [history, location.pathname],
  );

  const trackEntry = useCallback(
    (entry: string, flagged = false) => {
      track("menuentry_clicked", {
        entry,
        page: history.location.pathname,
        flagged,
      });
    },
    [history.location.pathname],
  );
  const handleClickCard = useCallback(() => {
    push("/card");
    trackEntry("card");
  }, [push, trackEntry]);
  const handleClickDashboard = useCallback(() => {
    push("/");
    trackEntry("/portfolio");
  }, [push, trackEntry]);
  const handleClickMarket = useCallback(() => {
    push("/market");
    trackEntry("market");
  }, [push, trackEntry]);
  const handleClickManager = useCallback(() => {
    push("/manager");
    trackEntry("manager");
  }, [push, trackEntry]);
  const handleClickAccounts = useCallback(() => {
    push("/accounts");
    trackEntry("accounts");
  }, [push, trackEntry]);
  const handleClickCatalog = useCallback(() => {
    push("/platform");
    trackEntry("platform");
  }, [push, trackEntry]);
  const handleClickExchange = useCallback(() => {
    push("/exchange");
    trackEntry("exchange");
  }, [push, trackEntry]);
  const openSendFlow = useOpenSendFlow();
  const handleClickEarn = useCallback(() => {
    push("/earn");
    trackEntry("earn");
  }, [push, trackEntry]);
  const handleClickSwap = useCallback(() => {
    push("/swap");
    trackEntry("swap");
  }, [push, trackEntry]);
  const handleClickRefer = useCallback(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      push(referralProgramConfig?.params.path);
      trackEntry("refer-a-friend", referralProgramConfig?.params.isNew);
    }
  }, [push, referralProgramConfig, trackEntry]);
  const maybeRedirectToAccounts = useCallback(() => {
    return location.pathname === "/manager" && push("/accounts");
  }, [location.pathname, push]);
  const handleOpenSendModal = useCallback(() => {
    maybeRedirectToAccounts();
    openSendFlow();
  }, [maybeRedirectToAccounts, openSendFlow]);
  const handleOpenReceiveModal = useCallback(() => {
    maybeRedirectToAccounts();
    dispatch(openModal("MODAL_RECEIVE", undefined));
  }, [dispatch, maybeRedirectToAccounts]);

  const handleClickRecover = useCallback(() => {
    const enabled = recoverFeature?.enabled;
    const openRecoverFromSidebar = recoverFeature?.params?.openRecoverFromSidebar;
    const liveAppId = recoverFeature?.params?.protectId;

    if (enabled && openRecoverFromSidebar && liveAppId && recoverHomePath) {
      history.push(recoverHomePath);
    } else if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
    track("button_clicked2", {
      button: "Protect",
    });
  }, [
    recoverFeature?.enabled,
    recoverFeature?.params?.openRecoverFromSidebar,
    recoverFeature?.params?.protectId,
    recoverHomePath,
    history,
    dispatch,
  ]);

  // Add your live-app path here if you don't want discovery and the live-app tabs to be both selected
  const isLiveAppTabSelected = checkLiveAppTabSelection(
    location,
    [
      referralProgramConfig?.params?.path, // Refer-a-friend
    ].filter((path): path is string => !!path), // Filter undefined values,
  );

  const getMinHeightForStarredAccountsList = () => {
    if (totalStarredAccounts === 0) {
      return "max-content"; // let it take the full height of the placeholder
    }

    const minHeight =
      Math.min(totalStarredAccounts, MAX_STARRED_ACCOUNTS_DISPLAYED_IN_SMALL_SCREEN) *
      STARRED_ACCOUNT_ITEM_HEIGHT;

    return minHeight + "px";
  };

  return (
    <Transition
      in={!collapsed}
      timeout={sideBarTransitionSpeed}
      onEnter={disableTransitions}
      onExit={disableTransitions}
      onEntered={enableTransitions}
      onExited={enableTransitions}
    >
      {state => {
        const secondAnim = !(state === "entered" && !collapsed);
        return (
          <SideBar style={sideBarTransitionStyles[state as keyof typeof sideBarTransitionStyles]}>
            <Collapser
              collapsed={collapsed}
              onClick={handleCollapse}
              data-testid="drawer-collapse-button"
            >
              <Icons.ChevronRight size="S" />
            </Collapser>

            <SideBarScrollContainer>
              <TopGradient />
              <Space of={60} />
              <SideBarList collapsed={secondAnim}>
                <SideBarListItem
                  id={"dashboard"}
                  label={t("dashboard.title")}
                  icon={Icons.Home}
                  iconActiveColor="wallet"
                  onClick={handleClickDashboard}
                  isActive={location.pathname === "/" || location.pathname.startsWith("/asset/")}
                  NotifComponent={<UpdateDot collapsed={collapsed} />}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"market"}
                  label={t("sidebar.market")}
                  icon={Icons.GraphAsc}
                  iconActiveColor="wallet"
                  onClick={handleClickMarket}
                  isActive={location.pathname.startsWith("/market")}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"accounts"}
                  label={t("sidebar.accounts")}
                  icon={Icons.Wallet}
                  iconActiveColor="wallet"
                  isActive={location.pathname.startsWith("/account")}
                  onClick={handleClickAccounts}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"send"}
                  label={t("send.title")}
                  icon={Icons.ArrowUp}
                  iconActiveColor="wallet"
                  onClick={handleOpenSendModal}
                  disabled={noAccounts || navigationLocked}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"receive"}
                  label={t("receive.title")}
                  icon={Icons.ArrowDown}
                  iconActiveColor="wallet"
                  onClick={handleOpenReceiveModal}
                  disabled={noAccounts || navigationLocked}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"swap"}
                  label={t("sidebar.swap")}
                  icon={Icons.Exchange}
                  iconActiveColor="wallet"
                  onClick={handleClickSwap}
                  isActive={location.pathname.startsWith("/swap")}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"earn"}
                  label={earnLabel}
                  icon={Icons.Percentage}
                  iconActiveColor="wallet"
                  onClick={handleClickEarn}
                  isActive={location.pathname === "/earn"}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"exchange"}
                  label={t("sidebar.exchange")}
                  icon={Icons.Dollar}
                  iconActiveColor="wallet"
                  onClick={handleClickExchange}
                  isActive={location.pathname === "/exchange"}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"catalog"}
                  label={t("sidebar.catalog")}
                  icon={Icons.Globe}
                  iconActiveColor="wallet"
                  isActive={location.pathname.startsWith("/platform") && !isLiveAppTabSelected}
                  onClick={handleClickCatalog}
                  collapsed={secondAnim}
                />
                <FeatureToggle featureId="referralProgramDesktopSidebar">
                  <SideBarListItem
                    id={"refer"}
                    label={t("sidebar.refer")}
                    icon={Icons.Gift}
                    iconActiveColor="wallet"
                    onClick={handleClickRefer}
                    isActive={
                      referralProgramConfig?.params &&
                      location.pathname.startsWith(referralProgramConfig.params.path)
                    }
                    collapsed={secondAnim}
                    NotifComponent={
                      referralProgramConfig?.params?.amount ? (
                        <CustomTag active type="plain" size="small">
                          {referralProgramConfig?.params.amount}
                        </CustomTag>
                      ) : referralProgramConfig?.params?.isNew ? (
                        <CustomTag active type="plain" size="small">
                          {t("common.new")}
                        </CustomTag>
                      ) : null
                    }
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"card"}
                  label={t("sidebar.card")}
                  icon={Icons.CreditCard}
                  iconActiveColor="wallet"
                  isActive={location.pathname === "/card"}
                  onClick={handleClickCard}
                  collapsed={secondAnim}
                  disabled={isCardDisabled}
                />
                <FeatureToggle featureId="protectServicesDesktop">
                  <SideBarListItem
                    id={"recover"}
                    label={t("sidebar.recover")}
                    icon={Icons.ShieldCheck}
                    iconActiveColor="wallet"
                    onClick={handleClickRecover}
                    collapsed={secondAnim}
                    NotifComponent={<RecoverStatusDot collapsed={collapsed} />}
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"manager"}
                  label={t("sidebar.manager")}
                  icon={Icons.LedgerDevices}
                  iconActiveColor="wallet"
                  onClick={handleClickManager}
                  isActive={location.pathname === "/manager"}
                  NotifComponent={displayBlueDot ? <Dot collapsed={collapsed} /> : null}
                  collapsed={secondAnim}
                />
              </SideBarList>

              <Space grow of={30} />
              <Hide visible={secondAnim && totalStarredAccounts > 0} mb={"-8px"}>
                <Separator />
              </Hide>
              <SideBarList
                style={{
                  maxHeight: "max-content",
                  minHeight: getMinHeightForStarredAccountsList(),
                }}
                scroll
                title={t("sidebar.stars")}
                collapsed={secondAnim}
              >
                <Stars pathname={location.pathname} collapsed={secondAnim} />
              </SideBarList>
            </SideBarScrollContainer>

            <Box pt={4}>
              <TagContainerExperimental collapsed={!secondAnim} />
              <TagContainerFeatureFlags collapsed={!secondAnim} />
            </Box>
          </SideBar>
        );
      }}
    </Transition>
  );
};
export default MainSideBar;

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory, useLocation, PromptProps } from "react-router-dom";
import { Transition } from "react-transition-group";
import styled from "styled-components";
import { useManagerBlueDot } from "@ledgerhq/live-common/manager/hooks";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { FeatureToggle, useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { IconsLegacy, Tag as TagComponent } from "@ledgerhq/react-ui";
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
import { darken, rgba } from "~/renderer/styles/helpers";
import IconChevron from "~/renderer/icons/ChevronRightSmall";
import IconExperimental from "~/renderer/icons/Experimental";
import { SideBarList, SideBarListItem } from "~/renderer/components/SideBar";
import Box from "~/renderer/components/Box";
import Space from "~/renderer/components/Space";
import UpdateDot from "~/renderer/components/Updater/UpdateDot";
import { Dot } from "~/renderer/components/Dot";
import Stars from "~/renderer/components/Stars";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { CARD_APP_ID } from "~/renderer/screens/card";
import TopGradient from "./TopGradient";
import Hide from "./Hide";
import { track } from "~/renderer/analytics/segment";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";

type Location = Parameters<Exclude<PromptProps["message"], string>>[0];

const MAIN_SIDEBAR_WIDTH = 230;
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
  padding: 2px ${p => p.theme.space[3] - 1}px;
  min-height: 32px;
  border-radius: 4px;
  margin: ${p => p.theme.space[2]}px ${p => p.theme.space[3]}px;
  color: ${p => p.theme.colors.palette.text.shade100};
  background-color: ${p => p.theme.colors.palette.background.default};
  text-decoration: none;
  cursor: pointer;
  border: solid 1px rgba(0, 0, 0, 0);

  &:hover {
    background-color: ${p => darken(p.theme.colors.palette.action.hover, 0.05)};
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
  top: ${58 - collapserSize / 2}px;
  left: ${p => (p.collapsed ? collapsedWidth : MAIN_SIDEBAR_WIDTH) - collapserSize / 2}px;

  width: ${collapserSize}px;
  height: ${collapserSize}px;

  cursor: pointer;
  border-radius: 50%;
  background: ${p => p.theme.colors.palette.background.paper};
  color: ${p => p.theme.colors.palette.text.shade80};
  border-color: ${p => p.theme.colors.palette.divider};
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid;
  transition: all 0.5s;
  z-index: 100;

  &:hover {
    border-color: ${p => p.theme.colors.wallet};
    color: ${p => p.theme.colors.wallet};
    background: ${p => rgba(p.theme.colors.wallet, 0.1)};
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
  background: ${p => p.theme.colors.palette.divider};
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
  background-color: ${p => p.theme.colors.palette.background.paper};
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
  const hasFullNodeConfigured = useEnv("SATSTACK"); // NB remove once full node is not experimental

  const { t } = useTranslation();
  return isExperimental || hasFullNodeConfigured ? (
    <Tag
      data-test-id="drawer-experimental-button"
      to={{
        pathname: "/settings/experimental",
      }}
      onClick={() => setTrackingSource("sidebar")}
    >
      <IconExperimental width={16} height={16} />
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
      data-test-id="drawer-feature-flags-button"
      to={{
        pathname: "/settings/developer",
        state: {
          shouldOpenFeatureFlags: true,
        },
      }}
      onClick={() => setTrackingSource("sidebar")}
    >
      <IconsLegacy.ChartNetworkMedium size={16} />
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
  const manifest = useRemoteLiveAppManifest(CARD_APP_ID);
  const isCardDisabled = !manifest;

  /** redux navigation locked state */
  const navigationLocked = useSelector(isNavigationLocked);
  const collapsed = useSelector(sidebarCollapsedSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const noAccounts = useSelector(accountsSelector).length === 0;
  const hasStarredAccounts = useSelector(starredAccountsSelector).length > 0;
  const displayBlueDot = useManagerBlueDot(lastSeenDevice);

  const referralProgramConfig = useFeature("referralProgramDesktopSidebar");
  const ptxEarnConfig = useFeature("ptxEarn");
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
  const handleClickLearn = useCallback(() => {
    push("/learn");
    trackEntry("learn");
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
    dispatch(openModal("MODAL_SEND", undefined));
  }, [dispatch, maybeRedirectToAccounts]);
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
          <SideBar
            className="unstoppableAnimation"
            style={sideBarTransitionStyles[state as keyof typeof sideBarTransitionStyles]}
          >
            <Collapser
              collapsed={collapsed}
              onClick={handleCollapse}
              data-test-id="drawer-collapse-button"
            >
              <IconChevron size={16} />
            </Collapser>
            <SideBarScrollContainer>
              <TopGradient />
              <Space of={70} />
              <SideBarList title={t("sidebar.menu")} collapsed={secondAnim}>
                <SideBarListItem
                  id={"dashboard"}
                  label={t("dashboard.title")}
                  icon={IconsLegacy.HouseMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleClickDashboard}
                  isActive={location.pathname === "/"}
                  NotifComponent={<UpdateDot collapsed={collapsed} />}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"market"}
                  label={t("sidebar.market")}
                  icon={IconsLegacy.GraphGrowMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleClickMarket}
                  isActive={location.pathname === "/market"}
                  collapsed={secondAnim}
                />
                <FeatureToggle featureId="learn">
                  <SideBarListItem
                    id="learn"
                    label={t("sidebar.learn")}
                    icon={IconsLegacy.NewsMedium}
                    iconSize={20}
                    iconActiveColor="wallet"
                    isActive={location.pathname.startsWith("/learn")}
                    onClick={handleClickLearn}
                    collapsed={secondAnim}
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"accounts"}
                  label={t("sidebar.accounts")}
                  icon={IconsLegacy.WalletMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  isActive={location.pathname.startsWith("/account")}
                  onClick={handleClickAccounts}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"catalog"}
                  label={t("sidebar.catalog")}
                  icon={IconsLegacy.PlanetMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  isActive={location.pathname.startsWith("/platform") && !isLiveAppTabSelected}
                  onClick={handleClickCatalog}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"send"}
                  label={t("send.title")}
                  icon={IconsLegacy.ArrowFromBottomMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleOpenSendModal}
                  disabled={noAccounts || navigationLocked}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"receive"}
                  label={t("receive.title")}
                  icon={IconsLegacy.ArrowToBottomMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleOpenReceiveModal}
                  disabled={noAccounts || navigationLocked}
                  collapsed={secondAnim}
                />
                <FeatureToggle featureId="ptxEarn">
                  <SideBarListItem
                    id={"earn"}
                    label={t("sidebar.earn")}
                    icon={IconsLegacy.LendMedium}
                    iconSize={20}
                    iconActiveColor="wallet"
                    onClick={handleClickEarn}
                    isActive={location.pathname === "/earn"}
                    collapsed={secondAnim}
                    NotifComponent={
                      ptxEarnConfig?.params?.isNew ? (
                        <CustomTag active type="plain" size="small">
                          {t("common.new")}
                        </CustomTag>
                      ) : null
                    }
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"exchange"}
                  label={t("sidebar.exchange")}
                  icon={IconsLegacy.BuyCryptoAltMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleClickExchange}
                  isActive={location.pathname === "/exchange"}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <SideBarListItem
                  id={"swap"}
                  label={t("sidebar.swap")}
                  icon={IconsLegacy.BuyCryptoMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleClickSwap}
                  isActive={location.pathname.startsWith("/swap")}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <FeatureToggle featureId="referralProgramDesktopSidebar">
                  <SideBarListItem
                    id={"refer"}
                    label={t("sidebar.refer")}
                    icon={IconsLegacy.GiftCardMedium}
                    iconSize={20}
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
                  icon={IconsLegacy.CardMedium}
                  iconSize={20}
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
                    icon={IconsLegacy.ShieldCheckMedium}
                    iconSize={20}
                    iconActiveColor="wallet"
                    onClick={handleClickRecover}
                    collapsed={secondAnim}
                    NotifComponent={
                      recoverFeature?.params?.isNew && (
                        <CustomTag active type="plain" size="small">
                          {t("common.new")}
                        </CustomTag>
                      )
                    }
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"manager"}
                  label={t("sidebar.manager")}
                  icon={IconsLegacy.NanoXFoldedMedium}
                  iconSize={20}
                  iconActiveColor="wallet"
                  onClick={handleClickManager}
                  isActive={location.pathname === "/manager"}
                  NotifComponent={displayBlueDot ? <Dot collapsed={collapsed} /> : null}
                  collapsed={secondAnim}
                />
                <Space of={30} />
              </SideBarList>
              <Box>
                <Space grow of={30} />
                <Hide visible={secondAnim && hasStarredAccounts} mb={"-8px"}>
                  <Separator />
                </Hide>
                <SideBarList
                  scroll
                  flex="1 1 40%"
                  title={t("sidebar.stars")}
                  collapsed={secondAnim}
                >
                  <Stars pathname={location.pathname} collapsed={secondAnim} />
                </SideBarList>
              </Box>
              <Space of={30} grow />
              <TagContainerExperimental collapsed={!secondAnim} />
              <TagContainerFeatureFlags collapsed={!secondAnim} />
            </SideBarScrollContainer>
          </SideBar>
        );
      }}
    </Transition>
  );
};
export default MainSideBar;

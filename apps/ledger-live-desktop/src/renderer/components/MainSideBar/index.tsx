import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Link } from "react-router";
import { Transition, type TransitionStatus } from "react-transition-group";
import styled from "styled-components";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { Icons, Tag as TagComponent } from "@ledgerhq/react-ui";
import {
  featureFlagsButtonVisibleSelector,
  overriddenFeatureFlagsSelector,
} from "~/renderer/reducers/settings";
import useExperimental from "~/renderer/hooks/useExperimental";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { darken } from "~/renderer/styles/helpers";
import { SideBarList, SideBarListItem } from "~/renderer/components/SideBar";
import Box from "~/renderer/components/Box";
import Space from "~/renderer/components/Space";
import UpdateDot from "~/renderer/components/Updater/UpdateDot";
import { Dot } from "~/renderer/components/Dot";
import Stars from "~/renderer/components/Stars";
import TopGradient from "./TopGradient";
import Hide from "./Hide";
import RecoverStatusDot from "~/renderer/components/MainSideBar/RecoverStatusDot";
import { useSideBarViewModel } from "LLD/components/SideBar/useSideBarViewModel";

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
const sideBarTransitionStyles: Record<TransitionStatus, React.CSSProperties> = {
  entering: { flexBasis: MAIN_SIDEBAR_WIDTH },
  entered: { flexBasis: MAIN_SIDEBAR_WIDTH },
  exiting: { flexBasis: collapsedWidth },
  exited: { flexBasis: collapsedWidth },
  unmounted: { flexBasis: collapsedWidth },
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

  &::-webkit-scrollbar {
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
      to="/settings/developer"
      onClick={() => setTrackingSource("sidebar")}
    >
      <Icons.Switch2 size="S" color="primary.c80" />
      <TagText collapsed={collapsed}>{t("common.featureFlags")}</TagText>
    </Tag>
  ) : null;
};

const MainSideBar = () => {
  const { t } = useTranslation();
  const viewModel = useSideBarViewModel();
  const nodeRef = useRef(null);

  const {
    pathname: locationPathname,
    collapsed,
    navigationLocked,
    noAccounts,
    totalStarredAccounts,
    displayBlueDot,
    earnLabel,
    isCardDisabled,
    isLiveAppTabSelected,
    isMarketBannerEnabled,
    isQuickActionCtasEnabled,
    isWallet40MainNavEnabled,
    referralProgramConfig,
    getMinHeightForStarredAccountsList,
    handleCollapse,
    handleClickDashboard,
    handleClickMarket,
    handleClickAccounts,
    handleClickManager,
    handleClickCatalog,
    handleClickExchange,
    handleClickEarn,
    handleClickSwap,
    handleClickPerps,
    handleClickCard,
    handleClickCardWallet,
    handleClickRefer,
    handleClickRecover,
    handleOpenSendModal,
    handleOpenReceiveModal,
  } = viewModel;

  return (
    <Transition
      in={!collapsed}
      timeout={sideBarTransitionSpeed}
      onEnter={disableTransitions}
      onExit={disableTransitions}
      onEntered={enableTransitions}
      onExited={enableTransitions}
      nodeRef={nodeRef}
    >
      {state => {
        const secondAnim = !(state === "entered" && !collapsed);
        return (
          <SideBar ref={nodeRef} style={sideBarTransitionStyles[state]}>
            <Collapser
              collapsed={collapsed}
              onClick={handleCollapse}
              data-testid="drawer-collapse-button"
            >
              <Icons.ChevronRight size="S" color="neutral.c70" />
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
                  isActive={locationPathname === "/" || locationPathname.startsWith("/asset/")}
                  NotifComponent={<UpdateDot collapsed={collapsed} />}
                  collapsed={secondAnim}
                />
                {!isMarketBannerEnabled && (
                  <SideBarListItem
                    id={"market"}
                    label={t("sidebar.market")}
                    icon={Icons.GraphAsc}
                    iconActiveColor="wallet"
                    onClick={handleClickMarket}
                    isActive={locationPathname.startsWith("/market")}
                    collapsed={secondAnim}
                  />
                )}
                <SideBarListItem
                  id={"accounts"}
                  label={t("sidebar.accounts")}
                  icon={Icons.Wallet}
                  iconActiveColor="wallet"
                  isActive={locationPathname.startsWith("/account")}
                  onClick={handleClickAccounts}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                {!isQuickActionCtasEnabled && (
                  <SideBarListItem
                    id={"send"}
                    label={t("send.title")}
                    icon={Icons.ArrowUp}
                    iconActiveColor="wallet"
                    onClick={handleOpenSendModal}
                    disabled={noAccounts || navigationLocked}
                    collapsed={secondAnim}
                  />
                )}
                {!isQuickActionCtasEnabled && (
                  <SideBarListItem
                    id={"receive"}
                    label={t("receive.title")}
                    icon={Icons.ArrowDown}
                    iconActiveColor="wallet"
                    onClick={handleOpenReceiveModal}
                    disabled={noAccounts || navigationLocked}
                    collapsed={secondAnim}
                  />
                )}
                <SideBarListItem
                  id={"swap"}
                  label={t("sidebar.swap")}
                  icon={Icons.Exchange}
                  iconActiveColor="wallet"
                  onClick={handleClickSwap}
                  isActive={locationPathname.startsWith("/swap")}
                  disabled={noAccounts}
                  collapsed={secondAnim}
                />
                <FeatureToggle featureId="ptxPerpsLiveApp">
                  <SideBarListItem
                    id={"perps"}
                    label={t("sidebar.perps")}
                    icon={Icons.GraphAsc}
                    iconActiveColor="wallet"
                    onClick={handleClickPerps}
                    isActive={locationPathname.startsWith("/perps")}
                    disabled={noAccounts}
                    collapsed={secondAnim}
                    NotifComponent={
                      <CustomTag active type="plain" size="small">
                        {t("common.new")}
                      </CustomTag>
                    }
                  />
                </FeatureToggle>
                <SideBarListItem
                  id={"earn"}
                  label={earnLabel}
                  icon={Icons.Percentage}
                  iconActiveColor="wallet"
                  onClick={handleClickEarn}
                  isActive={locationPathname === "/earn"}
                  collapsed={secondAnim}
                />
                {!isQuickActionCtasEnabled && (
                  <SideBarListItem
                    id={"exchange"}
                    label={t("sidebar.exchange")}
                    icon={Icons.Dollar}
                    iconActiveColor="wallet"
                    onClick={handleClickExchange}
                    isActive={locationPathname === "/exchange"}
                    disabled={noAccounts}
                    collapsed={secondAnim}
                  />
                )}
                <SideBarListItem
                  id={"catalog"}
                  label={t("sidebar.catalog")}
                  icon={Icons.Globe}
                  iconActiveColor="wallet"
                  isActive={locationPathname.startsWith("/platform") && !isLiveAppTabSelected}
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
                    isActive={Boolean(
                      referralProgramConfig?.params?.path &&
                        locationPathname.startsWith(referralProgramConfig.params.path),
                    )}
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
                {isWallet40MainNavEnabled ? (
                  <SideBarListItem
                    id={"card-wallet"}
                    label={t("sidebar.card")}
                    icon={Icons.CreditCard}
                    iconActiveColor="wallet"
                    isActive={locationPathname === "/card-new-wallet"}
                    onClick={handleClickCardWallet}
                    collapsed={secondAnim}
                  />
                ) : (
                  <SideBarListItem
                    id={"card"}
                    label={t("sidebar.card")}
                    icon={Icons.CreditCard}
                    iconActiveColor="wallet"
                    isActive={locationPathname === "/card"}
                    onClick={handleClickCard}
                    collapsed={secondAnim}
                    disabled={isCardDisabled}
                  />
                )}

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
                  isActive={locationPathname === "/manager"}
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
                title={t("sidebar.stars")}
                collapsed={secondAnim}
              >
                <Stars pathname={locationPathname} collapsed={secondAnim} />
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

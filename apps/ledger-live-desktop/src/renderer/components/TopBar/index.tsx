import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { lock } from "~/renderer/actions/application";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import { hasAccountsSelector } from "~/renderer/reducers/accounts";
import { Bar, ItemContainer } from "./shared";
import Box from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";
import Breadcrumb from "~/renderer/components/Breadcrumb";
import HelpSideBar from "~/renderer/modals/Help";

// TODO: ActivityIndicator
import ActivityIndicator from "./ActivityIndicator";
import { setDiscreetMode } from "~/renderer/actions/settings";
import { hasPasswordSelector } from "~/renderer/reducers/application";
import { NotificationIndicator } from "~/renderer/components/TopBar/NotificationIndicator";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { LiveAppDrawer } from "~/renderer/components/WebPlatformPlayer/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
const Container = styled(Box).attrs(() => ({}))`
  height: ${p => p.theme.sizes.topBarHeight}px;
  box-sizing: content-box;
  background-color: transparent;
`;
const Inner = styled(Box).attrs(() => ({
  horizontal: true,
  grow: true,
  flow: 4,
  alignItems: "center",
  px: 6,
}))`
  height: 100%;
`;
export const SeparatorBar = styled.div`
  height: 1px;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  width: calc(100% - ${p => p.theme.space[6] * 2}px);
  left: ${p => p.theme.space[6]};
  position: relative;
`;
const TopBar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const hasPassword = useSelector(hasPasswordSelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const discreetMode = useSelector(discreetModeSelector);
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);
  const handleLock = useCallback(() => dispatch(lock()), [dispatch]);
  const handleDiscreet = useCallback(
    () => dispatch(setDiscreetMode(!discreetMode)),
    [discreetMode, dispatch],
  );
  const navigateToSettings = useCallback(() => {
    const url = "/settings";
    if (location.pathname !== url) {
      setTrackingSource("topbar");
      history.push({
        pathname: url,
      });
    }
  }, [history, location]);
  return (
    <Container color="palette.text.shade80">
      <Inner bg="palette.background.default">
        <Box grow horizontal justifyContent="space-between">
          <Breadcrumb />
          <Box horizontal>
            {hasAccounts && (
              <>
                <ActivityIndicator />
                <Box justifyContent="center">
                  <Bar />
                </Box>
              </>
            )}
            <LiveAppDrawer />
            <NotificationIndicator />
            <Box justifyContent="center">
              <Bar />
            </Box>
            <Tooltip content={t("settings.discreet")} placement="bottom">
              <ItemContainer
                data-test-id="topbar-discreet-button"
                isInteractive
                onClick={handleDiscreet}
              >
                {discreetMode ? (
                  <IconsLegacy.EyeNoneMedium size={18} />
                ) : (
                  <IconsLegacy.EyeMedium size={18} />
                )}
              </ItemContainer>
            </Tooltip>
            <Box justifyContent="center">
              <Bar />
            </Box>
            <Tooltip content={t("settings.helpButton")} placement="bottom">
              <ItemContainer
                data-test-id="topbar-help-button"
                isInteractive
                onClick={() => setHelpSideBarVisible(true)}
              >
                <IconsLegacy.HelpMedium size={18} />
              </ItemContainer>
            </Tooltip>
            <HelpSideBar
              isOpened={helpSideBarVisible}
              onClose={() => setHelpSideBarVisible(false)}
            />
            {hasPassword && (
              <>
                <Box justifyContent="center">
                  <Bar />
                </Box>
                <Tooltip content={t("common.lock")}>
                  <ItemContainer
                    data-test-id="topbar-password-lock-button"
                    isInteractive
                    justifyContent="center"
                    onClick={handleLock}
                  >
                    <IconsLegacy.LockAltMedium size={18} />
                  </ItemContainer>
                </Tooltip>
              </>
            )}
            <Box justifyContent="center">
              <Bar />
            </Box>
            <Tooltip content={t("settings.title")} placement="bottom">
              <ItemContainer
                data-test-id="topbar-settings-button"
                isInteractive
                onClick={navigateToSettings}
              >
                <IconsLegacy.SettingsMedium size={18} />
              </ItemContainer>
            </Tooltip>
          </Box>
        </Box>
      </Inner>
    </Container>
  );
};
export default TopBar;

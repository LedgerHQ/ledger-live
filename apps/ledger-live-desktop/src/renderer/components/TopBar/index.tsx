import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
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
import { hasPasswordSelector } from "~/renderer/reducers/application";
import { NotificationIndicator } from "~/renderer/components/TopBar/NotificationIndicator";
import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { useDiscreetMode } from "LLD/components/TopBar/hooks/useDiscreetMode";
import { useSettings } from "LLD/components/TopBar/hooks/useSettings";

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

const TopBar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasPassword = useSelector(hasPasswordSelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);
  const handleLock = useCallback(() => dispatch(lock()), [dispatch]);
  const { handleDiscreet } = useDiscreetMode();
  const discreetMode = useSelector(discreetModeSelector);
  const { handleSettings, tooltip: settingsTooltip } = useSettings();

  return (
    <Container color="neutral.c80">
      <Inner backgroundColor="background.default">
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
                data-testid="topbar-discreet-button"
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
                data-testid="topbar-help-button"
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
                    data-testid="topbar-password-lock-button"
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
            <Tooltip content={settingsTooltip} placement="bottom">
              <ItemContainer
                data-testid="topbar-settings-button"
                isInteractive
                onClick={handleSettings}
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

import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router";
import { lock } from "~/renderer/actions/application";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import { hasAccountsSelector } from "~/renderer/reducers/accounts";
import { Bar, ItemContainer } from "./shared";
import Box from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";
import Breadcrumb from "~/renderer/components/Breadcrumb";
import HelpSideBar from "~/renderer/modals/Help";

import ActivityIndicator from "~/renderer/components/TopBar/ActivityIndicator";
import { setDiscreetMode } from "~/renderer/actions/settings";
import { hasPasswordSelector } from "~/renderer/reducers/application";
import { NotificationIndicator } from "~/renderer/components/TopBar/NotificationIndicator";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { track } from "~/renderer/analytics/segment";
import { NavBar, NavBarTrailing } from "@ledgerhq/lumen-ui-react";

const TopBar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const hasPassword = useSelector(hasPasswordSelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const discreetMode = useSelector(discreetModeSelector);
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);
  const handleLock = useCallback(() => dispatch(lock()), [dispatch]);

  const handleDiscreet = useCallback(() => {
    dispatch(setDiscreetMode(!discreetMode));
    track("button_clicked", {
      button: "Discreet mode",
      toggle: !discreetMode ? "ON" : "OFF",
    });
  }, [discreetMode, dispatch]);

  const navigateToSettings = useCallback(() => {
    const url = "/settings";
    if (location.pathname !== url) {
      setTrackingSource("topbar");
      navigate(url);
    }
  }, [navigate, location]);

  return (
    <NavBar className="justify-end py-24 pr-32 pl-[70px]">
      <NavBarTrailing className="gap-12">
        <Breadcrumb />
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
        <HelpSideBar isOpened={helpSideBarVisible} onClose={() => setHelpSideBarVisible(false)} />
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
        <Tooltip content={t("settings.title")} placement="bottom">
          <ItemContainer
            data-testid="topbar-settings-button"
            isInteractive
            onClick={navigateToSettings}
          >
            <IconsLegacy.SettingsMedium size={18} />
          </ItemContainer>
        </Tooltip>
      </NavBarTrailing>
    </NavBar>
  );
};
export default TopBar;

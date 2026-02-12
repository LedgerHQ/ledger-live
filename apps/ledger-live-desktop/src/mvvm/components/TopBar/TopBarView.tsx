import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router";
import { lock } from "~/renderer/actions/application";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import Tooltip from "~/renderer/components/Tooltip";
import Breadcrumb from "~/renderer/components/Breadcrumb";
import HelpSideBar from "~/renderer/modals/Help";

import { hasPasswordSelector } from "~/renderer/reducers/application";
import { NotificationIndicator } from "~/renderer/components/TopBar/NotificationIndicator";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { NavBar, NavBarTrailing, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { TopBarDivider } from "./components/Divider";
import { TopBarViewProps } from "./types";
import { TopBarActionsList } from "./components/ActionsList";

const TopBarView = ({ actionsList }: TopBarViewProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const hasPassword = useSelector(hasPasswordSelector);
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);
  const handleLock = useCallback(() => dispatch(lock()), [dispatch]);

  const navigateToSettings = useCallback(() => {
    const url = "/settings";
    if (location.pathname !== url) {
      setTrackingSource("topbar");
      navigate(url);
    }
  }, [navigate, location]);

  return (
    <NavBar className="items-center px-32 pt-32 pb-24">
      <NavBarTitle className="h-48">
        <Breadcrumb />
      </NavBarTitle>
      <NavBarTrailing className="h-48 gap-12">
        <LiveAppDrawer />
        <NotificationIndicator />
        <TopBarDivider />

        <TopBarActionsList actionsList={actionsList} />

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
            <TopBarDivider />

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
        <TopBarDivider />
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
export default TopBarView;

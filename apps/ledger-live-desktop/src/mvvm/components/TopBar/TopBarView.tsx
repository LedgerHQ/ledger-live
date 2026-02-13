import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { lock } from "~/renderer/actions/application";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import Tooltip from "~/renderer/components/Tooltip";
import Breadcrumb from "~/renderer/components/Breadcrumb";
import HelpSideBar from "~/renderer/modals/Help";

import { hasPasswordSelector } from "~/renderer/reducers/application";
import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { NavBar, NavBarTrailing, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { TopBarViewProps } from "./types";
import { TopBarActionsList } from "./components/ActionsList";

const TopBarView = ({ slots }: TopBarViewProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasPassword = useSelector(hasPasswordSelector);
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);
  const handleLock = useCallback(() => dispatch(lock()), [dispatch]);

  return (
    <NavBar className="items-center px-32 pt-32 pb-24">
      <NavBarTitle className="h-48">
        <Breadcrumb />
      </NavBarTitle>
      <NavBarTrailing className="h-48 gap-12">
        <LiveAppDrawer />

        <TopBarActionsList slots={slots} />

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
      </NavBarTrailing>
    </NavBar>
  );
};
export default TopBarView;

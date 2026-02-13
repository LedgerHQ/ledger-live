import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import Tooltip from "~/renderer/components/Tooltip";
import Breadcrumb from "~/renderer/components/Breadcrumb";
import HelpSideBar from "~/renderer/modals/Help";

import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { NavBar, NavBarTrailing, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { TopBarViewProps } from "./types";
import { TopBarActionsList } from "./components/ActionsList";

const TopBarView = ({ slots }: TopBarViewProps) => {
  const { t } = useTranslation();
  const [helpSideBarVisible, setHelpSideBarVisible] = useState(false);

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
      </NavBarTrailing>
    </NavBar>
  );
};
export default TopBarView;

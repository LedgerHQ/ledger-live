import React from "react";
import Breadcrumb from "~/renderer/components/Breadcrumb";

import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { NavBar, NavBarTrailing, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { TopBarViewProps } from "./types";
import { TopBarActionsList } from "./components/ActionsList";
import FirmwareUpdateBanner from "~/renderer/components/FirmwareUpdateBanner";
import Updater from "LLD/features/Updater";
import { TopBannerContainer } from "~/renderer/Default";

const TopBarView = ({ slots, shouldShowFirmwareUpdateBanner }: TopBarViewProps) => {
  return (
    <NavBar className="items-center px-32 pt-32 pb-24">
      <NavBarTitle className="h-48">
        <Breadcrumb />
      </NavBarTitle>
      <NavBarTrailing className="h-48 gap-12">
        <LiveAppDrawer />
        <TopBannerContainer>
          {shouldShowFirmwareUpdateBanner && <FirmwareUpdateBanner />}
          <Updater />
        </TopBannerContainer>
        <TopBarActionsList slots={slots} />
      </NavBarTrailing>
    </NavBar>
  );
};
export default TopBarView;

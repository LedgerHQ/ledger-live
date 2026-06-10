import React from "react";
import Breadcrumb from "~/renderer/components/Breadcrumb";

import { LiveAppDrawer } from "~/renderer/components/LiveAppDrawer";
import { NavBar, NavBarTrailing, NavBarTitle } from "@ledgerhq/lumen-ui-react";
import { TopBarViewProps } from "./types";
import { TopBarActionsList } from "./components/ActionsList";
import FirmwareUpdateBanner from "~/renderer/components/FirmwareUpdateBanner";
import Updater from "LLD/features/Updater";
import { MyWallet } from "LLD/features/MyWallet";
import { InformationDrawer } from "~/renderer/components/TopBar/NotificationIndicator/InformationDrawer";
import { TopBarSearch } from "./components/TopBarSearch";

const TopBarView = ({
  slots,
  shouldShowFirmwareUpdateBanner,
  isInformationCenterOpen,
  onInformationCenterClose,
  shouldDisplayAggregatedAssets,
  shouldDisplayAssetDiscoverability,
}: TopBarViewProps) => {
  const renderTitle = () => {
    if (shouldDisplayAssetDiscoverability) return <TopBarSearch />;
    if (shouldDisplayAggregatedAssets) return null;

    return (
      <NavBarTitle className="h-48">
        <Breadcrumb />
      </NavBarTitle>
    );
  };

  return (
    <>
      <InformationDrawer
        isOpen={isInformationCenterOpen}
        onRequestClose={onInformationCenterClose}
      />
      <NavBar className="w-full min-w-0 items-center px-32 pt-32 pb-24">
        {renderTitle()}
        <NavBarTrailing className="h-48 gap-12">
          <LiveAppDrawer />
          {shouldShowFirmwareUpdateBanner && <FirmwareUpdateBanner />}
          <Updater />
          <TopBarActionsList slots={slots} />
          <MyWallet />
        </NavBarTrailing>
      </NavBar>
    </>
  );
};
export default TopBarView;

import React, { useEffect } from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import Drawer from "LLM/components/Dummy/Drawer";
import { TrackScreen } from "~/analytics";
import FollowInstructions from "../../components/FollowInstructions";
import { useNavigation } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";

type Props = {
  isOpen: boolean;
  reopenDrawer: () => void;
  handleClose: () => void;
};

const FollowInstructionsDrawer = ({ isOpen, handleClose, reopenDrawer }: Props) => {
  const [isSyncMethodDrawerOpen, setIsSyncMethodDrawerOpen] = React.useState(false);

  const navigation = useNavigation();
  const onPressCloseDrawer = () => {
    setIsSyncMethodDrawerOpen(false);
    reopenDrawer();
  };

  const openSyncMethodDrawer = () => {
    setIsSyncMethodDrawerOpen(true);
    handleClose();
  };

  const goNext = () => {
    console.log("Navigate to goNext");
    handleClose();
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncSuccess,
      params: { created: true },
    });
  };

  useEffect(() => {
    console.log("Navigate to WalletSyncSuccess");
    setTimeout(() => goNext(), 3000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        <FollowInstructions />
      </QueuedDrawer>

      <Drawer isOpen={isSyncMethodDrawerOpen} handleClose={onPressCloseDrawer} />
    </>
  );
};

export default FollowInstructionsDrawer;

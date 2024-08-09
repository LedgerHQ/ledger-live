import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import Activation from "../../components/Activation";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../Synchronize/ChooseMethod";

type Props = {
  isOpen: boolean;
  reopenDrawer: () => void;
  handleClose: () => void;
};

const ActivationDrawer = ({ isOpen, handleClose, reopenDrawer }: Props) => {
  const [isSyncMethodDrawerOpen, setIsSyncMethodDrawerOpen] = React.useState(false);

  const onPressCloseDrawer = () => {
    setIsSyncMethodDrawerOpen(false);
    reopenDrawer();
  };

  const openSyncMethodDrawer = () => {
    setIsSyncMethodDrawerOpen(true);
    handleClose();
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        <Activation isInsideDrawer openSyncMethodDrawer={openSyncMethodDrawer} />
      </QueuedDrawer>

      <QueuedDrawer isRequestingToBeOpened={isSyncMethodDrawerOpen} onClose={onPressCloseDrawer}>
        <ChooseSyncMethod />
      </QueuedDrawer>
    </>
  );
};

export default ActivationDrawer;

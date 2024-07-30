import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import Activation from "../../components/Activation";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../Synchronize/ChooseMethod";
import QrCodeMethod from "../Synchronize/QrCodeMethod";
import DrawerHeader from "../../components/Synchronize/DrawerHeader";
import { useWindowDimensions } from "react-native";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  isOpen: boolean;
  reopenDrawer: () => void;
  handleClose: () => void;
};

const ActivationDrawer = ({ isOpen, handleClose, reopenDrawer }: Props) => {
  const [isSyncMethodDrawerOpen, setIsSyncMethodDrawerOpen] = React.useState(false);
  const [isQrCodeDrawerOpen, setIsQrCodeDrawerOpen] = React.useState(false);
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;

  const onPressCloseDrawer = () => {
    setIsSyncMethodDrawerOpen(false);
    reopenDrawer();
  };

  const openSyncMethodDrawer = () => {
    setIsSyncMethodDrawerOpen(true);
    handleClose();
  };

  const onCloseQrCodeDrawer = () => {
    setIsQrCodeDrawerOpen(false);
    setIsSyncMethodDrawerOpen(true);
  };

  const onScanMethodPress = () => {
    setIsSyncMethodDrawerOpen(false);
    setIsQrCodeDrawerOpen(true);
  };

  const CustomDrawerHeader = () => {
    return <DrawerHeader onClose={onCloseQrCodeDrawer} />;
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        <Activation isInsideDrawer openSyncMethodDrawer={openSyncMethodDrawer} />
      </QueuedDrawer>

      <QueuedDrawer isRequestingToBeOpened={isSyncMethodDrawerOpen} onClose={onPressCloseDrawer}>
        <ChooseSyncMethod onScanMethodPress={onScanMethodPress} />
      </QueuedDrawer>

      <QueuedDrawer
        isRequestingToBeOpened={isQrCodeDrawerOpen}
        onClose={onCloseQrCodeDrawer}
        CustomHeader={CustomDrawerHeader}
      >
        <Flex maxHeight={maxDrawerHeight}>
          <QrCodeMethod />
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default ActivationDrawer;

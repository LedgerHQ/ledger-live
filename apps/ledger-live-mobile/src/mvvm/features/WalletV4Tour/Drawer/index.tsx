import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerGorhom from "../../../components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { useWalletV4TourDrawerViewModel } from "./hooks/useWalletV4TourDrawerViewModel";

export const useWalletV4TourDrawer = () => {
  return useWalletV4TourDrawerViewModel();
};

export const WalletV4TourDrawer = ({
  isDrawerOpen,
  handleCloseDrawer,
}: {
  isDrawerOpen: boolean;
  handleCloseDrawer: () => void;
}) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isDrawerOpen}
      onClose={handleCloseDrawer}
      snapPoints={["92%"]}
      noCloseButton={false}
    >
      <Flex flex={1} style={{ paddingBottom: bottomInset }}>
        {/* add the slides here */}
      </Flex>
    </QueuedDrawerGorhom>
  );
};

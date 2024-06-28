import React from "react";
import { Text } from "@ledgerhq/native-ui";
import QueuedDrawer from "LLM/components/QueuedDrawer";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

const Drawer = ({ isOpen, handleClose }: Props) => {
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
      <Text>{"Dummy Drawer"}</Text>
    </QueuedDrawer>
  );
};

export default Drawer;

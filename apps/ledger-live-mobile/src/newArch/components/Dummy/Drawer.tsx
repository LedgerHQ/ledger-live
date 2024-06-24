import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { Text } from "@ledgerhq/native-ui";

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

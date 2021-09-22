import React, { useState, useCallback } from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Modal from "@components/Layout/Modal";
import Text from "@components/Text";
import CenterView from "../../CenterView";

const ModalStory = () => {
  const [isOpen, setIsOpen] = useState(true);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  button("Open modal", openModal);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        action("onClose")();
        setIsOpen(false);
      }}
    >
      <Text>{text("content", "Ledger")}</Text>
    </Modal>
  );
};

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Modal", () => <ModalStory />);

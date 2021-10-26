import React, { useState, useCallback } from "react";
import { storiesOf } from "../../storiesOf";
import { text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Popin from "@components/Layout/Modals/Popin";
import Text from "@components/Text";
import TrashMedium from "@ui/assets/icons/TrashMedium";

const PopinStory = () => {
  const [isOpen, setIsOpen] = useState(true);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  button("Open modal", openModal);

  return (
    <Popin
      isOpen={isOpen}
      onClose={() => {
        action("onClose")();
        setIsOpen(false);
      }}
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={TrashMedium}
      iconColor={"red"}
      onLeftButtonPress={action("onLeftButtonPress")}
      onRightButtonPress={action("onRightButtonPress")}
    >
      <>
        <Text>Exemple children</Text>
      </>
    </Popin>
  );
};

storiesOf((story) =>
  story("Layout/Modal", module).add("Popin", () => <PopinStory />)
);

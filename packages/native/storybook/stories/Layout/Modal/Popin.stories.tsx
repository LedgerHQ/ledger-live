import React, { useState, useCallback } from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Popin from "@components/Layout/Modal/Popin";
import Text from "@components/Text";
import CenterView from "../../CenterView";
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

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Modal/Popin", () => <PopinStory />);

import React, { useState, useCallback } from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import BottomDrawer from "@components/Layout/Modal/BottomDrawer";
import Text from "@components/Text";
import CenterView from "../../CenterView";
import Button from "@components/cta/Button";
import TrashMedium from "@ui/assets/icons/TrashMedium";

const BottomDrawerStory = () => {
  const [isOpen, setIsOpen] = useState(true);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  button("Open modal", openModal);

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={() => {
        action("onClose")();
        setIsOpen(false);
      }}
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={TrashMedium}
    >
      <>
        <Text>Exemple children</Text>
        <Button>
          <Text>button</Text>
        </Button>
      </>
    </BottomDrawer>
  );
};

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Modal/BottomDrawer", () => <BottomDrawerStory />);

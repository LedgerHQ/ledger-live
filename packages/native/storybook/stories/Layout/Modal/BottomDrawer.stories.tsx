import React, { useState, useCallback } from "react";
import { storiesOf } from "../../storiesOf";
import { text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import BottomDrawer from "../../../../src/components/Layout/Modals/BottomDrawer";
import Text from "../../../../src/components/Text";
import Button from "../../../../src/components/cta/Button";
import { Icons } from "../../../../src/assets";

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
      Icon={Icons.TrashMedium}
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

storiesOf((story) =>
  story("Layout/Modal", module).add("BottomDrawer", () => <BottomDrawerStory />)
);

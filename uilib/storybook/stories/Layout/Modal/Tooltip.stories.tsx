import React, { useState, useCallback } from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Tooltip from "@components/Layout/Modal/Tooltip";
import Text from "@components/Text";
import CenterView from "../../CenterView";
import Button from "@components/Button";
import Info from "@ui/icons/Info";

const TooltipStory = () => {
  const [isOpen, setIsOpen] = useState(true);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  button("Open modal", openModal);

  return (
    <Tooltip
      isOpen={isOpen}
      onClose={() => {
        action("onClose")();
        setIsOpen(false);
      }}
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={Info}
      iconColor={'red'}
    >
        <>
            <Text>Exemple children</Text>
            <Button type={"primary"}><Text>button</Text></Button>
        </>
    </Tooltip>
  );
};

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Modal/Tooltip", () => <TooltipStory />);

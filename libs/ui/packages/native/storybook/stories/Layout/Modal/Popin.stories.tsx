import React, { useState, useCallback } from "react";
import { Button } from "react-native";
import { ComponentStory } from "@storybook/react-native";
import { action } from "@storybook/addon-actions";
import Popin from "../../../../src/components/Layout/Modals/Popin";
import Text from "../../../../src/components/Text";
import { Icons } from "../../../../src/assets";

export default {
  title: "Layout/Modal/Popin",
  component: Popin,
};

export const Default: ComponentStory<typeof Popin> = (args: typeof DefaultStoryArgs) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <Button onPress={openModal} title="Open Popin" />
      <Popin
        isOpen={isOpen}
        onClose={() => {
          action("onClose")();
          setIsOpen(false);
        }}
        title={args.title}
        description={args.description}
        subtitle={args.subtitle}
        Icon={Icons.TrashMedium}
        iconColor={"red"}
        onLeftButtonPress={action("onLeftButtonPress")}
        onRightButtonPress={action("onRightButtonPress")}
      >
        <>
          <Text>Exemple children</Text>
        </>
      </Popin>
    </>
  );
};
Default.storyName = "Popin";
const DefaultStoryArgs = {
  title: "title",
  description: "Description",
  subtitle: "Subtitle",
};
Default.args = DefaultStoryArgs;

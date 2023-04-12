import React, { useState, useCallback } from "react";
import { Button } from "react-native";
import { action } from "@storybook/addon-actions";
import { ComponentStory } from "@storybook/react-native";
import { Alert, BaseModal, IconBox } from "../../../../src/components";
import { Icons } from "../../../../src/assets";

export default {
  title: "Layout/Modal",
  component: BaseModal,
};

const Template = (args: typeof BaseStoryArgs & typeof WithoutHeaderStoryArgs) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <Button onPress={openModal} title="Open Modal" />
      <BaseModal
        isOpen={isOpen}
        onClose={() => {
          action("onClose")();
          setIsOpen(false);
        }}
        {...(args.noHeader
          ? {}
          : {
              ...args,
              Icon: <IconBox Icon={Icons.TrashMedium} />,
            })}
        noCloseButton={args.noCloseButton}
      >
        <Alert type="info" showIcon={false} title="Example children (Alert component)" />
      </BaseModal>
    </>
  );
};

export const BaseStory: ComponentStory<typeof BaseModal> = Template.bind({});
BaseStory.storyName = "BaseModal";
const BaseStoryArgs = {
  noHeader: false,
  title: "title",
  description: "Description",
  subtitle: "Subtitle",
  noCloseButton: false,
};
BaseStory.args = BaseStoryArgs;
export const WithoutHeaderStory: ComponentStory<typeof BaseModal> = Template.bind({});
WithoutHeaderStory.storyName = "BaseModal (no header)";
const WithoutHeaderStoryArgs = {
  noHeader: true,
  noCloseButton: false,
};
WithoutHeaderStory.args = WithoutHeaderStoryArgs;

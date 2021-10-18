import React, { useState, useCallback } from "react";
import { storiesOf } from "../../storiesOf";
import { text, button } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import BaseModal from "../../../../src/components/Layout/Modal/BaseModal";
import Text from "@components/Text";
import TrashMedium from "@ui/assets/icons/TrashMedium";
import IconBox from "../../../../src/components/Icon/IconBox";

export const ModalStory = () => {
  const [isOpen, setIsOpen] = useState(true);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  button("Open modal", openModal);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        action("onClose")();
        setIsOpen(false);
      }}
      title={text("title", "title")}
      description={text("description", "Description")}
      subtitle={text("subtitle", "Subtitle")}
      Icon={<IconBox Icon={TrashMedium} />}
    >
      <Text>{text("content", "Ledger")}</Text>
    </BaseModal>
  );
};

storiesOf((story) => story("Layout", module).add("Modal", ModalStory));

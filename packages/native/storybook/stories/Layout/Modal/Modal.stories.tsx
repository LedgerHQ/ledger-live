import React, { useState, useCallback } from "react";
import { storiesOf } from "../../storiesOf";
import { text, button, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import { Alert, BaseModal, IconBox, Icons } from "../../../../src";

const MakeModalStory = ({ noHeaderProps = false }: { noHeaderProps?: boolean }) =>
  function ModalStory() {
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
        {...(noHeaderProps
          ? {}
          : {
              title: text("title", "title"),
              description: text("description", "Description"),
              subtitle: text("subtitle", "Subtitle"),
              Icon: <IconBox Icon={Icons.TrashMedium} />,
            })}
        noCloseButton={boolean("noCloseButton", false)}
      >
        <Alert type="info" title="Example children (Alert component)" />
      </BaseModal>
    );
  };

storiesOf((story) =>
  story("Layout/Modal", module)
    .add("BaseModal", MakeModalStory({ noHeaderProps: false }))
    .add("BaseModal without header props", MakeModalStory({ noHeaderProps: true })),
);

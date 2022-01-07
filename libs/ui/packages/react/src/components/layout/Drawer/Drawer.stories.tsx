import React from "react";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";

import Button from "../../cta/Button";
import Drawer, { DrawerProps } from "./index";
import { Flex } from "../index";

export default {
  title: "Layout/Drawer",
  component: Drawer,
  argTypes: {
    isOpen: {
      type: "boolean",
      value: true,
      description: "Is open",
      required: false,
      control: {
        type: "boolean",
      },
    },
    title: {
      type: "text",
      description: "Side default title",
      defaultValue: "Default title",
      control: {
        type: "text",
      },
      required: false,
    },
    backgroundColor: {
      control: {
        type: "color",
        presetColors: ["coral", "tomato", "orange", "blue", "purple"],
      },
    },
    big: {
      type: "boolean",
      value: true,
      description: "Larger width side drawer.",
      required: false,
      control: {
        type: "boolean",
      },
    },
    ignoreBackdropClick: {
      type: "boolean",
      value: true,
      description: "Prevent drawer from calling onClose when clicking on the backdrop.",
      required: false,
      control: {
        type: "boolean",
      },
    },
  },
};

const Template = ({ title, big, ignoreBackdropClick, backgroundColor, direction }: DrawerProps) => {
  const [{ isOpen }, updateArgs] = useArgs();

  return (
    <div>
      <Button variant={"main"} onClick={() => updateArgs({ isOpen: true })} style={{ flex: 1 }}>
        Open
      </Button>
      <Drawer
        isOpen={isOpen}
        onClose={() => updateArgs({ isOpen: false })}
        title={title}
        big={big}
        footer={
          <Flex flex={1} justifyContent="flex-end">
            <Button variant={"main"} onClick={() => updateArgs({ isOpen: false })}>
              Close
            </Button>
          </Flex>
        }
        ignoreBackdropClick={ignoreBackdropClick}
        backgroundColor={backgroundColor}
        direction={direction}
      >
        <Flex flexDirection={"column"}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed elit mi, tempus sed justo
            et, viverra mattis lorem. Praesent odio ligula, facilisis id porttitor tempor, cursus at
            metus. Etiam consequat ante efficitur sodales iaculis. Aliquam at justo vel erat
            eleifend semper eu non lorem. Cras porta, dolor a porttitor varius, augue lectus congue
            lorem, nec lobortis urna ipsum quis lorem. Nam quis auctor lacus. Aenean sit amet dictum
            purus, at convallis neque. Etiam ac augue non risus luctus laoreet eget a est. Curabitur
            magna purus, fermentum at eros a, faucibus sollicitudin erat. Proin purus sem, lacinia
            tincidunt ornare et, sollicitudin nec libero. Quisque lobortis dui ac lacus mollis
            posuere. Morbi vitae ligula commodo, scelerisque sapien quis, vulputate justo. Cras
            sagittis, ligula quis mollis porttitor, massa neque faucibus mauris, quis consectetur
            eros nibh a ante. Quisque ac porttitor ante. Curabitur in neque a nisl aliquet finibus.
            Mauris in sapien nec odio molestie vulputate. Suspendisse vitae lorem non quam dapibus
            cursus sit amet a mauris.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed elit mi, tempus sed justo
            et, viverra mattis lorem. Praesent odio ligula, facilisis id porttitor tempor, cursus at
            metus. Etiam consequat ante efficitur sodales iaculis. Aliquam at justo vel erat
            eleifend semper eu non lorem. Cras porta, dolor a porttitor varius, augue lectus congue
            lorem, nec lobortis urna ipsum quis lorem. Nam quis auctor lacus. Aenean sit amet dictum
            purus, at convallis neque. Etiam ac augue non risus luctus laoreet eget a est. Curabitur
            magna purus, fermentum at eros a, faucibus sollicitudin erat. Proin purus sem, lacinia
            tincidunt ornare et, sollicitudin nec libero. Quisque lobortis dui ac lacus mollis
            posuere. Morbi vitae ligula commodo, scelerisque sapien quis, vulputate justo. Cras
            sagittis, ligula quis mollis porttitor, massa neque faucibus mauris, quis consectetur
            eros nibh a ante. Quisque ac porttitor ante. Curabitur in neque a nisl aliquet finibus.
            Mauris in sapien nec odio molestie vulputate. Suspendisse vitae lorem non quam dapibus
            cursus sit amet a mauris.
          </p>

          <Flex>
            <Button
              variant={"main"}
              onClick={() => updateArgs({ isOpen: false })}
              style={{ flex: 1 }}
            >
              {"Fermer"}
            </Button>
          </Flex>
        </Flex>
      </Drawer>
    </div>
  );
};

export const Default = Template.bind({});

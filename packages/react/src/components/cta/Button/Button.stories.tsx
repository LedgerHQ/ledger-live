import React from "react";
import Button, { ExpandButton } from "./index";
import WalletAdd from "@ledgerhq/icons-ui/react/WalletAddRegular";
import { InvertTheme } from "../../../styles/InvertTheme";
import Flex from "../../layout/Flex";

export default {
  title: "cta/Button",
  component: Button,
  argTypes: {
    type: {
      options: [undefined, "main", "shade", "color", "error"],
      control: {
        type: "radio",
      },
    },
    fontSize: {
      options: [undefined, 0, 1, 2, 3, 4, 5, 6, 7, 8],
      control: {
        type: "radio",
      },
    },
    children: {
      type: "text",
    },
    iconPosition: {
      options: ["right", "left"],
      control: {
        type: "radio",
      },
    },
    disabled: {
      type: "boolean",
    },
    outline: {
      type: "boolean",
    },
  },
};

// @ts-expect-error FIXME
const Template = (args) => {
  return <Button {...args}>{args.children || "Regular button"}</Button>;
};

// @ts-expect-error FIXME
const TemplateInverted = (args) => {
  return (
    <Flex flexDirection="column">
      <Flex flex="0 0 1" p={4} alignItems="center" bg="palette.background.main">
        <Button {...args}>{args.children || "Regular button"}</Button>
      </Flex>
      <InvertTheme>
        <Flex flex="0 0 1" p={4} alignItems="center" bg="palette.background.main">
          <Button {...args}>{args.children || "Inverted button"}</Button>
        </Flex>
      </InvertTheme>
    </Flex>
  );
};

export const Default = Template.bind({});

export const Inverted = TemplateInverted.bind({});

export const IconButton = Template.bind({});
// @ts-expect-error FIXME
IconButton.args = {
  children: "",
  Icon: WalletAdd,
  iconPosition: "right",
};

const ExpandTemplate = (args: any) => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <ExpandButton {...args} onToggle={setShow}>
        {args.children}
      </ExpandButton>
      {show && (
        <div
          style={{
            padding: "1rem",
          }}
        >
          Hello world!
        </div>
      )}
    </>
  );
};

export const Expand = ExpandTemplate.bind({});
// @ts-expect-error FIXME
Expand.args = {
  children: "Show all",
};

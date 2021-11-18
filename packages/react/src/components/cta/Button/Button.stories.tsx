import React from "react";
import Button, { ExpandButton, ExpandButtonProps, ButtonTypes, IconPosition } from "./index";
import Text from "../../asorted/Text";
import { PlusMedium, WalletAddMedium } from "@ledgerhq/icons-ui/react/";
import { InvertTheme } from "../../../styles/InvertTheme";
import Flex from "../../layout/Flex";

const iconPositions: IconPosition[] = ["left", "right"];
const buttonTypes: ButtonTypes[] = ["main", "shade", "color", "error"];

export default {
  title: "cta/Button",
  component: Button,
  argTypes: {
    type: {
      options: [undefined, ...buttonTypes],
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
      options: iconPositions,
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

export const Overview = (() => {
  const templateProps = { Icon: PlusMedium, children: "Try me", onClick: () => {} };
  const propsArr = [
    { ...templateProps, Icon: undefined },
    { ...templateProps, iconPosition: iconPositions[0] },
    { ...templateProps, iconPosition: iconPositions[1] },
    { ...templateProps, children: "" },
  ];
  return (
    <Flex flexDirection="column">
      {buttonTypes.flatMap((buttonType) =>
        [false, true].map((outline) => (
          <Flex flexDirection="row" alignItems="center" height="70px" columnGap={4}>
            <Text variant="small" color="palette.neutral.c70">
              type="{buttonType}"<br />
              outline={`{${outline.toString()}}`}
              <br />
            </Text>
            {propsArr.map((buttonProps) => (
              <Flex minWidth="280px" columnGap={4}>
                {[false, true].map((disabled) => (
                  <Button
                    type={buttonType}
                    outline={outline}
                    disabled={disabled}
                    {...buttonProps}
                  />
                ))}
              </Flex>
            ))}
          </Flex>
        )),
      )}
    </Flex>
  );
}).bind({});

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
  Icon: WalletAddMedium,
  iconPosition: "right",
};

const ExpandTemplate = (args: ExpandButtonProps) => {
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

import React from "react";
import Button, { ExpandButton, ExpandButtonProps, ButtonVariants, IconPosition } from "./index";
import Text from "../../asorted/Text";
import { PlusMedium, WalletAddMedium } from "@ledgerhq/icons-ui/react/";
import { InvertTheme } from "../../../styles/InvertTheme";
import Flex from "../../layout/Flex";
import { StoryTemplate } from "src/components/helpers";

const iconPositions: IconPosition[] = ["left", "right"];
const buttonVariants: ButtonVariants[] = ["main", "shade", "color", "error"];

export default {
  title: "cta/Button",
  component: Button,
  parameters: {
    controls: {
      include: ["variant", "fontSize", "children", "iconPosition", "disabled", "outline"],
    },
  },
  argTypes: {
    variant: {
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

const OverViewTemplate = () => {
  const templateProps = { Icon: PlusMedium, children: "Try me", onClick: () => {} };
  const propsArr = [
    { ...templateProps, Icon: undefined },
    { ...templateProps, iconPosition: iconPositions[0] },
    { ...templateProps, iconPosition: iconPositions[1] },
    { ...templateProps, children: "" },
  ];
  return (
    <Flex flexDirection="column">
      {buttonVariants.flatMap((buttonType) =>
        [false, true].map((outline) => (
          <Flex flexDirection="row" alignItems="center" columnGap="16px" style={{ height: "70px" }}>
            <div style={{ width: "100px" }}>
              <Text variant="small" color="palette.neutral.c70">
                variant="{buttonType}"<br />
                outline={`{${outline.toString()}}`}
                <br />
              </Text>
            </div>
            {propsArr.map((buttonProps) => (
              <Flex style={{ minWidth: "280px", columnGap: "16px" }}>
                {[false, true].map((disabled) => (
                  <Button
                    variant={buttonType}
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
};

export const Overview: StoryTemplate<ButtonVariants> = OverViewTemplate.bind({});

Overview.parameters = { controls: { disabled: true } };

// @ts-expect-error FIXME
const Template = (args) => {
  return (
    <Button {...args} type={"submit"}>
      {args.children || "Regular button"}
    </Button>
  );
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

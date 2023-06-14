import React, { Fragment } from "react";
import Button, { ButtonExpandProps, ButtonProps, ButtonVariants, IconPosition } from "./index";
import Text from "../../asorted/Text";
import { PlusMedium, WalletAddMedium } from "@ledgerhq/icons-ui/react/";
import { InvertTheme } from "../../../styles/InvertTheme";
import Flex from "../../layout/Flex";
import Grid from "../../layout/Grid";
import { StoryTemplate } from "../../helpers";

const iconPositions: IconPosition[] = ["left", "right"];
const buttonVariants: ButtonVariants[] = ["main", "shade", "color", "error"];

export default {
  title: "cta/Button",
  component: Button,
  argTypes: {
    variant: {
      options: [undefined, ...buttonVariants],
      control: {
        type: "radio",
      },
    },
    size: {
      options: [undefined, "small", "medium", "large"],
      control: { type: "radio" },
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

export const Overview = ((args: ButtonProps) => {
  const templateProps = { Icon: PlusMedium, children: "Try me", onClick: () => {} };
  const propsArr = [
    { ...templateProps, Icon: undefined },
    { ...templateProps, iconPosition: iconPositions[0] },
    { ...templateProps, iconPosition: iconPositions[1] },
    { ...templateProps, children: "" },
  ];
  return (
    <Grid columns="none" gridTemplateColumns="max-content repeat(4, 1fr)" columnGap={8} rowGap={8}>
      {buttonVariants.flatMap((buttonType, i) =>
        [false, true].map((outline, j) => (
          <Fragment key={`${i}:${j}`}>
            <Text variant="small" color="neutral.c70">
              variant="{buttonType}"<br />
              outline={`{${outline.toString()}}`}
            </Text>
            {propsArr.map(buttonProps => (
              <Flex flex={1} columnGap={4}>
                {[false, true].map(disabled => (
                  <Button
                    size={args.size}
                    variant={buttonType}
                    outline={outline}
                    disabled={disabled}
                    {...buttonProps}
                  />
                ))}
              </Flex>
            ))}
          </Fragment>
        )),
      )}
    </Grid>
  );
}).bind({});

export const Default: StoryTemplate<ButtonProps> = args => {
  return <Button {...args}>{args.children || "Regular button"}</Button>;
};

export const Inverted: StoryTemplate<ButtonProps> = args => {
  return (
    <Flex flexDirection="column">
      <Flex flex="0 0 1" p={4} alignItems="center" bg="background.main">
        <Button {...args}>{args.children || "Regular button"}</Button>
      </Flex>
      <InvertTheme>
        <Flex flex="0 0 1" p={4} alignItems="center" bg="background.main">
          <Button {...args}>{args.children || "Inverted button"}</Button>
        </Flex>
      </InvertTheme>
    </Flex>
  );
};

export const IconButton: StoryTemplate<ButtonProps> = args => {
  return <Button {...args}>{args.children || "Regular button"}</Button>;
};
IconButton.args = {
  children: "",
  Icon: WalletAddMedium,
  iconPosition: "right",
};

export const Expand: StoryTemplate<ButtonProps> = (args: ButtonExpandProps) => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <Button.Expand {...args} onToggle={setShow}>
        {args.children}
      </Button.Expand>
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
Expand.args = {
  children: "Show all",
};

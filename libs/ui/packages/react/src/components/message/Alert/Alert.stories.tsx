import React from "react";
import Alert, { AlertProps } from "./index";
import Link from "../../cta/Link";
import Text from "../../asorted/Text";
import Button from "../../cta/Button";
import { Icons } from "../../../../src/assets";

export default {
  title: "Messages/Alerts",
  component: Alert,
  argTypes: {
    type: {
      options: ["info", "warning", "error"],
      control: {
        type: "radio",
      },
    },
    title: {
      control: {
        type: "text",
      },
      defaultValue: "Title",
    },
    showIcon: {
      control: {
        type: "boolean",
      },
      defaultValue: true,
    },
  },
};

export const Default = (args: AlertProps): JSX.Element => {
  return <Alert {...args} />;
};

export const WithContent = (args: AlertProps) => {
  return (
    <Alert
      {...args}
      containerProps={{ pr: 7 }}
      renderContent={({ color, textProps }) => (
        <>
          <Text color="inherit" {...textProps}>
            Your xpub is privacy-sensitive data. Use with caution, especially when disclosing to
            third parties.
          </Text>
          <Link
            color={color}
            textProps={textProps}
            alwaysUnderline
            size={"small" as any}
            Icon={Icons.ExternalLinkMedium}
          >
            And a learn more link
          </Link>
        </>
      )}
      renderRight={() => <Button variant="color">Click me</Button>}
    />
  );
};

import React from "react";
import Alert, { AlertProps } from "./index";
import Link from "../../cta/Link";
import Text from "../../asorted/Text";
import { Icons } from "../../../../src/assets";
export default {
  title: "Messages/Alerts",
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

export const WithChildren = (args: AlertProps) => {
  return (
    <Alert
      {...args}
      renderContent={({ color }) => (
        <>
          <Text color="inherit" variant="paragraph" fontWeight="medium">
            Some children text
          </Text>
          <Link
            color={color}
            textProps={{
              variant: "paragraph",
              fontWeight: "medium",
            }}
            alwaysUnderline
            size="small"
            Icon={Icons.ExternalLinkMedium}
          >
            And a learn more link
          </Link>
        </>
      )}
    />
  );
};

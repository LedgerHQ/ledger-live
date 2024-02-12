import React from "react";
import Alert, { AlertProps } from "./index";
import Link from "../../cta/Link";
import Button from "../../cta/Button";
import { IconsLegacy } from "../../../../src/assets";

export default {
  title: "Messages/Alerts",
  component: Alert,
  argTypes: {
    type: {
      options: ["info", "secondary", "success", "warning", "error"],
      control: {
        type: "radio",
      },
    },
    title: {
      control: {
        type: "text",
      },
    },
    showIcon: {
      control: {
        type: "boolean",
      },
    },
  },
  args: {
    title: "Title",
    showIcon: true,
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
      renderContent={({ textProps }) => (
        <>
          <Alert.BodyText>
            Your xpub is privacy-sensitive data. Use with caution, especially when disclosing to
            third parties.
          </Alert.BodyText>
          <Link
            textProps={textProps}
            alwaysUnderline
            size={"small" as "small" | "medium" | "large"}
            Icon={IconsLegacy.ExternalLinkMedium}
          >
            <Alert.UnderlinedText>Learn more</Alert.UnderlinedText>
          </Link>
        </>
      )}
      renderRight={() => <Button variant="color">Click me</Button>}
    />
  );
};

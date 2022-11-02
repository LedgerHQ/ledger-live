import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Icons, Link } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import Page from "~/renderer/components/Page";
import Settings from ".";

type Props = RouteComponentProps;

const WelcomeScreenSettings: React.FC<Props> = props => {
  return (
    <Box
      grow
      horizontal
      bg="palette.background.default"
      color="palette.text.shade60"
      style={{ width: "100%", height: "100%" }}
    >
      <Page>
        <Link
          alignSelf="flex-start"
          onClick={() => {
            props.history.push("/onboarding");
          }}
          mb={5}
          Icon={Icons.ArrowLeftMedium}
          iconPosition="left"
        >
          Back
        </Link>
        <Settings {...props} />
      </Page>
    </Box>
  );
};

export default WelcomeScreenSettings;

import React from "react";
import { useNavigate } from "react-router";
import { IconsLegacy, Link } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import Page from "LLD/components/Page";
import Settings from ".";
import { NewSettingsRoute } from "LLD/features/NewSettings";

const WelcomeScreenSettings: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      grow
      horizontal
      bg="background.default"
      color="neutral.c70"
      style={{ width: "100%", height: "100%" }}
    >
      <Page>
        <Link
          alignSelf="flex-start"
          onClick={() => {
            navigate("/onboarding");
          }}
          mb={5}
          Icon={IconsLegacy.ArrowLeftMedium}
          iconPosition="left"
        >
          Back
        </Link>
        <NewSettingsRoute legacySettings={<Settings />} />
      </Page>
    </Box>
  );
};

export default WelcomeScreenSettings;

import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import NewSeedIllustration from "./NewSeedIllustration";
import { track } from "~/analytics";
import { SeedOriginType } from "@ledgerhq/types-live";

type Props = {
  handlePress: (done: boolean) => void;
  seedConfiguration?: SeedOriginType;
};

const NewSeedConfirmation = ({ handlePress, seedConfiguration }: Props) => {
  const handleConfirm = useCallback(() => {
    track("button_clicked", {
      button: "Secure my crypto",
      flow: "onboarding",
      seedConfiguration,
    });
    handlePress(true);
  }, [handlePress, seedConfiguration]);

  const handleSkip = useCallback(() => {
    track("button_clicked", { button: "Maybe later", flow: "onboarding", seedConfiguration });
    handlePress(false);
  }, [handlePress, seedConfiguration]);

  return (
    <Flex>
      <Flex alignItems="center" mt={3}>
        <NewSeedIllustration />
      </Flex>
      <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={3}>
        <Trans i18nKey="syncOnboarding.newSeed.subtitle" />
      </Text>
      <Button mb={3} mt={6} size="small" type="main" onPress={handleConfirm}>
        <Trans i18nKey="syncOnboarding.newSeed.installCTA" />
      </Button>
      <Button size="small" onPress={handleSkip}>
        <Trans i18nKey="syncOnboarding.newSeed.skipCTA" />
      </Button>
    </Flex>
  );
};

export default NewSeedConfirmation;

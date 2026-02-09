import React, { useCallback } from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { SeedOriginType } from "@ledgerhq/types-live";
import NewSeedIllustration from "LLM/features/Onboarding/assets/NewSeedIllustration";
import { Trans } from "~/context/Locale";
import { track } from "~/analytics";

type Props = {
  handlePress: (done: boolean) => void;
  seedConfiguration?: SeedOriginType;
};

const NewSeedPanel = ({ handlePress, seedConfiguration }: Props) => {
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
      <Button
        mb={3}
        mt={6}
        size="small"
        type="main"
        onPress={handleConfirm}
        testID="new-seed-panel-confirm"
      >
        <Trans i18nKey="syncOnboarding.newSeed.installCTA" />
      </Button>
      <Button size="small" onPress={handleSkip} testID="new-seed-panel-skip">
        <Trans i18nKey="syncOnboarding.newSeed.skipCTA" />
      </Button>
    </Flex>
  );
};

export default NewSeedPanel;

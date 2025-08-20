import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import NewSeedIllustration from "./NewSeedIllustration";

type Props = {
  onConfirm: () => void;
  onReject: () => void;
};

const NewSeedConfirmation = ({ onConfirm, onReject }: Props) => (
  <Flex>
    <Flex alignItems="center" mt={3}>
      <NewSeedIllustration />
    </Flex>
    <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={3}>
      <Trans i18nKey="installSetOfApps.newSeed.subtitle" />
    </Text>
    <Button mb={3} mt={6} size="small" type="main" onPress={onConfirm}>
      <Trans i18nKey="installSetOfApps.newSeed.installCTA" />
    </Button>
    <Button size="small" onPress={onReject}>
      <Trans i18nKey="installSetOfApps.newSeed.skipCTA" />
    </Button>
  </Flex>
);

export default NewSeedConfirmation;

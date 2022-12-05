import React from "react";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import Illustration from "./Illustration";

type Props = {
  onConfirm: () => void;
  onReject: () => void;
  productName: string;
};

const Confirmation = ({ onConfirm, onReject, productName }: Props) => (
  <Flex>
    <Flex alignItems="center" mb={7} mt={3}>
      <Illustration />
    </Flex>
    <Text variant="h5" textAlign="center">
      <Trans
        i18nKey="installSetOfApps.landing.title"
        values={{ productName }}
      />
    </Text>
    <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={3}>
      <Trans i18nKey="installSetOfApps.landing.subtitle" />
    </Text>
    <Button mb={3} mt={8} type="main" onPress={onConfirm}>
      <Trans i18nKey="installSetOfApps.landing.installCTA" />
    </Button>
    <Button onPress={onReject}>
      <Trans i18nKey="installSetOfApps.landing.skipCTA" />
    </Button>
  </Flex>
);

export default Confirmation;

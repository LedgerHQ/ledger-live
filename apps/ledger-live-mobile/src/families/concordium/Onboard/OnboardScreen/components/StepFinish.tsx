import React from "react";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";

type Props = Readonly<{
  onDone: () => void;
}>;

export default function StepFinish({ onDone }: Props) {
  return (
    <Flex flex={1} justifyContent="space-between">
      <Flex alignItems="center" px={4} pt={6}>
        <Text variant="h5" fontWeight="semiBold" mb={6}>
          <Trans i18nKey="concordium.onboard.create.title" />
        </Text>
        <Alert type="success">
          <Text>
            <Trans i18nKey="concordium.onboard.finish.success" />
          </Text>
        </Alert>
      </Flex>
      <Flex px={6} pb={10}>
        <Button type="main" onPress={onDone}>
          <Trans i18nKey="common.done" />
        </Button>
      </Flex>
    </Flex>
  );
}

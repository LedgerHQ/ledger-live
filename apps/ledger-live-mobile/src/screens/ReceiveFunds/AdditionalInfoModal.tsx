import React from "react";
import { Trans } from "react-i18next";
import { BottomDrawer, Flex, Text, Button } from "@ledgerhq/native-ui";

const AdditionalInfoModal = ({
  isOpen,
  onClose,
  currencyTicker,
}: {
  isOpen: boolean;
  onClose: () => void;
  currencyTicker: string;
}) => (
  <BottomDrawer isOpen={isOpen} onClose={onClose}>
    <Text
      variant="h4"
      fontWeight="semiBold"
      color="neutral.c100"
      lineHeight="31.2px"
    >
      <Trans i18nKey="transfer.receive.additionalInfoModal.title" />
    </Text>
    <Text
      variant="bodyLineHeight"
      fontWeight="medium"
      color="neutral.c70"
      lineHeight="23.8px"
      mt={4}
    >
      <Trans
        i18nKey="transfer.receive.additionalInfoModal.subtitle"
        values={{ currencyTicker }}
      />
    </Text>
    <Flex alignSelf="stretch" mt={8}>
      <Button onPress={onClose} type="main" size="large">
        <Trans i18nKey="transfer.receive.additionalInfoModal.closeCta" />
      </Button>
    </Flex>
  </BottomDrawer>
);

export default AdditionalInfoModal;

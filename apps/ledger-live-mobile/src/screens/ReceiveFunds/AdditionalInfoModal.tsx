import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track, TrackScreen } from "../../analytics";
import QueuedDrawer from "../../components/QueuedDrawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currencyTicker: string;
};

const AdditionalInfoModal = ({ isOpen, onClose, currencyTicker }: Props) => {
  const onUnderstood = useCallback(() => {
    track("button_clicked", {
      button: "Ok, got it",
      drawer: "AdditionalInfoModal",
    });
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "AdditionalInfoModal",
    });
    onClose();
  }, [onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
      <TrackScreen
        category="Receive"
        name="Explication Account Import/Creation"
        type="drawer"
      />
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
        <Button onPress={onUnderstood} type="main" size="large">
          <Trans i18nKey="transfer.receive.additionalInfoModal.closeCta" />
        </Button>
      </Flex>
    </QueuedDrawer>
  );
};

export default AdditionalInfoModal;

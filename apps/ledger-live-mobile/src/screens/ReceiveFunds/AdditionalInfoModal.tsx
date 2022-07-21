import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { BottomDrawer, Flex, Text, Button } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import { track, TrackScreen } from "../../analytics";
import { usePreviousRouteName } from "../../helpers/routeHooks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currencyTicker: string;
};

const AdditionalInfoModal = ({ isOpen, onClose, currencyTicker }: Props) => {
  const route = useRoute();
  const lastRoute = usePreviousRouteName();

  const onUnderstood = useCallback(() => {
    track("button_clicked", {
      button: "Ok, got it",
      screen: route.name,
      drawer: "AdditionalInfoModal",
    });
    onClose();
  }, [onClose, route.name]);

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: route.name,
      drawer: "AdditionalInfoModal",
    });
    onClose();
  }, [onClose, route.name]);

  return (
    <BottomDrawer isOpen={isOpen} onClose={handleClose}>
      <TrackScreen
        category="ReceiveFunds"
        name="Explication Account Import/Creation"
        source={lastRoute}
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
    </BottomDrawer>
  );
};

export default AdditionalInfoModal;

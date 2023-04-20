import React from "react";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";

export type Props = {
  isOpen: boolean;
  onPress?: () => void;
  onClose?: () => void;
  productName: string;
};

const GenuineCheckDrawer = ({
  isOpen,
  onPress,
  productName,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      onClose={onClose}
      isRequestingToBeOpened={isOpen}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen
        category="Start Stax hardware check"
        type="drawer"
        refreshSource={false}
      />
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <Icons.LedgerLogoMedium size={28} color="primary.c80" />
      </Flex>
      <Text variant="paragraph" color="primary.c80" textAlign="center">
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckRequestDrawer.iconText",
        )}
      </Text>
      <Text textAlign="center" variant="h4" mb={8} mt={8}>
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckRequestDrawer.title",
          { productName },
        )}
      </Text>
      <Button type="main" mb={6} onPress={onPress}>
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckRequestDrawer.checkCta",
        )}
      </Button>
    </QueuedDrawer>
  );
};

export default GenuineCheckDrawer;

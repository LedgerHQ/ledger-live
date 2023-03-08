import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";

export type Props = {
  isOpen: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
  productName: string;
};

const GenuineCheckCancelledDrawer = ({
  isOpen,
  onRetry,
  onSkip,
  onClose,
  productName,
}: Props) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen
        category="Failed Stax hardware check"
        type="drawer"
        refreshSource={false}
      />
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <BoxedIcon
          Icon={<WarningSolidMedium color="warning.c80" size={24} />}
          variant="circle"
          backgroundColor="neutral.c30"
          borderColor="transparent"
          size={48}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.title",
        )}
      </Text>
      <Text
        textAlign="center"
        variant="bodyLineHeight"
        mb={8}
        color="neutral.c80"
      >
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.description",
          { productName },
        )}
      </Text>
      <Button type="main" mb={4} onPress={onRetry}>
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.retryCta",
        )}
      </Button>
      <Button onPress={onSkip}>
        {t(
          "syncOnboarding.softwareChecksSteps.genuineCheckCancelledDrawer.skipCta",
        )}
      </Button>
    </QueuedDrawer>
  );
};

export default GenuineCheckCancelledDrawer;

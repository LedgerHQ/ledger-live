import React from "react";
import {
  BottomDrawer,
  BoxedIcon,
  Button,
  Flex,
  Text,
} from "@ledgerhq/native-ui";
import { ShieldCheckMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";

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
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <BoxedIcon
          Icon={<ShieldCheckMedium color="warning.c100" size={24} />}
          variant="circle"
          backgroundColor="warning.c30"
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
    </BottomDrawer>
  );
};

export default GenuineCheckCancelledDrawer;

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
    <BottomDrawer
      onClose={onClose}
      isOpen={isOpen}
      preventBackdropClick
      noCloseButton
    >
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <BoxedIcon
          Icon={<ShieldCheckMedium color="primary.c90" size={24} />}
          variant="circle"
          backgroundColor="primary.c30"
          borderColor="transparent"
          size={48}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={8} mt={8}>
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
    </BottomDrawer>
  );
};

export default GenuineCheckDrawer;

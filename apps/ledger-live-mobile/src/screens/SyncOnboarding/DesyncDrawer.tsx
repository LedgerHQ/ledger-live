import React, { useCallback } from "react";
import { BottomDrawer, Button, Link, Text } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";

import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import { ScreenName } from "../../const";

export type Props = {
  isOpen: boolean;
  onClose?: () => void;
  productName: string;
} & Pick<
  StackScreenProps<SyncOnboardingStackParamList, "SyncOnboardingCompanion">,
  "navigation"
>;

const DesyncDrawer = ({ isOpen, onClose, navigation, productName }: Props) => {
  const { t } = useTranslation();

  const handleRetryPress = useCallback(() => {
    // Replace to avoid going back to this screen without re-rendering
    navigation.replace(ScreenName.BleDevicesScanning as "BleDevicesScanning");
  }, [navigation]);

  const handleSupportPress = useCallback(() => {
    // TODO: add logic when user press "Support" button
  }, []);

  return (
    <BottomDrawer
      onClose={onClose}
      isOpen={isOpen}
      preventBackdropClick
      noCloseButton
    >
      <Text variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t("syncOnboarding.desyncDrawer.title", { productName })}
      </Text>
      <Text variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("syncOnboarding.desyncDrawer.description", { productName })}
      </Text>
      <Button type="main" outline mb={6} onPress={handleRetryPress}>
        {t("syncOnboarding.desyncDrawer.retryCta")}
      </Button>
      <Link Icon={ExternalLinkMedium} onPress={handleSupportPress}>
        {t("syncOnboarding.desyncDrawer.helpCta")}
      </Link>
    </BottomDrawer>
  );
};

export default DesyncDrawer;

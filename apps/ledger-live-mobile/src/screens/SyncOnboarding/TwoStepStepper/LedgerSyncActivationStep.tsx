import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import IconsHeader from "LLM/features/WalletSync/components/Activation/IconsHeader";
import { setFromLedgerSyncOnboarding, setOnboardingType } from "~/actions/settings";
import { OnboardingType } from "~/reducers/types";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import SkipLedgerSyncDrawer from "./SkipLedgerSyncDrawer";
import { useDispatch } from "~/context/store";

const { BodyText } = VerticalTimeline;

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
>;

const LedgerSyncActivationStep = ({
  handleContinue,
  isLedgerSyncActive,
  device,
}: {
  handleContinue: () => void;
  isLedgerSyncActive: boolean;
  device: Device;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleSyncActivation = useCallback(() => {
    dispatch(setFromLedgerSyncOnboarding(true));
    dispatch(setOnboardingType(OnboardingType.setupNew));

    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: {
        device,
      },
    });
  }, [device, dispatch, navigation]);

  const handleDrawerClose = useCallback(() => setIsDrawerOpen(false), []);

  const handlSyncOpenFromDrawer = useCallback(() => {
    handleDrawerClose();
    handleSyncActivation();
  }, [handleDrawerClose, handleSyncActivation]);

  const handleSkip = useCallback(() => {
    handleDrawerClose();
    handleContinue();
  }, [handleDrawerClose, handleContinue]);

  return (
    <>
      <Flex justifyContent="center">
        <IconsHeader />
        <Flex mt={3} alignItems="center" justifyContent="center">
          <Text variant="h5" fontWeight="semiBold">
            {t("syncOnboarding.syncStep.descriptionTitle")}
          </Text>
          <BodyText variant="body" textAlign="center">
            {t("syncOnboarding.syncStep.description")}
          </BodyText>
        </Flex>
        {!isLedgerSyncActive && (
          <Button mb={3} mt={4} size="small" type="main" onPress={handleSyncActivation}>
            {t("common.continue")}
          </Button>
        )}
        {!isLedgerSyncActive && (
          <Button size="small" onPress={() => setIsDrawerOpen(true)}>
            {t("syncOnboarding.syncStep.skipCta")}
          </Button>
        )}
      </Flex>
      <SkipLedgerSyncDrawer
        isOpen={isDrawerOpen}
        handleClose={handleDrawerClose}
        openSync={handlSyncOpenFromDrawer}
        skipSync={handleSkip}
      />
    </>
  );
};

export default LedgerSyncActivationStep;

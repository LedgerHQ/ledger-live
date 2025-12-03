import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Flex, Text } from "@ledgerhq/react-ui/index";
import { SeedOriginType } from "@ledgerhq/types-live";
import NewSeedIllustration from "./NewSeedIllustration";
import {
  onboardingReceiveFlowSelector,
  onboardingReceiveSuccessSelector,
  setIsOnboardingReceiveFlow,
} from "~/renderer/reducers/onboarding";
import { track } from "~/renderer/analytics/segment";
import { analyticsFlowName } from "~/renderer/components/SyncOnboarding/Manual/shared";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";

const NewSeedPanel = ({
  handleComplete,
  seedConfiguration,
}: {
  handleComplete: () => void;
  seedConfiguration?: SeedOriginType;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const isOnboardingReceiveSuccess = useSelector(onboardingReceiveSuccessSelector);
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "receive",
    "MODAL_RECEIVE",
  );
  const handlePressFund = useCallback(() => {
    track("button_clicked", {
      button: "Secure my crypto",
      flow: analyticsFlowName,
      seedConfiguration,
    });
    dispatch(
      setIsOnboardingReceiveFlow({
        isFlow: true,
        isSuccess: false,
      }),
    );
    openAssetFlow();
  }, [dispatch, seedConfiguration, openAssetFlow]);

  const handleSkip = useCallback(() => {
    track("button_clicked", { button: "Maybe later", flow: analyticsFlowName, seedConfiguration });
    handleComplete();
  }, [handleComplete, seedConfiguration]);

  useEffect(() => {
    if (!isOnboardingReceiveFlow && isOnboardingReceiveSuccess) {
      dispatch(
        setIsOnboardingReceiveFlow({
          isFlow: false,
          isSuccess: false,
        }),
      );
      handleComplete();
    }
  }, [handleComplete, isOnboardingReceiveFlow, dispatch, isOnboardingReceiveSuccess]);

  return (
    <Flex flexDirection="column">
      <Flex justifyContent="center" alignItems="center" mb={6} mt={0}>
        <NewSeedIllustration />
      </Flex>

      <Text variant="bodyLineHeight" color="neutral.c80" textAlign="center" mt={2}>
        {t("syncOnboarding.manual.secureCrypto.description")}
      </Text>
      <Flex pt={8} pb={2} justifyContent="space-between">
        <Button variant="shade" outline flex={1} onClick={handleSkip} data-testid="skip-cta-button">
          {t("syncOnboarding.manual.secureCrypto.skipButton")}
        </Button>
        <Flex px={2} />
        <Button
          flex={1}
          variant="main"
          onClick={handlePressFund}
          data-testid="onboarding-fund-new-seed"
        >
          {t("syncOnboarding.manual.secureCrypto.depositButton")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default NewSeedPanel;

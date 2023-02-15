import React, { useState } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";

import Button from "../ButtonV3";
import DefaultAppsIllustration from "./DefaultAppsIllustration";
import RestoreAppsIllustration from "./RestoreAppsIllustration";
import AppInstallItem from "./AppInstallItem";
import { useTranslation } from "react-i18next";

const DEFAULT_APPS_TO_INSTALL_FALLBACK = ["Bitcoin", "Ethereum", "Polygon"];

type Props = {
  restore?: boolean;
  productName: string;
  restoreDeviceName?: string;
  onComplete?: () => void;
};

const OnboardingAppInstallStep = ({
  restore,
  productName,
  restoreDeviceName,
  onComplete,
}: Props) => {
  const { t } = useTranslation();

  const [dependenciesToInstall] = useState<string[]>(DEFAULT_APPS_TO_INSTALL_FALLBACK);
  const [inProgress, setInProgress] = useState<boolean>(false);

  const handleInstallDefault = () => {
    setInProgress(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const renderInstallsInProgress = () => {
    return (
      <Flex height="100%" flexDirection="column">
        <Flex flex={1} alignItems="center">
          <Flex mb={2} alignSelf="flex-start">
            <Text mb={5} variant="paragraphLineHeight">
              {t("onboardingAppInstall.progress.loading")}
            </Text>
          </Flex>
        </Flex>
        <Flex flexDirection="column" mt={2} mb={4}>
          {dependenciesToInstall.map((appName, index) => (
            <AppInstallItem
              key={appName}
              appName={appName}
              index={index}
              isActive={index === 1}
              installed={index === 0}
              itemProgress={33}
            />
          ))}
        </Flex>
        <Text variant="paragraphLineHeight" color="neutral.c70">
          {t("onboardingAppInstall.progress.disclaimer")}
        </Text>
      </Flex>
    );
  };

  const renderRestoreAppsConfirmation = () => {
    return (
      <Flex flexDirection="column">
        <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
          <RestoreAppsIllustration />
        </Flex>
        <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
          {restoreDeviceName
            ? t("onboardingAppInstall.restore.title", { deviceName: restoreDeviceName })
            : t("onboardingAppInstall.restore.titleNoDeviceName")}
        </Text>
        <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
          {t("onboardingAppInstall.restore.subtitle")}
        </Text>
        <Flex pt={8} pb={2} justifyContent="space-between">
          <Button flex={1} size="small" onClick={handleSkip}>
            {t("onboardingAppInstall.restore.skipCTA")}
          </Button>
          <Flex px={2} />
          <Button flex={1} variant="main" size="small" onClick={handleInstallDefault}>
            {t("onboardingAppInstall.restore.installCTA")}
          </Button>
        </Flex>
      </Flex>
    );
  };

  const renderDefaultAppsConfirmation = () => {
    return (
      <Flex flexDirection="column">
        <Flex justifyContent="center" alignItems="center" mb={10} mt={4}>
          <DefaultAppsIllustration />
        </Flex>
        <Text variant="h5Inter" fontWeight="semiBold" textAlign="center">
          {t("onboardingAppInstall.default.title", { productName })}
        </Text>
        <Text variant="paragraphLineHeight" color="neutral.c70" textAlign="center" mt={2}>
          {t("onboardingAppInstall.default.subtitle")}
        </Text>
        <Flex pt={8} pb={2} justifyContent="space-between">
          <Button flex={1} size="small" onClick={handleSkip}>
            {t("onboardingAppInstall.default.skipCTA")}
          </Button>
          <Flex px={2} />
          <Button flex={1} variant="main" size="small" onClick={handleInstallDefault}>
            {t("onboardingAppInstall.default.installCTA")}
          </Button>
        </Flex>
      </Flex>
    );
  };

  return inProgress
    ? renderInstallsInProgress()
    : restore
    ? renderRestoreAppsConfirmation()
    : renderDefaultAppsConfirmation();
};

export default OnboardingAppInstallStep;

import React from "react";
import { Flex, Text, ProgressLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AllowManager } from "~/components/DeviceAction/common";
import type { AppInstallConfig } from "../../constants/appInstallMap";
import { useInstallingContentViewModel } from "./useInstallingContentViewModel";

type Props = {
  device: Device;
  appConfig: AppInstallConfig;
  onSuccess: () => void;
  onError: (error: Error) => void;
};

export function InstallingContent({ device, appConfig, onSuccess, onError }: Props) {
  const { t } = useTranslation();
  const { showAllowManager, listingApps, progress, productName } =
    useInstallingContentViewModel({ device, appConfig, onSuccess, onError });

  if (showAllowManager) {
    return (
      <Flex px={6} pb={6}>
        <AllowManager
          wording={t("DeviceAction.allowManagerPermission", { productName })}
          device={device}
        />
      </Flex>
    );
  }

  if (listingApps) {
    return (
      <Flex alignItems="center" justifyContent="center" pt={8} pb={6} px={10}>
        <ProgressLoader infinite radius={30} strokeWidth={6} />
        <Text variant="h5" fontWeight="semiBold" textAlign="center" mt={6}>
          {t("deeplinkInstallApp.installing.resolving")}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex alignItems="center" justifyContent="center" pt={8} pb={6} px={10}>
      <ProgressLoader
        progress={progress}
        infinite={typeof progress !== "number" || progress === 1}
        radius={30}
        strokeWidth={6}
      >
        <Text color="primary.c80" variant="paragraph" fontWeight="semiBold">
          {typeof progress === "number" && progress < 1
            ? `${Math.round(progress * 100)}%`
            : ""}
        </Text>
      </ProgressLoader>
      <Text variant="h5" fontWeight="semiBold" textAlign="center" mt={6}>
        {t("deeplinkInstallApp.installing.title", { appName: appConfig.displayName })}
      </Text>
    </Flex>
  );
}

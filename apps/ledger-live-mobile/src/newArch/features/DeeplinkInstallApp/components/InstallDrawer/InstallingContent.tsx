import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text, ProgressLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { AllowManager } from "~/components/DeviceAction/common";
import { getDeviceModel } from "@ledgerhq/devices";
import type { AppInstallConfig } from "../../constants/appInstallMap";

type Props = {
  device: Device;
  appConfig: AppInstallConfig;
  onSuccess: () => void;
  onError: (error: Error) => void;
};

export function InstallingContent({ device, appConfig, onSuccess, onError }: Props) {
  const { t } = useTranslation();
  const action = useAppDeviceAction();

  const commandRequest = useMemo(
    () => ({
      dependencies: [{ appName: appConfig.appName }],
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [appConfig.appName],
  );

  const status = action.useHook(device, commandRequest);

  const {
    allowManagerRequested = false,
    listingApps = false,
    error,
    progress,
    opened,
  } = status || {};

  const [showAllowManager, setShowAllowManager] = useState(false);
  const allowManagerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCalledSuccess = useRef(false);
  const hasCalledError = useRef(false);

  useEffect(() => {
    if (allowManagerRequested) {
      allowManagerTimerRef.current = setTimeout(() => {
        setShowAllowManager(true);
      }, 300);
    } else {
      if (allowManagerTimerRef.current) {
        clearTimeout(allowManagerTimerRef.current);
        allowManagerTimerRef.current = null;
      }
      setShowAllowManager(false);
    }

    return () => {
      if (allowManagerTimerRef.current) {
        clearTimeout(allowManagerTimerRef.current);
      }
    };
  }, [allowManagerRequested]);

  useEffect(() => {
    if (opened && !hasCalledSuccess.current) {
      hasCalledSuccess.current = true;
      onSuccess();
    }
  }, [opened, onSuccess]);

  useEffect(() => {
    if (error && !hasCalledError.current) {
      hasCalledError.current = true;
      onError(error);
    }
  }, [error, onError]);

  if (showAllowManager) {
    const productName = getDeviceModel(device.modelId)?.productName || "";
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

import React from "react";
import { ProgressLoader } from "@ledgerhq/native-ui";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AllowManager } from "~/components/DeviceAction/common";
import type { AppInstallConfig } from "../../constants/appInstallMap";
import { useInstallingContentViewModel } from "./useInstallingContentViewModel";

type Props = Readonly<{
  device: Device;
  appConfig: AppInstallConfig;
  onSuccess: () => void;
  onError: (error: Error) => void;
}>;

export function InstallingContent({ device, appConfig, onSuccess, onError }: Props) {
  const { t } = useTranslation();
  const { showAllowManager, listingApps, progress, productName } = useInstallingContentViewModel({
    device,
    appConfig,
    onSuccess,
    onError,
  });

  if (showAllowManager) {
    return (
      <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s16" }}>
        <AllowManager
          wording={t("DeviceAction.allowManagerPermission", { productName })}
          device={device}
        />
      </Box>
    );
  }

  if (listingApps) {
    return (
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "s32",
          paddingBottom: "s16",
          paddingHorizontal: "s48",
        }}
      >
        <ProgressLoader infinite radius={30} strokeWidth={6} />
        <Text
          typography="heading5SemiBold"
          lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
        >
          {t("deeplinkInstallApp.installing.resolving")}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      lx={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "s32",
        paddingBottom: "s16",
        paddingHorizontal: "s48",
      }}
    >
      <ProgressLoader
        progress={progress}
        infinite={typeof progress !== "number" || progress === 1}
        radius={30}
        strokeWidth={6}
      >
        <Text typography="body2SemiBold" lx={{ color: "interactive" }}>
          {typeof progress === "number" && progress < 1 ? `${Math.round(progress * 100)}%` : ""}
        </Text>
      </ProgressLoader>
      <Text
        typography="heading5SemiBold"
        lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
      >
        {t("deeplinkInstallApp.installing.title", { appName: appConfig.displayName })}
      </Text>
    </Box>
  );
}

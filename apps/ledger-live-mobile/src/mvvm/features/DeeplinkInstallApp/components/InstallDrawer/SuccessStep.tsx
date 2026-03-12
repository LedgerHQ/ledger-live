import React from "react";
import { Platform } from "react-native";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import VersionNumber from "react-native-version-number";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import type { AppInstallConfig } from "../../constants/appInstallMap";

type Props = Readonly<{
  appConfig: AppInstallConfig;
  deviceModelId: string | undefined;
  onClose: () => void;
}>;

export function SuccessStep({ appConfig, deviceModelId, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <TrackScreen
        category="DeeplinkInstallApp"
        name="success"
        source="Universal Link"
        device={deviceModelId}
        equipmentOS={Platform.OS}
        LLVersion={VersionNumber.appVersion}
      />
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "s32",
          paddingBottom: "s12",
        }}
      >
        <CheckmarkCircleFill size={40} color="success" />
        <Text
          typography="heading5SemiBold"
          lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
        >
          {t("deeplinkInstallApp.success.title", { appName: appConfig.displayName })}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center", marginTop: "s12" }}>
          {t(appConfig.successDescriptionKey ?? "deeplinkInstallApp.success.genericDescription", {
            appName: appConfig.displayName,
          })}
        </Text>
        <Button
          appearance="gray"
          size="lg"
          lx={{ marginTop: "s24", alignSelf: "stretch" }}
          onPress={onClose}
        >
          {t("common.done")}
        </Button>
      </Box>
    </>
  );
}

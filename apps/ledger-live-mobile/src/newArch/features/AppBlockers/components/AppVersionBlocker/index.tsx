import AppBlocker from "../AppBlocker";
import { Button, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { Linking, Platform } from "react-native";
import { urls } from "~/utils/urls";
import { useTheme } from "styled-components/native";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";
import VersionNumber from "react-native-version-number";
import { useTranslation } from "react-i18next";

const AppVersionBlocker: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { shouldUpdate } = useAppVersionBlockCheck({
    appKey: "llm",
    platform: Platform.OS === "ios" ? "ios" : "android",
    appVersion: VersionNumber.appVersion,
    osVersion: `${Platform.Version}`,
  });

  const storeUrl = Platform.OS === "ios" ? urls.applestore : urls.playstore;
  const handleOpenStore = () => {
    Linking.openURL(storeUrl);
  };

  const renderCta = () => (
    <Button
      type="main"
      Icon={() => <Icons.ExternalLink size="M" color="neutral.c100" />}
      iconPosition="right"
      border={2}
      borderStyle="solid"
      borderColor={colors.opacityDefault.c50}
      borderRadius={500}
      color="neutral.c100"
      outline
      onPress={handleOpenStore}
      marginTop={24}
    >
      {t("versionBlocking.openStore")}
    </Button>
  );

  return (
    <AppBlocker
      blocked={shouldUpdate}
      title={t("versionBlocking.title")}
      description={t("versionBlocking.description")}
      ButtonComponent={renderCta}
      IconComponent={() => <Icons.DeleteCircleFill size="L" color="error.c60" />}
    >
      {children}
    </AppBlocker>
  );
};

export default AppVersionBlocker;

import AppBlocker from "../AppBlocker";
import { BoxedIcon, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Linking, Platform } from "react-native";
import { urls } from "~/utils/urls";
import { useTheme } from "styled-components/native";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";
import VersionNumber from "react-native-version-number";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AppVersionBlocker: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

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
    <Flex paddingX={8} backgroundColor={colors.background.drawer} paddingBottom={bottom}>
      <Button
        type="main"
        justifySelf="flex-end"
        border={2}
        borderStyle="solid"
        borderColor={colors.opacityDefault.c50}
        borderRadius={500}
        color="neutral.c100"
        onPress={handleOpenStore}
      >
        {t("versionBlocking.openStore")}
      </Button>
    </Flex>
  );

  return (
    <AppBlocker
      blocked={shouldUpdate}
      TitleComponent={() => (
        <Text
          variant="body"
          color="neutral.c100"
          fontSize={22}
          textAlign="center"
          fontWeight="semiBold"
          marginTop={24}
        >
          {t("versionBlocking.title")}
        </Text>
      )}
      DescriptionComponent={() => (
        <Text variant="body" fontSize={14} color="neutral.c70" marginTop={16} textAlign="center">
          {t("versionBlocking.description")}
        </Text>
      )}
      BottomCTAComponent={renderCta}
      IconComponent={() => (
        <BoxedIcon
          variant="circle"
          backgroundColor="error.c60"
          Icon={() => <Icons.CloudDownload size="M" color="neutral.c40" />}
        />
      )}
    >
      {children}
    </AppBlocker>
  );
};

export default AppVersionBlocker;

import React from "react";
import { Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useOFACGeoBlockCheck } from "@ledgerhq/live-common/hooks/useOFACGeoBlockCheck";
import { useTheme } from "styled-components/native";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import AppBlocker from "../AppBlocker";
import { Button } from "@ledgerhq/native-ui";

export default function AppGeoBlocker({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { blocked, isLoading } = useOFACGeoBlockCheck({
    geoBlockingFeatureFlagKey: "llmOfacGeoBlocking",
  });
  const localizedUrl = useLocalizedUrl(urls.geoBlock.learnMore);
  const handleLearnMore = () => {
    Linking.openURL(localizedUrl);
  };

  if (isLoading) {
    return null;
  } // don't show children while loading

  return (
    <AppBlocker
      blocked={blocked}
      IconComponent={() => <Icons.DeleteCircleFill size="L" color="error.c60" />}
      TitleComponent={() => (
        <Text
          variant="body"
          color="neutral.c100"
          fontSize={24}
          fontWeight="semiBold"
          marginTop={24}
        >
          {t("geoBlocking.title")}
        </Text>
      )}
      DescriptionComponent={() => (
        <Text variant="body" fontSize={14} color="neutral.c70" marginTop={16}>
          {t("geoBlocking.description")}
        </Text>
      )}
      MidCTAComponent={() => (
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
          onPress={handleLearnMore}
          marginTop={24}
        >
          {t("geoBlocking.learnMore")}
        </Button>
      )}
    >
      {children}
    </AppBlocker>
  );
}

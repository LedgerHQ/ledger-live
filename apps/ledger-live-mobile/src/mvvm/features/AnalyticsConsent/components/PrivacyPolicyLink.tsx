import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

interface PrivacyPolicyLinkProps {
  onPrivacyPolicyPress: () => void;
}

const PrivacyPolicyLink = ({ onPrivacyPolicyPress }: PrivacyPolicyLinkProps) => {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {t("analyticsConsent.privacyPolicy")}{" "}
      </Text>
      <Text
        typography="body3"
        lx={{ color: "base" }}
        style={{ textDecorationLine: "underline" }}
        onPress={onPrivacyPolicyPress}
        accessibilityRole="link"
      >
        {t("analyticsConsent.privacyPolicyCTA")}
      </Text>
    </Box>
  );
};

export default PrivacyPolicyLink;

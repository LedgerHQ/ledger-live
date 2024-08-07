import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Link } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";

interface RevokeInfoFieldProps {
  handleOpenPrivacyPolicy: () => void;
}

const RevokeInfoField = ({ handleOpenPrivacyPolicy }: RevokeInfoFieldProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Flex flexDirection={"column"} alignItems={"start"}>
      <Text variant="small" fontWeight="small" color={colors.neutral.c70} fontSize={12}>
        {t("analyticsOptInPrompt.common.revokeInfo")}
      </Text>
      <Link
        type={"color"}
        size={"small"}
        color={colors.primary.c80}
        onClick={handleOpenPrivacyPolicy}
      >
        {t("analyticsOptInPrompt.common.learnMore")}
      </Link>
    </Flex>
  );
};

export default RevokeInfoField;

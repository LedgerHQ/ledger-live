import React from "react";
import { Footer } from "LLD/AnalyticsOptInPrompt/screens/components";
import { useTranslation } from "react-i18next";
import { Flex, Link, Button } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";

interface MainFooterProps {
  setWantToManagePreferences?: (value: boolean) => void;
  onShareAnalyticsChange: (value: boolean) => void;
}

const MainFooter = ({ setWantToManagePreferences, onShareAnalyticsChange }: MainFooterProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleManagePreferencesClick = () => setWantToManagePreferences?.(true);
  const handleAcceptClick = () => onShareAnalyticsChange(true);
  const handleRefuseClick = () => onShareAnalyticsChange(false);

  return (
    <Footer>
      <Flex columnGap={"21px"} justifyContent={"center"} width={"100%"}>
        <Link
          type={"color"}
          size={"large"}
          color={colors.primary.c80}
          onClick={handleManagePreferencesClick}
        >
          {t("analyticsOptInPrompt.variantA.managePreferences")}
        </Link>
        <Flex columnGap={"8px"}>
          <Button
            variant={"shade"}
            outline
            size={"large"}
            borderRadius={48}
            onClick={handleRefuseClick}
          >
            {t("analyticsOptInPrompt.variantA.refuse")}
          </Button>
          <Button variant={"main"} size={"large"} borderRadius={48} onClick={handleAcceptClick}>
            {t("analyticsOptInPrompt.variantA.accept")}
          </Button>
        </Flex>
      </Flex>
    </Footer>
  );
};

export default MainFooter;

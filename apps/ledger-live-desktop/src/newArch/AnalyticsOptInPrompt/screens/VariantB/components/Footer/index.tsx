import React from "react";
import { Footer } from "LLD/AnalyticsOptInPrompt/screens/components";
import { useTranslation } from "react-i18next";
import { Flex, Button } from "@ledgerhq/react-ui";

interface VariantBFooterProps {
  currentStep: number;
  clickOptions: { [key: string]: () => void };
}

const VariantBFooter = ({ currentStep, clickOptions }: VariantBFooterProps) => {
  const { t } = useTranslation();

  const handleAcceptClick = () => {
    if (currentStep === 0) clickOptions.acceptAnalytics();
    else clickOptions.acceptPersonalizedExp();
  };

  const handleRefuseClick = () => {
    if (currentStep === 0) clickOptions.refuseAnalytics();
    else clickOptions.refusePersonalizedExp();
  };

  return (
    <Footer>
      <Flex
        width={"100%"}
        justifyItems={"center"}
        columnGap={"21px"}
        alignItems={"center"}
        flex={1}
      >
        <Button
          variant={"shade"}
          outline
          size={"large"}
          borderRadius={48}
          flex={1}
          onClick={handleRefuseClick}
        >
          {t("analyticsOptInPrompt.variantB.refuse")}
        </Button>
        <Button
          variant={"main"}
          size={"large"}
          borderRadius={48}
          flex={1}
          onClick={handleAcceptClick}
        >
          {t("analyticsOptInPrompt.variantB.accept")}
        </Button>
      </Flex>
    </Footer>
  );
};

export default VariantBFooter;

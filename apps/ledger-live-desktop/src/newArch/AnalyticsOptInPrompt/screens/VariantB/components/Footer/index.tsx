import React from "react";
import { Footer } from "LLD/AnalyticsOptInPrompt/screens/components";
import { useTranslation } from "react-i18next";
import { Flex, Button } from "@ledgerhq/react-ui";

interface VariantBFooterProps {
  clickOptions: { [key: string]: () => void };
}

const VariantBFooter = ({ clickOptions }: VariantBFooterProps) => {
  const { t } = useTranslation();

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
          onClick={clickOptions.refuse}
        >
          {t("analyticsOptInPrompt.variantB.refuse")}
        </Button>
        <Button
          variant={"main"}
          size={"large"}
          borderRadius={48}
          flex={1}
          onClick={clickOptions.accept}
        >
          {t("analyticsOptInPrompt.variantB.accept")}
        </Button>
      </Flex>
    </Footer>
  );
};

export default VariantBFooter;

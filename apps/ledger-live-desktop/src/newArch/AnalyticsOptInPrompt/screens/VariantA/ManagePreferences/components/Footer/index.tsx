import { Button, Flex } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Footer } from "LLD/AnalyticsOptInPrompt/screens/components";

interface ManagePreferencesFooterProps {
  onShareClick?: (value: boolean) => void;
}

const ManagePreferencesFooter = ({ onShareClick }: ManagePreferencesFooterProps) => {
  const { t } = useTranslation();

  const handleShareClick = () => onShareClick?.(true);

  return (
    <Footer>
      <Flex width={"100%"}>
        <Button
          variant={"main"}
          size={"large"}
          width={"100%"}
          borderRadius={48}
          onClick={handleShareClick}
        >
          {t("analyticsOptInPrompt.variantA.share")}
        </Button>
      </Flex>
    </Footer>
  );
};

export default ManagePreferencesFooter;

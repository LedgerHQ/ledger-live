import React, { memo } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

interface CardTitleProps {
  readonly title: string;
  readonly subtitle: string;
}

const CardTitle = ({ title, subtitle }: CardTitleProps) => {
  return (
    <Box lx={{ paddingTop: "s56", paddingHorizontal: "s24", alignItems: "center" }}>
      <Text
        typography="heading1SemiBold"
        lx={{ color: "base", textAlign: "center" }}
        numberOfLines={2}
        adjustsFontSizeToFit
        testID={CARD_LANDING_TEST_IDS.title}
      >
        {title}
      </Text>

      <Text
        typography="body2"
        lx={{ color: "muted", textAlign: "center", marginTop: "s4" }}
        testID={CARD_LANDING_TEST_IDS.subtitle}
      >
        {subtitle}
      </Text>
    </Box>
  );
};

export default memo(CardTitle);

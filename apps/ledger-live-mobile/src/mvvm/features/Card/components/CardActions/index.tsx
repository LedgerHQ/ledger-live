import React, { memo } from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

interface CardActionsProps {
  readonly ctas: readonly CardLandingCta[];
}

const ctasContainerStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
  width: "full",
};

const CardActions = ({ ctas }: CardActionsProps) => {
  return (
    <Box lx={ctasContainerStyle} testID={CARD_LANDING_TEST_IDS.ctas.container}>
      {ctas.map(cta => (
        <TileButton
          key={cta.id}
          lx={{ flex: 1 }}
          icon={cta.icon}
          onPress={cta.onPress}
          testID={cta.testID}
          accessibilityLabel={cta.label}
          isFull
        >
          {cta.label}
        </TileButton>
      ))}
    </Box>
  );
};

export default memo(CardActions);

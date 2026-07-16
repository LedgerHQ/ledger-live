import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CardScreen } from "@features/flow-card";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";

export const PayTabScreen = () => {
  const { top } = useNavigationBarHeights();

  return (
    <Box style={{ flex: 1, paddingTop: top }} testID="paytab-screen">
      <CardScreen />
    </Box>
  );
};

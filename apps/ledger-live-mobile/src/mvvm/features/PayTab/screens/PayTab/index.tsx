import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CardScreen } from "@features/flow-card";
import { CardLogin } from "@features/flow-pay-card-auth";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";

export const PayTabScreen = () => {
  const { top } = useNavigationBarHeights();

  return (
    <Box style={{ flex: 1, paddingTop: top }} testID="paytab-screen">
      <CardScreen />
      <CardLogin
        openHostedLogin={() => {
          /** TODO: Open hosted login in secure browser */
        }}
      />
    </Box>
  );
};

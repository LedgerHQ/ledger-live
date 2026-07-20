import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CardScreen } from "@features/flow-card";
import { usePayTabScreenViewModel } from "./usePayTabScreenViewModel";

export const PayTabScreen = () => {
  const { top } = usePayTabScreenViewModel();

  return (
    <Box style={{ flex: 1, paddingTop: top }} testID="paytab-screen">
      <CardScreen />
    </Box>
  );
};

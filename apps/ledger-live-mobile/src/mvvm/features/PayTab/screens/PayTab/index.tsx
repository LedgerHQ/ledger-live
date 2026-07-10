import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Card } from "@card/core";
import SafeAreaView from "~/components/SafeAreaView";

export const PayTabScreen = () => {
  return (
    <SafeAreaView isFlex testID="paytab-screen">
      <Box lx={{ padding: "s16" }}>
        <Card />
      </Box>
    </SafeAreaView>
  );
};

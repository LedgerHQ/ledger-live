import React from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { RequestReceive } from "@features/flow-pay-card-request";
import SafeAreaView from "~/components/SafeAreaView";
import { usePayTabRequestReceiveViewModel } from "./usePayTabRequestReceiveViewModel";

export const PayTabRequestReceiveScreen = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView isFlex style={{ backgroundColor: theme.colors.bg.base }}>
      <RequestReceive {...usePayTabRequestReceiveViewModel()} />
    </SafeAreaView>
  );
};

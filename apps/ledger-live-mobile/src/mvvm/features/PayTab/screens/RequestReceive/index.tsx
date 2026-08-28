import React from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { RequestReceive } from "@features/flow-pay-card-request";
import SafeAreaView from "~/components/SafeAreaView";
import GenericErrorView from "~/components/GenericErrorView";
import { usePayTabRequestReceiveViewModel } from "./usePayTabRequestReceiveViewModel";

const requestReceiveAccountMissingError = new Error("RequestReceiveAccountMissing");

export const PayTabRequestReceiveScreen = () => {
  const { theme } = useTheme();
  const viewModel = usePayTabRequestReceiveViewModel();

  return (
    <SafeAreaView isFlex style={{ backgroundColor: theme.colors.bg.base }}>
      {viewModel.address ? (
        <RequestReceive {...viewModel} />
      ) : (
        <GenericErrorView error={requestReceiveAccountMissingError} hasExportLogButton={false} />
      )}
    </SafeAreaView>
  );
};

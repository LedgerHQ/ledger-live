import React from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "@shared/analytics-react";
import { ReceiveAddress } from "@features/flow-receive";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import GenericErrorView from "~/components/GenericErrorView";
import { VerifyAddressExecutorLWM } from "LLM/features/Receive/verifyAddressIntent/VerifyAddressExecutorLWM";
import type { ReceiveAddressScreenViewProps } from "./useReceiveAddressScreenViewModel";

const receiveAccountMissingError = new Error("ReceiveAccountMissing");

export function ReceiveAddressScreenView({
  receiveAddress,
  verifyDevice,
}: ReceiveAddressScreenViewProps) {
  const { theme } = useTheme();
  // Top inset only: the screen sets its own bottom margin, like the other V4 screens.
  const { top } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1 }} style={{ paddingTop: top, backgroundColor: theme.colors.bg.base }}>
      {receiveAddress ? (
        <>
          <TrackScreen
            category="Receive address"
            flow="receive"
            asset={receiveAddress.asset.ticker}
            network={receiveAddress.network}
          />
          <ReceiveAddress {...receiveAddress} />
          {verifyDevice ? <VerifyAddressExecutorLWM {...verifyDevice} /> : null}
        </>
      ) : (
        <GenericErrorView error={receiveAccountMissingError} hasExportLogButton={false} />
      )}
    </Box>
  );
}

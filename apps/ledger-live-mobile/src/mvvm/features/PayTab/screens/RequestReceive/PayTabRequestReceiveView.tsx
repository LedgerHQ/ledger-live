import React from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { RequestReceive, VerifyAddress } from "@features/flow-pay-request";
import type { RequestReceiveProps, VerifyAddressProps } from "@features/flow-pay-request";
import SafeAreaView from "~/components/SafeAreaView";
import GenericErrorView from "~/components/GenericErrorView";
import { TrackScreen } from "~/analytics";
import {
  VerifyAddressExecutorLWM,
  type VerifyAddressExecutorLWMProps,
} from "LLM/features/PayTab/verifyAddressIntent/VerifyAddressExecutorLWM";

const requestReceiveAccountMissingError = new Error("RequestReceiveAccountMissing");

export type PayTabRequestReceiveViewProps = Readonly<{
  requestReceive: RequestReceiveProps;
  verifyAddress: VerifyAddressProps;
  verifyDevice?: VerifyAddressExecutorLWMProps;
}>;

export function PayTabRequestReceiveView({
  requestReceive,
  verifyAddress,
  verifyDevice,
}: PayTabRequestReceiveViewProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView isFlex style={{ backgroundColor: theme.colors.bg.base }}>
      {requestReceive.address ? (
        <>
          {verifyAddress.phase === "intro" ? <TrackScreen category={verifyAddress.page} /> : null}
          <RequestReceive {...requestReceive} />
          <VerifyAddress {...verifyAddress} />
          {verifyDevice ? <VerifyAddressExecutorLWM {...verifyDevice} /> : null}
        </>
      ) : (
        <GenericErrorView error={requestReceiveAccountMissingError} hasExportLogButton={false} />
      )}
    </SafeAreaView>
  );
}

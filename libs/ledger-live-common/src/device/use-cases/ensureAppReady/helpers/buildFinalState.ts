import type {
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import {
  BlockingStateType,
  FinalStateType,
  type EnsureAppReadyState,
  buildExtractedContext,
} from "@ledgerhq/live-dmk-shared";
import {
  type ExpectedAccountIdentity,
  validateDerivedAddress,
} from "../../../../hw/deviceInitialization/helpers/wrongDeviceValidation";

export function buildFinalState(params: {
  expectedAccount: ExpectedAccountIdentity | undefined;
  deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  currentApp: GetAppAndVersionResponse;
  derivation: string | undefined;
}): EnsureAppReadyState {
  const wrongDeviceCheck = validateDerivedAddress(params.expectedAccount, params.derivation);

  if (wrongDeviceCheck.status === "mismatch") {
    return {
      type: BlockingStateType.WrongDeviceForAccount,
      accountName: wrongDeviceCheck.accountName,
    };
  }

  return {
    type: FinalStateType.Success,
    extractedContext: buildExtractedContext({
      deviceMetadata: params.deviceMetadata,
      currentApp: params.currentApp,
      derivation: params.derivation,
    }),
  };
}

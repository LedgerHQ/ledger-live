import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { of } from "rxjs";
import {
  verifyAddressIntentDefinition,
  verifyAddressIntentDefinitionWithResult,
} from "../intentDefinition";
import type { StartAddressVerification, VerifyAddressIntentDefinition } from "../types";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

const confirmOnDevice: StartAddressVerification = () => ({
  observable: of({ type: "confirmed", address: ADDRESS }),
  cancel: () => {},
});

function runJob<Result>({ job }: VerifyAddressIntentDefinition<Result>) {
  const onResult = jest.fn<void, [Result]>();
  job({
    deviceConnectionResult: {
      dmk: {} as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.STAX } as never,
      compatDeviceId: "compat-1",
      compatDeviceName: "Ledger Stax",
      compatDeviceWired: true,
    },
    deviceExtractedContext: {} as never,
    input: { expectedAddress: ADDRESS, startAddressVerification: confirmOnDevice },
    onResult,
  }).subscribe();
  return onResult;
}

describe("verifyAddressIntentDefinition", () => {
  it("should report the result to a host that reads it", () => {
    const onResult = runJob(verifyAddressIntentDefinitionWithResult);

    expect(onResult).toHaveBeenCalledWith({ type: "verified", address: ADDRESS });
  });

  it("should report no result to a host that ignores it", () => {
    const onResult = runJob(verifyAddressIntentDefinition);

    expect(onResult).not.toHaveBeenCalled();
  });
});

import React from "react";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { VerifyAddressExecutorLWM } from "../VerifyAddressExecutorLWM";
import type { State } from "~/reducers/types";
import { VERIFY_ACCOUNT, withVerifyAccount, VERIFY_SELECTION } from "./verifyAddress.fixture";

type ExecutorProps = {
  deviceConnectionParams: DeviceConnectionParams;
  onIntentJobStateChanged: (jobState: VerifyAddressIntentJobState) => void;
  onUserCancel: () => void;
};

let executorProps: ExecutorProps;

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: (props: ExecutorProps) => {
    executorProps = props;
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return <View testID="device-intent-executor" />;
  },
}));

const mockBuildInit = jest.mocked(buildDeviceInitializationInput);
const mockTrack = jest.mocked(track);

const EVENT_PROPERTIES = {
  page: "Receive Address Verification",
  flow: "receive",
  asset: "ETH",
  network: "ethereum",
};

function renderExecutor(
  props: Partial<React.ComponentProps<typeof VerifyAddressExecutorLWM>> = {},
  overrideInitialState: (state: State) => State = withVerifyAccount,
) {
  const onExit = jest.fn();
  render(<VerifyAddressExecutorLWM selection={VERIFY_SELECTION} onExit={onExit} {...props} />, {
    overrideInitialState,
  });
  return { onExit };
}

async function renderMountedExecutor(
  props: Partial<React.ComponentProps<typeof VerifyAddressExecutorLWM>> = {},
) {
  const rendered = renderExecutor(props);
  await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
  return rendered;
}

describe("VerifyAddressExecutorLWM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildInit.mockResolvedValue({} as never);
  });

  it("should open the account's app on the device for the receive flow", async () => {
    await renderMountedExecutor();

    expect(mockBuildInit).toHaveBeenCalledWith({
      appRequest: { account: VERIFY_ACCOUNT, tokenCurrency: undefined },
      flow: "receive",
    });
  });

  it("should accept every device model by default", async () => {
    await renderMountedExecutor();

    expect(executorProps.deviceConnectionParams.acceptedDeviceModelIds).toEqual([]);
  });

  it("should refuse the device models the verification does not support", async () => {
    await renderMountedExecutor({ unsupportedDeviceModelIds: [DeviceModelId.NANO_S] });

    const { acceptedDeviceModelIds } = executorProps.deviceConnectionParams;
    expect(acceptedDeviceModelIds).not.toContain(DeviceModelId.NANO_S);
    expect(acceptedDeviceModelIds).toContain(DeviceModelId.STAX);
  });

  it.each([
    { jobState: { type: "verified", address: "0x" }, event: "receive_verification_complete" },
    { jobState: { type: "cancelled", retry: () => {} }, event: "receive_verification_cancelled" },
    {
      jobState: { type: "mismatch", expectedAddress: "0x", reportedAddress: "0xDEAD" },
      event: "receive_verification_mismatch",
    },
    {
      jobState: { type: "unsupported", error: new Error("cannot display") },
      event: "receive_verification_unsupported",
    },
  ] as const)("should send $event when the job reaches it", async ({ jobState, event }) => {
    await renderMountedExecutor();

    act(() => executorProps.onIntentJobStateChanged(jobState));

    expect(mockTrack).toHaveBeenCalledWith(event, EVENT_PROPERTIES);
  });

  it("should exit as verified when the user leaves after confirming on the device", async () => {
    const { onExit } = await renderMountedExecutor();
    act(() => executorProps.onIntentJobStateChanged({ type: "verified", address: "0x" }));

    expect(onExit).not.toHaveBeenCalled();
    act(() => executorProps.onUserCancel());

    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it("should send the dismiss event and exit as dismissed when the user leaves before confirming", async () => {
    const { onExit } = await renderMountedExecutor();
    act(() => executorProps.onIntentJobStateChanged({ type: "addressDisplayed" }));

    act(() => executorProps.onUserCancel());

    expect(mockTrack).toHaveBeenCalledWith("receive_verification_dismiss", EVENT_PROPERTIES);
    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should exit as mismatch when the user leaves the mismatch error", async () => {
    const { onExit } = await renderMountedExecutor();
    act(() =>
      executorProps.onIntentJobStateChanged({
        type: "mismatch",
        expectedAddress: "0x",
        reportedAddress: "0xDEAD",
      }),
    );

    act(() => executorProps.onUserCancel());

    expect(onExit).toHaveBeenCalledWith("mismatch");
  });

  it("should exit as unsupported without connecting when the device cannot show the address", async () => {
    const { onExit } = renderExecutor({
      selection: {
        ...VERIFY_SELECTION,
        verification: mockAccountReceive({
          verification: { type: "publicKey", path: "m/44h/60h/0h/0/0", publicKey: "302a" },
        }).verification!,
      },
    });

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("unsupported"));
    expect(screen.queryByTestId("device-intent-executor")).toBeNull();
  });

  it("should exit as initFailed when no legacy account backs the selected account", async () => {
    const { onExit } = renderExecutor({}, state => state);

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("initFailed"));
    expect(mockBuildInit).not.toHaveBeenCalled();
  });

  it("should exit as initFailed when the device initialization cannot be built", async () => {
    mockBuildInit.mockRejectedValueOnce(new Error("fail"));
    const { onExit } = renderExecutor();

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("initFailed"));
    expect(screen.queryByTestId("device-intent-executor")).toBeNull();
  });
});

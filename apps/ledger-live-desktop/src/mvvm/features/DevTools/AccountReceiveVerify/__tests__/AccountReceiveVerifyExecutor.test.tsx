import React from "react";
import { act, render, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { AccountReceiveVerifyExecutor } from "../AccountReceiveVerifyExecutor";

type ExecutorProps = {
  onIntentJobStateChanged: (state: VerifyAddressIntentJobState) => void;
  onIntentJobComplete: () => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
};

const executor: { props?: ExecutorProps } = {};
const buildInit = jest.fn();

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: (...args: unknown[]) => buildInit(...args),
  DeviceIntentExecutor: (props: ExecutorProps) => {
    executor.props = props;
    return null;
  },
}));

const options = {
  currency: getCryptoCurrencyById("ethereum"),
  derivationMode: "" as const,
  path: "44'/60'/0'/0/0",
  verify: true,
};
const input = { expectedAddress: "0x1", startAddressVerification: jest.fn() };

async function renderExecutor() {
  const onOutcome = jest.fn();
  render(<AccountReceiveVerifyExecutor options={options} input={input} onOutcome={onOutcome} />);
  await waitFor(() => expect(executor.props).toBeDefined());
  const props = executor.props;
  if (!props) throw new Error("executor not mounted");
  return { onOutcome, props };
}

describe("AccountReceiveVerifyExecutor", () => {
  beforeEach(() => {
    executor.props = undefined;
    buildInit.mockResolvedValue({});
  });

  it("opens the app of the currency", async () => {
    await renderExecutor();
    expect(buildInit).toHaveBeenCalledWith(
      expect.objectContaining({ appRequest: { currency: options.currency } }),
    );
  });

  it("reports the last state once the job completes, not on each emission", async () => {
    const { onOutcome, props } = await renderExecutor();
    act(() => props.onIntentJobStateChanged({ type: "verified", address: "0x1" }));
    expect(onOutcome).not.toHaveBeenCalled();
    act(() => props.onIntentJobComplete());
    expect(onOutcome).toHaveBeenCalledWith("verified on device: 0x1");
  });

  it("reports a mismatch with the address the device showed", async () => {
    const { onOutcome, props } = await renderExecutor();
    act(() =>
      props.onIntentJobStateChanged({
        type: "mismatch",
        expectedAddress: "0x1",
        reportedAddress: "0x2",
      }),
    );
    act(() => props.onIntentJobComplete());
    expect(onOutcome).toHaveBeenCalledWith("mismatch: device showed 0x2");
  });

  it("keeps a cancelled job open until the user closes it", async () => {
    const { onOutcome, props } = await renderExecutor();
    act(() => props.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
    expect(onOutcome).not.toHaveBeenCalled();
    act(() => props.onUserCancel());
    expect(onOutcome).toHaveBeenCalledWith("cancelled on device");
  });

  it("reports an error once, whatever follows", async () => {
    const { onOutcome, props } = await renderExecutor();
    act(() => props.onIntentJobError(new Error("boom")));
    act(() => props.onUserCancel());
    expect(onOutcome).toHaveBeenCalledTimes(1);
    expect(onOutcome).toHaveBeenCalledWith("error: Error: boom");
  });

  it("reports an unsupported device, and a close before any state as dismissed", async () => {
    const first = await renderExecutor();
    act(() =>
      first.props.onIntentJobStateChanged({ type: "unsupported", error: new Error("old app") }),
    );
    act(() => first.props.onIntentJobComplete());
    expect(first.onOutcome).toHaveBeenCalledWith("unsupported: old app");

    executor.props = undefined;
    const second = await renderExecutor();
    act(() => second.props.onUserCancel());
    expect(second.onOutcome).toHaveBeenCalledWith("dismissed");
  });

  it("reports a failed app opening", async () => {
    buildInit.mockRejectedValue(new Error("no app"));
    const onOutcome = jest.fn();
    render(<AccountReceiveVerifyExecutor options={options} input={input} onOutcome={onOutcome} />);
    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith("init failed: Error: no app"));
  });
});

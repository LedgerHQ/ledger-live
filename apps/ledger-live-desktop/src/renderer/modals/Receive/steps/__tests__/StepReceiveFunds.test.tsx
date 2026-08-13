import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { DeviceModelId } from "@ledgerhq/devices";
import StepReceiveFunds from "../StepReceiveFunds";
import type { StepProps } from "~/renderer/modals/Receive/Body";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => ({})),
}));

jest.mock("LLD/hooks/useVersionedStakePrograms", () => ({
  useVersionedStakePrograms: jest.fn(() => undefined),
}));

const mockDevice: Device = {
  deviceId: "mock-device",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const SHIELDED = "u1testshieldedaddress";

const makeAccount = (currencyId: string, privateInfo?: object) => ({
  ...createFixtureAccount(),
  currency: { id: currencyId, family: "bitcoin" },
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const baseProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  t: ((k: string) => k) as never,
  transitionTo: jest.fn(),
  device: mockDevice,
  account: makeAccount("bitcoin") as never,
  parentAccount: null,
  token: null,
  receiveTokenMode: false,
  closeModal: jest.fn(),
  isAddressVerified: null,
  verifyAddressError: null,
  onRetry: jest.fn(),
  onSkipConfirm: jest.fn(),
  onResetSkip: jest.fn(),
  onChangeToken: jest.fn(),
  onChangeAccount: jest.fn(),
  onChangeAddressVerified: jest.fn(),
  onClose: jest.fn(),
  currencyName: "bitcoin",
  ...overrides,
});

// Prevents the standard confirmAddress() 0x40 path from firing during rendering tests.
const { useLLDCoinFamily } = jest.requireMock("~/renderer/families") as {
  useLLDCoinFamily: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  useLLDCoinFamily.mockReturnValue({ useCustomConfirmAddress: true });
});

describe("StepReceiveFunds — device animation block", () => {
  it("shows the Zcash device animation when shielded address is set", () => {
    render(
      <StepReceiveFunds
        {...baseProps({
          account: makeAccount("zcash", { shieldedAddress: SHIELDED, ufvk: "uview1test" }) as never,
          currencyName: "zcash",
        })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );
    expect(screen.getByTestId("zcash-receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("receive-device-animation")).not.toBeInTheDocument();
  });

  it("shows no device animation for Zcash when in the activation CTA state (no shielded address)", () => {
    render(
      <StepReceiveFunds
        {...baseProps({ account: makeAccount("zcash") as never, currencyName: "zcash" })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("receive-device-animation")).not.toBeInTheDocument();
  });

  it("shows the standard device animation for non-Zcash accounts", () => {
    render(<StepReceiveFunds {...baseProps()} />, {
      initialState: withFlagOverrides({ zcashShielded: { enabled: true } }),
    });
    expect(screen.getByTestId("receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });
});

describe("StepReceiveFunds — Zcash shielded effects", () => {
  it("suppresses the standard 0x40 confirmAddress call for Zcash even without a shielded address", async () => {
    // Allow the real confirmAddress effect to run (useCustomConfirmAddress: false)
    useLLDCoinFamily.mockReturnValue({});
    const onChangeAddressVerified = jest.fn();

    render(
      <StepReceiveFunds
        {...baseProps({
          account: makeAccount("zcash") as never, // no shieldedAddress — CTA state
          currencyName: "zcash",
          onChangeAddressVerified,
        })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );

    await act(async () => {});
    // If confirmAddress() had fired and failed, it would have called onChangeAddressVerified(false, err).
    expect(onChangeAddressVerified).not.toHaveBeenCalled();
  });

  it("calls transitionTo('receive') when isAddressVerified becomes true after shielded verification", async () => {
    const transitionTo = jest.fn();

    render(
      <StepReceiveFunds
        {...baseProps({
          account: makeAccount("zcash", { shieldedAddress: SHIELDED, ufvk: "uview1test" }) as never,
          currencyName: "zcash",
          isAddressVerified: true,
          transitionTo,
        })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );

    await waitFor(() => expect(transitionTo).toHaveBeenCalledWith("receive"));
  });
});

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
  it("shows the standard device animation when the family provides no animation slot", () => {
    render(<StepReceiveFunds {...baseProps()} />);
    expect(screen.getByTestId("receive-device-animation")).toBeInTheDocument();
  });

  it("delegates to the family animation slot when one is provided", () => {
    useLLDCoinFamily.mockReturnValue({
      useCustomConfirmAddress: true,
      StepReceiveFundsDeviceAnimation: () => <div data-testid="family-device-animation" />,
    });

    render(<StepReceiveFunds {...baseProps()} />);

    expect(screen.getByTestId("family-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("receive-device-animation")).not.toBeInTheDocument();
  });

  it("gives the animation slot the standard animation as fallback", () => {
    useLLDCoinFamily.mockReturnValue({
      useCustomConfirmAddress: true,
      StepReceiveFundsDeviceAnimation: ({ fallback }: { fallback: React.ReactNode }) => (
        <>{fallback}</>
      ),
    });

    render(<StepReceiveFunds {...baseProps()} />);

    expect(screen.getByTestId("receive-device-animation")).toBeInTheDocument();
  });
});

describe("StepReceiveFunds — custom confirm address", () => {
  it("suppresses the standard confirmation when the family function returns true", async () => {
    const useCustomConfirmAddress = jest.fn(() => true);
    useLLDCoinFamily.mockReturnValue({ useCustomConfirmAddress });
    const onChangeAddressVerified = jest.fn();
    const account = makeAccount("zcash", { shieldedAddress: SHIELDED });

    render(
      <StepReceiveFunds
        {...baseProps({
          account: account as never,
          currencyName: "zcash",
          onChangeAddressVerified,
        })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );

    expect(useCustomConfirmAddress).toHaveBeenCalledWith(
      expect.objectContaining({ privateInfo: { shieldedAddress: SHIELDED } }),
      expect.objectContaining({ zcashShielded: expect.objectContaining({ enabled: true }) }),
    );
    await act(async () => {});
    expect(onChangeAddressVerified).not.toHaveBeenCalled();
  });

  it("runs the standard confirmation when the family function returns false", async () => {
    useLLDCoinFamily.mockReturnValue({ useCustomConfirmAddress: () => false });
    const onChangeAddressVerified = jest.fn();

    render(
      <StepReceiveFunds
        {...baseProps({
          account: makeAccount("zcash") as never,
          currencyName: "zcash",
          onChangeAddressVerified,
        })}
      />,
    );

    // confirmAddress() fires; it resolves or rejects in the test env, but it
    // must NOT be suppressed — onChangeAddressVerified is called either way.
    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalled());
  });
});

describe("StepReceiveFunds — two-block address isolation", () => {
  it("public block shows freshAddress and private block shows shieldedAddress, addresses differ", () => {
    // Primary funds-loss guard: crossing QR/copy targets would send funds to the wrong address.
    const PrivateMock = () => <div data-testid="receive-private-address-block">{SHIELDED}</div>;
    useLLDCoinFamily.mockReturnValue({
      useCustomConfirmAddress: true,
      StepReceiveFundsPostAlert: PrivateMock,
    });

    const account = makeAccount("zcash", { shieldedAddress: SHIELDED, ufvk: "uview1test" });

    render(
      <StepReceiveFunds
        {...baseProps({ account: account as never, currencyName: "zcash", device: mockDevice })}
      />,
      { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
    );

    const publicBlock = screen.getByTestId("receive-public-address-block");
    const privateBlock = screen.getByTestId("receive-private-address-block");

    expect(publicBlock).toHaveTextContent(account.freshAddress);
    expect(privateBlock).toHaveTextContent(SHIELDED);
    expect(account.freshAddress).not.toBe(SHIELDED);
  });
});

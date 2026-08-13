import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { DeviceModelId } from "@ledgerhq/devices";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { ZcashShieldedReceiveBlock } from "../ZcashShieldedReceiveBlock";
import type { ZcashShieldedReceiveBlockProps } from "../ZcashShieldedReceiveBlock";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
}));

const mockedUseAccountBridge = jest.mocked(useAccountBridge);

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const SHIELDED = "u1testshieldedaddressfortesting000xyz";
const UFVK = "uview1testufvkkey";

const baseAccount = {
  ...createFixtureAccount(),
  currency: { id: "zcash", family: "bitcoin" },
};

const buildAccount = (privateInfo?: unknown) => ({
  ...baseAccount,
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const mockBridge = (getShieldedAddress: jest.Mock) =>
  mockedUseAccountBridge.mockReturnValue({
    getShieldedAddress,
  } as unknown as ReturnType<typeof useAccountBridge>);

const renderBlock = (overrides: Partial<ZcashShieldedReceiveBlockProps> = {}) =>
  render(
    <ZcashShieldedReceiveBlock
      {...{
        account: buildAccount({ shieldedAddress: SHIELDED, ufvk: UFVK }) as never,
        device: mockDevice,
        isAddressVerified: null,
        onChangeAddressVerified: jest.fn(),
        closeModal: jest.fn(),
        ...overrides,
      }}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
  );

beforeEach(() => {
  jest.clearAllMocks();
  // Never-resolving: keeps verification effect pending so it does not
  // mutate state during render assertions.
  mockBridge(jest.fn(() => new Promise(() => {})));
});

describe("ZcashShieldedReceiveBlock — rendering", () => {
  it("renders the private address block when shieldedAddress is present", () => {
    renderBlock();
    expect(screen.getByTestId("receive-private-address-block")).toBeInTheDocument();
  });

  it("renders the activation CTA when ufvk is absent", () => {
    renderBlock({ account: buildAccount({}) as never });
    expect(screen.getByText("Enable private balance")).toBeInTheDocument();
  });

  it("renders nothing when ufvk is present but shieldedAddress is null", () => {
    renderBlock({ account: buildAccount({ ufvk: UFVK, shieldedAddress: null }) as never });
    expect(screen.queryByTestId("receive-private-address-block")).not.toBeInTheDocument();
    expect(screen.queryByText("Enable private balance")).not.toBeInTheDocument();
  });
});

describe("ZcashShieldedReceiveBlock — verification", () => {
  it("calls onChangeAddressVerified(true, null) when device returns matching address", async () => {
    const onChangeAddressVerified = jest.fn();
    mockBridge(jest.fn().mockResolvedValue({ address: SHIELDED }));

    renderBlock({ onChangeAddressVerified });

    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalledWith(true, null));
  });

  it("calls onChangeAddressVerified(false, Error) when device returns a different address", async () => {
    const onChangeAddressVerified = jest.fn();
    mockBridge(jest.fn().mockResolvedValue({ address: "u1wrongaddress" }));

    renderBlock({ onChangeAddressVerified });

    await waitFor(() =>
      expect(onChangeAddressVerified).toHaveBeenCalledWith(false, expect.any(Error)),
    );
  });

  it("calls onChangeAddressVerified with a sanitized error when getShieldedAddress rejects", async () => {
    const onChangeAddressVerified = jest.fn();
    const err = new Error("device transport failure — contains sensitive payload");
    mockBridge(jest.fn().mockRejectedValue(err));

    renderBlock({ onChangeAddressVerified });

    await waitFor(() =>
      expect(onChangeAddressVerified).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ message: "Verification failed", name: err.name }),
      ),
    );
  });

  it("does not call onChangeAddressVerified when device is absent", async () => {
    const onChangeAddressVerified = jest.fn();

    renderBlock({ device: null, onChangeAddressVerified });

    await act(async () => {});
    expect(onChangeAddressVerified).not.toHaveBeenCalled();
  });
});

describe("ZcashShieldedReceiveBlock — CTA", () => {
  it("calls closeModal and dispatches openModal when activation button is clicked", () => {
    const closeModal = jest.fn();
    renderBlock({ account: buildAccount({}) as never, closeModal });

    screen.getByText("Enable private balance").click();

    expect(closeModal).toHaveBeenCalledTimes(1);
  });
});

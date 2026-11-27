import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  withFlagOverrides,
} from "tests/testSetup";
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
const SHIELDED_TESTNET = "utest1shieldedaddressfortesting000xyz";
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
        transitionTo: jest.fn(),
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

  it("renders the private address block for a testnet shielded address (utest1…)", () => {
    renderBlock({
      account: buildAccount({ shieldedAddress: SHIELDED_TESTNET, ufvk: UFVK }) as never,
    });
    const block = screen.getByTestId("receive-private-address-block");
    expect(block).toBeInTheDocument();
    expect(block).toHaveTextContent(SHIELDED_TESTNET);
  });

  it.each([
    ["no UFVK", buildAccount({})],
    ["UFVK present but shielded address not yet derived", buildAccount({ ufvk: UFVK })],
  ])("renders a warning alert (no CTA) when %s", (_label, account) => {
    renderBlock({ account: account as never });
    expect(screen.queryByTestId("receive-private-address-block")).not.toBeInTheDocument();
    expect(
      screen.getByText("Enable your private balance to receive to a private address."),
    ).toBeInTheDocument();
    // No CTA — 0x40 transparent verification runs in the parent
    expect(screen.queryByText("Enable private balance")).not.toBeInTheDocument();
  });
});

describe("ZcashShieldedReceiveBlock — QR modal security", () => {
  // The LLD Modal portal target: document.getElementById("modals")
  beforeEach(() => {
    const container = document.createElement("div");
    container.id = "modals";
    document.body.appendChild(container);
  });
  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  it("private QR modal shows the shielded address — same address as the private block", async () => {
    renderBlock();

    // The private block shows the shielded address
    const privateBlock = screen.getByTestId("receive-private-address-block");
    expect(privateBlock).toHaveTextContent(SHIELDED);
    // No QR modal yet
    expect(screen.queryByTestId("private-qr-modal-address")).not.toBeInTheDocument();

    // Open the private QR modal via the Show QR Code link inside the block
    fireEvent.click(within(privateBlock).getByText("Show QR Code"));

    // The modal's address container must appear and show the shielded address
    const modalAddress = await screen.findByTestId("private-qr-modal-address");
    expect(modalAddress).toHaveTextContent(SHIELDED);
  });
});

describe("ZcashShieldedReceiveBlock — verification", () => {
  it("calls onChangeAddressVerified(true, null) when device returns matching address", async () => {
    const onChangeAddressVerified = jest.fn();
    const getShieldedAddressMock = jest.fn().mockResolvedValue({ address: SHIELDED });
    mockBridge(getShieldedAddressMock);

    renderBlock({ onChangeAddressVerified });

    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalledWith(true, null));
    // Exactly one exchange with the device, and display:true is passed (0x51 covers both addresses).
    expect(getShieldedAddressMock).toHaveBeenCalledTimes(1);
    expect(getShieldedAddressMock).toHaveBeenCalledWith(
      expect.objectContaining({ currency: { id: "zcash", family: "bitcoin" } }),
      { deviceId: "mock-device-id", display: true },
    );
  });

  it("advances to the receive step once the device confirmed the address", async () => {
    const transitionTo = jest.fn();
    mockBridge(jest.fn().mockResolvedValue({ address: SHIELDED }));

    renderBlock({ transitionTo });

    await waitFor(() => expect(transitionTo).toHaveBeenCalledWith("receive"));
  });

  it("calls onChangeAddressVerified(false, WrongDeviceForAccount) when device returns a different address", async () => {
    const onChangeAddressVerified = jest.fn();
    const transitionTo = jest.fn();
    mockBridge(jest.fn().mockResolvedValue({ address: "u1wrongaddress" }));

    renderBlock({ onChangeAddressVerified, transitionTo });

    await waitFor(() =>
      expect(onChangeAddressVerified).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ name: "WrongDeviceForAccount" }),
      ),
    );
    expect(transitionTo).not.toHaveBeenCalled();
  });

  it("passes the error through unchanged when getShieldedAddress rejects", async () => {
    const onChangeAddressVerified = jest.fn();
    const err = new Error("device transport failure");
    mockBridge(jest.fn().mockRejectedValue(err));

    renderBlock({ onChangeAddressVerified });

    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalledWith(false, err));
  });

  it("calls onChangeAddressVerified(false, error) when bridge does not implement getShieldedAddress", async () => {
    const onChangeAddressVerified = jest.fn();
    mockedUseAccountBridge.mockReturnValue({} as unknown as ReturnType<typeof useAccountBridge>);

    renderBlock({ onChangeAddressVerified });

    await waitFor(() =>
      expect(onChangeAddressVerified).toHaveBeenCalledWith(
        false,
        expect.objectContaining({
          message: "ZcashAccountBridge: getShieldedAddress not available",
        }),
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

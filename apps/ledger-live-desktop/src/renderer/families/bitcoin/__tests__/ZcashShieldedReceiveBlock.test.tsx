/**
 * @jest-environment jsdom
 */
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
import { getEnv } from "@shared/env";
import { ZcashShieldedReceiveBlock } from "../ZcashShieldedReceiveBlock";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

// ── Mocks ──────────────────────────────────────────────────────────────────

// jest.mock is hoisted before const declarations — never reference outer variables inside the factory.
// Several API schemas inside configureStore.ts require non-empty strings (z.string().min(1)).
// Providing "jest" for those keys satisfies the schemas without real network config.
jest.mock("@shared/env", () => ({
  getEnv: jest.fn((key: string) => {
    if (
      key === "CAL_SERVICE_URL" ||
      key === "LEDGER_CLIENT_VERSION" ||
      key === "LEDGER_COUNTERVALUES_API" ||
      key === "CMC_API_URL" ||
      key === "PUSH_DEVICES_SERVICE_URL" ||
      key === "SWAP_API_BASE"
    )
      return "jest";
    return "";
  }),
}));

const mockDispatch = jest.fn();
const mockGetShieldedAddress = jest.fn();
const mockGetEnv = jest.mocked(getEnv);

// Default getEnv implementation: schema-required keys → "jest", everything else → "".
// Used in beforeEach to restore after tests that override specific keys.
const defaultEnvImpl = (key: string): string => {
  if (
    key === "CAL_SERVICE_URL" ||
    key === "LEDGER_CLIENT_VERSION" ||
    key === "LEDGER_COUNTERVALUES_API" ||
    key === "CMC_API_URL" ||
    key === "PUSH_DEVICES_SERVICE_URL" ||
    key === "SWAP_API_BASE"
  )
    return "jest";
  return "";
};
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch, // spy-able dispatch; useSelector/useStore use real react-redux hooks
}));
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(() => null),
}));
jest.mock("@domain/entity-account-name", () => ({
  getDefaultAccountName: jest.fn(() => "Zcash 1"),
}));
jest.mock("~/renderer/actions/modals", () => ({ openModal: jest.fn(a => a) }));
jest.mock("../useZcashShieldedSync", () => ({
  useZcashBridge: jest.fn(() => ({ getShieldedAddress: mockGetShieldedAddress })),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

// Realistic-length UA: ~70 chars, ends in a unique suffix so both address
// segments ("slice(0,-5)" and "slice(-5)") are unambiguous in the DOM.
const SHIELDED = "u1testshieldedaddressfortestingreceivingblockzec000fxyz99";
const UFVK = "uview1testufvkkey";

const baseAccount = {
  ...createFixtureAccount(),
  currency: { id: "zcash", family: "bitcoin" },
};

const buildAccount = (privateInfo?: unknown) => ({
  ...baseAccount,
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const shieldedAccount = buildAccount({ shieldedAddress: SHIELDED, ufvk: UFVK });

const renderBlock = (
  overrides: Partial<{
    account: unknown;
    isAddressVerified: boolean | null | undefined;
    device: Device | null | undefined;
    onChangeAddressVerified: jest.Mock;
    closeModal: jest.Mock;
  }> = {},
) =>
  render(
    <ZcashShieldedReceiveBlock
      account={shieldedAccount as never}
      device={mockDevice}
      isAddressVerified={null}
      onChangeAddressVerified={jest.fn()}
      closeModal={jest.fn()}
      {...overrides}
    />,
    { initialState: withFlagOverrides({ zcashShielded: { enabled: true } }) },
  );

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ZcashShieldedReceiveBlock — address display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation(defaultEnvImpl);
    // Verification effect fires on mount (isAddressVerified=null, device set) — return a
    // never-resolving promise so the block renders normally without crashing or completing.
    mockGetShieldedAddress.mockReturnValue(new Promise(() => {}));
  });

  it("renders the private block with the stable data-testid", () => {
    renderBlock();
    expect(screen.getByTestId("receive-private-address-block")).toBeInTheDocument();
  });

  it("the block's ReadOnlyAddressField carries the shieldedAddress, not a different address", () => {
    renderBlock();
    const block = screen.getByTestId("receive-private-address-block");
    // ReadOnlyAddressField splits the address: first span = slice(0,-5)
    expect(within(block).getByText(SHIELDED.slice(0, -5))).toBeInTheDocument();
    expect(within(block).getByText(SHIELDED.slice(-5))).toBeInTheDocument();
  });

  it("the Show QR Code link is present and clickable without throwing", () => {
    // The modal renders into a #modals portal which does not exist in jsdom; testing the full
    // open/close lifecycle belongs in a playwright test. Here we verify the link is accessible and
    // that clicking it does not crash (state toggle is exercised by the act wrapper).
    renderBlock({ isAddressVerified: false });
    const block = screen.getByTestId("receive-private-address-block");
    expect(within(block).getByText("Show QR Code")).toBeInTheDocument();
    act(() => {
      fireEvent.click(within(block).getByText("Show QR Code"));
    });
  });
});

describe("ZcashShieldedReceiveBlock — no UFVK state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation(defaultEnvImpl);
  });

  it("renders the activation CTA when ufvk is absent", () => {
    renderBlock({ account: buildAccount({}) as never });
    // i18n is loaded in test env — assert the real translated string, not the key
    expect(screen.getByText("Enable private balance")).toBeInTheDocument();
  });

  it("renders nothing when ufvk is present but shieldedAddress is null", () => {
    renderBlock({ account: buildAccount({ ufvk: UFVK, shieldedAddress: null }) as never });
    expect(screen.queryByTestId("receive-private-address-block")).not.toBeInTheDocument();
    expect(screen.queryByText("zcash.receive.noUfvk.cta")).not.toBeInTheDocument();
  });
});

describe("ZcashShieldedReceiveBlock — verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockImplementation(defaultEnvImpl);
  });

  it("onChangeAddressVerified(true, null) when returned UA matches stored address", async () => {
    const onChangeAddressVerified = jest.fn();
    mockGetShieldedAddress.mockResolvedValue({ address: SHIELDED });
    renderBlock({ onChangeAddressVerified });
    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalledWith(true, null));
  });

  it("onChangeAddressVerified(false, Error) on UA mismatch — catches derivation divergence too", async () => {
    const onChangeAddressVerified = jest.fn();
    mockGetShieldedAddress.mockResolvedValue({ address: "u1wrongaddress" });
    renderBlock({ onChangeAddressVerified });
    await waitFor(() => {
      expect(onChangeAddressVerified).toHaveBeenCalledWith(false, expect.any(Error));
      const [, err] = onChangeAddressVerified.mock.calls[0];
      // Error message must not hard-code "wrong device" as the only cause
      expect((err as Error).message).not.toMatch(/wrong device/i);
    });
  });

  it("does not fire verification when device is absent", async () => {
    const onChangeAddressVerified = jest.fn();
    renderBlock({ device: null, onChangeAddressVerified });
    await act(async () => {});
    expect(onChangeAddressVerified).not.toHaveBeenCalled();
  });

  it("does not re-verify when isAddressVerified is already set (false)", async () => {
    const onChangeAddressVerified = jest.fn();
    mockGetShieldedAddress.mockResolvedValue({ address: SHIELDED });
    renderBlock({ isAddressVerified: false, onChangeAddressVerified });
    await act(async () => {});
    expect(onChangeAddressVerified).not.toHaveBeenCalled();
    expect(mockGetShieldedAddress).not.toHaveBeenCalled();
  });
});

describe("ZcashShieldedReceiveBlock — MOCK shortcut", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resolves verification without a device call in MOCK mode", () => {
    mockGetEnv.mockImplementation((key: string) => (key === "MOCK" ? "1" : defaultEnvImpl(key)));
    const onChangeAddressVerified = jest.fn();
    jest.useFakeTimers();
    renderBlock({ onChangeAddressVerified });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onChangeAddressVerified).toHaveBeenCalledWith(true);
    expect(mockGetShieldedAddress).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

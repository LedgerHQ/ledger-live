import React from "react";
import { NEVER } from "rxjs";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useLLDCoinFamily } from "~/renderer/families";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { DeviceModelId } from "@ledgerhq/devices";
import StepReceiveFunds from "../StepReceiveFunds";
import type { StepProps } from "../../Body";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { TFunction } from "i18next";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(),
}));

jest.mock("LLD/hooks/useVersionedStakePrograms", () => ({
  useVersionedStakePrograms: jest.fn(() => null),
}));

jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(() => null),
}));

// Several API schemas inside configureStore.ts require non-empty strings (z.string().min(1)).
// Providing "jest" for those keys satisfies the schemas without pulling in real network config.
jest.mock("@shared/env", () => ({
  getEnv: jest.fn((key: string) => {
    if (key === "MOCK") return false;
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

// Avoid rendering device SVGs in unit tests
jest.mock("~/renderer/components/DeviceAction/rendering", () => ({
  renderVerifyUnwrapped: jest.fn(() => null),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const mockDevice: Device = {
  deviceId: "mock-device-id",
  modelId: DeviceModelId.nanoS,
  wired: true,
};

const baseAccount = createFixtureAccount();

const buildAccount = (currencyId: string, privateInfo?: unknown) => ({
  ...baseAccount,
  currency: {
    ...baseAccount.currency,
    id: currencyId,
    family: "bitcoin",
  } as CryptoCurrency,
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const baseProps: Omit<StepProps, "account"> = {
  t: ((key: string) => key) as unknown as TFunction,
  transitionTo: jest.fn(),
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
  currencyName: "Bitcoin",
  device: mockDevice,
};

const renderStep = (
  props: Partial<StepProps> & { account: StepProps["account"] },
  flagEnabled = true,
) =>
  render(<StepReceiveFunds {...baseProps} {...props} />, {
    initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }),
  });

describe("StepReceiveFunds — 0x40 suppression", () => {
  let mockReceive: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReceive = jest.fn(() => NEVER);
    mockedGetAccountBridge.mockReturnValue({
      receive: mockReceive,
    } as unknown as ReturnType<typeof getAccountBridge>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLLDCoinFamily.mockReturnValue(null as any);
  });

  it("fires confirmAddress (0x40) for a Bitcoin account with device connected", async () => {
    renderStep({ account: buildAccount("bitcoin") });
    await waitFor(() => {
      expect(mockReceive).toHaveBeenCalledTimes(1);
    });
  });

  it("does not fire confirmAddress (0x40) for Zcash with zcashShielded enabled", async () => {
    renderStep({ account: buildAccount("zcash") });
    // Flush microtasks so any accidental async call would have fired
    await act(async () => {});
    expect(mockReceive).not.toHaveBeenCalled();
  });

  it("fires confirmAddress (0x40) for Zcash when zcashShielded feature is disabled", async () => {
    renderStep({ account: buildAccount("zcash") }, false);
    await waitFor(() => {
      expect(mockReceive).toHaveBeenCalledTimes(1);
    });
  });
});

describe("StepReceiveFunds — device animation rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockReturnValue({
      receive: jest.fn(() => NEVER),
    } as unknown as ReturnType<typeof getAccountBridge>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLLDCoinFamily.mockReturnValue(null as any);
  });

  it("renders Receive2Device (transparent) animation for Bitcoin", () => {
    renderStep({ account: buildAccount("bitcoin") });
    expect(screen.getByTestId("receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });

  it("renders ZcashReceive2Device animation for Zcash with shieldedAddress", () => {
    renderStep({
      account: buildAccount("zcash", {
        shieldedAddress: "u1testshieldedaddress",
        ufvk: "test-ufvk",
      }),
    });
    expect(screen.getByTestId("zcash-receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("receive-device-animation")).not.toBeInTheDocument();
  });

  it("renders no device animation for Zcash with no UFVK", () => {
    renderStep({ account: buildAccount("zcash") });
    expect(screen.queryByTestId("receive-device-animation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });

  it("renders no Zcash device animation when zcashShielded feature is disabled", () => {
    renderStep(
      {
        account: buildAccount("zcash", {
          shieldedAddress: "u1testshieldedaddress",
          ufvk: "test-ufvk",
        }),
      },
      false,
    );
    // Feature off → falls back to standard flow, Receive2Device shows
    expect(screen.getByTestId("receive-device-animation")).toBeInTheDocument();
    expect(screen.queryByTestId("zcash-receive-device-animation")).not.toBeInTheDocument();
  });
});

describe("StepReceiveFunds — Zcash transitionTo lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockReturnValue({
      receive: jest.fn(() => NEVER),
    } as unknown as ReturnType<typeof getAccountBridge>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLLDCoinFamily.mockReturnValue(null as any);
  });

  it("calls transitionTo('receive') when isZcashShielded and isAddressVerified becomes true", async () => {
    const transitionTo = jest.fn();
    renderStep({
      account: buildAccount("zcash", { shieldedAddress: "u1testshielded", ufvk: "uview1test" }),
      transitionTo,
      isAddressVerified: true,
    });
    await waitFor(() => expect(transitionTo).toHaveBeenCalledWith("receive"));
  });

  it("does not call transitionTo('receive') when isAddressVerified is true but account is not Zcash", async () => {
    const transitionTo = jest.fn();
    renderStep({ account: buildAccount("bitcoin"), transitionTo, isAddressVerified: true });
    await act(async () => {});
    expect(transitionTo).not.toHaveBeenCalledWith("receive");
  });
});

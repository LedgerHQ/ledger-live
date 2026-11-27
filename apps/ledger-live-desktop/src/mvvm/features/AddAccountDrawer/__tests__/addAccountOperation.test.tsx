import { LockedDeviceError, TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { DeviceModelId } from "@ledgerhq/devices";
import { CurrencyRegionRestrictedError } from "@ledgerhq/live-common/errors";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account } from "@ledgerhq/types-live";
import { setOperationSink } from "@shared/observability-operations";
import BigNumber from "bignumber.js";
import React from "react";
import { act, render, screen, userEvent } from "tests/testSetup";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { importLLDCoinFamily } from "~/renderer/families";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";
import { ARB_ACCOUNT } from "../../__mocks__/accounts.mock";
import {
  arbitrumCurrency,
  arbitrumToken,
  hederaCurrency,
  hypercoreCurrency,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { mockDomMeasurements } from "../../__tests__/shared";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import ScanAccounts from "../screens/ScanAccounts";

const mockDevice: Device = {
  deviceId: "device-1",
  deviceName: "My Stax",
  modelId: DeviceModelId.stax,
  wired: true,
};

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({
    useHook: () => ({ device: { modelId: "stax" }, onResult: () => true, isLocked: false }),
    mapResult: () => ({ device: mockDevice }),
  }),
}));

let triggerNext: (account: Account) => void = () => null;
let triggerComplete: () => void = () => null;
let triggerError: (error: Error) => void = () => null;

jest.mock("~/renderer/bridge/cache", () => ({
  prepareCurrency: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const { Observable } = require("rxjs");
  return {
    __esModule: true,
    getCurrencyBridge: () => ({
      scanAccounts: () =>
        new Observable((subscriber: { next: Function; complete: Function; error: Function }) => {
          triggerNext = (account: Account) => subscriber.next({ account });
          triggerComplete = () => subscriber.complete();
          triggerError = (error: Error) => subscriber.error(error);
          return () => {};
        }),
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    }),
    getAccountBridge: () => ({
      isAccountEmpty: (a: Account) => a.operationsCount === 0 && a.balance.isZero(),
    }),
  };
});

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

const sink = {
  isRecording: () => true,
  start: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
};

const EMPTY_ARB_ACCOUNT: Account = {
  ...ARB_ACCOUNT,
  id: "js:2:arbitrum:0xf97c24B5e0951db821b68CF7ce0e2F7BC9D93921:",
  freshAddress: "0xf97c24B5e0951db821b68CF7ce0e2F7BC9D93921",
  index: 1,
  used: false,
  operationsCount: 0,
  operations: [],
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  subAccounts: [],
};

const initialState = (state?: Partial<State>) => ({
  settings: AFTER_ONBOARDING_STATE,
  ...state,
  modularDialog: { source: "MADSource", flow: "Add account" },
});

const setup = (
  currency: React.ComponentProps<
    typeof ModularDrawerAddAccountFlowManager
  >["currency"] = arbitrumCurrency,
  { state, onAccountSelected }: { state?: Partial<State>; onAccountSelected?: () => void } = {},
) =>
  render(
    <ModularDrawerAddAccountFlowManager
      currency={currency}
      onAccountSelected={onAccountSelected}
    />,
    { initialState: initialState(state) },
  );

const flushPreparedCurrency = () => act(async () => {});

const scan = async (accounts: Account[]) => {
  await flushPreparedCurrency();
  for (const account of accounts) {
    await act(() => triggerNext(account));
  }
  await act(() => triggerComplete());
};

const lastAttributes = (call: jest.Mock) => call.mock.calls.at(-1)?.at(-1);

describe("add_account RUM operation", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockDomMeasurements();
    setOperationSink(sink);
    jest.mocked(prepareCurrency).mockResolvedValue(undefined);
    await Promise.all([importLLDCoinFamily("evm"), importLLDCoinFamily("hedera")]);
  });

  it("should start the operation with the flow attributes when the scan screen opens", async () => {
    setup();
    await flushPreparedCurrency();

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.start.mock.calls[0]).toStrictEqual([
      "add_account",
      undefined,
      {
        currency_id: "arbitrum",
        currency_family: "evm",
        is_token: false,
        device_model_id: "stax",
        transport: "usb",
        inline: false,
        source: "MADSource",
        attempt: 1,
      },
    ]);
    expect(JSON.stringify(sink.start.mock.calls[0])).not.toContain("My Stax");
  });

  it("should send the scanned parent chain when adding a token", async () => {
    setup(arbitrumToken);
    await flushPreparedCurrency();

    expect(lastAttributes(sink.start)).toMatchObject({ currency_id: "arbitrum", is_token: true });
  });

  it("should start an inline operation when the flow returns the account to another flow", async () => {
    setup(arbitrumCurrency, { onAccountSelected: jest.fn() });
    await flushPreparedCurrency();

    expect(lastAttributes(sink.start)).toMatchObject({ inline: true });
  });

  it("should succeed with the number of added accounts when the user confirms", async () => {
    setup();
    await scan([ARB_ACCOUNT]);

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(lastAttributes(sink.succeed)).toMatchObject({
      accounts_added: 1,
      accounts_scanned: 1,
      step: "selecting",
      attempt: 1,
    });
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should succeed as a hand-off when the scan defers the addition to its flow", async () => {
    const onComplete = jest.fn();
    render(
      <ScanAccounts
        currency={arbitrumCurrency}
        device={mockDevice}
        deferAccountAddition
        onComplete={onComplete}
        navigateToWarningScreen={jest.fn()}
      />,
      { initialState: initialState() },
    );
    await scan([ARB_ACCOUNT]);

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(lastAttributes(sink.succeed)).toMatchObject({
      handoff: "custom_flow",
      accounts_selected: 1,
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should fail with ERROR in the scanning step when the scan fails", async () => {
    setup();
    await flushPreparedCurrency();
    await act(() => triggerNext(ARB_ACCOUNT));

    await act(() => triggerError(new LockedDeviceError()));

    expect(sink.fail).toHaveBeenCalledTimes(1);
    expect(sink.fail.mock.calls[0][2]).toBe("ERROR");
    expect(lastAttributes(sink.fail)).toMatchObject({
      error_name: "LockedDeviceError",
      step: "scanning",
      accounts_scanned: 1,
    });
  });

  it("should fail with the device status when the device rejects the scan", async () => {
    setup();
    await flushPreparedCurrency();

    await act(() => triggerError(new TransportStatusError(0x6e01)));

    expect(lastAttributes(sink.fail)).toMatchObject({
      error_name: "TransportStatusError",
      error_apdu_status: "0x6e01",
    });
  });

  it("should keep the provider error code that the displayed error drops", async () => {
    setup();
    await flushPreparedCurrency();

    await act(() => triggerError(Object.assign(new Error("request timeout"), { code: "TIMEOUT" })));

    expect(screen.getByText(/internet seems to be down/i)).toBeVisible();
    expect(lastAttributes(sink.fail)).toMatchObject({
      error_name: "Error",
      error_code: "TIMEOUT",
      error_message: "request timeout",
    });
  });

  it("should start a new attempt when the user retries after a scan error", async () => {
    setup();
    await flushPreparedCurrency();
    await act(() => triggerError(new LockedDeviceError()));

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    await flushPreparedCurrency();

    expect(sink.start).toHaveBeenCalledTimes(2);
    expect(lastAttributes(sink.start)).toMatchObject({ attempt: 2 });
  });

  it("should succeed with the region_restricted outcome when the currency is region restricted", async () => {
    setup(hypercoreCurrency);
    await flushPreparedCurrency();

    await act(() => triggerError(new CurrencyRegionRestrictedError("Hyperliquid")));

    expect(lastAttributes(sink.succeed)).toMatchObject({ outcome: "region_restricted" });
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should succeed with the already_empty_account outcome when the empty account is already added", async () => {
    setup(arbitrumCurrency, { state: { accounts: [ARB_ACCOUNT, EMPTY_ARB_ACCOUNT] } });

    await scan([ARB_ACCOUNT, EMPTY_ARB_ACCOUNT]);

    expect(lastAttributes(sink.succeed)).toMatchObject({ outcome: "already_empty_account" });
  });

  it("should succeed with the no_associated_accounts outcome when the family has none to add", async () => {
    setup(hederaCurrency);

    await scan([]);

    expect(lastAttributes(sink.succeed)).toMatchObject({ outcome: "no_associated_accounts" });
  });

  it("should succeed with the nothing_to_add outcome when the scan finds no account", async () => {
    setup();

    await scan([]);

    expect(lastAttributes(sink.succeed)).toMatchObject({ outcome: "nothing_to_add" });
  });

  it("should abandon as scanning when the drawer unmounts before the scan completes", async () => {
    const { unmount } = setup();
    await flushPreparedCurrency();
    await act(() => triggerNext(ARB_ACCOUNT));

    unmount();

    expect(sink.fail.mock.calls[0][2]).toBe("ABANDONED");
    expect(lastAttributes(sink.fail)).toMatchObject({
      trigger: "unmount",
      step: "scanning",
      accounts_scanned: 1,
    });
  });

  it("should abandon as preparing when the drawer unmounts before the currency is prepared", async () => {
    jest.mocked(prepareCurrency).mockReturnValue(new Promise(() => {}));
    const { unmount } = setup();
    await flushPreparedCurrency();

    unmount();

    expect(lastAttributes(sink.fail)).toMatchObject({
      trigger: "unmount",
      step: "preparing",
      accounts_scanned: 0,
    });
  });

  it("should tell the user stopped the scan when the flow is left afterwards", async () => {
    const { unmount } = setup();
    await flushPreparedCurrency();
    await act(() => triggerNext(ARB_ACCOUNT));

    await userEvent.click(screen.getByRole("button", { name: /stop scanning/i }));
    unmount();

    expect(lastAttributes(sink.fail)).toMatchObject({
      trigger: "unmount",
      step: "selecting",
      scan_stopped_by_user: true,
    });
  });
});

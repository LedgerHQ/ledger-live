import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { WithdrawSubmitUnknownOutcomeError } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import type { PerpsWithdrawExecutionParams } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import { act, render, screen } from "@tests/test-renderer";
import { PerpsWithdrawSign, type PerpsWithdrawSignProps } from "../components/PerpsWithdrawSign";

const device: Device = { deviceId: "device-1", modelId: DeviceModelId.stax, wired: false };

jest.mock("~/components/SelectDevice2", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect }: { onSelect: (device: unknown) => void }) => (
      <TouchableOpacity
        testID="select-device"
        onPress={() => onSelect({ deviceId: "device-1", modelId: "stax", wired: false })}
      >
        <Text>SelectDevice</Text>
      </TouchableOpacity>
    ),
  };
});

// Stands in for the device connection: "Connect" returns the device with the Ethereum app open.
jest.mock("~/components/DeviceAction", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onResult, device }: { onResult: (result: unknown) => void; device: unknown }) => (
      <TouchableOpacity testID="connect-device" onPress={() => onResult({ device })}>
        <Text>Connect</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock("~/hooks/deviceActions", () => ({ useAppDeviceAction: () => ({}) }));

jest.mock(
  "../../PerpsDeposit/components/PerpsDepositSign/components/PerpsDepositConfirmation",
  () => {
    const { Text } = require("react-native");
    return { PerpsDepositConfirmation: () => <Text>Continue on your device</Text> };
  },
);

const mockExecute = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute"),
  executePerpsWithdraw: (params: unknown) => mockExecute(params),
}));

jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/request", () => ({
  getWithdrawRequestId: () => "request-1",
}));

const sourceAccount = genAccount("source-1", {
  currency: getCryptoCurrencyById("hypercore"),
  operationsSize: 0,
});
const destinationAccount = genAccount("eth-1", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});

function renderSign(selectedDevice: Device | null = device) {
  const props: PerpsWithdrawSignProps = {
    sourceAccount,
    destinationAccount,
    quote: {
      amountTo: new BigNumber("0.3"),
      payoutNetworkFees: new BigNumber("0.0004"),
      expiry: 0,
    },
    quoteParams: {
      amount: "10",
      sourceAccount,
      destinationAccount,
      accounts: [sourceAccount, destinationAccount],
      counterValueCurrency: "USD",
    },
    selectedDevice,
    onSelectDevice: jest.fn(),
    onDone: jest.fn(),
    onRefused: jest.fn(),
    onLeave: jest.fn(),
  };
  return { ...render(<PerpsWithdrawSign {...props} />), props };
}

describe("PerpsWithdrawSign integration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should ask for a device first", async () => {
    const { user, props } = renderSign(null);

    await user.press(screen.getByTestId("select-device"));

    expect(props.onSelectDevice).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: "device-1" }),
    );
  });

  it("should ask to confirm on the device, then hand the swap id over", async () => {
    let finishSubmit: (result: { swapId: string }) => void = () => undefined;
    mockExecute.mockImplementation(
      ({ onSigned }: PerpsWithdrawExecutionParams) =>
        new Promise(resolve => {
          finishSubmit = result => {
            onSigned?.();
            resolve(result);
          };
        }),
    );
    const { user, props } = renderSign();

    await user.press(await screen.findByTestId("connect-device"));
    expect(await screen.findByText("Continue on your device")).toBeVisible();

    await act(async () => finishSubmit({ swapId: "swap-1" }));

    expect(props.onDone).toHaveBeenCalledWith({ swapId: "swap-1" });
  });

  it("should offer Retry after a device error and connect again", async () => {
    mockExecute.mockRejectedValueOnce(new Error("Locked device"));
    const { user } = renderSign();

    await user.press(await screen.findByTestId("connect-device"));
    await user.press(await screen.findByTestId("perps-withdraw-sign-retry"));

    expect(await screen.findByTestId("connect-device")).toBeVisible();
  });

  it("should only offer Close when the submit outcome is unknown, ending the flow", async () => {
    mockExecute.mockRejectedValueOnce(new WithdrawSubmitUnknownOutcomeError("Bad gateway"));
    const { user, props } = renderSign();

    await user.press(await screen.findByTestId("connect-device"));
    await user.press(await screen.findByTestId("perps-withdraw-sign-close"));

    expect(screen.queryByTestId("perps-withdraw-sign-retry")).not.toBeOnTheScreen();
    expect(props.onLeave).toHaveBeenCalled();
  });
});

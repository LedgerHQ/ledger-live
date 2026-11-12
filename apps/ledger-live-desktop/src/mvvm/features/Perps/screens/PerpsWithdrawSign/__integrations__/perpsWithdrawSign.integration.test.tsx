import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { DeviceModelId } from "@ledgerhq/devices";
import { WithdrawSubmitUnknownOutcomeError } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import type { PerpsWithdrawExecutionParams } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import { act, render, screen } from "tests/testSetup";
import PerpsWithdrawSignRoot, { openPerpsWithdrawSign } from "../PerpsWithdrawSignDialog";
import type { PerpsWithdrawSignData } from "../usePerpsWithdrawSignViewModel";

const device = { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false };

// Stands in for the device connection: "Connect" returns the device with the Ethereum app open.
jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: ({ onResult }: { onResult: (result: { device: typeof device }) => void }) => (
    <button type="button" onClick={() => onResult({ device })}>
      Connect
    </button>
  ),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock("../../PerpsDepositSign/components/PerpsDepositConfirmation", () => ({
  PerpsDepositConfirmation: () => <p>Continue on your device</p>,
}));

const mockExecute = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute"),
  executePerpsWithdraw: (params: unknown) => mockExecute(params),
}));

const mockCancelWithdrawRequest = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/request", () => ({
  getWithdrawRequestId: () => "request-1",
  cancelWithdrawRequest: (id?: string | null) => mockCancelWithdrawRequest(id),
}));

const mockOpenPerpsTransactionSigned = jest.fn();
jest.mock("../../PerpsTransactionSigned/PerpsTransactionSignedDialog", () => ({
  openPerpsTransactionSigned: (data: unknown) => mockOpenPerpsTransactionSigned(data),
}));

jest.mock("../../PerpsWithdrawSummary/PerpsWithdrawSummaryDialog", () => ({
  openPerpsWithdrawSummary: jest.fn(),
}));

const sourceAccount = genAccount("source-1", {
  currency: getCryptoCurrencyById("hypercore"),
  operationsSize: 0,
});
const destinationAccount = genAccount("eth-1", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});
const data: PerpsWithdrawSignData = {
  sourceAccount,
  destinationAccount,
  quote: { amountTo: new BigNumber("0.3"), payoutNetworkFees: new BigNumber("0.0004"), expiry: 0 },
  quoteParams: {
    amount: "10",
    sourceAccount,
    destinationAccount,
    accounts: [sourceAccount, destinationAccount],
    counterValueCurrency: "USD",
  },
  draft: { picked: { account: destinationAccount }, amountText: "10" },
};

function renderSign() {
  const rendered = render(<PerpsWithdrawSignRoot />);
  act(() => openPerpsWithdrawSign(data));
  return rendered;
}

describe("PerpsWithdrawSign integration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should not render until Withdraw is pressed on the summary", () => {
    render(<PerpsWithdrawSignRoot />);

    expect(screen.queryByRole("button", { name: "Connect" })).not.toBeInTheDocument();
  });

  it("should ask to confirm on the device, then show the transaction signed screen", async () => {
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
    const { user } = renderSign();

    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(screen.getByText("Continue on your device")).toBeVisible();

    await act(async () => finishSubmit({ swapId: "swap-1" }));

    expect(mockOpenPerpsTransactionSigned).toHaveBeenCalledWith(
      expect.objectContaining({ swapId: "swap-1" }),
    );
    expect(screen.queryByText("Continue on your device")).not.toBeInTheDocument();
  });

  it("should offer Retry after a device error and connect again", async () => {
    mockExecute.mockRejectedValueOnce(new Error("Locked device"));
    const { user } = renderSign();

    await user.click(screen.getByRole("button", { name: "Connect" }));
    await user.click(await screen.findByTestId("perps-withdraw-sign-retry"));

    expect(screen.getByRole("button", { name: "Connect" })).toBeVisible();
  });

  it("should only offer Close when the submit outcome is unknown, ending the request", async () => {
    mockExecute.mockRejectedValueOnce(new WithdrawSubmitUnknownOutcomeError("Bad gateway"));
    const { user } = renderSign();

    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText("We couldn’t confirm your withdrawal")).toBeVisible();
    expect(screen.queryByTestId("perps-withdraw-sign-retry")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("perps-withdraw-sign-close"));

    expect(mockCancelWithdrawRequest).toHaveBeenCalledWith("request-1");
    expect(screen.queryByTestId("perps-withdraw-sign-close")).not.toBeInTheDocument();
  });
});

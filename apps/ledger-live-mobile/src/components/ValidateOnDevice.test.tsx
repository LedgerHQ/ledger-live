/* eslint-disable i18next/no-literal-string */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render } from "@tests/test-renderer";
import ValidateOnDevice from "./ValidateOnDevice";
import BigNumber from "bignumber.js";

// Mocks
jest.mock("@ledgerhq/live-common/hooks/useDeviceTransactionConfig");
jest.mock("~/hooks/useAccountUnit");

const mockUseDeviceTransactionConfig =
  require("@ledgerhq/live-common/hooks/useDeviceTransactionConfig")
    .useDeviceTransactionConfig as jest.Mock;
const mockUseAccountUnit = require("~/hooks/useAccountUnit").useAccountUnit as jest.Mock;

const mockAccount = {
  type: "Account",
  id: "test-account",
  currency: { family: "bitcoin", units: [{ code: "BTC", magnitude: 8 }] },
  freshAddress: "test-address",
  balance: new BigNumber(10000),
  spendableBalance: new BigNumber(10000),
} as any;

const mockDevice = { modelId: "nanoX" } as any;
const mockTransaction = { family: "bitcoin", amount: new BigNumber(1000) } as any;
const mockStatus = {
  amount: new BigNumber(1000),
  estimatedFees: new BigNumber(100),
} as any;

describe("ValidateOnDevice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "BTC", magnitude: 8 });
  });

  it("renders loading state", () => {
    mockUseDeviceTransactionConfig.mockReturnValue({ fields: [], loading: true });

    const { getByTestId } = render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(getByTestId("device-validation-scroll-view")).toBeTruthy();
  });

  it("calls useDeviceTransactionConfig with correct params", () => {
    mockUseDeviceTransactionConfig.mockReturnValue({ fields: [], loading: false });

    render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(mockUseDeviceTransactionConfig).toHaveBeenCalledWith({
      account: mockAccount,
      parentAccount: null,
      transaction: mockTransaction,
      status: mockStatus,
    });
  });

  it("renders fields when not loading", () => {
    mockUseDeviceTransactionConfig.mockReturnValue({
      fields: [
        { type: "amount", label: "Amount" },
        { type: "address", label: "Address", address: "test-addr" },
      ],
      loading: false,
    });

    const { getByTestId } = render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(getByTestId("device-validation-scroll-view")).toBeTruthy();
    expect(mockUseAccountUnit).toHaveBeenCalledWith(mockAccount);
  });

  it("warns on unsupported field type", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    mockUseDeviceTransactionConfig.mockReturnValue({
      fields: [{ type: "unknown", label: "Unknown" }],
      loading: false,
    });

    render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("field unknown is not implemented"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("renders scroll view container", () => {
    mockUseDeviceTransactionConfig.mockReturnValue({ fields: [], loading: false });

    const { getByTestId } = render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(getByTestId("device-validation-scroll-view")).toBeTruthy();
  });

  it("renders multiple fields correctly", () => {
    mockUseDeviceTransactionConfig.mockReturnValue({
      fields: [
        { type: "amount", label: "Amount" },
        { type: "fees", label: "Fees" },
        { type: "text", label: "Network", value: "Bitcoin" },
      ],
      loading: false,
    });

    const { getByTestId } = render(
      <ValidateOnDevice
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );

    expect(getByTestId("device-validation-scroll-view")).toBeTruthy();
  });
});

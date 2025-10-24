import React from "react";
import { render, screen } from "tests/testSetup";
import StepConnectDevice, { StepConnectDeviceFooter } from "./StepConnectDevice";
import { StepProps } from "../Body";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: jest.fn(() => ({ status: "idle" })),
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div>DeviceAction</div>,
}));

const mockCurrency = getCryptoCurrencyById("bitcoin");

const mockAccount: Account = {
  id: "account-1",
  type: "Account",
  currency: mockCurrency,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  blockHeight: 1,
  lastSyncDate: new Date(),
  swapHistory: [],
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  index: 0,
  used: false,
  freshAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  freshAddressPath: "44'/0'/0'/0/0",
  seedIdentifier: "seed",
  derivationMode: "" as const,
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 0 },
    DAY: { balances: [], latestDate: 0 },
    WEEK: { balances: [], latestDate: 0 },
  },
  creationDate: new Date(),
};

const baseProps: StepProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: jest.fn((key: string) => key) as any,
  transitionTo: jest.fn(),
  device: null,
  account: mockAccount,
  parentAccount: null,
  closeModal: jest.fn(),
  isAddressVerified: null,
  verifyAddressError: null,
  onRetry: jest.fn(),
  onSkipConfirm: jest.fn(),
  onResetSkip: jest.fn(),
  onChangeAccount: jest.fn(),
  onChangeAddressVerified: jest.fn(),
  onClose: jest.fn(),
  currencyName: "Bitcoin",
};

describe("StepConnectDevice", () => {
  it("should render DeviceAction", () => {
    render(<StepConnectDevice {...baseProps} />);
    expect(screen.getByText("DeviceAction")).toBeInTheDocument();
  });
});

describe("StepConnectDeviceFooter", () => {
  it("should render skip button", () => {
    render(<StepConnectDeviceFooter {...baseProps} />);
    expect(screen.getByText("receive.steps.connectDevice.withoutDevice")).toBeInTheDocument();
  });

  it("should call onSkipConfirm when button clicked", () => {
    const onSkipConfirm = jest.fn();
    render(<StepConnectDeviceFooter {...baseProps} onSkipConfirm={onSkipConfirm} />);
    const button = screen.getByText("receive.steps.connectDevice.withoutDevice");
    button.click();
    expect(onSkipConfirm).toHaveBeenCalled();
  });
});

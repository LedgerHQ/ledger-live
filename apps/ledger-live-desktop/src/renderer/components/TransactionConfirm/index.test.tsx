import React from "react";
import { render, screen } from "tests/testSetup";
import TransactionConfirm from "./index";
import { useDeviceTransactionConfig } from "@ledgerhq/live-common/hooks/useDeviceTransactionConfig";
import { getLLDCoinFamily } from "~/renderer/families";
import useTheme from "~/renderer/hooks/useTheme";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/deviceTransactionConfig";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { BigNumber } from "bignumber.js";
import { getDeviceAnimation } from "../DeviceAction/animations";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { DeviceModelId } from "@ledgerhq/types-devices";

jest.mock("@ledgerhq/live-common/hooks/useDeviceTransactionConfig");
jest.mock("~/renderer/families");
jest.mock("~/renderer/hooks/useTheme");
jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("../DeviceAction/animations");
jest.mock("~/renderer/animations", () => ({ __esModule: true, default: () => null }));

const mockDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

const mockCurrency = getCryptoCurrencyById("bitcoin");

const mockAccount: Account = {
  id: "account-1",
  type: "Account",
  currency: mockCurrency,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  blockHeight: 1,
  freshAddress: "test-address",
  seedIdentifier: "seed-id",
  derivationMode: "" as const,
  index: 0,
  freshAddressPath: "44'/0'/0'/0/0",
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  creationDate: new Date(),
  operationsCount: 0,
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  used: false,
};

const mockTransaction = { family: "bitcoin" } as Transaction;
const mockStatus = {
  amount: new BigNumber(50000),
  estimatedFees: new BigNumber(1000),
  errors: {},
  warnings: {},
} as TransactionStatus;

const mockUnit = { code: "BTC", magnitude: 8, name: "Bitcoin" };

describe("TransactionConfirm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ colors: { palette: { type: "dark" } } });
    (useAccountUnit as jest.Mock).mockReturnValue(mockUnit);
    (getMainAccount as jest.Mock).mockReturnValue(mockAccount);
    (getLLDCoinFamily as jest.Mock).mockReturnValue(undefined);
    (getDeviceAnimation as jest.Mock).mockReturnValue({ name: "test-animation", loop: true });
  });

  it("returns null when device is not provided", () => {
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields: [], loading: false });
    const { container } = render(
      <TransactionConfirm
        device={null as unknown as Device}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders loading state without fields", () => {
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields: [], loading: true });
    const { container } = render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it("renders amount field correctly", () => {
    const amountField: DeviceTransactionField = {
      type: "amount",
      label: "Amount",
    };
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({
      fields: [amountField],
      loading: false,
    });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders fees field correctly", () => {
    const feesField: DeviceTransactionField = {
      type: "fees",
      label: "Fees",
    };
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({
      fields: [feesField],
      loading: false,
    });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Fees")).toBeInTheDocument();
  });

  it("renders address field correctly", () => {
    const addressField: DeviceTransactionField = {
      type: "address",
      label: "Recipient",
      address: "test-address-123",
    };
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({
      fields: [addressField],
      loading: false,
    });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Recipient")).toBeInTheDocument();
    expect(screen.getByText("test-address-123")).toBeInTheDocument();
  });

  it("renders text field correctly", () => {
    const textField: DeviceTransactionField = {
      type: "text",
      label: "Memo",
      value: "test-memo",
    };
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({
      fields: [textField],
      loading: false,
    });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Memo")).toBeInTheDocument();
    expect(screen.getByText("test-memo")).toBeInTheDocument();
  });

  it("filters out Address label field", () => {
    const fields: DeviceTransactionField[] = [
      { type: "text", label: "Amount", value: "1 BTC" },
      { type: "text", label: "Address", value: "should-be-filtered" },
    ];
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields, loading: false });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.queryByText("should-be-filtered")).not.toBeInTheDocument();
  });

  it("extracts transaction type from fields", () => {
    const fields: DeviceTransactionField[] = [{ type: "text", label: "Type", value: "DELEGATE" }];
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields, loading: false });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Type")).toBeInTheDocument();
  });

  it("warns for unknown field type", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    const unknownField = {
      type: "unknown",
      label: "Unknown",
    } as unknown as DeviceTransactionField;
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({
      fields: [unknownField],
      loading: false,
    });
    render(
      <TransactionConfirm
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

  it("renders with manifestId and manifestName", () => {
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields: [], loading: false });
    const { container } = render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
        manifestId="test-manifest-id"
        manifestName="Test Manifest"
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it("renders custom family title", () => {
    const CustomTitle = () => <div>Custom Title</div>;
    (getLLDCoinFamily as jest.Mock).mockReturnValue({
      transactionConfirmFields: {
        title: CustomTitle,
        fieldComponents: {},
      },
    });
    (useDeviceTransactionConfig as jest.Mock).mockReturnValue({ fields: [], loading: false });
    render(
      <TransactionConfirm
        device={mockDevice}
        account={mockAccount}
        parentAccount={null}
        transaction={mockTransaction}
        status={mockStatus}
      />,
    );
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });
});

/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render } from "@testing-library/react-native";
import StepFinish from "../StepFinish";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/native-ui", () => ({
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IconBox: ({ Icon: _Icon }: { Icon: React.ComponentType }) => (
    <div data-testid="icon-box">Icon</div>
  ),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) => {
      if (params?.count !== undefined) {
        return `${key} (${params.count})`;
      }
      return key;
    },
  }),
}));

jest.mock("~/icons/Ledger", () => ({
  __esModule: true,
  default: () => <div>LedgerIcon</div>,
}));

const mockCurrency = {
  type: "CryptoCurrency",
  id: "canton_network",
  ticker: "CANTON",
  name: "Canton Network",
  family: "canton",
  units: [],
  signatureScheme: "ed25519",
  color: "#000000",
  managerAppName: "Canton",
  coinType: 60,
  scheme: "canton",
  explorerViews: [],
} as unknown as CryptoCurrency;

const mockAccount = {
  type: "Account",
  id: "account-1",
  name: "Test Account",
  seedIdentifier: "seed-1",
  derivationMode: "",
  index: 0,
  freshAddress: "0x123",
  freshAddressPath: "44'/0'/0'",
  used: false,
  balance: { toString: () => "0" } as any,
  spendableBalance: { toString: () => "0" } as any,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {},
  swapHistory: [],
  lastSyncDate: new Date(),
  creationDate: new Date(),
  blockHeight: 0,
  currency: mockCurrency,
} as unknown as Account;

describe("StepFinish", () => {
  const defaultProps = {
    currency: mockCurrency,
    device: { deviceId: "device-1" },
    accountName: "Test Account",
    editedNames: {},
    creatableAccount: mockAccount,
    importableAccounts: [],
    onboardingConfig: undefined,
    isReonboarding: false,
    onboardingStatus: AccountOnboardStatus.SUCCESS,
    isProcessing: false,
    error: null,
    onboardingResult: undefined,
    onAddAccounts: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetryOnboardAccount: jest.fn(),
    transitionTo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render success icon", () => {
    const { getByTestId } = render(<StepFinish {...defaultProps} />);
    expect(getByTestId("icon-box")).toBeDefined();
  });

  it("should display success message for normal onboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} />);
    expect(getByText("addAccounts.success (0)")).toBeDefined();
  });

  it("should display reonboard success message for reonboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} isReonboarding={true} />);
    expect(getByText("canton.onboard.reonboard.success")).toBeDefined();
  });

  it("should include completed account in count", () => {
    const completedAccount = { ...mockAccount, id: "account-completed" };
    const { getByText } = render(
      <StepFinish
        {...defaultProps}
        importableAccounts={[mockAccount]}
        onboardingResult={{ completedAccount }}
      />,
    );
    expect(getByText("addAccounts.success (2)")).toBeDefined();
  });

  it("should display success description", () => {
    const { getByText } = render(<StepFinish {...defaultProps} />);
    expect(getByText("addAccounts.successDescription (0)")).toBeDefined();
  });

  it("should display reonboard success description for reonboarding", () => {
    const { getByText } = render(<StepFinish {...defaultProps} isReonboarding={true} />);
    expect(getByText("canton.onboard.reonboard.successDescription")).toBeDefined();
  });
});

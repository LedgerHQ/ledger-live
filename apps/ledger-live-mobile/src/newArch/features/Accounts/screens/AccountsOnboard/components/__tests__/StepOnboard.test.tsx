/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render } from "@testing-library/react-native";
import StepOnboard from "../StepOnboard";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { StepId } from "../../types";

jest.mock("@ledgerhq/native-ui", () => ({
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Alert: ({ children, type }: { children: React.ReactNode; type: string }) => (
    <div data-type={type}>{children}</div>
  ),
}));

jest.mock("react-i18next", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

jest.mock("react-native", () => ({
  Linking: {
    openURL: jest.fn(),
  },
}));

jest.mock("~/components/SelectableAccountsList", () => ({
  __esModule: true,
  default: ({ accounts }: { accounts: unknown[] }) => (
    <div data-testid="accounts-list">{accounts.length} accounts</div>
  ),
}));

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: jest.fn(() => "https://example.com/learn-more"),
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

const mockImportableAccount: Account = {
  ...mockAccount,
  id: "account-2",
  used: true,
};

const mockOnboardingConfig = {
  stepComponents: {
    [StepId.ONBOARD]: jest.fn(),
    [StepId.FINISH]: jest.fn(),
  },
  footerComponents: {
    [StepId.ONBOARD]: jest.fn(),
    [StepId.FINISH]: jest.fn(),
  },
  translationKeys: {
    title: "canton.onboard.title",
    reonboardTitle: "canton.onboard.reonboard.title",
    init: "canton.onboard.init",
    reonboardInit: "canton.onboard.reonboard.init",
    account: "canton.onboard.reonboard.account",
    newAccount: "canton.onboard.account",
    success: "canton.onboard.success",
    reonboardSuccess: "canton.onboard.reonboard.success",
    error: "canton.onboard.error",
    error429: "canton.onboard.error429",
    statusPrepare: "canton.onboard.status.prepare",
    statusSubmit: "canton.onboard.status.submit",
    statusDefault: "canton.onboard.status.default",
  },
  urls: {
    learnMore: "https://example.com/learn-more",
  },
  stepFlow: [StepId.ONBOARD, StepId.FINISH],
};

describe("StepOnboard", () => {
  const defaultProps = {
    currency: mockCurrency,
    device: { deviceId: "device-1" },
    accountName: "Test Account",
    editedNames: {},
    creatableAccount: mockAccount,
    importableAccounts: [mockImportableAccount],
    onboardingConfig: mockOnboardingConfig,
    onboardingStatus: AccountOnboardStatus.INIT,
    isReonboarding: false,
    error: null,
    isProcessing: false,
    onboardingResult: undefined,
    onAddAccounts: jest.fn(),
    onOnboardAccount: jest.fn(),
    onRetryOnboardAccount: jest.fn(),
    transitionTo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render account list", () => {
    const { getByTestId } = render(<StepOnboard {...defaultProps} />);
    const accountsList = getByTestId("accounts-list");
    expect(accountsList).toBeDefined();
  });

  it("should display title for normal onboarding", () => {
    const { getByText } = render(<StepOnboard {...defaultProps} />);
    expect(getByText("canton.onboard.title")).toBeDefined();
  });

  it("should display reonboard title for reonboarding", () => {
    const { getByText } = render(<StepOnboard {...defaultProps} isReonboarding={true} />);
    expect(getByText("canton.onboard.reonboard.title")).toBeDefined();
  });

  it("should show success alert on SUCCESS status", () => {
    const { getByText } = render(
      <StepOnboard {...defaultProps} onboardingStatus={AccountOnboardStatus.SUCCESS} />,
    );
    expect(getByText("canton.onboard.success")).toBeDefined();
  });

  it("should show reonboard success alert for reonboarding", () => {
    const { getByText } = render(
      <StepOnboard
        {...defaultProps}
        onboardingStatus={AccountOnboardStatus.SUCCESS}
        isReonboarding={true}
      />,
    );
    expect(getByText("canton.onboard.reonboard.success")).toBeDefined();
  });

  it("should show error alert on ERROR status", () => {
    const { getByText } = render(
      <StepOnboard {...defaultProps} onboardingStatus={AccountOnboardStatus.ERROR} />,
    );
    expect(getByText("canton.onboard.error")).toBeDefined();
  });

  it("should show 429 error message for rate limit errors", () => {
    const error = { status: 429 } as any;

    const { getByText } = render(
      <StepOnboard {...defaultProps} onboardingStatus={AccountOnboardStatus.ERROR} error={error} />,
    );
    expect(getByText("canton.onboard.error429")).toBeDefined();
  });

  it("should show status message during PREPARE", () => {
    const { getByText } = render(
      <StepOnboard {...defaultProps} onboardingStatus={AccountOnboardStatus.PREPARE} />,
    );
    expect(getByText("canton.onboard.status.prepare")).toBeDefined();
  });

  it("should show status message during SUBMIT", () => {
    const { getByText } = render(
      <StepOnboard {...defaultProps} onboardingStatus={AccountOnboardStatus.SUBMIT} />,
    );
    expect(getByText("canton.onboard.status.submit")).toBeDefined();
  });

  it("should display only creatable account in reonboarding mode", () => {
    const { getByTestId } = render(<StepOnboard {...defaultProps} isReonboarding={true} />);
    const accountsList = getByTestId("accounts-list");
    expect(accountsList.props.children).toBe("1 accounts");
  });

  it("should display all accounts in normal mode", () => {
    const { getByTestId } = render(<StepOnboard {...defaultProps} />);
    const accountsList = getByTestId("accounts-list");
    expect(accountsList.props.children).toBe("2 accounts");
  });
});

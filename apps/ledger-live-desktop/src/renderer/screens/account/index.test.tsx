import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useLLDCoinFamily } from "~/renderer/families";
import AccountPageWrapper from "./index";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
}));
const { useParams } = jest.requireMock("react-router");

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridgeOrNull: jest.fn(() => ({ isAccountEmpty: () => false })),
}));

const accountPageFlags = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetSection: false, aggregatedAssets: false } },
});

jest.mock("./hooks/useAccountBackNavigation", () => ({
  useAccountBackNavigation: () => ({ showBackButton: false, navigateBack: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));

// Heavy children unrelated to the family-slot logic under test.
jest.mock("~/renderer/analytics/TrackPage", () => () => null);
jest.mock("./AccountHeaderRow", () => () => <div data-testid="account-header-row" />);
jest.mock("./AccountHeaderActions", () => () => null);
jest.mock("./AccountWarningBanner", () => ({
  AccountWarningBanner: () => null,
  AccountWarningCustomBanner: () => null,
}));
jest.mock("./BalanceSummary", () => () => <div data-testid="balance-summary" />);
jest.mock("./TokensList", () => () => null);
jest.mock("./EmptyStateAccount", () => () => null);
jest.mock("~/renderer/screens/account/AccountStakeBanner", () => ({
  AccountStakeBanner: () => null,
}));
jest.mock("LLD/features/NftEntryPoint", () => () => null);
jest.mock("~/renderer/components/OperationsList", () => () => <div data-testid="ops-list" />);

const currency = getCryptoCurrencyById("bitcoin");
const account = genAccount("test-account-btc", { currency, operationsSize: 1 });
const stub = (testId: string) => () => <div data-testid={testId} />;

beforeEach(() => {
  jest.clearAllMocks();
  useParams.mockReturnValue({ id: account.id, parentId: undefined, "*": undefined });
});

describe("AccountPage — useLLDCoinFamily slots", () => {
  it("renders AccountBodyHeader and AccountSubHeader stubs when family provides them", () => {
    mockFamily.mockReturnValue({
      AccountBodyHeader: stub("body-header"),
      AccountSubHeader: stub("sub-header"),
    } as never);

    render(<AccountPageWrapper />, {
      initialState: { ...accountPageFlags, accounts: [account] },
    });

    expect(screen.getByTestId("body-header")).toBeInTheDocument();
    expect(screen.getByTestId("sub-header")).toBeInTheDocument();
  });

  it("does not render AccountBodyHeader or AccountSubHeader when family returns empty object", () => {
    mockFamily.mockReturnValue({} as never);

    render(<AccountPageWrapper />, {
      initialState: { ...accountPageFlags, accounts: [account] },
    });

    expect(screen.queryByTestId("body-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sub-header")).not.toBeInTheDocument();
  });
});

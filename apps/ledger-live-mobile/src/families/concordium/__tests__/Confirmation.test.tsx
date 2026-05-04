import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import Confirmation from "../Confirmation";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/explorers", () => ({
  getDefaultExplorerView: () => ({
    tx: "https://testnet.ccdscan.io/transactions?dentity=transaction&dhash=$hash",
    address: "https://testnet.ccdscan.io/accounts?dentity=account&daddress=$address",
  }),
  getAddressExplorer: (_view: unknown, address: string) =>
    `https://testnet.ccdscan.io/accounts?dentity=account&daddress=${address}`,
}));

jest.mock("~/utils/address", () => ({
  getFreshAccountAddress: (account: { freshAddress: string }) => account.freshAddress,
}));

// NavigationScrollView uses useRoute() which requires a navigator screen context
jest.mock("~/components/NavigationScrollView", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ScrollView } = require("react-native");
  return (props: { children: React.ReactNode }) => <ScrollView>{props.children}</ScrollView>;
});

const { useAccountScreen } = jest.requireMock("LLM/hooks/useAccountScreen");

const mockAccount = {
  id: "concordium-account-1",
  type: "Account" as const,
  freshAddress: "3YkS2vmBHAbo7RGKQ78MjJ3QhEDAqQTJgX2tnrGZbE9oLpuRqE",
  freshAddressPath: "44'/919'/0'/0/0",
  currency: {
    type: "CryptoCurrency" as const,
    id: "concordium",
    ticker: "CCD",
    name: "Concordium",
    family: "concordium",
  },
  derivationMode: "",
  seedIdentifier: "test-seed",
  subAccounts: [],
};

const baseRoute = {
  key: "test-key",
  name: ScreenName.ReceiveConfirmation as const,
  params: {
    accountId: "concordium-account-1",
    parentId: undefined,
  },
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const baseNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
} as unknown as Parameters<typeof Confirmation>[0]["navigation"];

describe("Confirmation (Concordium)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccountScreen.mockReturnValue({
      account: mockAccount,
      parentAccount: null,
    });
  });

  it("should render the fresh address", () => {
    render(<Confirmation navigation={baseNavigation} route={baseRoute} />);
    expect(screen.getByText(mockAccount.freshAddress)).toBeDefined();
  });

  it("should render the security alert about verification not being possible", () => {
    render(<Confirmation navigation={baseNavigation} route={baseRoute} />);
    expect(screen.getByText(/not possible to verify your Concordium Address/)).toBeDefined();
  });

  it("should render the verify link to the explorer", () => {
    render(<Confirmation navigation={baseNavigation} route={baseRoute} />);
    expect(screen.getByText("Verify")).toBeDefined();
  });

  it("should render nothing when account is missing", () => {
    useAccountScreen.mockReturnValue({
      account: undefined,
      parentAccount: null,
    });

    const { toJSON } = render(<Confirmation navigation={baseNavigation} route={baseRoute} />);
    expect(toJSON()).toBeNull();
  });
});

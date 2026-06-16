import React from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import TokensList from "./TokensList";

jest.mock("~/renderer/families");
const mockFamily = jest.mocked(useLLDCoinFamily);

const mockUnit = { code: "USDC", magnitude: 6, name: "USDC" };
const mockToken = {
  id: "erc20/usdc",
  type: "TokenCurrency",
  ticker: "USDC",
  name: "USD Coin",
  units: [mockUnit],
  parentCurrencyId: "ethereum",
} as unknown as TokenAccount["token"];
const mockSubAccount: TokenAccount = {
  type: "TokenAccount",
  id: "token-account-1",
  token: mockToken,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  starred: false,
  creationDate: new Date(),
  swapHistory: [],
} as unknown as TokenAccount;

const accountWithTokens = {
  type: "Account",
  id: "account-1",
  currency: {
    family: "evm",
    tokenTypes: ["erc20"],
  },
  subAccounts: [mockSubAccount],
} as unknown as Account;

const accountWithoutSubAccounts = {
  type: "Account",
  id: "account-2",
  currency: {
    family: "evm",
    tokenTypes: ["erc20"],
  },
  subAccounts: undefined,
} as unknown as Account;

beforeEach(() => jest.clearAllMocks());

describe("TokensList — useLLDCoinFamily slot", () => {
  it("renders custom ReceiveButton from family slot when account has subAccounts", () => {
    mockFamily.mockReturnValue({
      tokenList: {
        ReceiveButton: () => <div data-testid="custom-receive" />,
      },
    } as never);

    render(<TokensList account={accountWithTokens} />);

    expect(screen.getByTestId("custom-receive")).toBeVisible();
  });

  it("falls back to default ReceiveButton when family returns no tokenList.ReceiveButton", () => {
    mockFamily.mockReturnValue({} as never);

    render(<TokensList account={accountWithTokens} />);

    expect(screen.queryByTestId("custom-receive")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeVisible();
  });

  it("renders nothing when account has no subAccounts", () => {
    mockFamily.mockReturnValue({} as never);

    const { container } = render(<TokensList account={accountWithoutSubAccounts} />);

    expect(container).toBeEmptyDOMElement();
  });
});

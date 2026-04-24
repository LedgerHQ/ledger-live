import React from "react";
import { render, screen } from "@tests/test-renderer";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import SelectToken, { type Props } from "./01-SelectToken";
import { HEDERA_ACCOUNT_1, HEDERA_ASSOCIATED_SUBACCOUNT } from "../__mocks__/account.mock";
import { htsToken, erc20Token } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/cryptoassets/cal-client/hooks/useTokensData");

const mockedUseTokensData = jest.mocked(useTokensData);
const mockNavigate = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
} as unknown as Props["navigation"];

const mockRoute = {
  key: "test",
  name: ScreenName.HederaAssociateTokenSelectToken,
  params: { accountId: HEDERA_ACCOUNT_1.id },
} as unknown as Props["route"];

const buildRowTestId = (tokenId: string) => `big-currency-row-${tokenId}`;

describe("AssociateTokenFlow - select token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTokensData.mockReturnValue({
      data: { tokens: [htsToken, erc20Token], pagination: { nextCursor: "" } },
      isLoading: false,
      isSuccess: true,
      error: undefined,
      isError: false,
      loadNext: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it("should render the token list", () => {
    render(<SelectToken navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
      }),
    });

    expect(screen.getByTestId(buildRowTestId(htsToken.id))).toBeVisible();
    expect(screen.getByTestId(buildRowTestId(erc20Token.id))).toBeVisible();
  });

  it("should navigate to HederaAssociateTokenSummary when tapping an unassociated HTS token", async () => {
    const { user } = render(<SelectToken navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
      }),
    });

    await user.press(screen.getByTestId(buildRowTestId(htsToken.id)));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.HederaAssociateTokenSummary, {
      accountId: HEDERA_ACCOUNT_1.id,
      token: htsToken,
    });
  });

  it("should navigate to ReceiveConfirmation with mainAccount.id when tapping an ERC-20 token", async () => {
    const { user } = render(<SelectToken navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
      }),
    });

    await user.press(screen.getByTestId(buildRowTestId(erc20Token.id)));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        currency: erc20Token,
        accountId: HEDERA_ACCOUNT_1.id,
      },
    });
  });

  it("should navigate to ReceiveConfirmation with subAccount ids when tapping an already-associated HTS token", async () => {
    const { user } = render(<SelectToken navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: (state: State): State => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [{ ...HEDERA_ACCOUNT_1, subAccounts: [HEDERA_ASSOCIATED_SUBACCOUNT] }],
        },
      }),
    });

    await user.press(screen.getByTestId(buildRowTestId(htsToken.id)));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        currency: htsToken,
        accountId: HEDERA_ASSOCIATED_SUBACCOUNT.id,
        parentId: HEDERA_ASSOCIATED_SUBACCOUNT.parentId,
      },
    });
  });
});

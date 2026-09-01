import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { ETH_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import NoFundsStakeModal from "./index";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/earn" }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: jest.fn(() => ({ data: ["ethereum", "ethereum/erc20/usd__coin"] })),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({
    isCurrencyAvailable: () => true,
  }),
}));

const modalOpenState = {
  accounts: [ETH_ACCOUNT],
  modals: { MODAL_NO_FUNDS_STAKE: { isOpened: true } },
};

describe("NoFundsStakeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const node = document.createElement("div");
    node.id = "modals";
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  describe("Swap button navigation", () => {
    it("navigates to /swap when Swap is clicked", () => {
      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      fireEvent.click(screen.getByText("Swap"));

      expect(mockNavigate).toHaveBeenCalledWith("/swap", expect.anything());
    });

    it("passes defaultCurrency as { toCurrencyId } not as raw currency object", () => {
      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      fireEvent.click(screen.getByText("Swap"));

      const state = mockNavigate.mock.calls[0][1].state;
      expect(state.defaultCurrency).toEqual({ toCurrencyId: "ethereum" });
      expect(state.defaultCurrency).not.toHaveProperty("id");
      expect(state.defaultCurrency).not.toHaveProperty("type");
    });

    it("includes defaultAccountId in navigation state", () => {
      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      fireEvent.click(screen.getByText("Swap"));

      const state = mockNavigate.mock.calls[0][1].state;
      expect(state.defaultAccountId).toBe(ETH_ACCOUNT.id);
    });

    it("includes from path in navigation state", () => {
      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      fireEvent.click(screen.getByText("Swap"));

      const state = mockNavigate.mock.calls[0][1].state;
      expect(state.from).toBe("/earn");
    });

    it("prefills token receive currency and includes account + parent ids for a token account", () => {
      const ethAccountWithUsdc = ETH_ACCOUNT_WITH_USDC;
      const usdcSubAccount = ethAccountWithUsdc.subAccounts?.[0];
      if (!usdcSubAccount) throw new Error("No USDC sub-account in mock");

      render(<NoFundsStakeModal account={usdcSubAccount} parentAccount={ethAccountWithUsdc} />, {
        initialState: {
          accounts: [ethAccountWithUsdc],
          modals: { MODAL_NO_FUNDS_STAKE: { isOpened: true } },
        },
      });

      fireEvent.click(screen.getByText("Swap"));

      const state = mockNavigate.mock.calls[0][1].state;
      expect(state.defaultCurrency).toEqual({ toCurrencyId: "ethereum/erc20/usd__coin" });
      expect(state.defaultAccountId).toBe(usdcSubAccount.id);
      expect(state.defaultParentAccountId).toBe(ethAccountWithUsdc.id);
    });
  });

  describe("modal rendering", () => {
    it("shows Buy, Swap, and Receive options", () => {
      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      expect(screen.getByText("Buy")).toBeInTheDocument();
      expect(screen.getByText("Swap")).toBeInTheDocument();
      expect(screen.getByText("Receive")).toBeInTheDocument();
    });

    it("hides Swap option when currency is not available on swap", () => {
      const { useFetchCurrencyAll } = jest.requireMock(
        "@ledgerhq/live-common/exchange/swap/hooks/index",
      );
      (useFetchCurrencyAll as jest.Mock).mockReturnValueOnce({ data: [] });

      render(<NoFundsStakeModal account={ETH_ACCOUNT} />, { initialState: modalOpenState });

      expect(screen.queryByText("Swap")).not.toBeInTheDocument();
    });
  });
});

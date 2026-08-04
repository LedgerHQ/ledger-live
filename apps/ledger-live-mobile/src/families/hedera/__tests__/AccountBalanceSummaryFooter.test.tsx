import React from "react";
import { render, screen } from "@tests/test-renderer";
import { useStake } from "LLM/hooks/useStake/useStake";
import AccountBalanceFooter from "../AccountBalanceSummaryFooter";
import { HEDERA_ACCOUNT_1, makeHederaAccount } from "../__mocks__/account.mock";
import { mockDelegation } from "../__mocks__/delegation.mock";

jest.mock("LLM/hooks/useStake/useStake", () => ({ useStake: jest.fn() }));

jest.mock("@ledgerhq/native-ui/pre-ldls", () => ({
  CryptoIcon: () => null,
}));

jest.mock("~/modals/Info", () => ({
  __esModule: true,
  default: () => null,
}));

const mockUseStake = jest.mocked(useStake);

const renderAccount = (account: ReturnType<typeof makeHederaAccount>) =>
  render(<AccountBalanceFooter account={account} />, {
    overrideInitialState: s => ({
      ...s,
      accounts: { ...s.accounts, active: [account] },
    }),
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockUseStake.mockReturnValue({
    getCanStakeCurrency: jest.fn().mockReturnValue(true),
  } as never);
});

describe("AccountBalanceFooter (Hedera)", () => {
  describe("guard clause", () => {
    it("renders null when hederaResources is absent", () => {
      const { toJSON } = render(<AccountBalanceFooter account={HEDERA_ACCOUNT_1 as never} />, {
        overrideInitialState: s => ({
          ...s,
          accounts: { ...s.accounts, active: [HEDERA_ACCOUNT_1] },
        }),
      });
      expect(toJSON()).toBeNull();
    });
  });

  describe("without delegation", () => {
    it("shows the Available balance section", () => {
      renderAccount(makeHederaAccount());
      expect(screen.getByText("Available balance")).toBeTruthy();
    });

    it("does not show Delegated assets or Claimable rewards sections", () => {
      renderAccount(makeHederaAccount());
      expect(screen.queryByText("Delegated assets")).toBeNull();
      expect(screen.queryByText("Claimable rewards")).toBeNull();
    });
  });

  describe("with delegation and staking enabled", () => {
    it("shows Available balance, Delegated assets, and Claimable rewards sections", () => {
      renderAccount(makeHederaAccount({ delegation: mockDelegation }));
      expect(screen.getByText("Available balance")).toBeTruthy();
      expect(screen.getByText("Delegated assets")).toBeTruthy();
      expect(screen.getByText("Claimable rewards")).toBeTruthy();
    });
  });

  describe("with delegation but staking disabled", () => {
    it("shows Available balance but hides the delegation sections", () => {
      mockUseStake.mockReturnValue({
        getCanStakeCurrency: jest.fn().mockReturnValue(false),
      } as never);

      renderAccount(makeHederaAccount({ delegation: mockDelegation }));

      expect(screen.getByText("Available balance")).toBeTruthy();
      expect(screen.queryByText("Delegated assets")).toBeNull();
      expect(screen.queryByText("Claimable rewards")).toBeNull();
    });
  });
});

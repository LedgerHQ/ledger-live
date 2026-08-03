import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { useStake } from "LLD/hooks/useStake";
import component from "../AccountBalanceSummaryFooter";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { HEDERA_ACCOUNT_1, makeHederaAccount } from "../__mocks__/account.mock";

jest.mock("LLD/hooks/useStake", () => ({ useStake: jest.fn() }));

const AccountBalanceSummaryFooter = component as unknown as React.ComponentType<{
  account: HederaAccount | TokenAccount;
}>;
const mockUseStake = jest.mocked(useStake);

const defaultState = {
  settings: AFTER_ONBOARDING_STATE,
  accounts: [HEDERA_ACCOUNT_1],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseStake.mockReturnValue({
    getCanStakeCurrency: jest.fn().mockReturnValue(true),
  } as never);
});

describe("AccountBalanceSummaryFooter", () => {
  describe("guard clauses — returns null", () => {
    it("renders nothing when account has no hederaResources", () => {
      const { container } = render(
        <AccountBalanceSummaryFooter
          account={{ ...HEDERA_ACCOUNT_1, hederaResources: undefined } as never}
        />,
        { initialState: defaultState },
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when staking is disabled for the currency", () => {
      mockUseStake.mockReturnValue({
        getCanStakeCurrency: jest.fn().mockReturnValue(false),
      } as never);

      const { container } = render(<AccountBalanceSummaryFooter account={makeHederaAccount()} />, {
        initialState: { ...defaultState, accounts: [makeHederaAccount()] },
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe("without delegation", () => {
    it("shows the available balance label", () => {
      render(<AccountBalanceSummaryFooter account={makeHederaAccount()} />, {
        initialState: { ...defaultState, accounts: [makeHederaAccount()] },
      });

      expect(screen.getByText(/available balance/i)).toBeVisible();
    });

    it("does not show delegated assets or claimable rewards sections", () => {
      render(<AccountBalanceSummaryFooter account={makeHederaAccount()} />, {
        initialState: { ...defaultState, accounts: [makeHederaAccount()] },
      });

      expect(screen.queryByText(/delegated/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/claimable/i)).not.toBeInTheDocument();
    });
  });

  describe("with delegation", () => {
    const delegatedAccount = makeHederaAccount({
      delegation: {
        nodeId: 3,
        delegated: new BigNumber(50_000_000),
        pendingReward: new BigNumber(10_000),
      },
    });

    it("shows available balance, delegated assets and claimable rewards labels", () => {
      render(<AccountBalanceSummaryFooter account={delegatedAccount} />, {
        initialState: { ...defaultState, accounts: [delegatedAccount] },
      });

      expect(screen.getByText(/available balance/i)).toBeVisible();
      expect(screen.getByText(/delegated/i)).toBeVisible();
      expect(screen.getByText(/claimable/i)).toBeVisible();
    });

    it("shows three balance detail sections", () => {
      render(<AccountBalanceSummaryFooter account={delegatedAccount} />, {
        initialState: { ...defaultState, accounts: [delegatedAccount] },
      });

      // Available + delegated + claimable
      expect(screen.getAllByText(/HBAR/i).length).toBeGreaterThanOrEqual(3);
    });
  });
});

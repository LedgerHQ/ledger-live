import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, userEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { openModal } from "~/renderer/actions/modals";
import { useStake } from "LLD/hooks/useStake";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import type { TokenAccount } from "@ledgerhq/types-live";
import DelegatedPositions from "../DelegatedPositions/index";
import { HEDERA_ACCOUNT_1, makeHederaAccount } from "../__mocks__/account.mock";
import { mockDelegation, mockEnrichedDelegation } from "../__mocks__/delegation.mock";

jest.mock("LLD/hooks/useStake", () => ({ useStake: jest.fn() }));

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaEnrichedDelegation: jest.fn(),
}));

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn((name: string, data?: unknown) => ({
    type: "MODAL_OPEN",
    payload: { name, data },
  })),
}));

jest.mock("~/renderer/families/hedera/DelegatedPositions/Row", () => ({
  Row: ({ onManageAction }: { onManageAction: (key: string) => void }) => (
    <div>
      <button
        data-testid="row-action-redelegation"
        onClick={() => onManageAction("MODAL_HEDERA_REDELEGATION")}
      >
        Redelegate
      </button>
      <button
        data-testid="row-action-undelegation"
        onClick={() => onManageAction("MODAL_HEDERA_UNDELEGATION")}
      >
        Undelegate
      </button>
    </div>
  ),
}));

jest.mock("~/renderer/families/hedera/DelegatedPositions/DelegationPlaceholder", () => ({
  __esModule: true,
  default: () => <div data-testid="delegation-placeholder">DelegationPlaceholder</div>,
}));

jest.mock("~/renderer/families/hedera/DelegatedPositions/Header", () => ({
  Header: () => null,
  TableLine: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseStake = jest.mocked(useStake);
const mockUseHederaEnrichedDelegation = jest.mocked(useHederaEnrichedDelegation);
const mockOpenModal = jest.mocked(openModal);

const makeTokenAccount = (): TokenAccount =>
  ({
    ...HEDERA_ACCOUNT_1,
    type: "TokenAccount",
  }) as unknown as TokenAccount;

const defaultState = { settings: AFTER_ONBOARDING_STATE };

beforeEach(() => {
  jest.clearAllMocks();
  mockUseStake.mockReturnValue({
    getCanStakeCurrency: jest.fn().mockReturnValue(true),
  } as never);
  mockUseHederaEnrichedDelegation.mockReturnValue(mockEnrichedDelegation);
});

describe("DelegatedPositions", () => {
  describe("guard clauses — renders null", () => {
    it("renders null for a token account", () => {
      const { container } = render(<DelegatedPositions account={makeTokenAccount()} />, {
        initialState: defaultState,
      });
      expect(container.firstChild).toBeNull();
    });

    it("renders null when staking is disabled", () => {
      mockUseStake.mockReturnValue({
        getCanStakeCurrency: jest.fn().mockReturnValue(false),
      } as never);

      const { container } = render(<DelegatedPositions account={makeHederaAccount()} />, {
        initialState: defaultState,
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe("without delegation", () => {
    it("renders DelegationPlaceholder when hederaResources is absent", () => {
      render(
        <DelegatedPositions
          account={{ ...HEDERA_ACCOUNT_1, hederaResources: undefined } as never}
        />,
        { initialState: defaultState },
      );
      expect(screen.getByTestId("delegation-placeholder")).toBeVisible();
    });

    it("renders DelegationPlaceholder when delegation is null", () => {
      render(<DelegatedPositions account={makeHederaAccount({ delegation: null })} />, {
        initialState: defaultState,
      });
      expect(screen.getByTestId("delegation-placeholder")).toBeVisible();
    });
  });

  describe("with delegation", () => {
    const buildAccount = () => makeHederaAccount({ delegation: mockDelegation });

    it("shows the Delegation section header", () => {
      render(<DelegatedPositions account={buildAccount()} />, { initialState: defaultState });
      expect(screen.getByText(/Delegation/i)).toBeVisible();
    });

    it("shows the Claim rewards button when pendingReward is positive", () => {
      render(<DelegatedPositions account={buildAccount()} />, { initialState: defaultState });
      expect(screen.getByRole("button", { name: /claim rewards/i })).toBeVisible();
    });

    it("hides the Claim rewards button when pendingReward is zero", () => {
      mockUseHederaEnrichedDelegation.mockReturnValue({
        ...mockEnrichedDelegation,
        pendingReward: new BigNumber(0),
      });

      render(<DelegatedPositions account={buildAccount()} />, { initialState: defaultState });
      expect(screen.queryByRole("button", { name: /claim rewards/i })).not.toBeInTheDocument();
    });

    it("dispatches MODAL_HEDERA_CLAIM_REWARDS when the Claim rewards button is clicked", async () => {
      const account = buildAccount();
      render(<DelegatedPositions account={account} />, { initialState: defaultState });

      await userEvent.click(screen.getByRole("button", { name: /claim rewards/i }));

      expect(mockOpenModal).toHaveBeenCalledWith("MODAL_HEDERA_CLAIM_REWARDS", { account });
    });

    it("dispatches MODAL_HEDERA_REDELEGATION when the row Redelegate action is triggered", async () => {
      const account = buildAccount();
      render(<DelegatedPositions account={account} />, { initialState: defaultState });

      await userEvent.click(screen.getByTestId("row-action-redelegation"));

      expect(mockOpenModal).toHaveBeenCalledWith("MODAL_HEDERA_REDELEGATION", { account });
    });

    it("dispatches MODAL_HEDERA_UNDELEGATION when the row Undelegate action is triggered", async () => {
      const account = buildAccount();
      render(<DelegatedPositions account={account} />, { initialState: defaultState });

      await userEvent.click(screen.getByTestId("row-action-undelegation"));

      expect(mockOpenModal).toHaveBeenCalledWith("MODAL_HEDERA_UNDELEGATION", { account });
    });
  });
});

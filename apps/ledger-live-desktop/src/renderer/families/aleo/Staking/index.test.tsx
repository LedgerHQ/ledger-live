import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  useAleoStakingPosition,
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import i18n from "~/renderer/i18n/init";
import {
  ALEO_BONDED_ACCOUNT,
  ALEO_MAIN_ACCOUNT,
  ALEO_TOKEN_ACCOUNT,
  withPendingOperation,
} from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import {
  aleoStakingPosition,
  bondedPosition,
  bondedUnbondingPosition,
  unbondingPosition,
} from "../__mocks__/stakingPosition.mock";
import { AleoCustomModal } from "../constants";
import { getAleoCurrencyConfig } from "../shared/utils";
import StakingSection from ".";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoStakingPosition: jest.fn(),
  useAleoUnbondingState: jest.fn(),
}));

jest.mock("~/renderer/hooks/useAccountUnit");

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

jest.mock("~/renderer/components/Tooltip", () => require("../__mocks__/tooltip.mock"));

const mockUseAleoStakingPosition = jest.mocked(useAleoStakingPosition);
const mockUseAleoUnbondingState = jest.mocked(useAleoUnbondingState);
const mockUseAccountUnit = jest.mocked(useAccountUnit);
const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

const NOT_BONDED = aleoStakingPosition();
const BONDED = bondedPosition();

const renderSection = (
  account: AleoAccount | TokenAccount = ALEO_MAIN_ACCOUNT,
  position: AleoStakingPositionView = NOT_BONDED,
) => {
  mockUseAleoStakingPosition.mockReturnValue(position);
  return render(<StakingSection account={account} />);
};

const manageButton = () =>
  screen.queryByRole("button", { name: i18n.t("aleo.stake.table.manage") });
const earnButton = () =>
  screen.queryByRole("button", { name: i18n.t("aleo.stake.emptyState.earnRewards") });
const summary = () => screen.queryByTestId("aleo-staked-balance");
// Scoped to each table's own title: the summary's "Unstaking" cell label is the same word as the
// unstaking table's heading.
const stakingTable = () =>
  screen.queryByText(i18n.t("aleo.stake.table.header"), {
    selector: '[data-e2e="title_Staking"]',
  });
const unstakingTable = () =>
  screen.queryByText(i18n.t("aleo.stake.unstaking.header"), {
    selector: '[data-e2e="title_Unstaking"]',
  });

describe("StakingSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
    mockUseAleoUnbondingState.mockReturnValue({
      isClaimable: false,
      isCountingDown: true,
      isSettling: false,
      blocksLeft: 240,
      currentHeight: 760,
    });
  });

  // The section reads the staking slice of the account, which token accounts do not carry.
  it("renders nothing for a token account", () => {
    const { container } = renderSection(ALEO_TOKEN_ACCOUNT);

    expect(container).toBeEmptyDOMElement();
  });

  // Gated ahead of the hooks on purpose: they fetch the validator list and poll the chain tip,
  // neither of which exists to be read while staking is off.
  describe("while staking is disabled", () => {
    it("renders nothing, and asks for no position", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: false });

      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
      expect(mockUseAleoStakingPosition).not.toHaveBeenCalled();
    });

    it("renders nothing when the currency config has not loaded", () => {
      mockGetAleoCurrencyConfig.mockReturnValue(undefined);

      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
      expect(mockUseAleoStakingPosition).not.toHaveBeenCalled();
    });
  });

  describe("with nothing staked", () => {
    it("invites the user to stake instead of showing an empty table", () => {
      renderSection();

      expect(
        screen.getByText(
          i18n.t("aleo.stake.emptyState.description", { name: ALEO_MAIN_ACCOUNT.currency.name }),
        ),
      ).toBeVisible();
      expect(earnButton()).toBeVisible();
    });

    // Nothing to manage and no row to head: offering either would describe a position the user
    // does not have.
    it("offers no manage action, summary or column headers", () => {
      renderSection();

      expect(manageButton()).not.toBeInTheDocument();
      expect(summary()).not.toBeInTheDocument();
      expect(screen.queryByText(i18n.t("aleo.stake.table.validator"))).not.toBeInTheDocument();
    });

    it("opens the bond flow for this account from the empty state", async () => {
      const { store, user } = renderSection();

      await user.click(earnButton()!);

      expect(store.getState().modals[AleoCustomModal.BOND_PUBLIC]).toEqual({
        isOpened: true,
        data: { account: ALEO_MAIN_ACCOUNT },
      });
    });

    it("closes the stake CTA while a bond is waiting to be confirmed", () => {
      renderSection(withPendingOperation(ALEO_MAIN_ACCOUNT, "BOND"));

      expect(earnButton()).toBeDisabled();
      expect(screen.getByTestId("tooltip")).toHaveAttribute(
        "data-tooltip",
        i18n.t("aleo.stake.emptyState.bondPendingTooltip"),
      );
    });
  });

  describe("with a bonded position", () => {
    it("shows the summary, the column headers and the staked row", () => {
      renderSection(ALEO_BONDED_ACCOUNT, BONDED);

      expect(summary()).toBeVisible();
      expect(screen.getByText(i18n.t("aleo.stake.table.validator"))).toBeVisible();
      expect(screen.getByText("Figment")).toBeVisible();
      expect(earnButton()).not.toBeInTheDocument();
    });

    it("opens the manage modal for this account", async () => {
      const { store, user } = renderSection(ALEO_BONDED_ACCOUNT, BONDED);

      await user.click(manageButton()!);

      expect(store.getState().modals[AleoCustomModal.MANAGE]).toEqual({
        isOpened: true,
        data: { account: ALEO_BONDED_ACCOUNT },
      });
    });
  });

  describe("the unstaking table", () => {
    it("is absent while the account has no unbonding entry", () => {
      renderSection(ALEO_BONDED_ACCOUNT, BONDED);

      expect(unstakingTable()).not.toBeInTheDocument();
    });

    it("appears alongside a bonded position", () => {
      renderSection(ALEO_BONDED_ACCOUNT, bondedUnbondingPosition());

      expect(stakingTable()).toBeVisible();
      expect(unstakingTable()).toBeVisible();
    });

    // Unstaking the whole position leaves nothing bonded while the entry is still waiting, so the
    // two halves have to coexist: the invitation to stake again, and the funds on their way out.
    it("appears under the empty state once the whole position is unbonding", () => {
      renderSection(ALEO_MAIN_ACCOUNT, unbondingPosition());

      expect(earnButton()).toBeVisible();
      expect(unstakingTable()).toBeVisible();
    });

    it("appears for a pending unbond the balances do not carry yet", () => {
      renderSection(
        ALEO_BONDED_ACCOUNT,
        bondedPosition({
          hasPendingUnbond: true,
          hasPendingUnbondingChange: true,
          pendingKind: "unbond",
        }),
      );

      expect(unstakingTable()).toBeVisible();
      expect(screen.getByTestId("aleo-unbond-pending")).toBeVisible();
    });
  });
});

import BigNumber from "bignumber.js";
import React from "react";
import { render, screen, within } from "tests/testSetup";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import i18n from "~/renderer/i18n/init";
import { ALEO_BONDED_CLAIMABLE_ACCOUNT } from "../__mocks__/account.mock";
import { bondedUnbondingPosition } from "../__mocks__/stakingPosition.mock";
import StakingSummary from "./StakingSummary";

jest.mock("~/renderer/hooks/useAccountUnit");

// Tippy renders its content lazily on hover, which jsdom makes unreliable. Render it inline
// instead, so each cell carries its own label, figure and explanation.
jest.mock("~/renderer/components/Tooltip", () => ({
  __esModule: true,
  default: ({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      {children}
      {content}
    </div>
  ),
}));

const mockUseAccountUnit = jest.mocked(useAccountUnit);

// The fixture's staked, locked and claimable figures all differ, so a cell reading the wrong
// field off the position fails rather than coincidentally matching.
const position = bondedUnbondingPosition;

const renderSummary = (
  positionOverrides: Partial<AleoStakingPositionView> = {},
  { discreetMode = false } = {},
) =>
  render(
    <StakingSummary
      account={ALEO_BONDED_CLAIMABLE_ACCOUNT}
      position={position(positionOverrides)}
    />,
    { initialState: { settings: { discreetMode } } },
  );

const cell = (testId: string) => within(screen.getByTestId(testId));

describe("StakingSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
  });

  // `unstakingBalance` is the locked part alone; `unbondingBalance` is that plus whatever has
  // already become claimable. Reading the latter here would double-count the claimable cell.
  it("splits the unbonding entry into its locked and claimable parts", () => {
    renderSummary();

    expect(cell("aleo-staked-balance").getByText("20 ALEO")).toBeVisible();
    expect(cell("aleo-unstaking-balance").getByText("3 ALEO")).toBeVisible();
    expect(cell("aleo-claimable-balance").getByText("2 ALEO")).toBeVisible();
    expect(screen.queryByText("5 ALEO")).not.toBeInTheDocument();
  });

  // The whole entry has finished unbonding: nothing is locked any more, so the locked cell has to
  // read zero rather than repeat the claimable figure.
  it("reads zero as unstaking once the whole entry is claimable", () => {
    renderSummary({
      unstakingBalance: new BigNumber(0),
      claimableBalance: new BigNumber(5_000_000),
    });

    expect(cell("aleo-unstaking-balance").getByText("0 ALEO")).toBeVisible();
    expect(cell("aleo-claimable-balance").getByText("5 ALEO")).toBeVisible();
  });

  it("hides every figure in discreet mode", () => {
    renderSummary({}, { discreetMode: true });

    expect(cell("aleo-staked-balance").getByText("***")).toBeVisible();
    expect(cell("aleo-unstaking-balance").getByText("***")).toBeVisible();
    expect(cell("aleo-claimable-balance").getByText("***")).toBeVisible();
    expect(screen.queryByText("20 ALEO")).not.toBeInTheDocument();
  });

  it.each([
    ["aleo-staked-balance", "aleo.account.stakedBalance", "aleo.account.stakedBalanceTooltip"],
    [
      "aleo-unstaking-balance",
      "aleo.account.unstakingBalance",
      "aleo.account.unstakingBalanceTooltip",
    ],
    [
      "aleo-claimable-balance",
      "aleo.account.claimableBalance",
      "aleo.account.claimableBalanceTooltip",
    ],
  ])("labels %s and explains what it counts", (testId, labelKey, tooltipKey) => {
    renderSummary();

    expect(cell(testId).getByText(i18n.t(labelKey))).toBeVisible();
    expect(cell(testId).getByText(i18n.t(tooltipKey))).toBeInTheDocument();
  });
});

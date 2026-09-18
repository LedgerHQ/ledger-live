import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoUnbondingDisplayState } from "@ledgerhq/live-common/families/aleo/types";
import {
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import i18n from "~/renderer/i18n/init";
import { ALEO_CLAIMABLE_ACCOUNT } from "../__mocks__/account.mock";
import { unbondingPosition } from "../__mocks__/stakingPosition.mock";
import { AleoCustomModal } from "../constants";
import Unstakings from "./Unstakings";

// The countdown, the settling gap and the catch-up sync are the hook's own contract, covered in
// live-common's react.test.ts. Here the display state is the input, and the row is what is asserted.
jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoUnbondingState: jest.fn(),
}));

jest.mock("~/renderer/hooks/useAccountUnit");

// Tippy renders its content lazily on hover, which jsdom makes unreliable. Every state here is
// distinguished by the message it offers, so expose that on the wrapper instead.
jest.mock("~/renderer/components/Tooltip", () => ({
  __esModule: true,
  default: ({ content, children }: { content: React.ReactNode; children?: React.ReactNode }) => (
    <div data-tooltip={content == null ? undefined : String(content)}>{children}</div>
  ),
}));

const mockUseAleoUnbondingState = jest.mocked(useAleoUnbondingState);
const mockUseAccountUnit = jest.mocked(useAccountUnit);

const UNBONDING_HEIGHT = 1_000;

const unbondingState = (
  overrides: Partial<AleoUnbondingDisplayState> = {},
): AleoUnbondingDisplayState => ({
  isClaimable: true,
  isCountingDown: false,
  isSettling: false,
  blocksLeft: 0,
  ...overrides,
});

const renderRow = (
  positionOverrides: Partial<AleoStakingPositionView> = {},
  stateOverrides: Partial<AleoUnbondingDisplayState> = {},
) => {
  mockUseAleoUnbondingState.mockReturnValue(unbondingState(stateOverrides));
  const props = {
    account: ALEO_CLAIMABLE_ACCOUNT,
    position: unbondingPosition(positionOverrides),
  };
  return { ...render(<Unstakings {...props} />), props };
};

/** The message the cell would show on hover, or "" when it offers none. */
const tooltipFor = (testId: string) =>
  screen.getByTestId(testId).closest("[data-tooltip]")?.getAttribute("data-tooltip") ?? "";

describe("Unstakings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
  });

  it("offers the claim CTA once the funds are claimable", () => {
    renderRow();

    expect(screen.getByTestId("aleo-claim-cta")).toBeVisible();
    expect(screen.queryByTestId("aleo-claim-pending")).not.toBeInTheDocument();
  });

  // The CTA has to reach the claim flow: pointing it at the Manage modal instead leaves the user
  // one extra choice away from the action the row already told them was available.
  it("opens the claim flow for this account when the CTA is clicked", async () => {
    const { store, user } = renderRow();

    await user.click(screen.getByTestId("aleo-claim-cta"));

    expect(store.getState().modals[AleoCustomModal.CLAIM_UNBOND]).toEqual({
      isOpened: true,
      data: { account: ALEO_CLAIMABLE_ACCOUNT },
    });
    expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
  });

  // The claimable figures come from the `unbonding` mapping, which a broadcast claim has not
  // yet emptied — without the guard the CTA would invite a second claim against funds the
  // chain has already released.
  it("replaces the claim CTA while a claim is pending", () => {
    renderRow({ hasPendingClaim: true, hasPendingUnbondingChange: true, pendingKind: "claim" });

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-claim-pending")).toBeVisible();
  });

  // `unbond_public` rewrites the same single `unbonding` slot the claim would target, so a
  // pending unbond has to close the claim too — guarding claim against only its own op type
  // would leave this crossing open.
  it("withholds the claim CTA while an unbond is pending, and says so", () => {
    renderRow({ hasPendingUnbond: true, hasPendingUnbondingChange: true, pendingKind: "unbond" });

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-unbond-pending")).toBeVisible();
    expect(screen.queryByTestId("aleo-claim-pending")).not.toBeInTheDocument();
  });

  // The bridge validates the claim against `account.blockHeight`, so offering the CTA on the
  // live height alone opens a flow with no amount and a disabled Continue.
  it("withholds the claim CTA and reports that it is settling", () => {
    renderRow(
      { claimableBalance: new BigNumber(0) },
      { isClaimable: false, isSettling: true, blocksLeft: 0 },
    );

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-claim-settling")).toBeVisible();
  });

  it("reads its display state from the unbonding hook, for this account and position", () => {
    const { props } = renderRow();

    expect(mockUseAleoUnbondingState).toHaveBeenCalledWith(props.account, props.position);
  });

  // The whole entry is what leaves the account, claimable part included. Showing the locked part
  // here instead would contradict the amount the claim flow then offers.
  it("shows the entire unbonding entry as the amount, not just the locked part", () => {
    renderRow();

    expect(screen.getByText("5 ALEO")).toBeVisible();
    expect(screen.queryByText("3 ALEO")).not.toBeInTheDocument();
  });

  describe("remaining wait", () => {
    const countdownAt = (
      blocksLeft: number | null,
      positionOverrides: Partial<AleoStakingPositionView> = {},
    ) => {
      renderRow(
        { claimableBalance: new BigNumber(0), ...positionOverrides },
        { isClaimable: false, isCountingDown: true, blocksLeft },
      );

      return screen.getByTestId("aleo-claim-countdown");
    };

    it("counts the blocks left until the funds unlock", () => {
      expect(countdownAt(240)).toHaveTextContent("~240 blocks left");
    });

    it("keeps the count singular on the last block", () => {
      expect(countdownAt(1)).toHaveTextContent("~1 block left");
    });

    // The live tip is not on the position — it reaches the row only as the blocks it counted
    // down. Naming the wrong one of the two heights makes the tooltip contradict the cell.
    it("names both the target height and the live tip it counted down from", () => {
      countdownAt(240);

      expect(tooltipFor("aleo-claim-countdown")).toBe(
        i18n.t("aleo.stake.claimableAtTooltip", {
          height: UNBONDING_HEIGHT,
          current: UNBONDING_HEIGHT - 240,
        }),
      );
    });

    // An unbonding entry with no recorded height cannot be counted down at all — the hook returns
    // no blocks for it — and the tooltip has no two heights to name.
    it("falls back to a dash with no tooltip when the entry records no height", () => {
      expect(countdownAt(null, { unbondingHeight: null })).toHaveTextContent("-");
      expect(tooltipFor("aleo-claim-countdown")).toBe("");
    });
  });

  describe("the status column", () => {
    it.each([
      ["claimable", {}, "aleo.stake.unstaking.claimableTooltip"],
      [
        "settling",
        { isClaimable: false, isSettling: true },
        "aleo.stake.unstaking.settlingTooltip",
      ],
      [
        "still counting down",
        { isClaimable: false, isCountingDown: true, blocksLeft: 240 },
        "aleo.stake.unstaking.pendingTooltip",
      ],
    ])("explains the wait when the entry is %s", (_label, stateOverrides, expectedKey) => {
      renderRow({}, stateOverrides);

      expect(tooltipFor("aleo-unstaking-status")).toBe(i18n.t(expectedKey));
    });
  });
});

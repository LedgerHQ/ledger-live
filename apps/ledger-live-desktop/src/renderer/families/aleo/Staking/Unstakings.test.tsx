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
import { UNBONDING_HEIGHT, unbondingPosition } from "../__mocks__/stakingPosition.mock";
import { AleoCustomModal } from "../constants";
import Unstakings from "./Unstakings";

// The countdown, the settling gap and the catch-up sync are the hook's own contract, covered in
// live-common's react.test.ts. Here the display state is the input, and the row is what is asserted.
jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoUnbondingState: jest.fn(),
}));

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/components/Tooltip", () => require("../__mocks__/tooltip.mock"));

const mockUseAleoUnbondingState = jest.mocked(useAleoUnbondingState);
const mockUseAccountUnit = jest.mocked(useAccountUnit);

const unbondingState = (
  overrides: Partial<AleoUnbondingDisplayState> = {},
): AleoUnbondingDisplayState => ({
  isClaimable: true,
  isCountingDown: false,
  isSettling: false,
  blocksLeft: 0,
  currentHeight: UNBONDING_HEIGHT,
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

/** The message the cell would show on hover, or null when it offers none. */
const tooltipFor = (testId: string) =>
  screen.getByTestId(testId).closest("[data-tooltip]")?.getAttribute("data-tooltip") ?? null;

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

  it("offers the claim as a button the keyboard can reach and activate", async () => {
    const { store, user } = renderRow();
    const claim = screen.getByTestId("aleo-claim-cta");

    expect(claim.tagName).toBe("BUTTON");

    claim.focus();
    await user.keyboard("{Enter}");

    expect(store.getState().modals[AleoCustomModal.CLAIM_UNBOND]?.isOpened).toBe(true);
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
    renderRow({ pendingKind: "claim" });

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-claim-pending")).toBeVisible();
  });

  // `unbond_public` rewrites the same single `unbonding` slot the claim would target, so a
  // pending unbond has to close the claim too.
  it("withholds the claim CTA while an unbond is pending, and says so", () => {
    renderRow({ pendingKind: "unbond" });

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

    expect(mockUseAleoUnbondingState).toHaveBeenCalledTimes(1);
    expect(mockUseAleoUnbondingState).toHaveBeenCalledWith(props.account, props.position);
  });

  // The source is the protocol, not a validator: the chain does not record which validator the
  // funds left, so naming the currently bonded one would name the wrong validator outright. It
  // is the unit that names the coin — the currency drags its network in, as "Aleo (Testnet)".
  it("names the coin as the source of the funds, not a validator", () => {
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo coin", magnitude: 6 });

    renderRow();

    expect(screen.getByText("Aleo coin")).toBeVisible();
  });

  // The whole entry is what leaves the account, claimable part included. Showing the locked part
  // here instead would contradict the amount the claim flow then offers.
  it("shows the entire unbonding entry as the amount, not just the locked part", () => {
    renderRow();

    expect(screen.getByText("5 ALEO")).toBeVisible();
    expect(screen.queryByText("3 ALEO")).not.toBeInTheDocument();
  });

  it("shows no amount for an unbond the balances do not carry yet", () => {
    renderRow({ unbondingBalance: new BigNumber(0), pendingKind: "unbond" });

    expect(screen.queryByText("0 ALEO")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-unbond-pending")).toBeVisible();
  });

  describe("remaining wait", () => {
    const countdownAt = (
      blocksLeft: number | null,
      positionOverrides: Partial<AleoStakingPositionView> = {},
    ) => {
      renderRow(
        { claimableBalance: new BigNumber(0), ...positionOverrides },
        {
          isClaimable: false,
          isCountingDown: true,
          blocksLeft,
          currentHeight: UNBONDING_HEIGHT - (blocksLeft ?? 0),
        },
      );

      return screen.getByTestId("aleo-claim-countdown");
    };

    it("counts the blocks left until the funds unlock", () => {
      expect(countdownAt(240)).toHaveTextContent("~240 blocks left");
    });

    it("keeps the count singular on the last block", () => {
      expect(countdownAt(1)).toHaveTextContent("~1 block left");
    });

    // The live tip and the target height are two different numbers the hook reports together.
    // Naming the wrong one of them makes the tooltip contradict the cell.
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
      expect(screen.getByTestId("aleo-claim-countdown").closest("[data-tooltip]")).toBeNull();
    });
  });

  describe("the status column", () => {
    it.each([
      ["claimable", {}, {}, "aleo.stake.unstaking.claimableTooltip"],
      [
        "settling",
        {},
        { isClaimable: false, isSettling: true },
        "aleo.stake.unstaking.settlingTooltip",
      ],
      [
        "still counting down",
        {},
        { isClaimable: false, isCountingDown: true, blocksLeft: 240 },
        "aleo.stake.unstaking.pendingTooltip",
      ],
      // The icon and the completion cell read one status, so the icon cannot keep saying the funds
      // are claimable while the cell next to it says the claim is already on its way.
      [
        "claimable but already being claimed",
        { pendingKind: "claim" as const },
        {},
        "aleo.stake.unstaking.claimPendingTooltip",
      ],
      [
        "claimable but caught behind a pending unbond",
        { pendingKind: "unbond" as const },
        {},
        "aleo.stake.unstaking.unbondPendingTooltip",
      ],
    ])(
      "explains the wait when the entry is %s",
      (_label, positionOverrides, stateOverrides, expectedKey) => {
        renderRow(positionOverrides, stateOverrides);

        expect(tooltipFor("aleo-unstaking-status")).toBe(i18n.t(expectedKey));
      },
    );
  });
});

import type { z } from "zod";
import type { EarnPositionSchema } from "@domain/entity-earn-position";
import { mockEarnPosition, mockEarnPositions } from "@domain/entity-earn-position/schema.mock";
import { markStakePositionTransacted } from "./stakePositionTransactions";
import {
  TRANSACTED_WINDOW_MS,
  clearStakePositionTransaction,
  getStakePositionTransaction,
  isWithinTransactedWindow,
  positionKeyOf,
  showsStakePositionTransaction,
  subscribeToStakePositionTransactions,
} from "./stakePositionTransactions.internals";

const OWNER_ADDRESS = "Wa11etTestAddress1111111111111111111111111111";
const POSITION_ID = "StakeAccountA1111111111111111111111111111111";
const POSITION = { ownerAddress: OWNER_ADDRESS, positionId: POSITION_ID };
const KEY = positionKeyOf(POSITION);

const positionsWith = (overrides?: Partial<z.input<typeof EarnPositionSchema>>) =>
  mockEarnPositions({ positions: [mockEarnPosition({ id: POSITION_ID, ...overrides })] });

describe("markStakePositionTransacted", () => {
  afterEach(() => {
    clearStakePositionTransaction(POSITION);
    jest.useRealTimers();
  });

  it("should record the action and the time of the user's transaction on the position", () => {
    jest.useFakeTimers({ now: 1_000_000 });

    markStakePositionTransacted({ ...POSITION, action: "deactivate" });

    expect(getStakePositionTransaction(KEY)).toEqual({ action: "deactivate", at: 1_000_000 });
  });

  it("should keep the transactions of other positions apart", () => {
    markStakePositionTransacted({ ...POSITION, action: "withdraw" });

    expect(
      getStakePositionTransaction(positionKeyOf({ ...POSITION, positionId: "OtherStakeAccount" })),
    ).toBeUndefined();
  });

  it("should tell the surfaces that read it, and again once it is cleared", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToStakePositionTransactions(listener);

    markStakePositionTransacted({ ...POSITION, action: "deactivate" });
    clearStakePositionTransaction(POSITION);
    clearStakePositionTransaction(POSITION);
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("isWithinTransactedWindow", () => {
  const transaction = { action: "deactivate", at: 1_000_000 } as const;

  it("should wait for a transaction broadcast within the window", () => {
    expect(isWithinTransactedWindow(transaction, 1_000_000 + TRANSACTED_WINDOW_MS)).toBe(true);
  });

  it("should stop waiting for a transaction once the window is over", () => {
    expect(isWithinTransactedWindow(transaction, 1_000_000 + TRANSACTED_WINDOW_MS + 1)).toBe(false);
  });
});

describe("showsStakePositionTransaction", () => {
  describe("after a deactivation", () => {
    it.each(["deactivating", "deactivated"] as const)("should be shown by a %s row", status => {
      expect(
        showsStakePositionTransaction("deactivate", positionsWith({ status }), POSITION_ID),
      ).toBe(true);
    });

    it.each(["activated", "activating"] as const)("should not be shown by an %s row", status => {
      expect(
        showsStakePositionTransaction("deactivate", positionsWith({ status }), POSITION_ID),
      ).toBe(false);
    });

    it("should not be shown by a missing row", () => {
      expect(
        showsStakePositionTransaction(
          "deactivate",
          mockEarnPositions({ positions: [] }),
          POSITION_ID,
        ),
      ).toBe(false);
    });
  });

  describe("after a withdrawal", () => {
    it("should be shown once the row is gone", () => {
      expect(
        showsStakePositionTransaction(
          "withdraw",
          mockEarnPositions({ positions: [] }),
          POSITION_ID,
        ),
      ).toBe(true);
    });

    it("should not be shown by a row missing behind a provider failure", () => {
      const positions = mockEarnPositions({
        positions: [],
        failures: [{ code: 503, reason: "Provider unavailable" }],
      });

      expect(showsStakePositionTransaction("withdraw", positions, POSITION_ID)).toBe(false);
    });

    it("should be shown by a closed row", () => {
      expect(
        showsStakePositionTransaction(
          "withdraw",
          positionsWith({ status: "archived" }),
          POSITION_ID,
        ),
      ).toBe(true);
    });

    it("should be shown by an empty row", () => {
      expect(
        showsStakePositionTransaction(
          "withdraw",
          positionsWith({ status: "deactivated", balance: "0" }),
          POSITION_ID,
        ),
      ).toBe(true);
    });

    it("should not be shown by a deactivated row that still holds its balance", () => {
      expect(
        showsStakePositionTransaction(
          "withdraw",
          positionsWith({ status: "deactivated" }),
          POSITION_ID,
        ),
      ).toBe(false);
    });
  });

  it("should not be shown by two rows with the id of the position", () => {
    const row = mockEarnPosition({ id: POSITION_ID, status: "deactivated" });

    expect(
      showsStakePositionTransaction(
        "deactivate",
        mockEarnPositions({ positions: [row, row] }),
        POSITION_ID,
      ),
    ).toBe(false);
  });
});

import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { useStakingPosition } from "./useStakingPosition";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/aleo/react");

const mockUseAleoValidators = jest.mocked(useAleoValidators);

const pendingOperation = (type: OperationType): Operation =>
  ({
    id: `pending-${type}`,
    hash: "",
    type,
    value: new BigNumber(1),
    fee: new BigNumber(1),
    senders: [],
    recipients: [],
    accountId: ALEO_MAIN_ACCOUNT.id,
    date: new Date(),
    blockHash: null,
    blockHeight: null,
    extra: {},
  }) as unknown as Operation;

const account = (pendingOperations: Operation[]): AleoAccount => ({
  ...ALEO_MAIN_ACCOUNT,
  pendingOperations,
});

const positionFor = (pendingOperations: Operation[]) =>
  renderHook(() => useStakingPosition(account(pendingOperations))).result.current;

describe("useStakingPosition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAleoValidators.mockReturnValue({ validators: [], loading: false, error: null });
  });

  // `unbond_public` and `claim_unbond_public` share one `unbonding` slot on chain, so the gate
  // both actions read has to close on either of them — the per-type flags exist only to label
  // what is in flight.
  describe("hasPendingUnbondingChange", () => {
    it("is false with nothing pending", () => {
      expect(positionFor([]).hasPendingUnbondingChange).toBe(false);
    });

    it("is true for a pending unbond", () => {
      const position = positionFor([pendingOperation("UNBOND")]);

      expect(position.hasPendingUnbondingChange).toBe(true);
      expect(position.hasPendingUnbond).toBe(true);
      expect(position.hasPendingClaim).toBe(false);
    });

    it("is true for a pending claim", () => {
      const position = positionFor([pendingOperation("WITHDRAW_UNBONDED")]);

      expect(position.hasPendingUnbondingChange).toBe(true);
      expect(position.hasPendingClaim).toBe(true);
      expect(position.hasPendingUnbond).toBe(false);
    });

    // A bond writes the `bonded` mapping, not `unbonding`, so it must not close either action.
    it("ignores a pending bond", () => {
      expect(positionFor([pendingOperation("BOND")]).hasPendingUnbondingChange).toBe(false);
    });

    it("ignores an unrelated pending operation", () => {
      expect(positionFor([pendingOperation("OUT")]).hasPendingUnbondingChange).toBe(false);
    });
  });
});

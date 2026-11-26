import type { KeyRingMemberKeyRecord } from "@domain/entity-key-ring";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";
import { sessionOf } from "../internals/handles";
import { acceptLedgerSyncResult } from "./acceptLedgerSyncResult";

const RUN_MEMBER_KEY = mockKeyRingMemberKeyRecord();
const ROTATED_MEMBER_KEY = mockKeyRingMemberKeyRecord({
  pubkey: `03${"c".repeat(64)}`,
  privatekey: "d".repeat(64),
});
const ACTION = { type: "trustchain/keyRingTreeSet", payload: "run-tree" };

function runSessionWith(memberCredentials: KeyRingMemberKeyRecord | null) {
  return sessionOf({ trustchain: mockKeyRingTreeRecord(), memberCredentials });
}

function stateWith(memberCredentials: KeyRingMemberKeyRecord | null) {
  return () => ({ trustchain: { trustchain: null, memberCredentials } });
}

describe("acceptLedgerSyncResult", () => {
  it("should dispatch the action and return true when the store still holds the run's member key", () => {
    const dispatch = jest.fn();

    const dispatched = acceptLedgerSyncResult(ACTION, runSessionWith(RUN_MEMBER_KEY))(
      dispatch,
      stateWith({ ...RUN_MEMBER_KEY }),
    );

    expect(dispatched).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(ACTION);
  });

  it("should dispatch nothing and return false when a reset rotated the member key", () => {
    const dispatch = jest.fn();

    const dispatched = acceptLedgerSyncResult(ACTION, runSessionWith(RUN_MEMBER_KEY))(
      dispatch,
      stateWith(ROTATED_MEMBER_KEY),
    );

    expect(dispatched).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should dispatch nothing and return false when the store holds no member key", () => {
    const dispatch = jest.fn();

    const dispatched = acceptLedgerSyncResult(ACTION, runSessionWith(RUN_MEMBER_KEY))(
      dispatch,
      stateWith(null),
    );

    expect(dispatched).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([
    ["holds no member key either", null],
    ["holds a member key", RUN_MEMBER_KEY],
  ])(
    "should dispatch nothing and return false when the run session has no member key and the store %s",
    (_, storedMemberKey) => {
      const dispatch = jest.fn();

      const dispatched = acceptLedgerSyncResult(ACTION, runSessionWith(null))(
        dispatch,
        stateWith(storedMemberKey),
      );

      expect(dispatched).toBe(false);
      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});

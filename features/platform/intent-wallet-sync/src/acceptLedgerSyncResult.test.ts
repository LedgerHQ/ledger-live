import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { acceptLedgerSyncResult } from "./acceptLedgerSyncResult";

const RUN_CREDENTIALS: MemberCredentials = { pubkey: "run-pubkey", privatekey: "run-privatekey" };
const ACTION = { type: "trustchain/set", payload: "run-trustchain" };

function stateWith(memberCredentials: MemberCredentials | null) {
  return () => ({ trustchain: { trustchain: null, memberCredentials } });
}

describe("acceptLedgerSyncResult", () => {
  it("should dispatch the action and return true when the store still holds the run's credentials", () => {
    const dispatch = jest.fn();

    const dispatched = acceptLedgerSyncResult(ACTION, RUN_CREDENTIALS)(
      dispatch,
      stateWith({ ...RUN_CREDENTIALS }),
    );

    expect(dispatched).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(ACTION);
  });

  it("should dispatch nothing and return false when a reset rotated the credentials", () => {
    const dispatch = jest.fn();
    const rotated = { pubkey: "rotated-pubkey", privatekey: "rotated-privatekey" };

    const dispatched = acceptLedgerSyncResult(ACTION, RUN_CREDENTIALS)(
      dispatch,
      stateWith(rotated),
    );

    expect(dispatched).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should dispatch nothing and return false when the store holds no credentials", () => {
    const dispatch = jest.fn();

    const dispatched = acceptLedgerSyncResult(ACTION, RUN_CREDENTIALS)(dispatch, stateWith(null));

    expect(dispatched).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
